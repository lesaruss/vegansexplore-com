// ve-holiday: the Holiday Guide's business holiday menus (canon-ve-holiday-guide v1, Sean 2026-11-07; migration 20261107_holiday_menus.sql).
// A member business with a claimed listing (or an open claim on it) sends its holiday menu; a person checks it before it shows.
// POST { action, ... }. verify_jwt off; the Vegans Explore token is checked here.
// Public:  holidays, live {holiday}
// Member:  mine {listing? (a super admin: any place, to upload its menu)}, save {holiday, listing_id, summary, items, order_url, order_by, pickup, price_range, holiday_hours, contact_note}, withdraw {id},
//          photo_url {listing_id} (a dish photo, squared in the browser, into vegan-media), scan_start {listing_id, type},
//          scan_read {listing_id, holiday, paths[]} (up to 3 photos or a PDF of their menu, read by Claude into dishes; 10 reads a day)
//          tip {holiday, place_name, city, state, link, note, listing_id?} (a menu a member found; a person checks it; the team's go live at once)
//          (any registered account, Sean 2026-11-10: quick registration is enough to send things) tip; wish_mine {holiday},
//          wish_add {holiday, kind: wish | gift, title, link?, note?}, wish_remove {id}
// Public:  wishes {holiday} (the team-approved gift ideas and the Most Wanted shelf), wish_list {code} (one person's list, by referral code),
//          gifts {holiday} (the Gift Guide our team picks, with each gift's pluses, and the caller's own when signed in)
// Account: gift_plus {gift_id, on} (any registered account; a plus lives only in the Holiday Guide)
// Admin:   queue {holiday?, status?}, get {id}, review {id, decision: approve | decline | note, note},
//          tips {holiday?}, tip_review {id, decision: approve | decline | note, note, listing_id?}, wish_queue {holiday?}, wish_review {id, decision}
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{1,40}$/;
const CLOSED_CLAIM = ['rejected', 'declined', 'cancelled', 'canceled', 'expired', 'test'];
const READ_ACTIONS = new Set(['holidays', 'live', 'mine']);
const PUBLIC_BASE = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/vegan-media/`;
const PHOTO_PREFIX = 'media/holiday-menus/';
const SCAN_BUCKET = 'holiday-menu-scans';
const SCAN_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const SCAN_READS_A_DAY = 10;
const TIPS_A_DAY = 10;
const WISHES_A_DAY = 20;
const CODE = /^[A-Za-z0-9-]{4,20}$/;
// The same wish from many people counts once per link (or per name when there is no link) on Most Wanted.
const wishKey = (w: { link?: string | null; title: string }) => { try { if (w.link) { const u = new URL(w.link); return (u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')).toLowerCase(); } } catch { /* the name then */ } return w.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
const TIP_LISTING = 'id, slug, name, category, address_city, address_state, logo_url, color, vegan_status, communities';
const MODEL = 'claude-opus-5-5';
// A dish photo must be one we hold, uploaded through photo_url.
const okPhoto = (u: string) => u.startsWith(PUBLIC_BASE + PHOTO_PREFIX) && /^[A-Za-z0-9/_.-]+$/.test(u.slice(PUBLIC_BASE.length));

function toBase64(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const MENU_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['is_menu', 'summary', 'items', 'left_out', 'note'],
  properties: {
    is_menu: { type: 'boolean', description: 'True if this shows food or drink for sale with names (a menu, a holiday order form, a flyer listing dishes).' },
    summary: { type: 'string', description: 'One or two lines on the offer, only from words printed (a bundle, a pickup date). Empty if the menu does not describe one.' },
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'desc', 'price'],
      properties: { name: { type: 'string' }, desc: { type: 'string', description: 'The printed description, shortened to one line if long. Empty if none.' }, price: { type: 'string', description: 'As printed, with the currency sign. Empty if none.' } } } },
    left_out: { type: 'integer', description: 'How many printed dishes were left out (not plant-based on a menu that mixes, or past 20).' },
    note: { type: 'string', description: 'One short sentence for the owner: what could not be read, or what was left out and why. Empty if nothing.' },
  },
};
async function readMenu(files: { bytes: Uint8Array; type: string }[], holidayName: string, fullyVegan: boolean) {
  const { data: k } = await db.from('lesaruss_secrets').select('value').eq('key', 'ANTHROPIC_API_KEY').maybeSingle();
  if (!k?.value) return { error: 'reader_unavailable' };
  const client = new Anthropic({ apiKey: String(k.value) });
  const content: any[] = files.map((f) => f.type === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: toBase64(f.bytes) } }
    : { type: 'image', source: { type: 'base64', media_type: f.type, data: toBase64(f.bytes) } });
  content.push({ type: 'text', text: `Read this menu for the business's ${holidayName} offer and list its dishes.` });
  try {
    const r: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: MENU_SCHEMA } },
      system: `You read a restaurant's menu (photos or a PDF) so the owner does not have to type it into the Vegans Explore Holiday Guide.
- Copy dish names, descriptions and prices exactly as printed. Never invent a dish, a price or a description. Leave a field empty when it is not printed.
- If the menu has a section for ${holidayName} (or Thanksgiving, holiday, seasonal or catering), take only that section. Otherwise take the dishes printed.
- ${fullyVegan ? 'This business is 100% Vegan, so every dish counts.' : 'This business is not 100% Vegan. Take only dishes the menu marks Vegan or plant-based (a V, VG, a leaf, the word Vegan or plant-based). Count the others in left_out and say so in note. If nothing is marked, take nothing and say in note that the owner should add their plant-based dishes by hand.'}
- At most 20 dishes, in the order printed.
- Write "Vegan" with a capital V. No em dashes.`,
      messages: [{ role: 'user', content }],
    } as any);
    if (r.stop_reason === 'refusal') return { error: 'unreadable' };
    if (r.stop_reason !== 'end_turn') return { error: 'unreadable' };
    const text = (r.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    return { result: JSON.parse(text) };
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { error: 'busy' };
    console.error('menu read', String(e));
    return { error: 'reader_unavailable' };
  }
}

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
// Same key derivation as ve-auth's signJWT / decodeToken.
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
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const escH = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T12:00:00Z'));
function cleanUrl(v: unknown): string | null {
  const s = clean(v, 500);
  if (!s) return null;
  const u = /^https?:\/\//i.test(s) ? s : 'https://' + s;
  try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.toString() : null; } catch { return null; }
}

async function holidays() {
  const { data } = await db.from('ve_holidays').select('slug, name, holiday_on, submit_close, promo_from, promo_to, sort').eq('active', true).order('sort');
  const now = Date.now();
  return (data || []).map((h) => ({ ...h, open: Date.parse(h.submit_close) > now, days_left: Math.max(0, Math.ceil((Date.parse(h.submit_close) - now) / 86400000)) }));
}

// The listings this member may send a menu for: ones they own, and ones with their open claim.
async function myListings(me: string) {
  const [own, cl] = await Promise.all([
    db.from('listings').select('id, slug, name, category, address_city, address_state, logo_url, color, vegan_status, google_hours_json').eq('owner_member_id', me).eq('status', 'approved').limit(50),
    db.from('ve_listing_claims').select('listing_id, status').eq('member_id', me).limit(50),
  ]);
  const out = (own.data || []).map((l) => ({ ...l, claim: 'owner' }));
  const openIds = (cl.data || []).filter((c) => !CLOSED_CLAIM.includes(String(c.status || ''))).map((c) => c.listing_id).filter((id) => !out.some((l) => l.id === id));
  if (openIds.length) {
    const { data } = await db.from('listings').select('id, slug, name, category, address_city, address_state, logo_url, color, vegan_status, google_hours_json').in('id', openIds).eq('status', 'approved');
    for (const l of data || []) out.push({ ...l, claim: 'waiting' });
  }
  return out;
}

async function sendEmail(to: { email: string; name?: string }, ref: string, subject: string, body: string): Promise<string> {
  if (String(to.name || '').startsWith('[TEST]')) return 'test_skipped';
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a"><p style="margin:0 0 18px"><img src="https://vegansexplore.com/public/logo-ve-landscape-v1.svg" alt="Vegans Explore" width="150" style="display:block;border:0"></p>${body}` +
    `<p style="margin-top:28px;font-size:12px;line-height:1.5;color:#777">You are getting this because you sent a holiday menu to Vegans Explore. <a href="{{unsubscribe_url}}" style="color:#777">Stop these emails</a>. {{postal_address}}.</p></div>`;
  try {
    const { data: t } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
    const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t?.value}` },
      body: JSON.stringify({ brand: 'vegans-explore', campaign_ref: ref, list_ref: 've-holiday-menus', subject, html, recipients: [{ email: to.email, name: to.name || undefined }] }) });
    const j = await r.json().catch(() => ({}));
    return j?.results?.[0]?.result || j?.error || `email-send ${r.status}`;
  } catch (e) { return String(e); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(b.action || '');

  // ---- Public ----
  if (action === 'holidays') return json({ ok: true, holidays: await holidays() });
  if (action === 'live') {
    const hs = String(b.holiday || '');
    if (!SLUG.test(hs)) return json({ error: 'bad_holiday' }, 400);
    const { data } = await db.from('ve_holiday_menus').select('id, listing_id, summary, items, order_url, order_by, pickup, price_range, holiday_hours').eq('holiday_slug', hs).eq('status', 'live').limit(500);
    const ids = (data || []).map((m) => m.listing_id);
    const { data: ls } = ids.length ? await db.from('listings').select('id, slug, name, category, address_city, address_state, logo_url, color, vegan_status, communities').in('id', ids).eq('status', 'approved') : { data: [] as any[] };
    const L = Object.fromEntries((ls || []).map((l) => [l.id, l]));
    const rows = (data || []).filter((m) => L[m.listing_id]).map((m) => ({ ...m, listing: L[m.listing_id] }))
      .sort((x, y) => (x.listing.vegan_status === 'fully_vegan' ? 0 : 1) - (y.listing.vegan_status === 'fully_vegan' ? 0 : 1) || String(x.listing.name).localeCompare(String(y.listing.name)));
    // Menus our members spotted (Sean, 2026-11-08): a place and a link to its own holiday menu, checked by our team; we never copy it.
    const { data: tp } = await db.from('ve_holiday_menu_tips').select('id, listing_id, place_name, city, state, link, note, reviewed_at').eq('holiday_slug', hs).eq('status', 'live').order('reviewed_at', { ascending: false }).limit(300);
    const tids = [...new Set((tp || []).map((t) => t.listing_id).filter(Boolean))];
    const { data: tl } = tids.length ? await db.from('listings').select(TIP_LISTING).in('id', tids).eq('status', 'approved') : { data: [] as any[] };
    const TL = Object.fromEntries((tl || []).map((l) => [l.id, l]));
    const shown = new Set(rows.map((r) => r.listing_id));
    const tips = (tp || []).filter((t) => !t.listing_id || !shown.has(t.listing_id)).map((t) => ({ ...t, listing: t.listing_id ? TL[t.listing_id] || null : null }));
    return json({ ok: true, menus: rows, tips });
  }
  // The Holiday Wish List (Sean, 2026-11-10): the public shelves show only what the team approved.
  if (action === 'wishes') {
    const hs = String(b.holiday || 'christmas');
    if (!SLUG.test(hs)) return json({ error: 'bad_holiday' }, 400);
    const { data } = await db.from('ve_holiday_wishes').select('id, kind, title, link, note, reviewed_at').eq('holiday_slug', hs).eq('status', 'live').order('reviewed_at', { ascending: false }).limit(500);
    const rows = data || [];
    const tally: Record<string, { title: string; link: string | null; note: string | null; n: number }> = {};
    for (const w of rows) { const k = wishKey(w as any); if (!tally[k]) tally[k] = { title: w.title, link: w.link, note: w.note, n: 0 }; tally[k].n++; }
    const most = Object.values(tally).sort((x, y) => y.n - x.n || x.title.localeCompare(y.title)).slice(0, 12);
    return json({ ok: true, gifts: rows.filter((w) => w.kind === 'gift').slice(0, 60), most_wanted: most });
  }
  if (action === 'gifts') {
    const hs = String(b.holiday || 'christmas');
    if (!SLUG.test(hs)) return json({ error: 'bad_holiday' }, 400);
    const { data } = await db.from('ve_holiday_gifts').select('id, section, title, brand, listing_id, link, amazon_link, price, image_url, note, source_name, source_url, sort').eq('holiday_slug', hs).eq('status', 'live').order('sort').limit(300);
    const rows = data || [], ids = rows.map((g) => g.id), lids = [...new Set(rows.map((g) => g.listing_id).filter(Boolean))];
    const [{ data: pl }, { data: ls }] = await Promise.all([
      ids.length ? db.from('ve_holiday_gift_plus').select('gift_id, member_id').in('gift_id', ids) : Promise.resolve({ data: [] as any[] }),
      lids.length ? db.from('listings').select('id, slug, name, logo_url').in('id', lids).eq('status', 'approved') : Promise.resolve({ data: [] as any[] }),
    ]);
    const tok0 = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const who = tok0 && tok0.split('.').length === 3 ? await verifyToken(tok0) : null;
    const n: Record<string, number> = {}, mine: Record<string, boolean> = {};
    for (const p of pl || []) { n[p.gift_id] = (n[p.gift_id] || 0) + 1; if (who && p.member_id === who) mine[p.gift_id] = true; }
    const L = Object.fromEntries((ls || []).map((l: any) => [l.id, l]));
    return json({ ok: true, gifts: rows.map((g) => ({ ...g, listing: g.listing_id ? L[g.listing_id] || null : null, plus: n[g.id] || 0, mine: !!mine[g.id] })) });
  }
  if (action === 'wish_list') {
    const code = String(b.code || ''), hs = String(b.holiday || 'christmas');
    if (!CODE.test(code) || !SLUG.test(hs)) return json({ error: 'bad_code' }, 400);
    const { data: who } = await db.from('members').select('id, name').eq('referral_code', code).maybeSingle();
    if (!who) return json({ error: 'not_found' }, 404);
    const { data } = await db.from('ve_holiday_wishes').select('id, title, link, note').eq('holiday_slug', hs).eq('member_id', who.id).eq('kind', 'wish').in('status', ['pending', 'live']).order('created_at').limit(100);
    return json({ ok: true, first_name: String(who.name || '').trim().split(/\s+/)[0] || 'A friend', items: data || [] });
  }

  // ---- Signed in ----
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(b.token || '');
  const me = tok ? await verifyToken(tok) : null;
  if (!me) return json({ error: 'not_authenticated' }, 401);
  const { data: mm } = await db.from('members').select('id, name, email, is_superadmin, standing, membership_status, member_class').eq('id', me).maybeSingle();
  if (!mm) return json({ error: 'not_authenticated' }, 401);
  if (!READ_ACTIONS.has(action) && mm.standing && mm.standing !== 'good') return json({ error: 'account_not_in_good_standing' }, 403);
  const admin = !!mm.is_superadmin;
  const member = admin || mm.membership_status === 'active';

  if (action === 'mine') {
    const ls: any[] = member ? await myListings(me) : [];
    // A super admin uploads any place's menu (Sean, 2026-11-08: "a way for superadmins to upload menus directly"): the place asked for
    // joins their list, and the menu is read and waits for a check like any other.
    const want = String(b.listing || '');
    if (admin && /^[a-z0-9][a-z0-9-]{0,120}$/.test(want) && !ls.some((l) => l.slug === want)) {
      const { data: one } = await db.from('listings').select('id, slug, name, category, address_city, address_state, logo_url, color, vegan_status, google_hours_json').eq('slug', want).eq('status', 'approved').maybeSingle();
      if (one) ls.unshift({ ...one, claim: 'admin' });
    }
    const ids = ls.map((l) => l.id);
    const { data: menus } = ids.length ? await db.from('ve_holiday_menus').select('*').in('listing_id', ids) : { data: [] as any[] };
    return json({ ok: true, member, listings: ls, menus: menus || [], holidays: await holidays() });
  }

  if (action === 'save') {
    if (!member) return json({ error: 'member_needed' }, 403);
    const hs = String(b.holiday || ''), lid = String(b.listing_id || '');
    if (!SLUG.test(hs) || !UUID.test(lid)) return json({ error: 'bad_request' }, 400);
    const { data: h } = await db.from('ve_holidays').select('slug, name, submit_close, active').eq('slug', hs).maybeSingle();
    if (!h || !h.active) return json({ error: 'bad_holiday' }, 400);
    if (Date.parse(h.submit_close) <= Date.now() && !admin) return json({ error: 'closed' }, 409);
    const mine = await myListings(me);
    let listing: any = mine.find((l) => l.id === lid);
    if (!listing && !admin) return json({ error: 'not_your_listing' }, 403);
    if (!listing) listing = (await db.from('listings').select('id, name').eq('id', lid).maybeSingle()).data;

    const summary = clean(b.summary, 400);
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 20)
      .map((x: any) => { const ph = clean(x?.photo, 500); return { name: clean(x?.name, 120), desc: clean(x?.desc, 300), price: clean(x?.price, 30), ...(ph && okPhoto(ph) ? { photo: ph } : {}) }; }).filter((x: any) => x.name);
    if (summary.length < 10) return json({ error: 'summary_needed' }, 400);
    if (!items.length) return json({ error: 'items_needed' }, 400);
    const orderBy = clean(b.order_by, 10);
    if (orderBy && !isDate(orderBy)) return json({ error: 'bad_order_by' }, 400);
    const rawUrl = clean(b.order_url, 500);
    const orderUrl = cleanUrl(rawUrl);
    if (rawUrl && !orderUrl) return json({ error: 'bad_order_url' }, 400);
    const fields = {
      summary, items, order_url: orderUrl, order_by: orderBy || null,
      pickup: clean(b.pickup, 300) || null, price_range: clean(b.price_range, 60) || null,
      holiday_hours: clean(b.holiday_hours, 200) || null, contact_note: clean(b.contact_note, 600) || null,
    };
    const { data: prev } = await db.from('ve_holiday_menus').select('id, status').eq('holiday_slug', hs).eq('listing_id', lid).maybeSingle();
    const now = new Date().toISOString();
    // Any change goes back to a person: a live menu that is edited waits again.
    const row = { ...fields, status: 'pending', decline_note: null, updated_at: now, submitted_at: now, member_id: prev ? undefined : me };
    let saved;
    if (prev) {
      const { member_id: _m, ...upd } = row as any;
      saved = await db.from('ve_holiday_menus').update(upd).eq('id', prev.id).select('id, status').single();
    } else {
      saved = await db.from('ve_holiday_menus').insert({ ...row, holiday_slug: hs, listing_id: lid, member_id: me }).select('id, status').single();
    }
    if (saved.error) return json({ error: 'save_failed' }, 500);
    // The team hears about each one (contact@lesaruss.com), unless the business is [TEST].
    if (!String(listing?.name || '').startsWith('[TEST]')) {
      const body = `<p><b>${escH(listing?.name || 'A business')}</b> ${prev ? 'changed' : 'sent'} its ${escH(h.name)} menu. It waits for a check.</p>` +
        `<p>${escH(summary)}</p><p><a href="https://vegansexplore.com/admin/depot/holiday-menus#m/${saved.data.id}" style="color:#2D5C27">Open it in the Depot</a></p>`;
      sendEmail({ email: 'contact@lesaruss.com', name: 'Vegans Explore team' }, `ve-holiday-menu-team-${saved.data.id}-${Date.now()}`, `[Holiday menu] ${listing?.name || ''}: ${h.name}`, body).catch(() => {});
    }
    return json({ ok: true, id: saved.data.id, status: 'pending', was: prev?.status || null });
  }

  if (action === 'photo_url' || action === 'scan_start' || action === 'scan_read') {
    if (!member) return json({ error: 'member_needed' }, 403);
    const lid = String(b.listing_id || '');
    if (!UUID.test(lid)) return json({ error: 'bad_request' }, 400);
    const listing = (await myListings(me)).find((l) => l.id === lid);
    let L: any = listing;
    if (!L && admin) L = (await db.from('listings').select('id, slug, name, vegan_status').eq('id', lid).maybeSingle()).data;
    if (!L) return json({ error: 'not_your_listing' }, 403);

    if (action === 'photo_url') {
      const path = `${PHOTO_PREFIX}${L.slug}/dish-${crypto.randomUUID()}.jpg`;
      const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_failed' }, 500);
      return json({ ok: true, upload_url: up.signedUrl, url: PUBLIC_BASE + path });
    }
    if (action === 'scan_start') {
      const ext = SCAN_TYPES[String(b.type || '')];
      if (!ext) return json({ error: 'bad_type' }, 400);
      const path = `${me}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { data: up, error } = await db.storage.from(SCAN_BUCKET).createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_failed' }, 500);
      return json({ ok: true, upload_url: up.signedUrl, path });
    }
    // scan_read
    const paths = (Array.isArray(b.paths) ? b.paths : []).map((x: unknown) => String(x)).slice(0, 3);
    if (!paths.length || paths.some((x: string) => !x.startsWith(me + '/') || x.includes('..'))) return json({ error: 'bad_request' }, 400);
    if (!admin) {
      const since = new Date(Date.now() - 86400000).toISOString();
      const { count } = await db.from('ve_holiday_menu_reads').select('id', { count: 'exact', head: true }).eq('member_id', me).gte('created_at', since);
      if ((count || 0) >= SCAN_READS_A_DAY) return json({ error: 'rate_limited' }, 429);
    }
    const files: { bytes: Uint8Array; type: string }[] = [];
    let total = 0;
    for (const pth of paths) {
      const { data: f, error } = await db.storage.from(SCAN_BUCKET).download(pth);
      if (error || !f) return json({ error: 'not_uploaded' }, 400);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const type = pth.endsWith('.pdf') ? 'application/pdf' : pth.endsWith('.png') ? 'image/png' : pth.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      if (type !== 'application/pdf' && bytes.length > 5 * 1024 * 1024) return json({ error: 'too_big' }, 400);
      total += bytes.length; files.push({ bytes, type });
    }
    if (total > 25 * 1024 * 1024) return json({ error: 'too_big' }, 400);
    const { data: h } = await db.from('ve_holidays').select('name').eq('slug', String(b.holiday || '')).maybeSingle();
    const r: any = await readMenu(files, h?.name || 'holiday', L.vegan_status === 'fully_vegan');
    const res = r.result || {};
    const items = (Array.isArray(res.items) ? res.items : []).slice(0, 20).map((x: any) => ({ name: clean(x?.name, 120), desc: clean(x?.desc, 300), price: clean(x?.price, 30) })).filter((x: any) => x.name);
    await db.from('ve_holiday_menu_reads').insert({ member_id: me, listing_id: lid, paths, items_found: r.error ? null : items.length, error: r.error || (res.is_menu === false ? 'not_a_menu' : null) });
    if (r.error) return json({ error: r.error }, r.error === 'busy' ? 429 : 400);
    if (res.is_menu === false) return json({ ok: true, is_menu: false, items: [], note: 'That does not look like a menu.' });
    return json({ ok: true, is_menu: true, summary: clean(res.summary, 400), items, left_out: Number(res.left_out) || 0, note: clean(res.note, 300) });
  }

  if (action === 'withdraw') {
    const id = String(b.id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: m } = await db.from('ve_holiday_menus').select('id, listing_id').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    if (!admin && !(await myListings(me)).some((l) => l.id === m.listing_id)) return json({ error: 'not_your_listing' }, 403);
    await db.from('ve_holiday_menus').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', id);
    return json({ ok: true, status: 'withdrawn' });
  }

  if (action === 'gift_plus') {
    const gid = String(b.gift_id || '');
    if (!UUID.test(gid)) return json({ error: 'bad_id' }, 400);
    if (!(await db.from('ve_holiday_gifts').select('id').eq('id', gid).eq('status', 'live').maybeSingle()).data) return json({ error: 'not_found' }, 404);
    if (b.on === false) await db.from('ve_holiday_gift_plus').delete().eq('gift_id', gid).eq('member_id', me);
    else await db.from('ve_holiday_gift_plus').upsert({ gift_id: gid, member_id: me }, { onConflict: 'gift_id,member_id', ignoreDuplicates: true });
    const { count } = await db.from('ve_holiday_gift_plus').select('gift_id', { count: 'exact', head: true }).eq('gift_id', gid);
    return json({ ok: true, plus: count || 0, mine: b.on !== false });
  }
  // Wish list: any registered account (quick registration is enough).
  if (action === 'wish_mine' || action === 'wish_add' || action === 'wish_remove') {
    const hs = String(b.holiday || 'christmas');
    if (!SLUG.test(hs)) return json({ error: 'bad_holiday' }, 400);
    if (action === 'wish_remove') {
      const id = String(b.id || '');
      if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
      const { data: w } = await db.from('ve_holiday_wishes').select('id, member_id').eq('id', id).maybeSingle();
      if (!w || (w.member_id !== me && !admin)) return json({ error: 'not_found' }, 404);
      await db.from('ve_holiday_wishes').update({ status: 'removed', updated_at: new Date().toISOString() }).eq('id', id);
      return json({ ok: true });
    }
    if (action === 'wish_add') {
      const { data: h } = await db.from('ve_holidays').select('slug, name, active').eq('slug', hs).maybeSingle();
      if (!h || !h.active) return json({ error: 'bad_holiday' }, 400);
      const kind = b.kind === 'gift' ? 'gift' : 'wish';
      const title = clean(b.title, 120);
      if (title.length < 2) return json({ error: 'title_needed' }, 400);
      const rawLink = clean(b.link, 500), link = rawLink ? cleanUrl(rawLink) : null;
      if (rawLink && !link) return json({ error: 'bad_link' }, 400);
      if (!admin) {
        const since = new Date(Date.now() - 86400000).toISOString();
        const { count } = await db.from('ve_holiday_wishes').select('id', { count: 'exact', head: true }).eq('member_id', me).gte('created_at', since);
        if ((count || 0) >= WISHES_A_DAY) return json({ error: 'rate_limited' }, 429);
      }
      const now = new Date().toISOString();
      const { data: saved, error } = await db.from('ve_holiday_wishes').insert({ holiday_slug: hs, member_id: me, kind, title, link, note: clean(b.note, 300) || null,
        status: admin ? 'live' : 'pending', reviewed_by: admin ? me : null, reviewed_at: admin ? now : null }).select('id, status').single();
      if (error || !saved) return json({ error: 'save_failed' }, 500);
      return json({ ok: true, id: saved.id, status: saved.status });
    }
    const [{ data: rows }, { data: who }] = await Promise.all([
      db.from('ve_holiday_wishes').select('id, kind, title, link, note, status, created_at').eq('holiday_slug', hs).eq('member_id', me).neq('status', 'removed').order('created_at').limit(200),
      db.from('members').select('referral_code').eq('id', me).maybeSingle(),
    ]);
    return json({ ok: true, items: rows || [], code: who?.referral_code || null });
  }

  if (action === 'tip') {
    const hs = String(b.holiday || '');
    if (!SLUG.test(hs)) return json({ error: 'bad_holiday' }, 400);
    const { data: h } = await db.from('ve_holidays').select('slug, name, holiday_on, active').eq('slug', hs).maybeSingle();
    if (!h || !h.active) return json({ error: 'bad_holiday' }, 400);
    if (Date.parse(h.holiday_on + 'T23:59:00-05:00') < Date.now() && !admin) return json({ error: 'closed' }, 409);
    const place = clean(b.place_name, 120);
    if (place.length < 2) return json({ error: 'place_needed' }, 400);
    const link = cleanUrl(b.link);
    if (!link) return json({ error: 'link_needed' }, 400);
    let lid: string | null = String(b.listing_id || '') || null;
    if (lid && (!UUID.test(lid) || !(await db.from('listings').select('id').eq('id', lid).eq('status', 'approved').maybeSingle()).data)) lid = null;
    if (!admin) {
      const since = new Date(Date.now() - 86400000).toISOString();
      const { count } = await db.from('ve_holiday_menu_tips').select('id', { count: 'exact', head: true }).eq('member_id', me).gte('created_at', since);
      if ((count || 0) >= TIPS_A_DAY) return json({ error: 'rate_limited' }, 429);
    }
    const { data: dup } = await db.from('ve_holiday_menu_tips').select('id, status').eq('holiday_slug', hs).eq('link', link).neq('status', 'declined').limit(1).maybeSingle();
    if (dup) return json({ ok: true, id: dup.id, status: dup.status, already: true });
    const now = new Date().toISOString();
    const row: any = { holiday_slug: hs, member_id: me, listing_id: lid, place_name: place, city: clean(b.city, 80) || null, state: clean(b.state, 40) || null, link,
      note: clean(b.note, 400) || null, status: admin ? 'live' : 'pending', by_team: admin, reviewed_by: admin ? me : null, reviewed_at: admin ? now : null };
    const { data: saved, error } = await db.from('ve_holiday_menu_tips').insert(row).select('id, status').single();
    if (error || !saved) return json({ error: 'save_failed' }, 500);
    if (!admin && !place.startsWith('[TEST]')) {
      const body = `<p><b>${escH(mm.name || 'A member')}</b> spotted a ${escH(h.name)} menu: <b>${escH(place)}</b>${row.city ? ', ' + escH(row.city) : ''}.</p>` +
        `<p><a href="${escH(link)}" style="color:#2D5C27">${escH(link)}</a></p>${row.note ? `<p>${escH(row.note)}</p>` : ''}` +
        `<p><a href="https://vegansexplore.com/admin/depot/holiday-menus#tips/pending" style="color:#2D5C27">Check it in the Depot</a></p>`;
      sendEmail({ email: 'contact@lesaruss.com', name: 'Vegans Explore team' }, `ve-holiday-tip-team-${saved.id}`, `[Holiday menu spotted] ${place}`, body).catch(() => {});
    }
    return json({ ok: true, id: saved.id, status: saved.status });
  }

  // ---- The team ----
  if (!admin) return json({ error: 'no_access' }, 403);

  if (action === 'tips') {
    let q = db.from('ve_holiday_menu_tips').select('*').order('created_at', { ascending: false }).limit(1000);
    if (SLUG.test(String(b.holiday || ''))) q = q.eq('holiday_slug', String(b.holiday));
    const { data, error } = await q;
    if (error) return json({ error: 'load_failed' }, 500);
    const lids = [...new Set((data || []).map((t) => t.listing_id).filter(Boolean))];
    const mids = [...new Set((data || []).map((t) => t.member_id))];
    const [{ data: ls }, { data: ms }] = await Promise.all([
      lids.length ? db.from('listings').select(TIP_LISTING).in('id', lids) : Promise.resolve({ data: [] as any[] }),
      mids.length ? db.from('members').select('id, name, email').in('id', mids) : Promise.resolve({ data: [] as any[] }),
    ]);
    const L = Object.fromEntries((ls || []).map((l: any) => [l.id, l])), M = Object.fromEntries((ms || []).map((m: any) => [m.id, m]));
    const counts: Record<string, number> = { pending: 0, live: 0, declined: 0, all: (data || []).length };
    for (const t of data || []) counts[t.status] = (counts[t.status] || 0) + 1;
    return json({ ok: true, counts, holidays: await holidays(), rows: (data || []).map((t) => ({ ...t, listing: t.listing_id ? L[t.listing_id] || null : null, member: M[t.member_id] || null })) });
  }

  if (action === 'tip_review') {
    const id = String(b.id || ''), d = String(b.decision || ''), note = clean(b.note, 1000);
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    if (!['approve', 'decline', 'note'].includes(d)) return json({ error: 'bad_decision' }, 400);
    const { data: t } = await db.from('ve_holiday_menu_tips').select('id').eq('id', id).maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    if (d !== 'approve' && note.length < 3) return json({ error: 'note_needed' }, 400);
    const now = new Date().toISOString();
    const upd: any = { updated_at: now };
    if (note) upd.team_note = note;
    if (b.listing_id !== undefined) {
      const lid = String(b.listing_id || '');
      if (!lid) upd.listing_id = null;
      else if (UUID.test(lid) && (await db.from('listings').select('id').eq('id', lid).maybeSingle()).data) upd.listing_id = lid;
      else return json({ error: 'bad_listing' }, 400);
    }
    if (d !== 'note') { upd.status = d === 'approve' ? 'live' : 'declined'; upd.reviewed_by = me; upd.reviewed_at = now; }
    await db.from('ve_holiday_menu_tips').update(upd).eq('id', id);
    return json({ ok: true, status: upd.status || null });
  }

  if (action === 'wish_queue') {
    let q = db.from('ve_holiday_wishes').select('*').eq('status', 'pending').order('created_at').limit(500);
    if (SLUG.test(String(b.holiday || ''))) q = q.eq('holiday_slug', String(b.holiday));
    const { data } = await q;
    const mids = [...new Set((data || []).map((w) => w.member_id))];
    const { data: ms } = mids.length ? await db.from('members').select('id, name, email').in('id', mids) : { data: [] as any[] };
    const M = Object.fromEntries((ms || []).map((m: any) => [m.id, m]));
    return json({ ok: true, rows: (data || []).map((w) => ({ ...w, member: M[w.member_id] || null })) });
  }
  if (action === 'wish_review') {
    const id = String(b.id || ''), d = String(b.decision || '');
    if (!UUID.test(id) || !['approve', 'decline'].includes(d)) return json({ error: 'bad_request' }, 400);
    const now = new Date().toISOString();
    await db.from('ve_holiday_wishes').update({ status: d === 'approve' ? 'live' : 'declined', reviewed_by: me, reviewed_at: now, updated_at: now, team_note: clean(b.note, 500) || null }).eq('id', id).eq('status', 'pending');
    return json({ ok: true });
  }

  if (action === 'queue') {
    let q = db.from('ve_holiday_menus').select('id, holiday_slug, listing_id, member_id, status, summary, items, submitted_at, reviewed_at').order('submitted_at', { ascending: true }).limit(1000);
    if (SLUG.test(String(b.holiday || ''))) q = q.eq('holiday_slug', String(b.holiday));
    const { data, error } = await q;
    if (error) return json({ error: 'load_failed' }, 500);
    const lids = [...new Set((data || []).map((m) => m.listing_id))];
    const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name, address_city, address_state, logo_url, color, vegan_status').in('id', lids) : { data: [] as any[] };
    const L = Object.fromEntries((ls || []).map((l) => [l.id, l]));
    const counts: Record<string, number> = { pending: 0, live: 0, declined: 0, withdrawn: 0, all: (data || []).length };
    for (const m of data || []) counts[m.status] = (counts[m.status] || 0) + 1;
    return json({ ok: true, counts, holidays: await holidays(), rows: (data || []).map((m) => ({ ...m, listing: L[m.listing_id] || null })) });
  }

  if (action === 'get') {
    const id = String(b.id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: m } = await db.from('ve_holiday_menus').select('*').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    const [l, who, h, by] = await Promise.all([
      db.from('listings').select('id, slug, name, category, address_city, address_state, logo_url, color, vegan_status, owner_member_id, website, phone').eq('id', m.listing_id).maybeSingle(),
      db.from('members').select('id, name, email').eq('id', m.member_id).maybeSingle(),
      db.from('ve_holidays').select('slug, name, holiday_on, submit_close').eq('slug', m.holiday_slug).maybeSingle(),
      m.reviewed_by ? db.from('members').select('name').eq('id', m.reviewed_by).maybeSingle() : Promise.resolve({ data: null as any }),
    ]);
    return json({ ok: true, menu: m, listing: l.data, member: who.data, holiday: h.data, claim: l.data?.owner_member_id === m.member_id ? 'owner' : 'waiting', reviewed_by_name: by.data?.name || null });
  }

  if (action === 'review') {
    const id = String(b.id || ''), d = String(b.decision || ''), note = clean(b.note, 1000);
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    if (!['approve', 'decline', 'note'].includes(d)) return json({ error: 'bad_decision' }, 400);
    const { data: m } = await db.from('ve_holiday_menus').select('id, status, listing_id, member_id, holiday_slug').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    if (d === 'decline' && note.length < 3) return json({ error: 'note_needed' }, 400);
    if (d === 'note') {
      if (note.length < 3) return json({ error: 'note_needed' }, 400);
      await db.from('ve_holiday_menus').update({ team_note: note, updated_at: new Date().toISOString() }).eq('id', id);
      return json({ ok: true });
    }
    if (m.status === 'withdrawn') return json({ error: 'withdrawn' }, 409);
    const now = new Date().toISOString();
    const upd: any = { status: d === 'approve' ? 'live' : 'declined', reviewed_by: me, reviewed_at: now, updated_at: now };
    if (d === 'decline') upd.decline_note = note; else upd.decline_note = null;
    if (note && d === 'approve') upd.team_note = note;
    await db.from('ve_holiday_menus').update(upd).eq('id', id);
    const [{ data: who }, { data: l }, { data: h }] = await Promise.all([
      db.from('members').select('name, email, is_superadmin').eq('id', m.member_id).maybeSingle(),
      db.from('listings').select('slug, name, owner_member_id').eq('id', m.listing_id).maybeSingle(),
      db.from('ve_holidays').select('name').eq('slug', m.holiday_slug).maybeSingle(),
    ]);
    let email = 'no_email';
    // A menu the team uploaded for a place it does not own sends no "your menu" email to the team member.
    const teamUpload = !!who?.is_superadmin && l?.owner_member_id !== m.member_id;
    if (who?.email && !teamUpload && !String(l?.name || '').startsWith('[TEST]')) {
      const first = String(who.name || '').trim().split(/\s+/)[0];
      const hi = `<p>${first ? 'Hi ' + escH(first) + ',' : 'Hi there,'}</p>`;
      const body = d === 'approve'
        ? hi + `<p>Your ${escH(h?.name || 'holiday')} menu for <b>${escH(l?.name || '')}</b> is approved. It goes live in the Vegans Explore Holiday Guide when the Guide opens for the holiday.</p><p>You can change it any time before menus close; a change goes back to our team for a quick look. <a href="https://vegansexplore.com/business/holiday-menu" style="color:#2D5C27">Open your menu</a></p><p>Thank you for feeding the community.<br>Vegans Explore team</p>`
        : hi + `<p>We looked at your ${escH(h?.name || 'holiday')} menu for <b>${escH(l?.name || '')}</b> and need one change before it can go live:</p><p style="padding:10px 14px;background:#f5f7f5;border-left:3px solid #2D5C27">${escH(note)}</p><p><a href="https://vegansexplore.com/business/holiday-menu" style="color:#2D5C27">Update your menu</a> and send it again.</p><p>Vegans Explore team</p>`;
      email = await sendEmail({ email: who.email, name: who.name || undefined }, `ve-holiday-menu-${d}-${id}-${Date.now()}`, d === 'approve' ? `Your ${h?.name || 'holiday'} menu is approved` : `One change to your ${h?.name || 'holiday'} menu`, body);
    }
    return json({ ok: true, status: upd.status, email });
  }

  return json({ error: 'unknown_action' }, 400);
});
