// ve-hunt: the Vegans Explore Hunt (playbook ve-verified-tours-hunt, group C, Sean 2026-09-27).
// Each month, one area of South Florida and a pin for every participating business. A member
// buys anything, the cashier hands over the VE Hunt register card, the member scans its QR
// (vegansexplore.com/hunt/scan?c=<code>) and the stamp lands. One stamp per business per member
// per hunt. Reaching the goal (default 5) earns that month's badge and Points. "Cashier didn't
// know?" holds the visit as pending until the owner confirms (Depot > Hunt).
//
// Public:
//   POST { action: 'current', community? }   -> { hunt, stops }  the live hunt (for the teaser; no codes)
// Member (Authorization: Bearer <ve_token>; the Hunt is members only, same gate as ve-votes):
//   POST { action: 'mine', community? }     -> { hunt, stops, stamps, completed, badges }
//   POST { action: 'scan', code, lat?, lng? } -> { ok, stamp, progress } or { error }
//   POST { action: 'report', stop_id, note } -> { ok } a pending stamp the VE team confirms
//   POST { action: 'badges' }                -> { badges } every hunt this member completed
// Superadmin (the Depot):
//   admin_hunts, admin_save_hunt, admin_stops, admin_add_stop, admin_update_stop, admin_remove_stop,
//   admin_replace_code, admin_reports, admin_review { id, decision }, admin_stats, admin_flags
//
// verify_jwt is false: the VE app token is HMAC-verified here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SEAN_EMAIL = 'contact@lesaruss.com';
// Flag a code when it is stamped this many times inside FLAG_WINDOW_MIN, or scanned from two
// places more than FLAG_KM apart inside FLAG_TRAVEL_MIN.
const FLAG_BURST = 6, FLAG_WINDOW_MIN = 60, FLAG_KM = 40, FLAG_TRAVEL_MIN = 120;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const plain = (v: unknown, n: number) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isId = (v: unknown) => /^[0-9a-f-]{36}$/.test(String(v || ''));

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
// Register-card codes: 8 characters with no look-alikes (0/O, 1/I/L).
function newCode(): string {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', b = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(b, (x) => A[x % A.length]).join('');
}
async function sha(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
function km(a: number, b: number, c: number, d: number) {
  const r = (x: number) => (x * Math.PI) / 180, R = 6371;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
async function mail(subject: string, html: string) {
  if (!RESEND_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [SEAN_EMAIL], subject, html }) });
  } catch (e) { console.error('hunt email failed', e); }
}
// OpenStreetMap geocoding for a stop's pin (listings carry no coordinates). One request per stop add.
async function geocode(l: any): Promise<{ lat: number; lng: number } | null> {
  const q = [l.address_street, l.address_city, l.address_state, l.address_zip].filter(Boolean).join(', ');
  if (!l.address_city) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'VegansExplore-Hunt/1.0 (hello@vegansexplore.com)' } });
    const d = await r.json();
    return d?.[0] ? { lat: +d[0].lat, lng: +d[0].lon } : null;
  } catch { return null; }
}

// Today in Eastern time, which is when a South Florida hunt starts and ends.
const todayET = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
async function liveHunt(community = 'south-florida') {
  const t = todayET();
  const { data } = await db.from('ve_hunts').select('*').eq('community_slug', community).eq('status', 'live')
    .lte('starts_on', t).gte('ends_on', t).order('starts_on', { ascending: false }).limit(1).maybeSingle();
  return data;
}
const STOP_COLS = 'id, listing_id, is_anchor, offer_type, offer_text, latitude, longitude, active, listing:listings(id, name, slug, address_street, address_city, logo_url, color, ve_verified, ve_verified_tier, ve_verified_until)';
function publicStop(s: any) {
  const l = s.listing || {};
  const tier = l.ve_verified_tier && (!l.ve_verified_until || new Date(l.ve_verified_until).getTime() > Date.now() - 3 * 864e5) ? l.ve_verified_tier : null;
  return { id: s.id, listing_id: s.listing_id, name: l.name, slug: l.slug, address: [l.address_street, l.address_city].filter(Boolean).join(', '),
    logo_url: l.logo_url, color: l.color, verified: !!(tier && l.ve_verified), tier, is_anchor: s.is_anchor,
    offer_type: s.offer_type, offer_text: s.offer_text, lat: s.latitude, lng: s.longitude };
}
async function stopsFor(huntId: string) {
  const { data } = await db.from('ve_hunt_stops').select(STOP_COLS).eq('hunt_id', huntId).eq('active', true);
  return (data || []).map(publicStop).sort((a: any, b: any) => (b.is_anchor ? 1 : 0) - (a.is_anchor ? 1 : 0) || (b.verified ? 1 : 0) - (a.verified ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
}
async function badgesFor(memberId: string) {
  const { data } = await db.from('ve_hunt_completions').select('completed_at, points_awarded, hunt:ve_hunts(id, name, badge_name, badge_image_url, area_name, starts_on)').eq('member_id', memberId).order('completed_at', { ascending: false });
  return (data || []).map((c: any) => ({ name: c.hunt?.badge_name, image: c.hunt?.badge_image_url, hunt: c.hunt?.name, area: c.hunt?.area_name, month: c.hunt?.starts_on, completed_at: c.completed_at, points: c.points_awarded }));
}
// After a stamp lands: anchor bonus, and the badge plus Points once the goal is reached.
async function afterStamp(hunt: any, stop: any, memberId: string) {
  if (stop.is_anchor) await db.rpc('ve_hunt_award', { p_member: memberId, p_points: hunt.anchor_bonus_points, p_ref: `hunt-anchor:${stop.id}`, p_reason: 've_hunt_anchor' });
  const { count } = await db.from('ve_hunt_stamps').select('id', { count: 'exact', head: true }).eq('hunt_id', hunt.id).eq('member_id', memberId).eq('status', 'stamped');
  let completed = false;
  if ((count || 0) >= hunt.goal) {
    const { data: done } = await db.from('ve_hunt_completions').insert({ hunt_id: hunt.id, member_id: memberId, points_awarded: hunt.points_reward }).select('hunt_id').maybeSingle();
    if (done) await db.rpc('ve_hunt_award', { p_member: memberId, p_points: hunt.points_reward, p_ref: `hunt:${hunt.id}`, p_reason: 've_hunt_complete' });
    completed = true;
  }
  return { stamped: count || 0, goal: hunt.goal, completed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const community = plain(body.community, 60) || 'south-florida';

  if (body.action === 'current') {
    const hunt = await liveHunt(community);
    if (!hunt) return json({ hunt: null, stops: [] });
    return json({ hunt: { id: hunt.id, name: hunt.name, area_name: hunt.area_name, starts_on: hunt.starts_on, ends_on: hunt.ends_on, goal: hunt.goal, points_reward: hunt.points_reward, badge_name: hunt.badge_name, badge_image_url: hunt.badge_image_url }, stops: await stopsFor(hunt.id) });
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, email, name, is_superadmin, membership_status').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'not_authenticated' }, 401);
  const paid = member.membership_status === 'active' || member.is_superadmin;

  if (body.action === 'badges') return json({ badges: await badgesFor(memberId) });

  if (body.action === 'mine') {
    const hunt = await liveHunt(community);
    const badges = await badgesFor(memberId);
    if (!hunt) return json({ hunt: null, stops: [], stamps: [], completed: false, badges, member: paid });
    const { data: stamps } = await db.from('ve_hunt_stamps').select('stop_id, listing_id, status, source, created_at').eq('hunt_id', hunt.id).eq('member_id', memberId);
    const { data: comp } = await db.from('ve_hunt_completions').select('completed_at').eq('hunt_id', hunt.id).eq('member_id', memberId).maybeSingle();
    return json({ hunt: { id: hunt.id, name: hunt.name, area_name: hunt.area_name, starts_on: hunt.starts_on, ends_on: hunt.ends_on, goal: hunt.goal, points_reward: hunt.points_reward, anchor_bonus_points: hunt.anchor_bonus_points, badge_name: hunt.badge_name, badge_image_url: hunt.badge_image_url },
      stops: paid ? await stopsFor(hunt.id) : [], stamps: stamps || [], completed: !!comp, badges, member: paid });
  }

  if (body.action === 'scan') {
    const code = plain(body.code, 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const lat = Number.isFinite(+body.lat) && body.lat !== null && body.lat !== undefined ? +body.lat : null;
    const lng = Number.isFinite(+body.lng) && body.lng !== null && body.lng !== undefined ? +body.lng : null;
    const ipHash = await sha((req.headers.get('x-forwarded-for') || '').split(',')[0].trim() + '|ve-hunt');
    const log = (row: Record<string, unknown>) => db.from('ve_hunt_scans').insert({ member_id: memberId, code, latitude: lat, longitude: lng, ip_hash: ipHash, ...row });
    if (!paid) { await log({ ok: false, reason: 'not_member' }); return json({ error: 'payment_required' }, 402); }
    const { data: stop } = code ? await db.from('ve_hunt_stops').select('*, listing:listings(name, slug)').eq('code', code).maybeSingle() : { data: null };
    if (!stop || !stop.active) { await log({ ok: false, reason: 'bad_code' }); return json({ error: 'bad_code' }, 404); }
    const { data: hunt } = await db.from('ve_hunts').select('*').eq('id', stop.hunt_id).maybeSingle();
    const t = todayET();
    if (!hunt || hunt.status !== 'live' || hunt.starts_on > t || hunt.ends_on < t) { await log({ hunt_id: stop.hunt_id, stop_id: stop.id, ok: false, reason: 'hunt_not_live' }); return json({ error: 'hunt_not_live' }, 409); }
    const { data: existing } = await db.from('ve_hunt_stamps').select('id, status').eq('hunt_id', hunt.id).eq('listing_id', stop.listing_id).eq('member_id', memberId).maybeSingle();
    if (existing?.status === 'stamped') { await log({ hunt_id: hunt.id, stop_id: stop.id, ok: false, reason: 'already' }); return json({ error: 'already_stamped', business: stop.listing?.name }, 409); }
    const now = new Date().toISOString();
    // A scan settles a pending report for the same stop.
    const { error } = existing
      ? await db.from('ve_hunt_stamps').update({ status: 'stamped', source: 'scan', updated_at: now }).eq('id', existing.id)
      : await db.from('ve_hunt_stamps').insert({ hunt_id: hunt.id, stop_id: stop.id, listing_id: stop.listing_id, member_id: memberId, status: 'stamped', source: 'scan' });
    if (error) { await log({ hunt_id: hunt.id, stop_id: stop.id, ok: false, reason: 'save_failed' }); return json({ error: 'save_failed' }, 500); }
    await log({ hunt_id: hunt.id, stop_id: stop.id, ok: true });
    const progress = await afterStamp(hunt, stop, memberId);
    return json({ ok: true, business: stop.listing?.name, anchor: stop.is_anchor, progress, badge_name: progress.completed ? hunt.badge_name : null });
  }

  if (body.action === 'report') {
    if (!paid) return json({ error: 'payment_required' }, 402);
    if (!isId(body.stop_id)) return json({ error: 'bad_id' }, 400);
    const { data: stop } = await db.from('ve_hunt_stops').select('*, listing:listings(name, slug, address_city, ve_contact_name, ve_contact_phone, ve_contact_email, phone)').eq('id', body.stop_id).eq('active', true).maybeSingle();
    if (!stop) return json({ error: 'not_found' }, 404);
    const hunt = await liveHunt(community);
    if (!hunt || hunt.id !== stop.hunt_id) return json({ error: 'hunt_not_live' }, 409);
    const note = plain(body.note, 500);
    const { data: existing } = await db.from('ve_hunt_stamps').select('id, status').eq('hunt_id', hunt.id).eq('listing_id', stop.listing_id).eq('member_id', memberId).maybeSingle();
    if (existing?.status === 'stamped') return json({ error: 'already_stamped' }, 409);
    if (existing?.status === 'pending') return json({ ok: true, already: true });
    const now = new Date().toISOString();
    const { error } = existing
      ? await db.from('ve_hunt_stamps').update({ status: 'pending', source: 'report', note, reviewed_by: null, reviewed_at: null, updated_at: now }).eq('id', existing.id)
      : await db.from('ve_hunt_stamps').insert({ hunt_id: hunt.id, stop_id: stop.id, listing_id: stop.listing_id, member_id: memberId, status: 'pending', source: 'report', note });
    if (error) return json({ error: 'save_failed' }, 500);
    const l = stop.listing || {};
    const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });
    await mail(`Hunt: cashier didn't know at ${l.name || 'a stop'}`,
      `<p>${esc(member.name || member.email || 'A member')} says the cashier at <b>${esc(l.name || '')}</b> (${esc(l.address_city || '')}) did not know about the VE Hunt, ${esc(when)} ET.</p>` +
      (note ? `<p>Their note: ${esc(note)}</p>` : '') +
      `<p>Owner contact on file: ${esc(l.ve_contact_name || 'none')}${l.ve_contact_phone ? ', ' + esc(l.ve_contact_phone) : l.phone ? ', ' + esc(l.phone) : ''}${l.ve_contact_email ? ', ' + esc(l.ve_contact_email) : ''}.</p>` +
      `<p>The visit is held as pending. Confirm it in the Depot once the owner does: <a href="https://vegansexplore.com/admin/depot/hunt">vegansexplore.com/admin/depot/hunt</a></p>`);
    return json({ ok: true });
  }

  // ---- The Depot (superadmins only).
  if (!String(body.action || '').startsWith('admin_')) return json({ error: 'unknown_action' }, 400);
  if (!member.is_superadmin) return json({ error: 'no_access' }, 403);
  const now = new Date().toISOString();

  if (body.action === 'admin_hunts') {
    const { data } = await db.from('ve_hunts').select('*').order('starts_on', { ascending: false }).limit(60);
    return json({ hunts: data || [] });
  }

  if (body.action === 'admin_save_hunt') {
    const h = body.hunt || {};
    const row: Record<string, unknown> = {
      community_slug: plain(h.community_slug, 60) || 'south-florida', name: plain(h.name, 120), area_name: plain(h.area_name, 120),
      starts_on: plain(h.starts_on, 10), ends_on: plain(h.ends_on, 10), goal: Math.round(+h.goal) || 5,
      points_reward: Math.max(0, Math.round(+h.points_reward) || 0), anchor_bonus_points: Math.max(0, Math.round(+h.anchor_bonus_points) || 0),
      badge_name: plain(h.badge_name, 120), badge_image_url: /^https:\/\//.test(String(h.badge_image_url || '')) ? plain(h.badge_image_url, 500) : null,
      status: ['draft', 'live', 'ended'].includes(h.status) ? h.status : 'draft', updated_at: now,
    };
    if (!row.name || !row.area_name || !row.badge_name || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.starts_on)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(row.ends_on))) return json({ error: 'missing_fields' }, 400);
    const { data, error } = isId(h.id)
      ? await db.from('ve_hunts').update(row).eq('id', h.id).select('*').single()
      : await db.from('ve_hunts').insert({ ...row, created_by: memberId }).select('*').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 400);
    return json({ ok: true, hunt: data });
  }

  if (body.action === 'admin_stops') {
    if (!isId(body.hunt_id)) return json({ error: 'bad_id' }, 400);
    const { data } = await db.from('ve_hunt_stops').select('*, listing:listings(id, name, slug, address_street, address_city, logo_url, color, ve_verified, ve_verified_tier, ve_verified_until, ve_contact_name, ve_contact_phone, phone)').eq('hunt_id', body.hunt_id).order('created_at');
    return json({ stops: data || [] });
  }

  if (body.action === 'admin_add_stop') {
    if (!isId(body.hunt_id) || !isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
    const { data: l } = await db.from('listings').select('id, address_street, address_city, address_state, address_zip').eq('id', body.listing_id).maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    const g = await geocode(l);
    const { data, error } = await db.from('ve_hunt_stops').insert({ hunt_id: body.hunt_id, listing_id: body.listing_id, code: newCode(), latitude: g?.lat ?? null, longitude: g?.lng ?? null }).select('id').single();
    if (error) return json({ error: error.code === '23505' ? 'already_a_stop' : 'save_failed', message: error.message }, 400);
    return json({ ok: true, id: data.id, geocoded: !!g });
  }

  if (body.action === 'admin_update_stop') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const patch: Record<string, unknown> = { updated_at: now };
    if (body.is_anchor !== undefined) patch.is_anchor = !!body.is_anchor;
    if (body.offer_type !== undefined) patch.offer_type = ['discount', 'prize', 'donation'].includes(body.offer_type) ? body.offer_type : null;
    if (body.offer_text !== undefined) patch.offer_text = plain(body.offer_text, 200) || null;
    if (body.lat !== undefined && body.lng !== undefined) {
      const la = +body.lat, lo = +body.lng;
      if (body.lat === null || body.lat === '') { patch.latitude = null; patch.longitude = null; }
      else if (Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) { patch.latitude = la; patch.longitude = lo; }
      else return json({ error: 'bad_coords' }, 400);
    }
    if (body.regeocode) {
      const { data: s } = await db.from('ve_hunt_stops').select('listing:listings(address_street, address_city, address_state, address_zip)').eq('id', body.id).maybeSingle();
      const g = s ? await geocode((s as any).listing) : null;
      if (!g) return json({ error: 'geocode_failed' }, 400);
      patch.latitude = g.lat; patch.longitude = g.lng;
    }
    const { data, error } = await db.from('ve_hunt_stops').update(patch).eq('id', body.id).select('*').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 400);
    return json({ ok: true, stop: data });
  }

  if (body.action === 'admin_remove_stop') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { count } = await db.from('ve_hunt_stamps').select('id', { count: 'exact', head: true }).eq('stop_id', body.id);
    // A stop with stamps is switched off rather than deleted, so members keep what they earned.
    const { error } = count
      ? await db.from('ve_hunt_stops').update({ active: false, updated_at: now }).eq('id', body.id)
      : await db.from('ve_hunt_stops').delete().eq('id', body.id);
    if (error) return json({ error: 'save_failed' }, 400);
    return json({ ok: true, deactivated: !!count });
  }

  if (body.action === 'admin_replace_code') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: s } = await db.from('ve_hunt_stops').select('code_version').eq('id', body.id).maybeSingle();
    if (!s) return json({ error: 'not_found' }, 404);
    const { data, error } = await db.from('ve_hunt_stops').update({ code: newCode(), code_version: s.code_version + 1, active: true, updated_at: now }).eq('id', body.id).select('id, code, code_version').single();
    if (error) return json({ error: 'save_failed' }, 400);
    return json({ ok: true, stop: data });
  }

  if (body.action === 'admin_reports') {
    const q = db.from('ve_hunt_stamps').select('id, status, source, note, created_at, reviewed_at, hunt_id, listing:listings(name, slug, address_city, ve_contact_name, ve_contact_phone, phone), member:members(name, email)').eq('source', 'report').order('created_at', { ascending: false }).limit(200);
    const { data } = isId(body.hunt_id) ? await q.eq('hunt_id', body.hunt_id) : await q;
    return json({ reports: data || [] });
  }

  if (body.action === 'admin_review') {
    if (!isId(body.id) || !['confirm', 'reject'].includes(body.decision)) return json({ error: 'bad_request' }, 400);
    const { data: st } = await db.from('ve_hunt_stamps').select('*').eq('id', body.id).maybeSingle();
    if (!st) return json({ error: 'not_found' }, 404);
    if (st.status !== 'pending') return json({ error: 'not_pending' }, 409);
    const status = body.decision === 'confirm' ? 'stamped' : 'rejected';
    const { error } = await db.from('ve_hunt_stamps').update({ status, reviewed_by: memberId, reviewed_at: now, updated_at: now }).eq('id', st.id).eq('status', 'pending');
    if (error) return json({ error: 'save_failed' }, 400);
    let progress = null;
    if (status === 'stamped') {
      const { data: hunt } = await db.from('ve_hunts').select('*').eq('id', st.hunt_id).single();
      const { data: stop } = await db.from('ve_hunt_stops').select('*').eq('id', st.stop_id).single();
      progress = await afterStamp(hunt, stop, st.member_id);
    }
    return json({ ok: true, progress });
  }

  if (body.action === 'admin_stats') {
    if (!isId(body.hunt_id)) return json({ error: 'bad_id' }, 400);
    const { data: stamps } = await db.from('ve_hunt_stamps').select('listing_id, status, source').eq('hunt_id', body.hunt_id);
    const by: Record<string, { stamped: number; pending: number; reports: number; rejected: number }> = {};
    for (const s of stamps || []) {
      const b = by[s.listing_id] ||= { stamped: 0, pending: 0, reports: 0, rejected: 0 };
      if (s.status === 'stamped') b.stamped++; if (s.status === 'pending') b.pending++; if (s.status === 'rejected') b.rejected++;
      if (s.source === 'report') b.reports++;
    }
    const { count: members } = await db.from('ve_hunt_stamps').select('member_id', { count: 'exact', head: true }).eq('hunt_id', body.hunt_id).eq('status', 'stamped');
    const { count: completions } = await db.from('ve_hunt_completions').select('member_id', { count: 'exact', head: true }).eq('hunt_id', body.hunt_id);
    return json({ by_listing: by, stamps: members || 0, completions: completions || 0 });
  }

  if (body.action === 'admin_flags') {
    if (!isId(body.hunt_id)) return json({ error: 'bad_id' }, 400);
    const { data: scans } = await db.from('ve_hunt_scans').select('stop_id, member_id, ok, latitude, longitude, created_at').eq('hunt_id', body.hunt_id).eq('ok', true).order('created_at').limit(5000);
    const byStop: Record<string, any[]> = {};
    for (const s of scans || []) (byStop[s.stop_id] ||= []).push(s);
    const flags: any[] = [];
    for (const [stopId, list] of Object.entries(byStop)) {
      let burst = 0, travel = null as null | { km: number; at: string };
      for (let i = 0; i < list.length; i++) {
        const t0 = new Date(list[i].created_at).getTime();
        const inWin = list.filter((x) => { const t = new Date(x.created_at).getTime(); return t >= t0 && t - t0 <= FLAG_WINDOW_MIN * 60e3; }).length;
        burst = Math.max(burst, inWin);
        if (list[i].latitude != null) for (let j = i + 1; j < list.length; j++) {
          const tj = new Date(list[j].created_at).getTime();
          if (tj - t0 > FLAG_TRAVEL_MIN * 60e3) break;
          if (list[j].latitude == null) continue;
          const d = km(list[i].latitude, list[i].longitude, list[j].latitude, list[j].longitude);
          if (d > FLAG_KM && (!travel || d > travel.km)) travel = { km: Math.round(d), at: list[j].created_at };
        }
      }
      if (burst >= FLAG_BURST || travel) flags.push({ stop_id: stopId, scans: list.length, burst: burst >= FLAG_BURST ? burst : null, travel });
    }
    return json({ flags, rule: { burst: FLAG_BURST, window_min: FLAG_WINDOW_MIN, km: FLAG_KM, travel_min: FLAG_TRAVEL_MIN } });
  }

  return json({ error: 'unknown_action' }, 400);
});
