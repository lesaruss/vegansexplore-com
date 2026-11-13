// ve-challenge: Earn your Passport, part 4, the three challenges (Sean, 2026-11-01, canon canon-ve-earn-your-passport; playbook
// ve-pricing-points-passport; migration 20261101_earn_your_passport_challenges.sql). Support Local, The Connector and The Advocate:
// pick 1 to 3, Start, 30 days, one restart; every task is approved by the team before it counts; 1,100 points each. The first one
// finished pays the Passport (the account becomes a member); each one after adds 1,100 points; all three is the Trailblazer badge.
// The rules and the settling live in SQL (ve_challenge_progress, ve_challenge_settle, cron ve-challenge-sweep every 15 minutes).
//
// Who: a Taster (their Taster key, body.taster, from ve-taster) whose email is confirmed; Start makes their sign-in account (a
// members row waiting on its Passport, no password) and returns its session. An account that never paid, or a member whose
// membership came from a challenge, with their member token. A member who paid the $11 does not take them.
//
//   { action: 'state', taster? }               the person's challenges with progress (settling first), their link, and a session
//                                              when the Taster key belongs to a challenger account with no password yet
//   { action: 'start', kind, taster? }         support_local | connector | advocate
//   { action: 'restart', kind }                once, after the 30 days ran out: 30 more days, approved work kept
//   { action: 'nearby', lat, lng, accuracy? }  Vegan places within 400 m, to check in at (ve-checkin does the check-in)
//   { action: 'pick', what, q? }               events | animals | posts, for The Advocate's proofs
//   { action: 'proof_start', task }            event | animals: a one-object signed upload into the private bucket challenge-proofs
//   { action: 'proof', task, ... }             event {event_id, photo_path}; animals {listing_id, photo_path, lat?, lng?, accuracy?};
//                                              share {post_id | listing_id (a rescue or sanctuary page), url}; an optional note.
//                                              Waits for the team.
//   { action: 'set_password', password }       once a member, an account made at Start sets its password (8 or more characters)
//   { action: 'admin_list', status? }          super admins: challenges by status (active | done | expired) with progress
//   { action: 'proof_list', status? }          super admins: The Advocate's proofs (pending | approved | declined), signed photos
//   { action: 'proof_review', id, decision, note? }  super admins: approve | decline; approving may finish the challenge
//
// verify_jwt is off: the member token is HMAC-checked here like ve-auth; ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member
// with as_member, and as a super admin for the admin actions.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
const SITE = 'https://vegansexplore.com';
const KINDS = ['support_local', 'connector', 'advocate'];
const TASKS = ['event', 'animals', 'share'];
// The places Support Local counts: food places with How Vegan set (the same list as ve_challenge_progress).
const FOOD = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Food Trucks & Vendors', 'Catering', 'Meal Prep', 'Markets'];
const CHAPTERS = ['south-florida', 'central-florida', 'north-florida', 'atlanta', 'washington-dc', 'delaware', 'maryland', 'virginia', 'west-virginia', 'new-york', 'philadelphia', 'los-angeles', 'seattle', 'london'];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(+v) ? +v : null);
const likeEsc = (s: string) => s.replace(/[\\%_,()]/g, (c) => '\\' + c);
function fromB64u(s: string) { const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''; const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const b64uStr = (s: string) => b64u(new TextEncoder().encode(s));

// Member sessions: the same HMAC as ve-auth (bytes 0 to 32 of the service key).
const memberKey = (use: 'sign' | 'verify') => crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
async function readMember(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    if (!(await crypto.subtle.verify('HMAC', await memberKey('verify'), fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    if (d.k === 'taster') return null;
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function signMember(m: { id: string; email: string }) {
  const now = Math.floor(Date.now() / 1000);
  const h = b64uStr(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64uStr(JSON.stringify({ sub: m.id, email: m.email, tier: 'free', brand: 'vegans-explore', iat: now, exp: now + 30 * 86400 }));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await memberKey('sign'), new TextEncoder().encode(`${h}.${p}`)));
  return `${h}.${p}.${b64u(sig)}`;
}
// The Taster key (ve-taster): bytes 32 to 64 of the service key.
async function readTaster(token: unknown): Promise<string | null> {
  try {
    const [h, p, s] = String(token || '').split('.');
    if (!h || !p || !s) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(32, 64).padEnd(32, '1')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k === 'taster' && typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, km, 256);
  const hex = (a: Uint8Array) => Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${hex(salt)}:${hex(new Uint8Array(derived))}`;
}
const MEMBER_COLS = 'id, name, email, membership_status, is_superadmin, referral_code, password_hash, trailblazer_at, home_community, member_class, founding_member';
const memberOut = (m: any) => ({ id: m.id, name: m.name, email: m.email, membership_status: m.membership_status, is_superadmin: !!m.is_superadmin,
  referral_code: m.referral_code, ve_role: 'member', ve_tier: m.membership_status === 'active' ? 'passport' : 'free', home_community: m.home_community });

// The account a Taster signs in with, made at Start once their email is confirmed. One email, one account.
async function accountForTaster(tasterId: string): Promise<{ member?: any; error?: string }> {
  const { data: t } = await db.from('ve_tasters').select('*').eq('id', tasterId).maybeSingle();
  if (!t) return { error: 'not_found' };
  if (!t.confirmed_at) return { error: 'confirm_email' };
  if (t.account_id) {
    const { data: m } = await db.from('members').select(MEMBER_COLS).eq('id', t.account_id).maybeSingle();
    if (m) return { member: m };
  }
  const { data: ex } = await db.from('members').select(MEMBER_COLS).ilike('email', likeEsc(String(t.email).toLowerCase())).maybeSingle();
  if (ex) {
    await db.from('ve_tasters').update({ account_id: ex.id, updated_at: new Date().toISOString() }).eq('id', t.id);
    return { member: ex };
  }
  const name = String(t.name || '').trim() || 'Explorer';
  const initials = name.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC'];
  const home = CHAPTERS.includes(t.chapter) ? t.chapter : null;
  const { data: m, error } = await db.from('members').insert({
    email: String(t.email).toLowerCase(), name, initials, color: colors[Math.floor(Math.random() * colors.length)],
    referral_code: `VE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, membership_tier: 'free', membership_status: 'pending_payment',
    ve_role: 'member', ve_tier: 'free', auth_methods: ['email'], home_community: home, tenant_id: VE_TENANT_ID, email_verified: true,
  }).select(MEMBER_COLS).single();
  if (error || !m) { console.error('account', error); return { error: 'account_failed' }; }
  if (home) await db.from('member_communities').insert({ member_id: m.id, community_slug: home }).select().maybeSingle();
  await db.rpc('apply_member_points_delta', { p_member_id: m.id, p_delta: 0 });
  await db.from('ve_tasters').update({ account_id: m.id, updated_at: new Date().toISOString() }).eq('id', t.id);
  return { member: m };
}

async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'challenges').maybeSingle();
  return { points: 1100, days: 30, support_local_places: 3, connector_friends: 3, ...((data as any)?.value || {}) };
}
async function stateFor(m: any) {
  const { data: rows } = await db.from('ve_challenges').select('*').eq('member_id', m.id).order('created_at');
  for (const c of rows || []) if (c.status === 'active') await db.rpc('ve_challenge_settle', { p_id: c.id });
  const { data: fresh } = await db.from('ve_challenges').select('*').eq('member_id', m.id).order('created_at');
  const list = await Promise.all((fresh || []).map(async (c: any) => {
    const { data: p } = await db.rpc('ve_challenge_progress', { p_id: c.id });
    return { id: c.id, kind: c.kind, status: c.status, started_at: c.started_at, ends_at: c.ends_at, restarts: c.restarts, completed_at: c.completed_at,
      points_paid: c.points_paid, made_member: c.made_member, can_restart: c.status === 'expired' && c.restarts < 1, progress: p };
  }));
  const { data: me } = await db.from('members').select(MEMBER_COLS).eq('id', m.id).maybeSingle();
  const { data: ok } = await db.rpc('ve_challenger_ok', { p_member: m.id });
  return { member: memberOut(me || m), active: (me || m).membership_status === 'active', founding: !!(me || m).founding_member,
    trailblazer: !!(me || m).trailblazer_at, can_take: !!ok, needs_password: (me || m).membership_status === 'active' && !(me || m).password_hash,
    link: (me || m).referral_code ? `${SITE}/r/${(me || m).referral_code}` : null, challenges: list, settings: await settings() };
}

// Abuse watch (Sean 2026-11-03): a suspended or banned member may read but not write. A DB error means not blocked.
async function standingBlocked(db: any, memberId: string | null): Promise<boolean> {
  if (!memberId) return false;
  const { data } = await db.from('members').select('standing').eq('id', memberId).maybeSingle();
  return !!data?.standing && data.standing !== 'good';
}
// Pure reads. Anything not listed is treated as a write (start, restart, pick, proof_start, proof, set_password).
const READ_ACTIONS = new Set(['state', 'nearby']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const ops = !!admin && bearer.length === admin.length && bearer === admin;
  let memberId: string | null = ops ? (isId(body.as_member) ? body.as_member : null) : (bearer ? await readMember(bearer) : null);
  const memberViaToken = !ops && !!memberId; // a member token only: not ops as_member, not a Taster key
  const tasterId = await readTaster(body.taster);
  let session: string | null = null;

  // ---------- The team ----------
  if (action === 'admin_list' || action === 'proof_list' || action === 'proof_review') {
    let ok = ops;
    if (!ok && memberId) { const { data: a } = await db.from('members').select('is_superadmin').eq('id', memberId).maybeSingle(); ok = !!a?.is_superadmin; }
    if (!ok) return json({ error: 'forbidden' }, 403);
    if (action === 'admin_list') {
      const status = ['active', 'done', 'expired'].includes(body.status) ? body.status : 'active';
      const { data: rows } = await db.from('ve_challenges').select('*, members(name, email, membership_status)').eq('status', status)
        .order(status === 'active' ? 'ends_at' : 'created_at', { ascending: status === 'active' }).limit(200);
      const out = await Promise.all((rows || []).map(async (c: any) => {
        const { data: p } = await db.rpc('ve_challenge_progress', { p_id: c.id });
        return { id: c.id, kind: c.kind, status: c.status, started_at: c.started_at, ends_at: c.ends_at, restarts: c.restarts, completed_at: c.completed_at,
          made_member: c.made_member, member: { name: c.members?.name, email: c.members?.email, active: c.members?.membership_status === 'active' }, progress: p };
      }));
      const counts: Record<string, number> = {};
      for (const s of ['active', 'done', 'expired']) { const { count } = await db.from('ve_challenges').select('id', { count: 'exact', head: true }).eq('status', s); counts[s] = count || 0; }
      const { count: waiting } = await db.from('ve_challenge_proofs').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      return json({ ok: true, rows: out, counts, proofs_waiting: waiting || 0 });
    }
    if (action === 'proof_list') {
      const status = ['pending', 'approved', 'declined'].includes(body.status) ? body.status : 'pending';
      const { data: rows } = await db.from('ve_challenge_proofs').select('*, members(name, email), listings(name, slug, category), events(title, starts_at, city), ve_board_posts(title, kind, community_slug)')
        .eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(100);
      const out = await Promise.all((rows || []).map(async (r: any) => {
        let photo = null;
        if (r.photo_path) { const { data } = await db.storage.from('challenge-proofs').createSignedUrl(r.photo_path, 3600); photo = data?.signedUrl || null; }
        return { id: r.id, task: r.task, status: r.status, at: r.created_at, photo, url: r.url, note: r.note, review_note: r.review_note, distance_m: r.distance_m, accuracy_m: r.accuracy_m,
          member: { name: r.members?.name || r.members?.email }, listing: r.listings ? { name: r.listings.name, slug: r.listings.slug, category: r.listings.category } : null,
          event: r.events ? { id: r.event_id, title: r.events.title, starts_at: r.events.starts_at, city: r.events.city } : null,
          post: r.ve_board_posts ? { id: r.post_id, title: r.ve_board_posts.title, kind: r.ve_board_posts.kind, community: r.ve_board_posts.community_slug } : null };
      }));
      return json({ ok: true, rows: out });
    }
    if (!isId(body.id) || !['approve', 'decline'].includes(body.decision)) return json({ error: 'bad_request' }, 400);
    const { data: p } = await db.from('ve_challenge_proofs').select('id, status, challenge_id').eq('id', body.id).maybeSingle();
    if (!p) return json({ error: 'not_found' }, 404);
    if (p.status !== 'pending') return json({ ok: false, why: 'already_reviewed' }, 409);
    await db.from('ve_challenge_proofs').update({ status: body.decision === 'approve' ? 'approved' : 'declined', review_note: String(body.note || '').trim().slice(0, 300) || null,
      reviewed_by: ops ? null : memberId, reviewed_at: new Date().toISOString() }).eq('id', p.id);
    const { data: settled } = await db.rpc('ve_challenge_settle', { p_id: p.challenge_id });
    return json({ ok: true, challenge: settled });
  }

  // ---------- Who is asking ----------
  if (!memberId && tasterId) {
    const { data: t } = await db.from('ve_tasters').select('id, name, email, confirmed_at, account_id').eq('id', tasterId).maybeSingle();
    if (!t) return json({ error: 'bad_token' }, 401);
    if (action === 'start' && !t.account_id) {
      const r = await accountForTaster(t.id);
      if (r.error === 'confirm_email') return json({ ok: false, why: 'confirm_email', message: 'Open the link we emailed you first, so we know the email is yours.' }, 403);
      if (r.error) return json({ error: r.error }, 500);
      t.account_id = r.member.id;
    }
    if (!t.account_id) return json({ ok: true, taster: { name: t.name, confirmed: !!t.confirmed_at }, account: false });
    const { data: m } = await db.from('members').select(MEMBER_COLS).eq('id', t.account_id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    // The Taster key opens the challenger's account only while it has no password and is not a member yet.
    if (m.membership_status === 'active' || m.password_hash) return json({ ok: false, why: 'sign_in', message: 'Your account is ready. Sign in to keep going.', email: m.email }, 401);
    memberId = m.id;
    session = await signMember(m);
  }
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: m } = await db.from('members').select(MEMBER_COLS).eq('id', memberId).maybeSingle();
  if (!m) return json({ error: 'not_found' }, 404);
  if (memberViaToken && !READ_ACTIONS.has(action) && await standingBlocked(db, memberId)) {
    return json({ error: 'account_not_in_good_standing', message: 'Your account is on hold. Write to contact@lesaruss.com and we will help.' }, 403);
  }
  const extra = session ? { token: session } : {};

  if (action === 'state') return json({ ok: true, ...extra, ...(await stateFor(m)) });

  if (action === 'start') {
    const kind = String(body.kind || '');
    if (!KINDS.includes(kind)) return json({ error: 'kind' }, 400);
    const { data: ok } = await db.rpc('ve_challenger_ok', { p_member: m.id });
    if (!ok) return json({ ok: false, why: 'already_member', message: 'You are already a member, so the challenges are not for you. Your Passport is open.' }, 403);
    const { data: ex } = await db.from('ve_challenges').select('id, status').eq('member_id', m.id).eq('kind', kind).maybeSingle();
    if (!ex) {
      const st = await settings();
      const { data: t } = await db.from('ve_tasters').select('id').eq('account_id', m.id).maybeSingle();
      const { error } = await db.from('ve_challenges').insert({ member_id: m.id, taster_id: t?.id || null, kind,
        ends_at: new Date(Date.now() + st.days * 864e5).toISOString() });
      if (error) return json({ error: 'save_failed' }, 500);
    }
    return json({ ok: true, ...extra, ...(await stateFor(m)) });
  }

  if (action === 'restart') {
    const kind = String(body.kind || '');
    const { data: c } = await db.from('ve_challenges').select('*').eq('member_id', m.id).eq('kind', kind).maybeSingle();
    if (!c) return json({ error: 'not_found' }, 404);
    if (c.status !== 'expired' || c.restarts >= 1) return json({ ok: false, why: 'no_restart', message: 'Each challenge restarts once, after its 30 days run out.' }, 409);
    const st = await settings();
    await db.from('ve_challenges').update({ status: 'active', restarts: 1, restarted_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + st.days * 864e5).toISOString() }).eq('id', c.id);
    return json({ ok: true, ...extra, ...(await stateFor(m)) });
  }

  const running = async (kind: string) => {
    const { data } = await db.from('ve_challenges').select('*').eq('member_id', m.id).eq('kind', kind).eq('status', 'active').maybeSingle();
    return data;
  };

  if (action === 'nearby') {
    const lat = num(body.lat), lng = num(body.lng);
    if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ error: 'position' }, 400);
    const dLat = 0.0045, dLng = 0.0045 / Math.max(0.2, Math.cos(lat * Math.PI / 180));
    const { data } = await db.from('listings').select('id, name, slug, category, vegan_status, latitude, longitude, address_city, logo_url')
      .eq('status', 'approved').not('vegan_status', 'is', null).in('category', FOOD).or('business_status.is.null,business_status.neq.CLOSED_PERMANENTLY')
      .gte('latitude', lat - dLat).lte('latitude', lat + dLat).gte('longitude', lng - dLng).lte('longitude', lng + dLng).limit(200);
    const R = 6371000, rad = (x: number) => x * Math.PI / 180;
    const out = (data || []).map((l: any) => {
      const d = 2 * R * Math.asin(Math.sqrt(Math.sin(rad(l.latitude - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(l.latitude)) * Math.sin(rad(l.longitude - lng) / 2) ** 2));
      return { id: l.id, name: l.name, slug: l.slug, category: l.category, vegan_status: l.vegan_status, city: l.address_city, logo: l.logo_url, distance_m: Math.round(d) };
    }).filter((l: any) => l.distance_m <= 400).sort((a: any, b: any) => a.distance_m - b.distance_m).slice(0, 12);
    return json({ ok: true, places: out });
  }

  if (action === 'pick') {
    const q = String(body.q || '').trim().slice(0, 60);
    if (body.what === 'events') {
      let r = db.from('events').select('id, title, starts_at, city, state, country, is_free, price_cents').eq('tenant_id', VE_TENANT_ID).eq('status', 'approved')
        .gte('starts_at', new Date(Date.now() - 45 * 864e5).toISOString()).lte('starts_at', new Date(Date.now() + 2 * 864e5).toISOString()).order('starts_at', { ascending: false }).limit(30);
      if (q) r = r.ilike('title', `%${likeEsc(q)}%`);
      const { data } = await r;
      return json({ ok: true, items: (data || []).map((e: any) => ({ id: e.id, title: e.title, starts_at: e.starts_at, where: [e.city, e.state || e.country].filter(Boolean).join(', '), free: e.is_free !== false && !e.price_cents })) });
    }
    if (body.what === 'animals') {
      let r = db.from('listings').select('id, name, slug, category, address_city, address_state').eq('status', 'approved').in('category', ['Rescues', 'Sanctuaries', 'Nonprofits']).order('name').limit(30);
      if (q) r = r.ilike('name', `%${likeEsc(q)}%`);
      else if (m.home_community) r = r.contains('communities', [m.home_community]);
      const { data } = await r;
      return json({ ok: true, items: (data || []).map((l: any) => ({ id: l.id, title: l.name, slug: l.slug, where: [l.category, l.address_city].filter(Boolean).join(' · ') })) });
    }
    if (body.what === 'posts') {
      // Fosters and Rescues posts first; a rescue's or sanctuary's own Directory page counts too (the boards are new).
      let r = db.from('ve_board_posts').select('id, title, kind, community_slug, created_at').in('kind', ['foster', 'rescue']).in('status', ['open', 'resolved'])
        .eq('pinned', false).order('created_at', { ascending: false }).limit(30);
      if (q) r = r.ilike('title', `%${likeEsc(q)}%`);
      let l = db.from('listings').select('id, name, slug, category, address_city').eq('status', 'approved').in('category', ['Rescues', 'Sanctuaries']).order('name').limit(30);
      if (q) l = l.ilike('name', `%${likeEsc(q)}%`);
      else if (m.home_community) l = l.contains('communities', [m.home_community]);
      const [{ data }, { data: ls }] = await Promise.all([r, l]);
      return json({ ok: true, items: (data || []).map((p: any) => ({ id: p.id, kind: 'post', title: p.title, where: (p.kind === 'foster' ? 'Fosters' : 'Rescues') + ' board · ' + p.community_slug, url: `${SITE}/pulse/${p.kind === 'foster' ? 'fosters' : 'rescues'}?post=${p.id}` }))
        .concat((ls || []).map((x: any) => ({ id: x.id, kind: 'listing', title: x.name, where: x.category + (x.address_city ? ' · ' + x.address_city : ''), url: `${SITE}/directory/${x.slug}` }))) });
    }
    return json({ error: 'what' }, 400);
  }

  if (action === 'proof_start') {
    if (body.task !== 'event' && body.task !== 'animals') return json({ error: 'task' }, 400);
    const c = await running('advocate');
    if (!c) return json({ ok: false, why: 'not_running' }, 409);
    const path = `${m.id}/${c.id}/${body.task}-${crypto.randomUUID()}.jpg`;
    const { data: up, error } = await db.storage.from('challenge-proofs').createSignedUploadUrl(path);
    if (error || !up) return json({ error: 'upload_failed' }, 500);
    return json({ ok: true, ...extra, path, upload_url: up.signedUrl });
  }

  if (action === 'proof') {
    const task = String(body.task || '');
    if (!TASKS.includes(task)) return json({ error: 'task' }, 400);
    const c = await running('advocate');
    if (!c) return json({ ok: false, why: 'not_running' }, 409);
    const row: Record<string, unknown> = { challenge_id: c.id, member_id: m.id, task, status: 'pending', note: String(body.note || '').replace(/\s+/g, ' ').trim().slice(0, 500) || null };
    const photo = async () => {
      const p = String(body.photo_path || '');
      if (!p.startsWith(`${m.id}/${c.id}/${task}-`) || !/\.jpg$/.test(p)) return false;
      const dir = p.slice(0, p.lastIndexOf('/')), name = p.slice(p.lastIndexOf('/') + 1);
      const { data: listed } = await db.storage.from('challenge-proofs').list(dir, { search: name });
      if (!(listed || []).some((f: any) => f.name === name)) return false;
      row.photo_path = p; return true;
    };
    if (task === 'event') {
      if (!isId(body.event_id)) return json({ ok: false, why: 'event', message: 'Pick the event.' }, 400);
      const { data: e } = await db.from('events').select('id, starts_at, status, tenant_id').eq('id', body.event_id).maybeSingle();
      if (!e || e.status !== 'approved' || e.tenant_id !== VE_TENANT_ID) return json({ ok: false, why: 'event', message: 'Pick an event from our calendar.' }, 400);
      if (Date.parse(e.starts_at) < Date.parse(c.started_at) - 864e5 || Date.parse(e.starts_at) > Date.now() + 864e5) return json({ ok: false, why: 'event_date', message: 'The event has to be during your challenge.' }, 400);
      if (!(await photo())) return json({ ok: false, why: 'photo_needed', message: 'Add a photo from the event.' }, 400);
      row.event_id = e.id;
    } else if (task === 'animals') {
      if (!isId(body.listing_id)) return json({ ok: false, why: 'listing', message: 'Pick the sanctuary, rescue or nonprofit.' }, 400);
      const { data: l } = await db.from('listings').select('id, category, latitude, longitude').eq('id', body.listing_id).eq('status', 'approved').maybeSingle();
      if (!l || !['Rescues', 'Sanctuaries', 'Nonprofits'].includes(l.category)) return json({ ok: false, why: 'listing', message: 'Pick a sanctuary, rescue or nonprofit from the Directory.' }, 400);
      if (!(await photo())) return json({ ok: false, why: 'photo_needed', message: 'Add a photo from your visit or volunteering.' }, 400);
      row.listing_id = l.id;
      const lat = num(body.lat), lng = num(body.lng), acc = num(body.accuracy);
      if (lat !== null && lng !== null && l.latitude != null && l.longitude != null) {
        const rad = (x: number) => x * Math.PI / 180;
        row.distance_m = Math.round(2 * 6371000 * Math.asin(Math.sqrt(Math.sin(rad(l.latitude - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(l.latitude)) * Math.sin(rad(l.longitude - lng) / 2) ** 2)));
        row.accuracy_m = acc !== null ? Math.round(acc) : null;
      }
    } else {
      // A Fosters or Rescues post, or a rescue's or sanctuary's Directory page.
      if (isId(body.post_id)) {
        const { data: p } = await db.from('ve_board_posts').select('id, kind').eq('id', body.post_id).maybeSingle();
        if (!p || !['foster', 'rescue'].includes(p.kind)) return json({ ok: false, why: 'post', message: 'Pick a post from the Fosters or Rescues board.' }, 400);
        row.post_id = p.id;
      } else if (isId(body.listing_id)) {
        const { data: l } = await db.from('listings').select('id, category').eq('id', body.listing_id).eq('status', 'approved').maybeSingle();
        if (!l || !['Rescues', 'Sanctuaries'].includes(l.category)) return json({ ok: false, why: 'post', message: 'Pick a rescue or sanctuary.' }, 400);
        row.listing_id = l.id;
      } else return json({ ok: false, why: 'post', message: 'Pick what you shared.' }, 400);
      const u = String(body.url || '').trim();
      if (!/^https:\/\/[^\s]+\.[^\s]+/i.test(u) || u.length > 500 || /vegansexplore\.com/i.test(u)) return json({ ok: false, why: 'url', message: 'Paste the link to where you shared it (your post or story).' }, 400);
      row.url = u;
    }
    const { data: prior } = await db.from('ve_challenge_proofs').select('id, status').eq('challenge_id', c.id).eq('task', task).in('status', ['pending', 'approved']);
    if ((prior || []).some((x: any) => x.status === 'approved')) return json({ ok: false, why: 'already_approved' }, 409);
    const pend = (prior || []).find((x: any) => x.status === 'pending');
    const { error } = pend ? await db.from('ve_challenge_proofs').update(row).eq('id', pend.id) : await db.from('ve_challenge_proofs').insert(row);
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, ...extra, ...(await stateFor(m)) });
  }

  if (action === 'set_password') {
    const pw = String(body.password || '');
    if (m.membership_status !== 'active') return json({ ok: false, why: 'not_member' }, 409);
    if (m.password_hash) return json({ ok: false, why: 'has_password', message: 'Your account already has a password.' }, 409);
    const { count } = await db.from('ve_challenges').select('id', { count: 'exact', head: true }).eq('member_id', m.id).eq('made_member', true);
    if (!count) return json({ ok: false, why: 'not_earned' }, 403);
    if (pw.length < 8 || pw.length > 200) return json({ ok: false, why: 'password', message: 'Use 8 characters or more.' }, 400);
    await db.from('members').update({ password_hash: await hashPassword(pw) }).eq('id', m.id);
    return json({ ok: true, token: await signMember(m), member: memberOut({ ...m, membership_status: 'active' }) });
  }

  return json({ error: 'unknown_action' }, 400);
});
