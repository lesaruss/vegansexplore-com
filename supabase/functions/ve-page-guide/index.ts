// ve-page-guide: the super admin's chat with the page's Guide (Sean, 2026-11-05, playbook ve-page-guide, phase 1).
// "When I do that as a super admin, that is the equivalent of me speaking to you here. And if you have any follow-up
// questions or any confirmation, you can do that."
//
// The Feedback button opens it for a super admin (public/ve-page-guide.js). Everyone else still gets the Feedback form,
// which sends a suggestion to the Inbox (ve-feedback).
//
//   { action: 'chat',  page_url, page_label?, page_text?, messages: [{role: 'user'|'assistant', text}] }
//        -> { reply, changes: [{key, target, contact_id, field, label, from, to, why}] }   proposes, changes nothing
//   { action: 'apply', page_url, changes: [...] }   applies the changes Sean confirmed (re-checked here), returns what saved
//
// What it can change, on a Directory listing: its name, website, Instagram, Facebook, TikTok, phone, email, street, ZIP,
// about text, menu link and hours (through ve-outreach listing_fix, each change a ve_listing_edits row), a team note, and the
// business outreach contact tied to it: the contact's name (set by hand, so confirmed for the greeting), email, or do not email.
// verify_jwt off; the member token is checked here and must be a super admin's.
//
// Step 2 (2026-11-05): the same chat with the page's own Guide. The page sends `guide` (liz, maya, river, nori, dani, theo, kai,
// pascal): the Guide rail on a Guide page, the Resources tab's Guide, or Liz on the Partner Dashboard tour. On a page it cannot
// edit (a Guide page, any page that is not a Directory listing) the Guide files a Note for Logan instead (target "logan"): a
// ve_feedback row, kind suggestion, named "Sean (via <Guide>)", which Logan works from Depot > Feedback.
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

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

// What can be changed, and how it reads to Sean.
const LISTING_FIELDS: Record<string, string> = {
  name: 'Name', website: 'Website', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', phone: 'Phone', email: 'Email on the listing',
  address_street: 'Street', address_zip: 'ZIP', description: 'About', menu_url: 'Menu link', hours: 'Hours',
};
const CONTACT_FIELDS: Record<string, string> = { contact_name: 'Outreach contact name', contact_email: 'Outreach email', do_not_email: 'Do not email' };
// The Guides who can be talked to, and what each one leads (CLAUDE.md, Guide banners: who leads which Guide).
const GUIDES: Record<string, { name: string; leads: string }> = {
  liz: { name: 'Liz', leads: 'the Vegan Restaurant Guide and the business side of Vegans Explore' },
  maya: { name: 'Maya', leads: 'the Vegan Dairy Guide' },
  river: { name: 'River', leads: 'the Vegan Events Guide, the Stadium & Arena Guide and the Theme Park Guide' },
  nori: { name: 'Nori', leads: 'the Airport Guide' },
  dani: { name: 'Dani', leads: 'the Nonprofit Guide, the Group Partner Guide and the Welcome Guide' },
  theo: { name: 'Theo', leads: 'the Nutrition Guide' },
  kai: { name: 'Kai', leads: 'the Creator Guide' },
  pascal: { name: 'Pascal', leads: 'the Supermarket Guide' },
};
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Ctx = { listing: any | null; contacts: any[] };
type Change = { key: string; target: 'listing' | 'contact' | 'note' | 'logan'; contact_id: string; field: string; label: string; from: string; to: string; why: string; hours?: Record<string, string> };

function slugOf(pageUrl: string): string | null {
  try { const m = new URL(pageUrl).pathname.match(/^\/(?:dashboard\/)?directory\/([a-z0-9-]+)\/?$/i); return m ? m[1].toLowerCase() : null; } catch { return null; }
}
async function loadCtx(pageUrl: string): Promise<Ctx> {
  const slug = slugOf(pageUrl);
  if (!slug) return { listing: null, contacts: [] };
  const cols = 'id,slug,name,category,status,business_status,website,instagram,facebook,tiktok,phone,email,address_street,address_city,address_zip,description,google_hours_json,menu_crawl_url,details';
  let { data: l } = await db.from('listings').select(cols).eq('slug', slug).eq('status', 'approved').limit(1).maybeSingle();
  if (!l) ({ data: l } = await db.from('listings').select(cols).eq('slug', slug).order('updated_at', { ascending: false }).limit(1).maybeSingle());
  if (!l) return { listing: null, contacts: [] };
  const { data: cs } = await db.from('ve_outreach_contacts').select('id,email,email_source,contact_name,name_confirmed,status,community_slug').eq('listing_id', l.id);
  return { listing: l, contacts: cs || [] };
}
function hoursText(h: unknown): string {
  let o: any = h; if (typeof o === 'string') { try { o = JSON.parse(o); } catch { return String(o); } }
  if (!o || typeof o !== 'object') return '';
  return DAYS.filter((d) => o[d]).map((d) => `${d}: ${o[d]}`).join('\n');
}
function parseHours(t: string): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const line of t.split(/\n|;/)) {
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.+)$/); if (!m) continue;
    const d = DAYS.find((x) => x.toLowerCase().startsWith(m[1].toLowerCase().slice(0, 3)));
    if (d) out[d] = clean(m[2], 80);
  }
  return Object.keys(out).length ? out : null;
}
function currentOf(ctx: Ctx, target: string, field: string, contactId: string): string {
  const l = ctx.listing;
  if (target === 'listing' && l) {
    if (field === 'hours') return hoursText(l.google_hours_json);
    if (field === 'menu_url') return String(l.menu_crawl_url || '');
    return String(l[field] ?? '');
  }
  if (target === 'contact') {
    const c = ctx.contacts.find((x) => x.id === contactId); if (!c) return '';
    if (field === 'contact_name') return String(c.contact_name || '');
    if (field === 'contact_email') return String(c.email || '');
    if (field === 'do_not_email') return c.status === 'held' ? 'held' : c.status;
  }
  return '';
}
// Checks one proposed change against what may change, and fills in what it replaces. Returns null if it is not allowed.
function normalize(ctx: Ctx, raw: any, i: number): Change | null {
  const target = String(raw?.target || ''), field = String(raw?.field || ''), to = clean(raw?.to, 2000), why = clean(raw?.why, 300);
  const contactId = String(raw?.contact_id || '');
  if (target === 'logan') { if (to.length < 4) return null; return { key: 'c' + i, target, contact_id: '', field: 'logan', label: 'Note for Logan', from: '', to, why }; }
  if (!ctx.listing) return null;
  if (target === 'note') { if (to.length < 2) return null; return { key: 'c' + i, target, contact_id: '', field: 'note', label: 'Team note on the listing', from: '', to, why }; }
  if (target === 'listing') {
    if (!LISTING_FIELDS[field]) return null;
    if (field === 'name' && to.length < 2) return null;
    if (field === 'email' && to && !isEmail(to.toLowerCase())) return null;
    const ch: Change = { key: 'c' + i, target, contact_id: '', field, label: LISTING_FIELDS[field], from: currentOf(ctx, target, field, ''), to: field === 'email' ? to.toLowerCase() : to, why };
    if (field === 'hours') { const h = parseHours(to); if (!h) return null; ch.hours = h; ch.to = hoursText(h); }
    return ch.from === ch.to ? null : ch;
  }
  if (target === 'contact') {
    if (!CONTACT_FIELDS[field] || !ctx.contacts.some((c) => c.id === contactId)) return null;
    if (field === 'contact_email' && !isEmail(to.toLowerCase())) return null;
    if (field === 'contact_name' && to.length < 2) return null;
    const ch: Change = { key: 'c' + i, target, contact_id: contactId, field, label: CONTACT_FIELDS[field], from: currentOf(ctx, target, field, contactId),
      to: field === 'contact_email' ? to.toLowerCase() : field === 'do_not_email' ? 'held' : to, why };
    return ch.from === ch.to ? null : ch;
  }
  return null;
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['reply', 'changes'],
  properties: {
    reply: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['target', 'contact_id', 'field', 'to', 'why'],
        properties: {
          target: { type: 'string', enum: ['listing', 'contact', 'note', 'logan'] },
          contact_id: { type: 'string' },
          field: { type: 'string', enum: [...Object.keys(LISTING_FIELDS), ...Object.keys(CONTACT_FIELDS), 'note', 'logan'] },
          to: { type: 'string' },
          why: { type: 'string' },
        },
      },
    },
  },
};
const systemFor = (g: { name: string; leads: string }) => `You are ${g.name}, a Guide on Vegans Explore (vegansexplore.com) who leads ${g.leads}. You are talking with Sean A. Russell, its founder and a super admin, about the page he is looking at.
Sean tells you what is wrong or out of date. Your job is to turn what he says into exact changes, and to ask when you are not sure.

Rules:
- Propose only what Sean said or what follows plainly from it. Never invent a phone number, email, link, name or hours.
- If something is unclear (which field, which contact, whether a name is the owner or the chef, whether an old email should be replaced or only set aside), ask one short question in reply and propose nothing for that part.
- Changes you can propose, on the listing (target "listing"): ${Object.entries(LISTING_FIELDS).map(([k, v]) => `${k} (${v})`).join(', ')}. For hours, write one line per day as "Monday: 9 AM to 5 PM"; a closed day is "Closed".
- On a business outreach contact (target "contact", with its contact_id): contact_name (the name we greet them by; a name Sean gives is confirmed), contact_email (where outreach emails go), do_not_email (to "true": never email this contact).
- Anything worth remembering about a listing that is not a field (who someone is, a relationship, how they like to be reached): target "note", the note's text in "to".
- Anything you cannot change yourself (the words or layout of a page, a Guide's tab, a button, a picture, a bug, anything on a page that is not a Directory listing): target "logan", field "logan", with a clear note for Logan in "to": the page, what is wrong or wanted, and Sean's words where they matter. Logan builds it; nothing changes until he does.
- Leave contact_id empty unless the target is "contact".
- In reply, speak to Sean in plain, short sentences, first person, as ${g.name}. Say what you will change, or what you need to know. No dashes, no markdown headings. Capitalize Vegan.
- If the page is not a Directory listing, you can only answer and pass notes to Logan: propose a "logan" note for each thing Sean wants changed, and say that Logan will make it.`;

function ctxText(ctx: Ctx, pageUrl: string, label: string, pageText: string) {
  const parts = [`Page: ${label || ''} ${pageUrl}`];
  const l = ctx.listing;
  if (l) {
    parts.push(`This page is the Directory listing "${l.name}" (${l.category || 'no category'}${l.address_city ? ', ' + l.address_city : ''}). What it holds now:`);
    for (const [k, v] of Object.entries(LISTING_FIELDS)) parts.push(`  ${k} (${v}): ${currentOf(ctx, 'listing', k, '') || '(empty)'}`);
    const notes = Array.isArray(l.details?.admin_notes) ? l.details.admin_notes.slice(-5) : [];
    if (notes.length) parts.push('Recent team notes: ' + notes.map((n: any) => `${String(n.at || '').slice(0, 10)} ${n.text}`).join(' | '));
    if (ctx.contacts.length) {
      parts.push('Business outreach contacts for it:');
      for (const c of ctx.contacts) parts.push(`  contact_id ${c.id}: name ${c.contact_name || '(none)'}${c.name_confirmed ? ' (confirmed)' : ''}, email ${c.email || '(none)'} (found: ${c.email_source || 'unknown'}), status ${c.status}`);
    } else parts.push('It has no business outreach contact.');
  } else parts.push('This page is not a Directory listing.');
  if (pageText) parts.push('What the page shows (start of it):\n' + pageText.slice(0, 4000));
  return parts.join('\n');
}

async function applyChanges(ctx: Ctx, changes: Change[], me: string, token: string, pageUrl: string, pageLabel: string, guideName: string) {
  const l = ctx.listing, at = new Date().toISOString(), saved: string[] = [], failed: string[] = [];
  const { data: who } = await db.from('members').select('name,email').eq('id', me).single();
  const by = String(who?.name || 'Admin').split(/\s+/)[0];
  // Notes for Logan go to Depot > Feedback, whatever the page.
  const forLogan = changes.filter((x) => x.target === 'logan');
  for (const n of forLogan) {
    const { error } = await db.from('ve_feedback').insert({ kind: 'suggestion', page_url: pageUrl, page_label: pageLabel || null, message: n.to.slice(0, 2000),
      name: `${by} (via ${guideName})`, email: who?.email || null, member_signed_in: true, status: 'new', note: n.why ? 'Why: ' + n.why : null });
    if (error) failed.push(`Note for Logan (${error.message.slice(0, 60)})`); else saved.push('Note for Logan');
  }
  if (!l) return { saved, failed };
  // Fields ve-outreach listing_fix already knows how to clean, check and log.
  const fixFields: Record<string, unknown> = {};
  for (const c of changes.filter((x) => x.target === 'listing' && !['name', 'email'].includes(x.field))) fixFields[c.field] = c.field === 'hours' ? c.hours : c.to;
  if (Object.keys(fixFields).length) {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/ve-outreach`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'listing_fix', listing_id: l.id, fields: fixFields }) });
    const d = await r.json().catch(() => ({}));
    const labels = Object.keys(fixFields).map((k) => LISTING_FIELDS[k]);
    if (r.ok && d.ok) saved.push(...labels); else failed.push(...labels.map((x) => `${x} (${d.error || r.status})`));
  }
  // Name and the listing's own email: written here, each logged.
  for (const c of changes.filter((x) => x.target === 'listing' && ['name', 'email'].includes(x.field))) {
    const { error } = await db.from('listings').update({ [c.field]: c.to || null, updated_at: at }).eq('id', l.id);
    if (error) { failed.push(c.label); continue; }
    await db.from('ve_listing_edits').insert({ listing_id: l.id, member_id: me, field: c.field, old_value: l[c.field] ?? null, new_value: c.to || null, meta: { by: 'admin', where: 'page_guide' } });
    saved.push(c.label);
  }
  // The outreach contact.
  for (const c of changes.filter((x) => x.target === 'contact')) {
    const patch: Record<string, unknown> = {};
    if (c.field === 'contact_name') Object.assign(patch, { contact_name: c.to, name_confirmed: true });
    if (c.field === 'contact_email') Object.assign(patch, { email: c.to, email_source: 'set by Sean on the page' });
    if (c.field === 'do_not_email') Object.assign(patch, { status: 'held', stop_reason: 'Sean: do not email', batch_id: null });
    const { error } = await db.from('ve_outreach_contacts').update(patch).eq('id', c.contact_id);
    if (error) { failed.push(`${c.label} (${error.message.slice(0, 60)})`); continue; }
    await db.from('ve_outreach_events').insert({ contact_id: c.contact_id, kind: c.field === 'do_not_email' ? 'status' : 'note', detail: { by: me, where: 'page_guide', field: c.field, from: c.from, to: c.to } });
    saved.push(c.label);
  }
  // Team notes.
  const notes = changes.filter((x) => x.target === 'note');
  if (notes.length) {
    const { data: fresh } = await db.from('listings').select('details').eq('id', l.id).single();
    const d = { ...(fresh?.details || {}) };
    d.admin_notes = [...(d.admin_notes || []), ...notes.map((n) => ({ at, by, kind: 'note', text: n.to }))];
    const { error } = await db.from('listings').update({ details: d, updated_at: at }).eq('id', l.id);
    if (error) failed.push('Team note'); else saved.push(notes.length > 1 ? `${notes.length} team notes` : 'Team note');
  }
  return { saved, failed };
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
  const pageUrl = clean(b.page_url, 500);
  if (!/^https?:\/\//.test(pageUrl)) return json({ error: 'page_url' }, 400);
  const ctx = await loadCtx(pageUrl);
  const gKey = GUIDES[String(b.guide || '').toLowerCase()] ? String(b.guide).toLowerCase() : 'liz', guide = GUIDES[gKey];

  if (b.action === 'chat') {
    const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-20)
      .map((x: any) => ({ role: x?.role === 'assistant' ? 'assistant' : 'user', content: clean(x?.text, 4000) })).filter((x: any) => x.content);
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'message_needed' }, 400);
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    // The model API needs turns to alternate; fold any two in a row together.
    const turns: { role: string; content: string }[] = [];
    for (const x of msgs) { const last = turns[turns.length - 1]; if (last && last.role === x.role) last.content += '\n\n' + x.content; else turns.push({ ...x }); }
    turns[0].content = ctxText(ctx, pageUrl, clean(b.page_label, 120), clean(b.page_text, 6000)) + '\n\nSean says:\n' + turns[0].content;
    const apiKey = await secret('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'no_model_key' }, 500);
    let out: any;
    try {
      const client = new Anthropic({ apiKey });
      const res: any = await client.beta.messages.create({
        model: MODEL, max_tokens: 3000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        system: systemFor(guide), messages: turns,
      } as any);
      if (res.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
      out = JSON.parse((res.content || []).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
      return json({ error: String((e as Error).message || e).slice(0, 200) }, 502);
    }
    const changes = (out.changes || []).map((c: any, i: number) => normalize(ctx, c, i)).filter(Boolean) as Change[];
    const reply = clean(out.reply, 3000);
    await db.from('ve_page_guide_log').insert({ member_id: me, page_url: pageUrl, listing_id: ctx.listing?.id || null, kind: 'chat', message: msgs[msgs.length - 1].content, reply, changes, result: { guide: gKey } });
    return json({ ok: true, reply, changes: changes.map(({ hours, ...c }) => c), listing: ctx.listing ? { name: ctx.listing.name, slug: ctx.listing.slug } : null });
  }

  if (b.action === 'apply') {
    const list = (Array.isArray(b.changes) ? b.changes : []).slice(0, 30);
    const changes = list.map((c: any, i: number) => normalize(ctx, c, i)).filter(Boolean) as Change[];
    if (!changes.length) return json({ error: ctx.listing ? 'nothing_to_apply' : 'not_a_listing' }, 400);
    const result = await applyChanges(ctx, changes, me, token, pageUrl, clean(b.page_label, 120), guide.name);
    await db.from('ve_page_guide_log').insert({ member_id: me, page_url: pageUrl, listing_id: ctx.listing?.id || null, kind: 'apply', changes, result: { ...result, guide: gKey } });
    return json({ ok: !result.failed.length, ...result });
  }
  return json({ error: 'unknown_action' }, 400);
});
