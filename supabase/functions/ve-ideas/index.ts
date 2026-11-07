// ve-ideas: Sean's idea inbox (Sean, 2026-11-06, playbook ve-idea-intake, folded into branddesk-production-wing). verify_jwt off.
// "Drop ideas... voice dictation, upload assets... links... give you context... you confirm what I'm asking, and then I approve, and
// then you start working on it... provide me with the link to see what you've done."
//
//   list                                  every idea, newest first (no file links)
//   get          { id }                   one idea with an hour-long link to each file
//   upload_start { name, type, size }     a signed upload into the private bucket idea-files -> { path, url }
//   create       { body, links[], files[{path,name,type,size}], page_url? }   saves it, then Logan reads it (read) and returns the idea
//   read         { id, reply? }           Logan (Claude) reads the idea, its pictures, PDFs, text files and voice memos and the thread,
//                                         and writes back what he thinks is asked, the playbook it belongs to, how he would do it and
//                                         anything he needs answered. A reply from Sean is added to the thread first.
//   read_blueprint { id, reply? }         the same read for a BrandDesk > Blueprint > Ideas row (blueprint_ideas; HQ calls it with the
//                                         ops token after checking the signed-in person). Saves read or read_error, never half a read.
//   approve      { id }                   Sean's go: status approved. A scheduled build session (hourly, fresh each firing) picks it up.
//   set          { id, status?, note?, session_url?, result_url?, playbook_slug? }   done needs a result_url
//   next                                  the oldest approved idea (id, a short excerpt) and whether a build is already running
//   claim        { session_url, id? }     takes the oldest approved idea (or that one) and makes it building with the session's link
//
// Who: a super admin's VE token, or ops: Bearer LESARUSS_ADMIN_TOKEN, optionally with as_member (a super admin). Ops reads and moves
// ideas through the build (list, get, next, claim, set) and serves HQ's Blueprint > Ideas (upload_start, read_blueprint).
//
// The read's output budget (branddesk-production-wing R, 2026-11-06): on the 5.x models thinking counts against max_tokens, so a small
// budget returns a cut-off or empty answer. MAX_TOKENS is 16000 and anything but a clean end (end_turn) is an error (cut_off,
// refused, stopped_<reason>, model_output), saved as read_error; the last good read is kept and nothing partial is ever saved.
// What the read sees: pictures (JPEG, PNG, GIF, WebP up to 4.5 MB), PDFs (up to 20 MB, 24 MB of attachments in all), text files,
// and voice memos and short videos as words (ElevenLabs speech to text, kept on the file so it runs once). Anything else is listed by
// name and Logan says he could not open it.
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const MAX_TOKENS = 16000;
const BUCKET = 'idea-files';
const STATUSES = ['new', 'read', 'approved', 'building', 'done', 'set_aside'];
const UPLOAD_TYPES = /^(image\/|application\/pdf$|video\/|audio\/|text\/(plain|markdown|csv)$|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$)/;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const OPS_ACTIONS = new Set(['list', 'get', 'next', 'claim', 'set', 'upload_start', 'read_blueprint']);
const BUSY_HOURS = 6;
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const PATH_OK = (p: string) => /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-/.test(p);

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string) {
  const env = Deno.env.get(key); if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
function toB64(u8: Uint8Array) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); }

const SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    ask: { type: 'string', description: 'What Sean is asking for, in two to five plain sentences, as Logan would say it back to him.' },
    size: { type: 'string', enum: ['tweak', 'build', 'big'], description: 'tweak: a small change to something that exists; build: a feature on an existing playbook; big: a new idea needing its own playbook.' },
    playbook: { type: 'string', description: 'The slug of the existing playbook it belongs to, from the list given, or empty when none fits.' },
    new_playbook: { type: 'string', description: 'When nothing fits: a suggested slug for a new playbook (ve-...). Else empty.' },
    plan: { type: 'array', items: { type: 'string' }, description: 'How Logan would do it, two to six short steps.' },
    questions: { type: 'array', items: { type: 'string' }, description: 'Anything Logan needs Sean to answer before building, at most three. Empty when it is clear.' },
  },
  required: ['ask', 'size', 'playbook', 'new_playbook', 'plan', 'questions'],
};
const SYSTEM = `You are Logan Russell, Director of AI Production Systems at LESARUSS, reading an idea Sean (the founder) dropped into his idea inbox
from his phone. It is often dictated by voice, so read through filler words and run-on sentences. Screenshots, documents, voice memos and
links are his evidence; read every attachment you are given and use what is in it. Your job right now is only to confirm you understand:
say back what he is asking, in plain words, so he can approve it or correct you.
Rules: plain American English, short sentences, no em dashes, "Vegan" always capitalized. Never invent facts about the site; when you do not
know whether something exists, say what you would check. If an attachment could not be opened, say so in one line. Name the playbook it
belongs to from the list (Sean wants every piece of work tied to a playbook). A small tweak to something that exists belongs in ve-feedback.
Ask a question only when the answer changes what you build.`;

type FileRef = { path: string; name: string; type: string; size: number; transcript?: string };
type Src = { body: string; links: string[]; files: FileRef[]; page_url?: string | null; thread: { role: string; text: string }[] };

// A voice memo or short video as words, once (ElevenLabs speech to text). Returns null when it cannot.
async function transcribe(f: FileRef): Promise<string | null> {
  const key = await secret('ELEVENLABS_API_KEY');
  if (!key || (f.size || 0) > 26214400) return null;
  const { data: blob } = await db.storage.from(BUCKET).download(f.path);
  if (!blob) return null;
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('file', new File([blob], f.name || 'memo', { type: f.type || 'audio/mpeg' }));
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: form });
    if (!r.ok) return null;
    const j = await r.json();
    const t = clean(j?.text, 40000);
    return t || null;
  } catch { return null; }
}

// The read. Returns { read, files } (files with any new transcripts) or { error }. Never a partial read.
async function readCore(src: Src, maxTokens = MAX_TOKENS): Promise<{ read?: any; files: FileRef[]; error?: string; detail?: string }> {
  const files: FileRef[] = (src.files || []).map((f) => ({ ...f }));
  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'no_model_key', files };
  const { data: pbs } = await db.from('ve_playbook_index').select('slug,title,goal,status').neq('status', 'done').limit(160);
  const pbText = (pbs || []).map((p: any) => `- ${p.slug}: ${p.title || ''}${p.goal ? ' (' + String(p.goal).slice(0, 160) + ')' : ''}`).join('\n');
  const content: any[] = [];
  const unread: string[] = [];
  const texts: string[] = [];
  let budget = 24_000_000;
  for (const f of files.slice(0, 12)) {
    const type = String(f.type || '');
    const size = f.size || 0;
    if (/^image\/(jpeg|png|gif|webp)$/.test(type) || type === 'application/pdf') {
      const cap = type === 'application/pdf' ? 20_000_000 : 4_500_000;
      if (size > cap || size > budget) { unread.push(`${f.name} (too large to read)`); continue; }
      const { data: blob } = await db.storage.from(BUCKET).download(f.path);
      if (!blob) { unread.push(`${f.name} (not found)`); continue; }
      budget -= size;
      const data = toB64(new Uint8Array(await blob.arrayBuffer()));
      content.push(type === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: type, data }, title: f.name }
        : { type: 'image', source: { type: 'base64', media_type: type, data } });
    } else if (/^text\//.test(type)) {
      const { data: blob } = await db.storage.from(BUCKET).download(f.path);
      if (!blob) { unread.push(`${f.name} (not found)`); continue; }
      texts.push(`--- ${f.name} ---\n${(await blob.text()).slice(0, 60000)}`);
    } else if (/^(audio|video)\//.test(type)) {
      if (!f.transcript) f.transcript = (await transcribe(f)) || undefined;
      if (f.transcript) texts.push(`--- ${f.name} (voice memo, as words) ---\n${f.transcript}`);
      else unread.push(`${f.name} (could not turn the sound into words)`);
    } else unread.push(`${f.name} (a kind of file I cannot open; a PDF works)`);
  }
  const thread = (src.thread || []).map((t) => `${t.role === 'logan' ? 'Logan' : 'Sean'}: ${t.text}`).join('\n\n');
  content.push({ type: 'text', text:
    `Open playbooks:\n${pbText || '(none listed)'}\n\n` +
    `Sean's idea:\n${src.body || '(no words, only the attachments)'}\n\n` +
    (src.links?.length ? `Links he added:\n${src.links.join('\n')}\n\n` : '') +
    (src.page_url ? `He was on this page: ${src.page_url}\n\n` : '') +
    (texts.length ? `Files as text:\n${texts.join('\n\n')}\n\n` : '') +
    (files.length ? `Attachments: ${files.map((f) => f.name).join(', ')} (pictures and PDFs are attached above).\n\n` : '') +
    (unread.length ? `Could not open: ${unread.join('; ')}.\n\n` : '') +
    (thread ? `What has been said since:\n${thread}\n\nRead it again with his latest words in mind.` : 'Write back what you think he is asking.') });
  let out: any;
  let stop = '';
  try {
    const client = new Anthropic({ apiKey });
    const res: any = await client.beta.messages.create({
      model: MODEL, max_tokens: maxTokens, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM, messages: [{ role: 'user', content }],
    } as any);
    stop = String(res.stop_reason || '');
    if (stop === 'refusal') return { error: 'refused', files };
    if (stop === 'max_tokens') return { error: 'cut_off', detail: `The read ran past ${maxTokens} tokens and stopped part way.`, files };
    if (stop !== 'end_turn' && stop !== 'stop_sequence') return { error: `stopped_${stop || 'unknown'}`, files };
    out = JSON.parse((res.content || []).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
    if (!out || typeof out.ask !== 'string' || !out.ask.trim()) return { error: 'model_output', files };
  } catch (e) {
    const msg = String((e as Error).message || e);
    return { error: msg.startsWith('Unexpected') || msg.includes('JSON') ? 'model_output' : 'model_error', detail: msg.slice(0, 300), files };
  }
  const known = new Set((pbs || []).map((p: any) => p.slug));
  const read = {
    ask: clean(out.ask, 3000), size: ['tweak', 'build', 'big'].includes(out.size) ? out.size : 'build',
    playbook: known.has(out.playbook) ? out.playbook : '', new_playbook: clean(out.new_playbook, 80),
    plan: (out.plan || []).map((s: unknown) => clean(s, 400)).filter(Boolean).slice(0, 6),
    questions: (out.questions || []).map((s: unknown) => clean(s, 400)).filter(Boolean).slice(0, 3),
    unread, at: new Date().toISOString(),
  };
  return { read, files };
}

async function readIdea(id: string) {
  const { data: idea } = await db.from('ve_ideas').select('*').eq('id', id).maybeSingle();
  if (!idea) return { error: 'not_found' };
  const r = await readCore({ body: idea.body, links: idea.links || [], files: idea.files || [], page_url: idea.page_url, thread: idea.thread || [] });
  if (r.error) return { error: r.error };
  const read = r.read;
  const thr = [...(idea.thread || []), { role: 'logan', text: read.ask, at: read.at }];
  const { data: row } = await db.from('ve_ideas').update({
    read, thread: thr, files: r.files, status: idea.status === 'new' || idea.status === 'read' ? 'read' : idea.status,
    playbook_slug: read.playbook || read.new_playbook || idea.playbook_slug, updated_at: read.at,
  }).eq('id', id).select('*').single();
  return { idea: row };
}

async function readBlueprint(id: string, reply: string, maxTokens = MAX_TOKENS) {
  const { data: idea } = await db.from('blueprint_ideas').select('*').eq('id', id).maybeSingle();
  if (!idea) return { error: 'not_found' };
  const now = new Date().toISOString();
  let thread = idea.thread || [];
  if (reply) {
    thread = [...thread, { role: 'sean', text: reply, at: now }];
    await db.from('blueprint_ideas').update({ thread, updated_at: now }).eq('id', id);
  }
  const body = [idea.title, idea.detail].filter(Boolean).join('\n\n');
  const r = await readCore({ body, links: idea.links || [], files: idea.files || [], thread }, maxTokens);
  if (r.error) {
    // The failed try stays in the conversation too, so the scroll shows what happened (never a half read: only the error line).
    const failNote = { role: 'logan', text: r.error === 'cut_off' ? 'My read was cut off before it finished, so I saved nothing. Read it again.' : 'My read did not finish, so I saved nothing. Read it again.', error: r.error, at: now };
    await db.from('blueprint_ideas').update({ read_error: r.detail ? `${r.error}: ${r.detail}` : r.error, read_at: now, files: r.files, thread: [...thread, failNote], updated_at: now }).eq('id', id);
    await db.from('blueprint_idea_events').insert({ idea_id: id, by: 'Logan', action: 'read_failed', detail: { error: r.error } });
    return { error: r.error, detail: r.detail || null };
  }
  const read = r.read;
  const patch: Record<string, unknown> = { read, read_error: null, read_at: read.at, files: r.files, thread: [...thread, { role: 'logan', text: read.ask, read, at: read.at }], updated_at: read.at };
  if (idea.status === 'new' && (read.playbook || read.new_playbook) && (!idea.suggested_playbook || idea.suggested_by_read)) {
    patch.suggested_playbook = read.playbook || 'new';
    patch.suggest_reason = read.playbook ? `From Logan's read of the idea and its files (above).` : `From Logan's read: nothing fits, so a new playbook, ${read.new_playbook}.`;
    patch.suggested_at = read.at;
    patch.suggested_by_read = true;
  }
  const { data: row } = await db.from('blueprint_ideas').update(patch).eq('id', id).select('*').single();
  await db.from('blueprint_idea_events').insert({ idea_id: id, by: 'Logan', action: 'read', detail: { playbook: read.playbook || read.new_playbook || null, unread: read.unread.length } });
  return { idea: row };
}

async function withLinks(idea: any) {
  const files = [];
  for (const f of idea.files || []) {
    const { data } = await db.storage.from(BUCKET).createSignedUrl(f.path, 60 * 60);
    files.push({ ...f, url: data?.signedUrl || null });
  }
  return { ...idea, files };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const adminTok = token ? await secret('LESARUSS_ADMIN_TOKEN') : null;
  const ops = !!token && !!adminTok && token === adminTok;
  if (ops && !OPS_ACTIONS.has(b.action)) return json({ error: 'not_for_ops' }, 403);
  if (!ops && b.action === 'read_blueprint') return json({ error: 'ops_only' }, 403);
  const me = ops ? (isId(b.as_member) ? b.as_member : null) : (token ? await verifyToken(token) : null);
  if (!me && !ops) return json({ error: 'not_authenticated' }, 401);
  if (me) {
    const { data: m } = await db.from('members').select('is_superadmin').eq('id', me).maybeSingle();
    if (!m?.is_superadmin) return json({ error: 'admins_only' }, 403);
  }
  const busySince = () => new Date(Date.now() - BUSY_HOURS * 3600_000).toISOString();

  if (b.action === 'next') {
    const { data: busy } = await db.from('ve_ideas').select('id,session_url,updated_at').eq('status', 'building').gte('updated_at', busySince()).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    const { data: nx } = await db.from('ve_ideas').select('id,body,playbook_slug,approved_at').eq('status', 'approved').order('approved_at', { ascending: true, nullsFirst: false }).order('created_at').limit(1).maybeSingle();
    const { count } = await db.from('ve_ideas').select('id', { count: 'exact', head: true }).eq('status', 'approved');
    return json({ ok: true, busy: busy || null, waiting: count || 0, next: nx ? { id: nx.id, playbook_slug: nx.playbook_slug, approved_at: nx.approved_at, excerpt: String(nx.body || '').slice(0, 200) } : null });
  }
  if (b.action === 'claim') {
    const url = clean(b.session_url, 1000);
    if (!/^https:\/\//i.test(url)) return json({ error: 'session_url' }, 400);
    const { data: busy } = await db.from('ve_ideas').select('id').eq('status', 'building').gte('updated_at', busySince()).limit(1).maybeSingle();
    if (busy) return json({ error: 'busy', building: busy.id }, 409);
    let id = isId(b.id) ? b.id : null;
    if (!id) {
      const { data: nx } = await db.from('ve_ideas').select('id').eq('status', 'approved').order('approved_at', { ascending: true, nullsFirst: false }).order('created_at').limit(1).maybeSingle();
      if (!nx) return json({ ok: true, idea: null });
      id = nx.id;
    }
    const now = new Date().toISOString();
    const { data: cur } = await db.from('ve_ideas').select('thread').eq('id', id).maybeSingle();
    const { data } = await db.from('ve_ideas').update({ status: 'building', session_url: url, updated_at: now,
      thread: [...(cur?.thread || []), { role: 'logan', text: 'Building it now. The build session is linked below.', at: now }] })
      .eq('id', id).eq('status', 'approved').select('*').maybeSingle();
    if (!data) return json({ error: 'not_approved' }, 409);
    return json({ ok: true, idea: await withLinks(data) });
  }

  if (b.action === 'list') {
    const { data } = await db.from('ve_ideas').select('id,body,links,files,status,read,playbook_slug,result_url,session_url,done_at,created_at,updated_at').order('created_at', { ascending: false }).limit(300);
    return json({ ok: true, rows: data || [] });
  }
  if (b.action === 'get') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const { data } = await db.from('ve_ideas').select('*').eq('id', b.id).maybeSingle();
    if (!data) return json({ error: 'not_found' }, 404);
    return json({ ok: true, idea: await withLinks(data) });
  }
  if (b.action === 'upload_start') {
    const type = clean(b.type, 100), size = Number(b.size) || 0;
    if (!UPLOAD_TYPES.test(type)) return json({ error: 'file_type' }, 400);
    if (size > 26214400) return json({ error: 'too_big' }, 400);
    const name = clean(b.name, 120).replace(/[^a-zA-Z0-9._-]+/g, '-') || 'file';
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${name}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return json({ error: error?.message || 'upload_url' }, 500);
    return json({ ok: true, path, url: data.signedUrl });
  }
  if (b.action === 'read_blueprint') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    // test_max_tokens (ops only): proves a cut-off read is an error and saves nothing half read (R).
    const tmt = Math.floor(Number(b.test_max_tokens) || 0);
    const r: any = await readBlueprint(b.id, clean(b.reply, 10000), tmt >= 16 && tmt < MAX_TOKENS ? tmt : MAX_TOKENS);
    if (r.error) return json({ error: r.error, detail: r.detail || null }, r.error === 'not_found' ? 404 : 502);
    return json({ ok: true, idea: r.idea });
  }
  if (b.action === 'create') {
    const body = clean(b.body, 20000);
    const links = (Array.isArray(b.links) ? b.links : []).map((x: unknown) => clean(x, 1000)).filter((x: string) => /^https?:\/\//i.test(x)).slice(0, 20);
    const files = (Array.isArray(b.files) ? b.files : []).slice(0, 12).map((f: any) => ({ path: clean(f?.path, 300), name: clean(f?.name, 160), type: clean(f?.type, 100), size: Number(f?.size) || 0 }))
      .filter((f: any) => PATH_OK(f.path));
    if (!body && !links.length && !files.length) return json({ error: 'empty' }, 400);
    const now = new Date().toISOString();
    const { data: row, error } = await db.from('ve_ideas').insert({ created_by: me, body, links, files, page_url: clean(b.page_url, 500) || null, thread: body ? [{ role: 'sean', text: body, at: now }] : [] }).select('id').single();
    if (error || !row) return json({ error: error?.message || 'save' }, 500);
    const r: any = await readIdea(row.id);
    const { data: idea } = await db.from('ve_ideas').select('*').eq('id', row.id).single();
    return json({ ok: true, idea: await withLinks(idea), read_error: r.error || null });
  }
  if (b.action === 'read') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const reply = clean(b.reply, 10000);
    if (reply) {
      const { data: cur } = await db.from('ve_ideas').select('thread').eq('id', b.id).maybeSingle();
      if (!cur) return json({ error: 'not_found' }, 404);
      await db.from('ve_ideas').update({ thread: [...(cur.thread || []), { role: 'sean', text: reply, at: new Date().toISOString() }], updated_at: new Date().toISOString() }).eq('id', b.id);
    }
    const r: any = await readIdea(b.id);
    if (r.error) return json({ error: r.error }, r.error === 'not_found' ? 404 : 502);
    return json({ ok: true, idea: await withLinks(r.idea) });
  }
  if (b.action === 'approve') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const now = new Date().toISOString();
    const { data } = await db.from('ve_ideas').update({ status: 'approved', approved_at: now, updated_at: now }).eq('id', b.id).in('status', ['new', 'read']).select('*').maybeSingle();
    if (!data) return json({ error: 'not_open' }, 409);
    return json({ ok: true, idea: await withLinks(data) });
  }
  if (b.action === 'set') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return json({ error: 'status' }, 400); patch.status = b.status; if (b.status === 'done') patch.done_at = patch.updated_at; }
    if (b.note !== undefined) patch.note = clean(b.note, 4000) || null;
    for (const k of ['session_url', 'result_url']) if (b[k] !== undefined) { const v = clean(b[k], 1000); if (v && !/^https?:\/\//i.test(v)) return json({ error: k }, 400); patch[k] = v || null; }
    if (b.playbook_slug !== undefined) patch.playbook_slug = clean(b.playbook_slug, 80) || null;
    if (b.status === 'done' || b.status === 'building') {
      const { data: cur } = await db.from('ve_ideas').select('result_url,thread').eq('id', b.id).maybeSingle();
      if (!cur) return json({ error: 'not_found' }, 404);
      if (b.status === 'done' && !(patch.result_url ?? cur.result_url)) return json({ error: 'result_url_needed' }, 400);
      if (b.status === 'done') patch.thread = [...(cur.thread || []), { role: 'logan', text: 'Built. It is on its own branch, waiting for you to look and say merge.' + (patch.note ? ' ' + patch.note : ''), at: patch.updated_at }];
    }
    const { data } = await db.from('ve_ideas').update(patch).eq('id', b.id).select('*').maybeSingle();
    if (!data) return json({ error: 'not_found' }, 404);
    return json({ ok: true, idea: await withLinks(data) });
  }
  return json({ error: 'unknown_action' }, 400);
});
