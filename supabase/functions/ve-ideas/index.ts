// ve-ideas: Sean's idea inbox (Sean, 2026-11-06, playbook ve-idea-intake, folded into branddesk-production-wing). verify_jwt off.
// One idea store (branddesk-production-wing N, 2026-11-08): ve_ideas holds every idea, Depot > Ideas and HQ's BrandDesk > Blueprint >
// Ideas alike (migration 20261108_one_idea_store.sql). Statuses: new, approved, building, done (the build path) and sent, own_playbook,
// parked, declined (the Blueprint's sorting). An idea Logan has read stays new; its read is on the row. Set aside is parked.
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
// Send to (branddesk-production-wing M, 2026-11-08; Sean: "Drafts only; I approve each one"):
//   sends        { id }                   the idea's Pulse drafts and podcast drafts, the next episode in planning, the chapters
//   pulse_draft  { id, community, date }  Logan writes a Daily Pulse story (title, take) from the idea: a ve_pulse_features row,
//                                         status draft, for one chapter (or 'all') on one Eastern date. Nothing goes in a Pulse yet.
//   pulse_save   { feature_id, title, take, url, community, date }   change a draft
//   pulse_approve { feature_id }          Sean's OK: live, so that date's Pulse carries it (waiting drafts get it at once)
//   pulse_discard { feature_id }          the draft is not used (kept, status discarded)
//   podcast_draft { id }                  a proposed news segment (Kai, Top stories) on the next episode still in planning, written from
//                                         the idea; approved in BrandDesk > Podcast like every segment. No episode in planning: no_episode.
// Sorting (branddesk-production-wing, 2026-11-08; Sean: ideas live only in Depot > Ideas). Moved here from HQ's BrandDesk > Blueprint >
// Ideas (app/api/branddesk/blueprint/ideas), the same rules, so that screen can come out. A super admin's VE token only (never ops):
//   sort_options                          the brand's open playbooks to send an idea to
//   sort_send    { id, playbook, note? }  a decision record on that playbook and a pending item on its page under "From the Blueprint
//                                         ideas" (no model edits the page; a page whose markup is not found gets the record only)
//   sort_own     { id, slug, title, status }   a new playbook page from the active template, an index row and a record; parked | building
//   sort_park    { id, revisit_on?, reason? }
//   sort_decline { id, reason }           a reason required
//   sort_reopen  { id }                   back to New
// Only a New or Parked idea can be sent, parked, declined or made its own playbook (already_sorted).
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
// The read searches the web (branddesk-production-wing L, 2026-11-07): web_search and web_fetch, the dynamic-filtering versions,
// at most 5 searches and 3 pages a read. A paused turn (the server's search loop hit its limit) is sent back to resume, up to 4 times.
const WEB_TOOLS = [
  { type: 'web_search_20260209', name: 'web_search', max_uses: 5 },
  { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 3, max_content_tokens: 20000 },
];
const BUCKET = 'idea-files';
const STATUSES = ['new', 'approved', 'building', 'done', 'sent', 'own_playbook', 'parked', 'declined'];
const UPLOAD_TYPES = /^(image\/|application\/pdf$|video\/|audio\/|text\/(plain|markdown|csv)$|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$)/;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const CHAPTERS = ['south-florida', 'central-florida', 'north-florida', 'atlanta', 'washington-dc', 'delaware', 'maryland', 'virginia', 'west-virginia', 'new-york', 'philadelphia', 'los-angeles', 'london'];
const easternDay = (offset = 0) => new Date(Date.now() + offset * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const OPS_ACTIONS = new Set(['sends', 'pulse_draft', 'pulse_save', 'podcast_draft', 'list', 'get', 'next', 'claim', 'set', 'upload_start', 'read_blueprint']);
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
const logEv = (idea: string, by: string, action: string, detail: Record<string, unknown> = {}) => db.from('blueprint_idea_events').insert({ idea_id: idea, by, action, detail });
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
Ask a question only when the answer changes what you build.
You can search the web and open pages. Use them when the idea turns on something outside our own site: a company, product, person, show,
law, price, tool or event, or a link he added (open it). Do not search for things about our own site; you are not given its code. Say in the
ask what you found and where, in plain words, and never present something you did not find as fact.`;

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
  const searched: string[] = [];
  const sources: { title: string; url: string }[] = [];
  try {
    const client = new Anthropic({ apiKey });
    const messages: any[] = [{ role: 'user', content }];
    let res: any = null;
    for (let turn = 0; turn < 5; turn++) {
      res = await client.beta.messages.create({
        model: MODEL, max_tokens: maxTokens, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
        tools: WEB_TOOLS, system: SYSTEM, messages,
      } as any);
      for (const b of (res.content || [])) {
        if (b.type === 'server_tool_use') searched.push(clean(b.input?.query || b.input?.url, 200));
        if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const r of b.content) if (r?.url) sources.push({ title: clean(r.title, 200), url: String(r.url).slice(0, 600) });
        if (b.type === 'web_fetch_tool_result' && b.content?.url) sources.push({ title: clean(b.content?.content?.title || b.content.url, 200), url: String(b.content.url).slice(0, 600) });
      }
      if (res.stop_reason !== 'pause_turn') break;
      const prev = messages[messages.length - 1];
      if (prev.role === 'assistant') prev.content = [...prev.content, ...(res.content || [])];
      else messages.push({ role: 'assistant', content: res.content || [] });
    }
    stop = String(res?.stop_reason || '');
    if (stop === 'refusal') return { error: 'refused', files };
    if (stop === 'max_tokens') return { error: 'cut_off', detail: `The read ran past ${maxTokens} tokens and stopped part way.`, files };
    if (stop === 'pause_turn') return { error: 'cut_off', detail: 'The web search did not finish.', files };
    if (stop !== 'end_turn' && stop !== 'stop_sequence') return { error: `stopped_${stop || 'unknown'}`, files };
    const blocks: any[] = res.content || [];
    // The answer is the text after the last tool result (text before a search is the model talking to itself).
    let last = -1;
    blocks.forEach((b, i) => { if (/_tool_result$|^server_tool_use$/.test(String(b.type))) last = i; });
    out = JSON.parse(blocks.slice(last + 1).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
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
    searched: searched.filter(Boolean).slice(0, 8),
    sources: [...new Map(sources.map((x) => [x.url, x])).values()].slice(0, 8),
  };
  return { read, files };
}

// The Depot's read is the same read as the Blueprint's: one table now. The playbook it names is kept on playbook_slug too.
// The Daily Pulse story for an idea (M). Only from the idea's own words; never a fact it does not hold.
const PULSE_SCHEMA = { type: 'object', additionalProperties: false, properties: {
  title: { type: 'string', description: 'A plain headline, at most 70 characters.' },
  take: { type: 'string', description: 'One or two sentences a member reads in the Daily Pulse, at most 280 characters.' } }, required: ['title', 'take'] };
async function writePulse(idea: any): Promise<{ title?: string; take?: string; error?: string }> {
  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'no_model_key' };
  try {
    const client = new Anthropic({ apiKey });
    const res: any = await client.messages.create({
      model: MODEL, max_tokens: MAX_TOKENS, output_config: { effort: 'low', format: { type: 'json_schema', schema: PULSE_SCHEMA } },
      system: 'You write one story for the Vegans Explore Daily Pulse, the morning briefing members read in their city. Write only from the idea and notes given: never add a fact, name, number, date or link that is not in them. Speak to members, warm and plain, short sentences, no dashes, no hype. Capitalize Vegan. Never state a price. If the idea is an internal plan, write what members will see or can do, and nothing that is not built yet.',
      messages: [{ role: 'user', content: `The idea: ${idea.title || ''}\n\n${idea.body || ''}\n\n${idea.read?.ask ? 'Logan read it as: ' + idea.read.ask : ''}\n\n${(idea.links || []).length ? 'Links: ' + idea.links.join(' ') : ''}` }],
    } as any);
    if (res.stop_reason !== 'end_turn') return { error: res.stop_reason === 'max_tokens' ? 'cut_off' : `stopped_${res.stop_reason}` };
    const out = JSON.parse((res.content || []).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
    return { title: clean(out.title, 120), take: clean(out.take, 600) };
  } catch (e) { return { error: 'model_error' }; }
}

async function readIdea(id: string) {
  const r: any = await readBlueprint(id, '');
  if (r.error) return r;
  const pb = r.idea?.read?.playbook || r.idea?.read?.new_playbook;
  if (pb && !r.idea.playbook_slug) { const { data } = await db.from('ve_ideas').update({ playbook_slug: pb }).eq('id', id).select('*').single(); return { idea: data }; }
  return r;
}

async function readBlueprint(id: string, reply: string, maxTokens = MAX_TOKENS) {
  const { data: idea } = await db.from('ve_ideas').select('*').eq('id', id).maybeSingle();
  if (!idea) return { error: 'not_found' };
  const now = new Date().toISOString();
  let thread = idea.thread || [];
  if (reply) {
    thread = [...thread, { role: 'sean', text: reply, at: now }];
    await db.from('ve_ideas').update({ thread, updated_at: now }).eq('id', id);
  }
  // A title made from the first sentence is not said twice.
  const body = [idea.body && String(idea.body).startsWith(String(idea.title || '').replace(/\.$/, '')) ? '' : idea.title, idea.body].filter(Boolean).join('\n\n');
  const r = await readCore({ body, links: idea.links || [], files: idea.files || [], page_url: idea.page_url, thread }, maxTokens);
  if (r.error) {
    // The failed try stays in the conversation too, so the scroll shows what happened (never a half read: only the error line).
    const failNote = { role: 'logan', text: r.error === 'cut_off' ? 'My read was cut off before it finished, so I saved nothing. Read it again.' : 'My read did not finish, so I saved nothing. Read it again.', error: r.error, at: now };
    await db.from('ve_ideas').update({ read_error: r.detail ? `${r.error}: ${r.detail}` : r.error, read_at: now, files: r.files, thread: [...thread, failNote], updated_at: now }).eq('id', id);
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
  const { data: row } = await db.from('ve_ideas').update(patch).eq('id', id).select('*').single();
  await db.from('blueprint_idea_events').insert({ idea_id: id, by: 'Logan', action: 'read', detail: { playbook: read.playbook || read.new_playbook || null, unread: read.unread.length } });
  return { idea: row };
}

// Sorting helpers (copied from lesaruss-hq lib/blueprintIdeas.ts; change both together until HQ's copy is retired).
const IDEA_GROUP = 'FROM THE BLUEPRINT IDEAS';
const escH = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PENDING_OPEN = '<div class="tabpanel" id="panel-pending" role="tabpanel">';
const COUNT_RE = /(data-tab="pending">Pending <span class="count">)(\d+)(<\/span>)/;
const BRAND_NAMES: Record<string, string> = { 'vegans-explore': 'Vegans Explore', 'geekfon-society': 'GeekFon Society', 'sean-a-russell': 'Sean A. Russell', 'lesaruss-ai': 'LESARUSS.ai', 'lesaruss-hq': 'LESARUSS HQ', 'meatless-muscle': 'Meatless Muscle' };
const slugOk = (v: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length >= 3 && v.length <= 80;
const eastern = (o: Intl.DateTimeFormatOptions) => new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', ...o });
function ideaItem(title: string, detail: string, dateLabel: string): string {
  const more = detail.trim() ? ` ${escH(detail.trim())}` : '';
  return `<li class="chk-item pending"><span class="chk-box"></span><span><strong>${escH(title.trim())}.</strong>${more} <em>(Idea sent from the Blueprint, ${escH(dateLabel)})</em></span></li>`;
}
function addIdeaToPending(html: string, item: string): { html: string; placed: boolean } {
  const at = html.indexOf(PENDING_OPEN);
  if (at < 0 || !COUNT_RE.test(html)) return { html, placed: false };
  let out = html;
  const groupHead = `<summary><span>${IDEA_GROUP}</span>`;
  const g = out.indexOf(groupHead);
  if (g >= 0) {
    const ulEnd = out.indexOf('</ul>', g);
    if (ulEnd < 0) return { html, placed: false };
    out = out.slice(0, ulEnd) + `  ${item}\n      ` + out.slice(ulEnd);
    out = out.replace(new RegExp(`(${groupHead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<span class="grp-count">)(\\d+)( pending</span>)`), (_m, a, n, b) => `${a}${Number(n) + 1}${b}`);
  } else {
    const start = at + PENDING_OPEN.length;
    const rest = out.slice(start).replace(/^\s*<p class="empty-state">Nothing pending\.<\/p>/, '');
    const block = `\n    <details class="held" open>\n      <summary><span>${IDEA_GROUP}</span><span class="grp-count">1 pending</span></summary>\n      <div class="body"><ul class="chk-list">\n        ${item}\n      </ul></div>\n    </details>\n`;
    out = out.slice(0, start) + block + rest;
  }
  out = out.replace(COUNT_RE, (_m, a, n, b) => `${a}${Number(n) + 1}${b}`);
  return { html: out, placed: true };
}
function newPlaybookPage(shell: string, v: { title: string; brand: string; date: string; stage: string; status: string; overview: string; firstItem: string; history: string }): string {
  const pending = `    <details class="held" open>\n      <summary><span>${IDEA_GROUP}</span><span class="grp-count">1 pending</span></summary>\n      <div class="body"><ul class="chk-list">\n        ${v.firstItem}\n      </ul></div>\n    </details>`;
  const map: Record<string, string> = {
    TITLE: escH(v.title), TYPE_LABEL: 'Playbook', BRAND: escH(v.brand), DATE: escH(v.date), PREPARED_BY: 'Logan Russell',
    STAGE: escH(v.stage), STATUS_SUMMARY: escH(v.status), OVERVIEW_SECTIONS_HTML: v.overview,
    PENDING_COUNT: '1', DONE_COUNT: '0', PENDING_HTML: pending, DONE_HTML: '<p class="empty-state">Nothing completed yet.</p>',
    LINKS_HTML: '', DECISION_HISTORY_HTML: v.history,
  };
  return shell.replace(/\{\{([A-Z_]+)\}\}/g, (m, k: string) => (k in map ? map[k] : m));
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

  if (b.action === 'sends') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const [f, sg, ep] = await Promise.all([
      db.from('ve_pulse_features').select('id,status,starts_on,ends_on,communities,story,created_at,approved_at').eq('idea_id', b.id).order('created_at'),
      db.from('ve_pod_segments').select('id,episode_id,title,status,script,updated_at,ve_pod_episodes(number,air_date,status,title)').eq('idea_id', b.id),
      db.from('ve_pod_episodes').select('id,number,air_date,title,status').eq('show_slug', 'vegans-explore-podcast').eq('status', 'planning').gte('air_date', easternDay()).order('air_date').limit(1).maybeSingle(),
    ]);
    return json({ ok: true, pulse: f.data || [], podcast: sg.data || [], next_episode: ep.data || null, chapters: CHAPTERS, tomorrow: easternDay(1) });
  }
  if (b.action === 'pulse_draft' || b.action === 'pulse_save') {
    const community = clean(b.community, 40) || 'all', date = clean(b.date, 10) || easternDay(1);
    if (community !== 'all' && !CHAPTERS.includes(community)) return json({ error: 'community' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < easternDay()) return json({ error: 'date' }, 400);
    const url = clean(b.url, 600);
    if (url && !/^https:\/\//i.test(url)) return json({ error: 'url' }, 400);
    if (b.action === 'pulse_save') {
      if (!isId(b.feature_id)) return json({ error: 'id' }, 400);
      const title = clean(b.title, 120), take = clean(b.take, 600);
      if (!title || !take) return json({ error: 'empty' }, 400);
      const { data } = await db.from('ve_pulse_features').update({ starts_on: date, ends_on: date, communities: community === 'all' ? null : [community],
        story: { title, take, ...(url ? { url } : {}), source: 'Vegans Explore', ours: true } }).eq('id', b.feature_id).eq('status', 'draft').select('id').maybeSingle();
      if (!data) return json({ error: 'not_draft' }, 409);
      return json({ ok: true });
    }
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const { data: idea } = await db.from('ve_ideas').select('*').eq('id', b.id).maybeSingle();
    if (!idea) return json({ error: 'not_found' }, 404);
    const w = await writePulse(idea);
    if (w.error) return json({ error: w.error }, 502);
    const link = url || (idea.links || []).find((l: string) => /^https:\/\//i.test(l)) || null;
    const { data, error } = await db.from('ve_pulse_features').insert({ idea_id: b.id, status: 'draft', starts_on: date, ends_on: date,
      communities: community === 'all' ? null : [community], note: `Draft from idea: ${String(idea.title || '').slice(0, 120)}`,
      story: { title: w.title, take: w.take, ...(link ? { url: link } : {}), source: 'Vegans Explore', ours: true } }).select('*').single();
    if (error) return json({ error: error.message }, 500);
    await logEv(b.id, ops ? 'Logan' : 'Sean', 'sent_to_pulse', { draft: true, community, date });
    return json({ ok: true, feature: data });
  }
  if (b.action === 'pulse_approve' || b.action === 'pulse_discard') {
    if (!isId(b.feature_id)) return json({ error: 'id' }, 400);
    if (b.action === 'pulse_approve' && ops) return json({ error: 'sean_approves' }, 403);
    const now = new Date().toISOString();
    const { data } = await db.from('ve_pulse_features').update(b.action === 'pulse_approve' ? { status: 'live', approved_at: now } : { status: 'discarded' })
      .eq('id', b.feature_id).eq('status', 'draft').select('id,idea_id,starts_on,communities').maybeSingle();
    if (!data) return json({ error: 'not_draft' }, 409);
    if (b.action === 'pulse_approve') {
      await db.rpc('ve_pulse_features_apply');
      if (data.idea_id) await logEv(data.idea_id, 'Sean', 'sent_to_pulse', { approved: true, date: data.starts_on, communities: data.communities });
    }
    return json({ ok: true });
  }
  if (b.action === 'podcast_draft') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const { data: idea } = await db.from('ve_ideas').select('*').eq('id', b.id).maybeSingle();
    if (!idea) return json({ error: 'not_found' }, 404);
    const { data: ep } = await db.from('ve_pod_episodes').select('id,number,air_date,title').eq('show_slug', 'vegans-explore-podcast').eq('status', 'planning').gte('air_date', easternDay()).order('air_date').limit(1).maybeSingle();
    if (!ep) return json({ error: 'no_episode' }, 409);
    const { data: had } = await db.from('ve_pod_segments').select('id').eq('episode_id', ep.id).eq('idea_id', b.id).maybeSingle();
    if (had) return json({ error: 'already_on_episode' }, 409);
    const { data: segs } = await db.from('ve_pod_segments').select('id,kind,position').eq('episode_id', ep.id).order('position');
    const NEWSY = ['news', 'community', 'directory', 'world'];
    const lastNews = [...(segs || [])].reverse().find((x: any) => NEWSY.includes(x.kind));
    const firstCom = (segs || []).find((x: any) => x.kind === 'commercial');
    const pos = lastNews ? lastNews.position + 1 : firstCom ? firstCom.position : ((segs || []).length ? segs![segs!.length - 1].position + 1 : 0);
    for (const x of [...(segs || [])].reverse()) if (x.position >= pos) await db.from('ve_pod_segments').update({ position: x.position + 1 }).eq('id', x.id);
    const t = String(idea.title || 'An idea');
    const { data, error } = await db.from('ve_pod_segments').insert({ episode_id: ep.id, idea_id: b.id, kind: 'news', speaker: 'kai', position: pos, status: 'proposed',
      title: `Top stories: ${t.length > 60 ? t.slice(0, 57) + '…' : t}`, note: 'Draft from an idea in Depot > Ideas. Write the script, then approve it here.',
      sources: [{ title: t, url: (idea.links || [])[0] || null, source: "Sean's idea", city: null, summary: String(idea.body || idea.read?.ask || '').slice(0, 600) }] }).select('id').single();
    if (error) return json({ error: error.message }, 500);
    await logEv(b.id, ops ? 'Logan' : 'Sean', 'sent_to_podcast', { draft: true, episode: ep.number, air_date: ep.air_date });
    return json({ ok: true, segment_id: data.id, episode: ep });
  }

  if (typeof b.action === 'string' && b.action.startsWith('sort_')) {
    if (ops || !me) return json({ error: 'sean_sorts' }, 403);
    const { data: mm } = await db.from('members').select('name').eq('id', me).maybeSingle();
    const by = mm?.name || 'Sean A. Russell';
    const now = new Date().toISOString();
    if (b.action === 'sort_options') {
      const brand = clean(b.brand, 80) || 'vegans-explore';
      const { data } = await db.from('briefings').select('slug, title').eq('type', 'playbook').eq('brand_slug', brand).neq('status', 'archived').order('title');
      return json({ ok: true, playbooks: data || [] });
    }
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const { data: cur } = await db.from('ve_ideas').select('*').eq('id', b.id).maybeSingle();
    if (!cur) return json({ error: 'not_found' }, 404);
    const brand = cur.brand_slug || 'vegans-explore';
    const title = String(cur.title || String(cur.body || '').split(/(?<=[.!?])\s/)[0] || 'Untitled idea').slice(0, 200);
    const detail = String(cur.body || '');
    if (b.action === 'sort_reopen') {
      if (cur.status === 'new') return json({ error: 'already_new' }, 409);
      await db.from('ve_ideas').update({ status: 'new', updated_at: now }).eq('id', b.id);
      await logEv(b.id, by, 'reopened', { from: cur.status });
      return json({ ok: true });
    }
    if (cur.status !== 'new' && cur.status !== 'parked') return json({ error: 'already_sorted', status: cur.status }, 409);
    if (b.action === 'sort_park') {
      const revisit = clean(b.revisit_on, 10);
      if (revisit && !/^\d{4}-\d{2}-\d{2}$/.test(revisit)) return json({ error: 'bad_date' }, 400);
      const reason = clean(b.reason, 1000);
      await db.from('ve_ideas').update({ status: 'parked', revisit_on: revisit || null, reason: reason || null, sorted_by: by, sorted_at: now, updated_at: now }).eq('id', b.id);
      await logEv(b.id, by, 'parked', { revisit_on: revisit || null, reason });
      return json({ ok: true });
    }
    if (b.action === 'sort_decline') {
      const reason = clean(b.reason, 1000);
      if (!reason) return json({ error: 'reason_needed' }, 400);
      await db.from('ve_ideas').update({ status: 'declined', reason, sorted_by: by, sorted_at: now, updated_at: now }).eq('id', b.id);
      await logEv(b.id, by, 'declined', { reason });
      return json({ ok: true });
    }
    const dateLabel = eastern({ month: 'short', day: 'numeric', year: 'numeric' });
    if (b.action === 'sort_send') {
      const target = clean(b.playbook, 80);
      const { data: pb } = await db.from('briefings').select('slug, title, content').eq('type', 'playbook').eq('brand_slug', brand).eq('slug', target).neq('status', 'archived').maybeSingle();
      if (!pb) return json({ error: 'unknown_playbook' }, 404);
      const note = clean(b.note, 1000);
      const rec = await db.from('playbook_records').insert({ slug: target, brand_slug: brand, author: by, source: 'text', kind: 'decision',
        body: `${target}: idea from the Blueprint, "${title}". ${detail ? detail + ' ' : ''}${note ? 'Note: ' + note + ' ' : ''}(Sent by ${by}, ${dateLabel}.)` });
      if (rec.error) return json({ error: 'record_failed' }, 500);
      const placed = addIdeaToPending(String(pb.content || ''), ideaItem(title, [detail, note].filter(Boolean).join(' '), dateLabel));
      if (placed.placed) await db.from('briefings').update({ content: placed.html, updated_at: now }).eq('slug', target).eq('type', 'playbook').eq('content', pb.content);
      await db.from('ve_ideas').update({ status: 'sent', target_playbook: target, placed_on_page: placed.placed, reason: note || null, sorted_by: by, sorted_at: now, updated_at: now }).eq('id', b.id);
      await logEv(b.id, by, 'sent', { playbook: target, placed: placed.placed, note });
      return json({ ok: true, placed: placed.placed });
    }
    if (b.action === 'sort_own') {
      const slug = clean(b.slug, 80).toLowerCase();
      const ptitle = clean(b.title, 120);
      const status = b.status === 'building' ? 'building' : 'parked';
      if (!slugOk(slug)) return json({ error: 'bad_slug' }, 400);
      if (!ptitle) return json({ error: 'title_needed' }, 400);
      // Taken means any page, index row or record already uses the slug (a playbook can have an index row and records but no page;
      // the first version checked pages only and overwrote branddesk-production-wing's index row in its test, 2026-11-08).
      const [tb, ti, tr] = await Promise.all([
        db.from('briefings').select('slug').eq('slug', slug).limit(1),
        db.from('ve_playbook_index').select('slug').eq('slug', slug).limit(1),
        db.from('playbook_records').select('id').eq('slug', slug).limit(1),
      ]);
      if (tb.error || ti.error || tr.error) return json({ error: 'check_failed' }, 500);
      if ((tb.data || []).length || (ti.data || []).length || (tr.data || []).length) return json({ error: 'slug_taken' }, 409);
      const [tpl, sib] = await Promise.all([
        db.from('templates').select('parameters').eq('subtype', 'playbook').eq('status', 'active').maybeSingle(),
        db.from('briefings').select('tenant_id').eq('type', 'playbook').eq('brand_slug', brand).limit(1).maybeSingle(),
      ]);
      const shell = (tpl.data?.parameters as any)?.html_shell;
      if (!shell) return json({ error: 'no_template' }, 500);
      if (!sib.data?.tenant_id) return json({ error: 'no_tenant' }, 500);
      const why = `${slug}: opened from a Blueprint idea, "${title}". ${detail ? detail + ' ' : ''}(${by}, ${dateLabel}, status ${status === 'building' ? 'Building' : 'Parked'}.)`;
      const rec = await db.from('playbook_records').insert({ slug, brand_slug: brand, author: by, source: 'text', kind: 'decision', body: why });
      if (rec.error) return json({ error: 'record_failed' }, 500);
      const hist = await db.rpc('ve_pb_history', { slugs: [slug] });
      const statusLine = status === 'building' ? 'Building. Opened from a Blueprint idea.' : 'Parked. Opened from a Blueprint idea; nothing is built until it moves to Building.';
      const html = newPlaybookPage(shell, { title: ptitle, brand: BRAND_NAMES[brand] || brand, date: eastern({ month: 'long', day: 'numeric', year: 'numeric' }), stage: 'Idea', status: statusLine,
        overview: `<h2>Where it came from</h2>\n<p>${escH(title)}${detail ? '. ' + escH(detail) : ''}</p>`, firstItem: ideaItem(title, detail, dateLabel), history: typeof hist.data === 'string' ? hist.data : '' });
      const ins = await db.from('briefings').insert({ tenant_id: sib.data.tenant_id, slug, title: ptitle, content: html, type: 'playbook', brand_slug: brand, author: 'Logan Russell', status: 'published', status_summary: statusLine });
      if (ins.error) return json({ error: 'page_failed', detail: ins.error.message }, 500);
      await db.from('ve_playbook_index').upsert({ slug, brand_slug: brand, title: ptitle, status, stage: 'Idea', next_action: status === 'building' ? 'Logan writes the plan for Sean' : '', owner: 'Logan', updated_at: now }, { onConflict: 'slug' });
      await db.from('ve_ideas').update({ status: 'own_playbook', target_playbook: slug, placed_on_page: true, sorted_by: by, sorted_at: now, updated_at: now }).eq('id', b.id);
      await logEv(b.id, by, 'own_playbook', { playbook: slug, title: ptitle, status });
      return json({ ok: true, playbook: slug });
    }
    return json({ error: 'unknown_action' }, 400);
  }

  if (b.action === 'list') {
    const { data } = await db.from('ve_ideas').select('id,brand_slug,title,body,source,submitted_by,links,files,status,read,read_error,playbook_slug,target_playbook,suggested_playbook,reason,revisit_on,result_url,session_url,done_at,created_at,updated_at').order('created_at', { ascending: false }).limit(300);
    return json({ ok: true, rows: data || [] });
  }
  if (b.action === 'get') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const { data } = await db.from('ve_ideas').select('*').eq('id', b.id).maybeSingle();
    if (!data) return json({ error: 'not_found' }, 404);
    const { data: ev } = await db.from('blueprint_idea_events').select('at,by,action,detail').eq('idea_id', b.id).order('at');
    return json({ ok: true, idea: { ...(await withLinks(data)), events: ev || [] } });
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
    const { data: mm } = me ? await db.from('members').select('name').eq('id', me).maybeSingle() : { data: null };
    const { data: row, error } = await db.from('ve_ideas').insert({ created_by: me, submitted_by: mm?.name || null, source: 'depot', title: clean(b.title, 200) || null, body, links, files, page_url: clean(b.page_url, 500) || null, thread: body ? [{ role: 'sean', text: body, at: now }] : [] }).select('id').single();
    if (error || !row) return json({ error: error?.message || 'save' }, 500);
    await logEv(row.id, mm?.name || 'Sean', 'added', { from: 'depot', files: files.length, links: links.length });
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
    const { data } = await db.from('ve_ideas').update({ status: 'approved', approved_at: now, updated_at: now }).eq('id', b.id).in('status', ['new', 'parked']).select('*').maybeSingle();
    if (!data) return json({ error: 'not_open' }, 409);
    await logEv(b.id, 'Sean', 'approved');
    return json({ ok: true, idea: await withLinks(data) });
  }
  if (b.action === 'set') {
    if (!isId(b.id)) return json({ error: 'id' }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.status === 'set_aside') b.status = 'parked';
    if (b.status !== undefined) { if (!STATUSES.includes(b.status)) return json({ error: 'status' }, 400); patch.status = b.status; if (b.status === 'done') patch.done_at = patch.updated_at; if (b.status === 'parked' || b.status === 'declined') { patch.sorted_at = patch.updated_at; patch.sorted_by = ops ? 'Logan' : 'Sean'; } }
    if (b.reason !== undefined) patch.reason = clean(b.reason, 1000) || null;
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
    if (b.status && ['building', 'done', 'parked', 'declined', 'new'].includes(b.status)) await logEv(b.id, ops ? 'Logan' : 'Sean', b.status === 'new' ? 'reopened' : b.status, patch.reason ? { reason: patch.reason } : {});
    return json({ ok: true, idea: await withLinks(data) });
  }
  return json({ error: 'unknown_action' }, 400);
});
