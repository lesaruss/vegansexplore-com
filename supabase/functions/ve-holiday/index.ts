// ve-holiday: the Holiday Guide's business holiday menus (canon-ve-holiday-guide v1, Sean 2026-11-07; migration 20261107_holiday_menus.sql).
// A member business with a claimed listing (or an open claim on it) sends its holiday menu; a person checks it before it shows.
// POST { action, ... }. verify_jwt off; the Vegans Explore token is checked here.
// Public:  holidays, live {holiday}
// Member:  mine, save {holiday, listing_id, summary, items, order_url, order_by, pickup, price_range, holiday_hours, contact_note}, withdraw {id}
// Admin:   queue {holiday?, status?}, get {id}, review {id, decision: approve | decline | note, note}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{1,40}$/;
const CLOSED_CLAIM = ['rejected', 'declined', 'cancelled', 'canceled', 'expired', 'test'];
const READ_ACTIONS = new Set(['holidays', 'live', 'mine']);

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
    return json({ ok: true, menus: rows });
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
    const ls = member ? await myListings(me) : [];
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
    const listing = mine.find((l) => l.id === lid);
    if (!listing && !admin) return json({ error: 'not_your_listing' }, 403);

    const summary = clean(b.summary, 400);
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 20)
      .map((x: any) => ({ name: clean(x?.name, 120), desc: clean(x?.desc, 300), price: clean(x?.price, 30) })).filter((x: any) => x.name);
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

  if (action === 'withdraw') {
    const id = String(b.id || '');
    if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: m } = await db.from('ve_holiday_menus').select('id, listing_id').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    if (!admin && !(await myListings(me)).some((l) => l.id === m.listing_id)) return json({ error: 'not_your_listing' }, 403);
    await db.from('ve_holiday_menus').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', id);
    return json({ ok: true, status: 'withdrawn' });
  }

  // ---- The team ----
  if (!admin) return json({ error: 'no_access' }, 403);

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
      db.from('members').select('name, email').eq('id', m.member_id).maybeSingle(),
      db.from('listings').select('slug, name').eq('id', m.listing_id).maybeSingle(),
      db.from('ve_holidays').select('name').eq('slug', m.holiday_slug).maybeSingle(),
    ]);
    let email = 'no_email';
    if (who?.email && !String(l?.name || '').startsWith('[TEST]')) {
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
