// ve-ideas: Sean's idea inbox (Sean, 2026-11-06, playbook ve-idea-intake). Super admins only; verify_jwt off, the member token is
// checked here. "Drop ideas... voice dictation, upload assets... links... give you context... you confirm what I'm asking, and then I
// approve, and then you start working on it... provide me with the link to see what you've done."
//
//   list                                  every idea, newest first (no file links)
//   get          { id }                   one idea with an hour-long link to each file
//   upload_start { name, type, size }     a signed upload into the private bucket idea-files -> { path, url }
//   create       { body, links[], files[{path,name,type,size}], page_url? }   saves it, then Logan reads it (read) and returns the idea
//   read         { id, reply? }           Logan (Claude) reads the idea, its pictures and the thread, and writes back what he thinks is
//                                         asked, the playbook it belongs to, how he would do it and anything he needs answered.
//                                         A reply from Sean is added to the thread first, so "no, I meant..." gets a fresh read.
//   approve      { id }                   Sean's go: status approved (step 3, starting a build session, is not wired yet)
//   set          { id, status?, note?, session_url?, result_url?, playbook_slug? }
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const BUCKET = 'idea-files';
const STATUSES = ['new', 'read', 'approved', 'building', 'done', 'set_aside'];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

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
from his phone. It is often dictated by voice, so read through filler words and run-on sentences. Screenshots and links are his evidence.
Your job right now is only to confirm you understand: say back what he is asking, in plain words, so he can approve it or correct you.
Rules: plain American English, short sentences, no em dashes, "Vegan" always capitalized. Never invent facts about the site; when you do not
know whether something exists, say what you would check. Name the playbook it belongs to from the list (Sean wants every piece of work tied
to a playbook). A small tweak to something that exists belongs in ve-feedback. Ask a question only when the answer changes what you build.`;

async function readIdea(id: string) {
  const { data: idea } = await db.from('ve_ideas').select('*').eq('id', id).maybeSingle();
  if (!idea) return { error: 'not_found' };
  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'no_model_key' };
  const { data: pbs } = await db.from('ve_playbook_index').select('slug,title,goal,status').neq('status', 'Done').limit(120);
  const pbText = (pbs || []).map((p: any) => `- ${p.slug}: ${p.title || ''}${p.goal ? ' (' + String(p.goal).slice(0, 160) + ')' : ''}`).join('\n');
  const content: any[] = [];
  for (const f of (idea.files || []).slice(0, 8)) {
    const type = String(f.type || '');
    if (!/^image\/(jpeg|png|gif|webp)$/.test(type) && type !== 'application/pdf') continue;
    if ((f.size || 0) > 4_500_000) continue;
    const { data: blob } = await db.storage.from(BUCKET).download(f.path);
    if (!blob) continue;
    const data = toB64(new Uint8Array(await blob.arrayBuffer()));
    content.push(type === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: type, data } }
      : { type: 'image', source: { type: 'base64', media_type: type, data } });
  }
  const thread = (idea.thread || []).map((t: any) => `${t.role === 'logan' ? 'Logan' : 'Sean'}: ${t.text}`).join('\n\n');
  content.push({ type: 'text', text:
    `Open playbooks:\n${pbText || '(none listed)'}\n\n` +
    `Sean's idea:\n${idea.body || '(no words, only the attachments)'}\n\n` +
    (idea.links?.length ? `Links he added:\n${idea.links.join('\n')}\n\n` : '') +
    (idea.page_url ? `He was on this page: ${idea.page_url}\n\n` : '') +
    ((idea.files || []).length ? `Attachments: ${(idea.files || []).map((f: any) => f.name).join(', ')} (pictures and PDFs are attached above).\n\n` : '') +
    (thread ? `What has been said since:\n${thread}\n\nRead it again with his latest words in mind.` : 'Write back what you think he is asking.') });
  let out: any;
  try {
    const client = new Anthropic({ apiKey });
    const res: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 3000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM, messages: [{ role: 'user', content }],
    } as any);
    if (res.stop_reason === 'refusal') return { error: 'refused' };
    out = JSON.parse((res.content || []).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
  } catch (e) {
    return { error: String((e as Error).message || e).slice(0, 200) };
  }
  const known = new Set((pbs || []).map((p: any) => p.slug));
  const read = {
    ask: clean(out.ask, 3000), size: ['tweak', 'build', 'big'].includes(out.size) ? out.size : 'build',
    playbook: known.has(out.playbook) ? out.playbook : '', new_playbook: clean(out.new_playbook, 80),
    plan: (out.plan || []).map((s: unknown) => clean(s, 400)).filter(Boolean).slice(0, 6),
    questions: (out.questions || []).map((s: unknown) => clean(s, 400)).filter(Boolean).slice(0, 3),
    at: new Date().toISOString(),
  };
  const thr = [...(idea.thread || []), { role: 'logan', text: read.ask, at: read.at }];
  const { data: row } = await db.from('ve_ideas').update({
    read, thread: thr, status: idea.status === 'new' || idea.status === 'read' ? 'read' : idea.status,
    playbook_slug: read.playbook || read.new_playbook || idea.playbook_slug, updated_at: read.at,
  }).eq('id', id).select('*').single();
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
  const me = token ? await verifyToken(token) : null;
  if (!me) return json({ error: 'not_authenticated' }, 401);
  const { data: m } = await db.from('members').select('is_superadmin').eq('id', me).maybeSingle();
  if (!m?.is_superadmin) return json({ error: 'admins_only' }, 403);

  if (b.action === 'list') {
    const { data } = await db.from('ve_ideas').select('id,body,links,files,status,read,playbook_slug,result_url,created_at,updated_at').order('created_at', { ascending: false }).limit(300);
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
    if (!/^(image\/|application\/pdf$|video\/|audio\/|text\/plain$)/.test(type)) return json({ error: 'file_type' }, 400);
    if (size > 26214400) return json({ error: 'too_big' }, 400);
    const name = clean(b.name, 120).replace(/[^a-zA-Z0-9._-]+/g, '-') || 'file';
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${name}`;
    const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return json({ error: error?.message || 'upload_url' }, 500);
    return json({ ok: true, path, url: data.signedUrl });
  }
  if (b.action === 'create') {
    const body = clean(b.body, 20000);
    const links = (Array.isArray(b.links) ? b.links : []).map((x: unknown) => clean(x, 1000)).filter((x: string) => /^https?:\/\//i.test(x)).slice(0, 20);
    const files = (Array.isArray(b.files) ? b.files : []).slice(0, 12).map((f: any) => ({ path: clean(f?.path, 300), name: clean(f?.name, 160), type: clean(f?.type, 100), size: Number(f?.size) || 0 }))
      .filter((f: any) => /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-/.test(f.path));
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
    const { data } = await db.from('ve_ideas').update(patch).eq('id', b.id).select('*').maybeSingle();
    if (!data) return json({ error: 'not_found' }, 404);
    return json({ ok: true, idea: await withLinks(data) });
  }
  return json({ error: 'unknown_action' }, 400);
});
