// ve-ambassador: the Ambassador door (Sean, 2026-10-29: "Build the ambassador door"; canon canon-ve-ambassadors-talent-shop).
// Paid work needs activation, a checklist that keeps itself up to date: 1. profile (their own People listing in the Directory,
// claimed and approved, with a photo, what they do and a bio), 2. platforms (their accounts and audience; YouTube is read from
// YouTube, the rest self-reported), 3. rates (team only), 4. get paid (Stripe Connect Express: bank, identity and tax details on
// Stripe's own pages). Not active yet until all four; reminders Day 2, Day 7, then weekly; Active with an email to them and Sean.
// Migration 20261029_ambassador_door.sql (ve_ambassador_door, ve_profile_claims, cron ve-ambassador-remind).
//
// verify_jwt off; the VE member token is checked here. Ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member.
// Ambassadors (members.ve_role 'ambassador') and super admins:
//   POST { action: 'door' }  -> { member, steps: {profile, platforms, rates, paid}, active, active_at, profile, claim, platforms,
//        rates, skills, chapters, payouts }   the checklist as it stands (opening it starts the reminders)
//   POST { action: 'profile_search', q }  -> People listings no one has claimed
//   POST { action: 'profile_claim', listing_id? | name, title, bio, note? }  asks for their People listing, or for one to be made
//   POST { action: 'profile_withdraw' }
//   POST { action: 'profile_save', title, bio, website, instagram }  their own listing (each change a ve_listing_edits row);
//        the photo goes through ve-claims owner_photo_url / owner_photo_done like any owner's logo
//   POST { action: 'platforms_save', platforms: [{kind, handle, followers}] }
//   POST { action: 'rates_save', rates: {post, reel, story, appearance, hosting, social_day, notes}, skills, chapters }
//   POST { action: 'payout_start' }  -> { url }   Stripe's onboarding for their Express account (made on the first press)
//   POST { action: 'payout_status' }              asks Stripe whether payouts are on
//   POST { action: 'story', kind: intro|interview|host|report, name?, about, place?, contact? }  an introduction or a story for us
//        (Sean, 2026-10-30: business owners, podcasters, people with a story, a guest host, news from their community), 10 a day
// Super admins (or ops):
//   POST { action: 'story_status', id, status: new|contacted|done }
//   POST { action: 'admin_list' }  -> every Ambassador with their checklist, and the profile requests waiting
//   POST { action: 'claim_decide', id, approve, note? }  approving gives them the listing (or makes it, under Content Creators)
// The cron (x-cron-secret) or ops:
//   POST { action: 'remind' }  emails who is due: Day 2, Day 7, then every 7 days, at most 10, naming what is missing
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const DOOR = `${SITE}/ambassadors/door`;
const SEAN_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const DAY_MS = 24 * 60 * 60 * 1000;
// Keep in step with PEOPLE_CATS in /public/ve-region-directory.js and ve-people.
const PEOPLE_CATS = ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders'];
const KINDS = ['instagram', 'tiktok', 'youtube', 'facebook', 'podcast'];
const RATE_KEYS = ['post', 'reel', 'story', 'appearance', 'hosting', 'social_day'];
const SKILLS = ['recipes', 'fitness', 'hosting', 'speaking', 'ugc', 'photo', 'video_edit', 'design', 'social', 'writing', 'outreach'];
const CHAPTERS = ['south-florida', 'central-florida', 'north-florida', 'atlanta', 'dc', 'delaware', 'maryland', 'virginia', 'west-virginia',
  'new-york', 'philadelphia', 'los-angeles', 'london'];
const BIO_MIN = 80;
const STORY_KINDS: Record<string, string> = { intro: 'An introduction', interview: 'Their own story', host: 'Hosting', report: 'From their community' };
const REMIND_MAX = 10;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there';
const slugify = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
// Same key derivation as ve-auth's signJWT.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secretKey = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function isOps(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  return !!admin && token.length === admin.length && token === admin;
}
async function memberOf(req: Request, body: any): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  if (await isOps(req)) return isId(body.as_member) ? body.as_member : null;
  return await verifyToken(token);
}

async function sendOne(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_KEY) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: SEAN_EMAIL, to: [to], subject, html }),
    });
    const d = res.ok ? await res.json() : null;
    if (!res.ok) console.error('Resend error:', await res.text());
    return d?.id ?? null;
  } catch (e) { console.error('Resend failed:', e); return null; }
}
const FOOT = `<p style="font-size:12px;color:#777;margin:18px 0 0">Vegans Explore, a LESARUSS brand. 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p>`;
const wrap = (inner: string) => `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">${inner}${FOOT}</div>`;
const btn = (href: string, label: string) => `<p style="margin:0 0 16px"><a href="${href}" style="display:inline-block;background:#2d7d31;color:#fff;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:6px">${esc(label)}</a></p>`;

// Stripe, the way ve-restaurant-audit and ve-group do it: test accounts (ve_test_checkout_allowlist) use the test key.
async function stripeKey(test: boolean) {
  if (!test) return Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const k = await secret('STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST');
  if (!String(k || '').startsWith('sk_test_')) throw new Error('test key missing');
  return String(k);
}
async function isTestAccount(email: string | null) {
  if (!email) return false;
  const { data } = await db.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
async function stripe(test: boolean, method: string, path: string, params?: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method, headers: { Authorization: `Bearer ${await stripeKey(test)}`, ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d };
}

// YouTube's Data API (the project's Google key, as ve-youtube reads it): a channel's subscribers by its handle.
async function youtubeSubs(handle: string): Promise<{ followers: number; url: string } | null> {
  const key = (await secret('YOUTUBE_API_KEY')) || (await secret('GOOGLE_PLACES_API_KEY'));
  if (!key || !handle) return null;
  try {
    const q = new URLSearchParams({ part: 'statistics,snippet', forHandle: '@' + handle.replace(/^@/, ''), key });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?${q}`);
    const d = r.ok ? await r.json() : null;
    const c = d?.items?.[0];
    if (!c) return null;
    return { followers: Number(c.statistics?.subscriberCount || 0), url: `https://www.youtube.com/channel/${c.id}` };
  } catch { return null; }
}

function handleOf(kind: string, raw: unknown) {
  let v = clean(raw, 300);
  if (kind === 'podcast') return v ? (/^https?:\/\//i.test(v) ? v : 'https://' + v) : '';
  v = v.replace(/^https?:\/\/(www\.|m\.)?(instagram|tiktok|youtube|facebook)\.com\//i, '').replace(/[?#].*$/, '').replace(/\/+$/, '').replace(/^@/, '');
  return /^[A-Za-z0-9._-]{1,60}$/.test(v) ? v : '';
}
function urlOf(kind: string, h: string) {
  if (!h) return '';
  if (kind === 'podcast') return h;
  return ({ instagram: `https://www.instagram.com/${h}`, tiktok: `https://www.tiktok.com/@${h}`, youtube: `https://www.youtube.com/@${h}`,
    facebook: `https://www.facebook.com/${h}` } as Record<string, string>)[kind] || '';
}

// What is missing, in the words the page and the reminders use.
const STEP_WORDS: Record<string, string> = { profile: 'your profile', platforms: 'your platforms', rates: 'your rates', paid: 'getting paid' };

async function profileOf(memberId: string) {
  const { data } = await db.from('listings').select('id, slug, name, category, tagline, description, logo_url, website, instagram, details')
    .eq('owner_member_id', memberId).eq('status', 'approved').in('category', PEOPLE_CATS).order('created_at').limit(1);
  const l = data?.[0];
  if (!l) return null;
  return { id: l.id, slug: l.slug, name: l.name, category: l.category, title: l.details?.person?.title || l.tagline || '', bio: l.description || '',
    logo_url: l.logo_url || '', website: l.website || '', instagram: l.instagram || '' };
}

async function state(memberId: string) {
  const [{ data: row }, profile, { data: claims }] = await Promise.all([
    db.from('ve_ambassador_door').select('*').eq('member_id', memberId).maybeSingle(),
    profileOf(memberId),
    db.from('ve_profile_claims').select('id, listing_id, new_profile, status, note, decision_note, created_at, decided_at').eq('member_id', memberId).order('created_at', { ascending: false }).limit(1),
  ]);
  const r = row || { platforms: [], rates: {}, skills: [], chapters: [], payouts_ready: false } as any;
  let claim = claims?.[0] || null;
  if (claim?.listing_id) {
    const { data: l } = await db.from('listings').select('name, slug').eq('id', claim.listing_id).maybeSingle();
    claim = { ...claim, listing: l || null };
  }
  const plats = (r.platforms || []).filter((p: any) => p.handle && Number(p.followers) > 0);
  const steps = {
    profile: !!(profile && profile.logo_url && profile.title && profile.bio.length >= BIO_MIN),
    platforms: plats.length > 0,
    rates: RATE_KEYS.some((k) => Number(r.rates?.[k]) > 0),
    paid: !!r.payouts_ready,
  };
  return { row, r, profile, claim, steps, active: steps.profile && steps.platforms && steps.rates && steps.paid };
}

// Turns Active the first time all four are done, and says so to them and to Sean.
async function settle(member: any, s: any) {
  if (!s.active || !s.row || s.row.active_at) return s.row?.active_at || null;
  const at = new Date().toISOString();
  await db.from('ve_ambassador_door').update({ active_at: at, updated_at: at }).eq('member_id', member.id).is('active_at', null);
  await sendOne(member.email, 'You are active for paid work on Vegans Explore', wrap(
    `<p style="margin:0 0 12px">Hi ${esc(firstName(member.name))},</p>` +
    `<p style="margin:0 0 12px">Your profile, platforms, rates and payouts are all set, so you are now <b>active</b> for paid work. We look for campaigns, events and press that fit you, and when one does, it comes to you with what it pays and what it asks.</p>` +
    `<p style="margin:0 0 16px">Keep your rates and numbers current so the right work finds you.</p>` + btn(DOOR, 'See your checklist')));
  await sendOne(SEAN_EMAIL, `[Ambassadors] ${member.name || member.email} is active for paid work`, wrap(
    `<p><b>${esc(member.name || '')}</b> (${esc(member.email || '')}) finished the Ambassador door: profile, platforms, rates and payouts.</p>` +
    `<p><a href="${SITE}/admin/depot/ambassadors#door">Depot &gt; Ambassadors &gt; Paid work</a></p>`));
  return at;
}

function shape(member: any, s: any, activeAt: string | null) {
  const r = s.r;
  return {
    ok: true,
    member: { id: member.id, name: member.name, email: member.email, is_superadmin: !!member.is_superadmin, ambassador: member.ve_role === 'ambassador' },
    steps: s.steps, active: s.active, active_at: activeAt,
    profile: s.profile, claim: s.claim,
    platforms: KINDS.map((k) => { const p = (r.platforms || []).find((x: any) => x.kind === k) || {}; return { kind: k, handle: p.handle || '', url: p.url || '', followers: Number(p.followers) || 0, verified: !!p.verified, checked_at: p.checked_at || null }; }),
    rates: r.rates || {}, skills: r.skills || [], chapters: r.chapters || [],
    payouts: { started: !!r.stripe_account_id, ready: !!r.payouts_ready, checked_at: r.payouts_checked_at || null, test: !!r.stripe_test },
    lists: { kinds: KINDS, rate_keys: RATE_KEYS, skills: SKILLS, chapters: CHAPTERS, bio_min: BIO_MIN },
  };
}

async function ensureRow(memberId: string) {
  await db.from('ve_ambassador_door').upsert({ member_id: memberId }, { onConflict: 'member_id', ignoreDuplicates: true });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  // ---- The reminders (the cron, or ops): Day 2, Day 7, then every 7 days, at most 10, naming what is still missing.
  if (action === 'remind') {
    const cron = req.headers.get('x-cron-secret');
    const cs = await secret('CRON_SECRET');
    if (!((cron && cs && cron === cs) || (await isOps(req)))) return json({ error: 'forbidden' }, 403);
    const { data: rows } = await db.from('ve_ambassador_door').select('member_id, started_at, reminders, last_reminder_at').is('active_at', null).lt('reminders', REMIND_MAX);
    const now = Date.now();
    let sent = 0;
    for (const row of rows || []) {
      const age = (now - new Date(row.started_at).getTime()) / DAY_MS;
      const since = row.last_reminder_at ? (now - new Date(row.last_reminder_at).getTime()) / DAY_MS : Infinity;
      const due = row.reminders === 0 ? age >= 2 : row.reminders === 1 ? age >= 7 : since >= 7;
      if (!due) continue;
      const { data: m } = await db.from('members').select('id, name, email, ve_role, is_superadmin').eq('id', row.member_id).maybeSingle();
      if (!m?.email || m.ve_role !== 'ambassador') continue;
      const s = await state(m.id);
      if (s.active) { await settle(m, s); continue; }
      const missing = Object.keys(s.steps).filter((k) => !(s.steps as any)[k]).map((k) => STEP_WORDS[k]);
      const id = await sendOne(m.email, 'Finish your Ambassador checklist for paid work', wrap(
        `<p style="margin:0 0 12px">Hi ${esc(firstName(m.name))},</p>` +
        `<p style="margin:0 0 12px">You are a few steps from being active for paid work on Vegans Explore. Still to do: <b>${esc(missing.join(', '))}</b>.</p>` +
        `<p style="margin:0 0 16px">Once all four are done, we start sending you the campaigns, events and press that fit you.</p>` + btn(DOOR, 'Finish your checklist') +
        `<p style="font-size:13px;color:#555;margin:0">Not interested in paid work right now? Reply and tell us, and we will stop these reminders.</p>`));
      if (id) { sent++; await db.from('ve_ambassador_door').update({ reminders: row.reminders + 1, last_reminder_at: new Date().toISOString() }).eq('member_id', m.id); }
    }
    return json({ ok: true, sent });
  }

  const memberId = await memberOf(req, body);
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, name, email, ve_role, is_superadmin, membership_status').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'not_authenticated' }, 401);
  const isAdmin = !!member.is_superadmin;

  // ---- The team: every Ambassador's checklist, and the profile requests waiting.
  if (action === 'admin_list' || action === 'claim_decide' || action === 'story_status') {
    if (!isAdmin) return json({ error: 'forbidden' }, 403);
    if (action === 'story_status') {
      if (!isId(body.id) || !['new', 'contacted', 'done'].includes(body.status)) return json({ error: 'bad_request' }, 400);
      const { error } = await db.from('ve_ambassador_stories').update({ status: body.status, status_at: new Date().toISOString(), status_by: member.id }).eq('id', body.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }
    if (action === 'claim_decide') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: c } = await db.from('ve_profile_claims').select('*').eq('id', body.id).maybeSingle();
      if (!c || c.status !== 'pending') return json({ error: 'not_pending' }, 409);
      const { data: who } = await db.from('members').select('id, name, email').eq('id', c.member_id).maybeSingle();
      const at = new Date().toISOString();
      if (body.approve !== true) {
        await db.from('ve_profile_claims').update({ status: 'declined', decided_at: at, decided_by: member.id, decision_note: clean(body.note, 500) || null }).eq('id', c.id);
        if (who?.email) await sendOne(who.email, 'About your Vegans Explore profile', wrap(`<p style="margin:0 0 12px">Hi ${esc(firstName(who.name))},</p><p style="margin:0 0 12px">We could not give you that profile as asked.${body.note ? ' ' + esc(clean(body.note, 500)) : ''}</p><p style="margin:0 0 16px">Reply to this email and we will sort it out with you.</p>` + btn(DOOR, 'Open your checklist')));
        return json({ ok: true, status: 'declined' });
      }
      let listingId = c.listing_id;
      if (listingId) {
        const { data: l } = await db.from('listings').select('id, owner_member_id, status, category').eq('id', listingId).maybeSingle();
        if (!l || l.status !== 'approved' || !PEOPLE_CATS.includes(l.category)) return json({ error: 'listing_gone' }, 409);
        if (l.owner_member_id && l.owner_member_id !== c.member_id) return json({ error: 'owned', message: 'Someone else already holds that profile.' }, 409);
        await db.from('listings').update({ owner_member_id: c.member_id, claimed_by_member_id: c.member_id, claim_status: 'verified', updated_at: at }).eq('id', listingId);
      } else {
        const np = c.new_profile || {};
        const name = clean(np.name, 120) || who?.name || 'New profile';
        let slug = slugify(name) || 'profile';
        const { data: taken } = await db.from('listings').select('slug').like('slug', `${slug}%`);
        const used = new Set((taken || []).map((x: any) => x.slug));
        if (used.has(slug)) { let i = 2; while (used.has(`${slug}-${i}`)) i++; slug = `${slug}-${i}`; }
        const { data: made, error } = await db.from('listings').insert({
          name, slug, category: 'Content Creators', specialty: '', location: 'Online', status: 'approved', communities: ['all'], vegan_status: null,
          description: clean(np.bio, 2000) || null, crawl_source: 'ambassador', owner_member_id: c.member_id, claimed_by_member_id: c.member_id, claim_status: 'verified',
          details: { person: { title: clean(np.title, 200) || '', added: `Ambassador door, ${at.slice(0, 10)}` } },
        }).select('id').single();
        if (error || !made) return json({ error: 'save_failed', message: error?.message }, 500);
        listingId = made.id;
      }
      await db.from('ve_profile_claims').update({ status: 'approved', listing_id: listingId, decided_at: at, decided_by: member.id, decision_note: clean(body.note, 500) || null }).eq('id', c.id);
      await db.from('ve_listing_edits').insert({ listing_id: listingId, member_id: member.id, field: 'owner_member_id', old_value: null, new_value: c.member_id, meta: { source: 'ambassador_door', claim: c.id } });
      if (who?.email) await sendOne(who.email, 'Your Vegans Explore profile is yours', wrap(`<p style="margin:0 0 12px">Hi ${esc(firstName(who.name))},</p><p style="margin:0 0 16px">Your profile in the Directory is now yours to keep current: your photo, what you do and your bio. It is the first step of your checklist for paid work.</p>` + btn(`${DOOR}?step=profile`, 'Finish your profile')));
      return json({ ok: true, status: 'approved', listing_id: listingId });
    }
    const [{ data: ambs }, { data: rows }, { data: pend }, { data: stories }] = await Promise.all([
      db.from('members').select('id, name, email, avatar_url, ambassador_profile').eq('ve_role', 'ambassador').order('name'),
      db.from('ve_ambassador_door').select('*'),
      db.from('ve_profile_claims').select('id, member_id, listing_id, new_profile, note, created_at').eq('status', 'pending').order('created_at'),
      db.from('ve_ambassador_stories').select('id, member_id, kind, name, about, place, contact, status, status_at, created_at').order('created_at', { ascending: false }).limit(200),
    ]);
    const byMember: Record<string, any> = {}; for (const r of rows || []) byMember[r.member_id] = r;
    const people = await Promise.all((ambs || []).map(async (a: any) => {
      const s = await state(a.id);
      return { id: a.id, name: a.name, email: a.email, avatar_url: a.avatar_url, profile_kind: a.ambassador_profile || null, started: !!byMember[a.id],
        started_at: byMember[a.id]?.started_at || null, steps: s.steps, active: s.active, active_at: byMember[a.id]?.active_at || null,
        reminders: byMember[a.id]?.reminders || 0, listing: s.profile ? { slug: s.profile.slug, name: s.profile.name } : null,
        rates: byMember[a.id]?.rates || {}, skills: byMember[a.id]?.skills || [], chapters: byMember[a.id]?.chapters || [],
        platforms: (byMember[a.id]?.platforms || []).filter((p: any) => p.handle) };
    }));
    const lids = (pend || []).map((c: any) => c.listing_id).filter(Boolean);
    const { data: ls } = lids.length ? await db.from('listings').select('id, name, slug').in('id', lids) : { data: [] };
    const names: Record<string, any> = {}; for (const a of ambs || []) names[a.id] = a;
    const claims = (pend || []).map((c: any) => ({ ...c, member: names[c.member_id] ? { name: names[c.member_id].name, email: names[c.member_id].email } : null,
      listing: (ls || []).find((l: any) => l.id === c.listing_id) || null }));
    const sids = [...new Set((stories || []).map((x: any) => x.member_id).filter((id: string) => !names[id]))];
    const { data: more } = sids.length ? await db.from('members').select('id, name, email').in('id', sids) : { data: [] };
    for (const m of more || []) names[m.id] = m;
    const storyRows = (stories || []).map((x: any) => ({ ...x, kind_words: STORY_KINDS[x.kind] || x.kind,
      member: names[x.member_id] ? { name: names[x.member_id].name, email: names[x.member_id].email } : null }));
    return json({ ok: true, ambassadors: people, claims, stories: storyRows });
  }

  // ---- The Ambassador's own checklist.
  if (member.ve_role !== 'ambassador' && !isAdmin) return json({ error: 'ambassadors_only', message: 'The door is for Ambassadors.' }, 403);
  const reply = async () => { const s = await state(member.id); const at = await settle(member, s); return json(shape(member, s, at || s.row?.active_at || null)); };

  // An introduction or a story (Sean, 2026-10-30). Not bound to their city: anyone, anywhere. Saved for the team and emailed to Sean.
  if (action === 'story') {
    const kind = String(body.kind || '');
    if (!STORY_KINDS[kind]) return json({ error: 'bad_kind' }, 400);
    const about = clean(body.about, 1500), name = clean(body.name, 160), place = clean(body.place, 160), contact = clean(body.contact, 300);
    if (about.length < 10) return json({ error: 'missing', message: 'Tell us a little more.' }, 400);
    if (kind === 'intro' && !name) return json({ error: 'missing', message: 'Who are you introducing?' }, 400);
    const since = new Date(Date.now() - DAY_MS).toISOString();
    const { count } = await db.from('ve_ambassador_stories').select('id', { count: 'exact', head: true }).eq('member_id', member.id).gte('created_at', since);
    if ((count ?? 0) >= 10) return json({ error: 'daily_limit', message: 'That is ten today. Send the rest tomorrow, or email us.' }, 429);
    const { error } = await db.from('ve_ambassador_stories').insert({ member_id: member.id, kind, name: name || null, about, place: place || null, contact: contact || null });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    await sendOne(SEAN_EMAIL, `[Ambassadors] ${STORY_KINDS[kind]} from ${member.name || member.email}${name ? ': ' + name : ''}`, wrap(
      `<p><b>${esc(member.name || '')}</b> (${esc(member.email || '')}) sent ${esc(STORY_KINDS[kind].toLowerCase())}.</p>` +
      (name ? `<p><b>Who:</b> ${esc(name)}</p>` : '') + `<p style="white-space:pre-line">${esc(about)}</p>` +
      (place ? `<p><b>Where:</b> ${esc(place)}</p>` : '') + (contact ? `<p><b>How to reach them:</b> ${esc(contact)}</p>` : '') +
      `<p><a href="${SITE}/admin/depot/ambassadors#stories">Depot &gt; Ambassadors &gt; Stories</a></p>`));
    return json({ ok: true });
  }

  if (action === 'door') {
    if (member.ve_role === 'ambassador') await ensureRow(member.id);
    return await reply();
  }

  if (action === 'profile_search') {
    const q = clean(body.q, 80).replace(/[%_,()]/g, ' ').trim();
    if (q.length < 2) return json({ ok: true, results: [] });
    const { data } = await db.from('listings').select('id, slug, name, category, logo_url, owner_member_id, details')
      .eq('status', 'approved').in('category', PEOPLE_CATS).ilike('name', `%${q}%`).order('name').limit(8);
    return json({ ok: true, results: (data || []).map((l: any) => ({ id: l.id, slug: l.slug, name: l.name, category: l.category, logo_url: l.logo_url || '',
      title: l.details?.person?.title || '', taken: !!l.owner_member_id && l.owner_member_id !== member.id })) });
  }

  if (action === 'profile_claim') {
    if (await profileOf(member.id)) return json({ error: 'have_one', message: 'You already have your profile.' }, 409);
    const { data: open } = await db.from('ve_profile_claims').select('id').eq('member_id', member.id).eq('status', 'pending').maybeSingle();
    if (open) return json({ error: 'waiting', message: 'Your request is with our team already.' }, 409);
    const note = clean(body.note, 500) || null;
    let row: any;
    if (isId(body.listing_id)) {
      const { data: l } = await db.from('listings').select('id, name, slug, owner_member_id, status, category').eq('id', body.listing_id).maybeSingle();
      if (!l || l.status !== 'approved' || !PEOPLE_CATS.includes(l.category)) return json({ error: 'not_found' }, 404);
      if (l.owner_member_id) return json({ error: 'taken', message: 'That profile is already claimed. Tell us if it is yours.' }, 409);
      row = { member_id: member.id, listing_id: l.id, note };
    } else {
      const name = clean(body.name, 120), title = clean(body.title, 200), bio = clean(body.bio, 2000);
      if (!name || !title) return json({ error: 'missing', message: 'Give your name and what you do.' }, 400);
      row = { member_id: member.id, new_profile: { name, title, bio }, note };
    }
    const { data: c, error } = await db.from('ve_profile_claims').insert(row).select('id').single();
    if (error || !c) return json({ error: 'save_failed', message: error?.message }, 500);
    await ensureRow(member.id);
    await sendOne(SEAN_EMAIL, `[Ambassadors] ${member.name || member.email} asked for their profile`, wrap(
      `<p><b>${esc(member.name || '')}</b> (${esc(member.email || '')}) asked ${row.listing_id ? 'for an existing People profile' : 'for a new profile: ' + esc(row.new_profile.name) + ', ' + esc(row.new_profile.title)}.</p>` +
      (note ? `<p>Their note: ${esc(note)}</p>` : '') + `<p><a href="${SITE}/admin/depot/ambassadors#door">Approve it in Depot &gt; Ambassadors &gt; Paid work</a></p>`));
    return await reply();
  }

  if (action === 'profile_withdraw') {
    await db.from('ve_profile_claims').update({ status: 'withdrawn', decided_at: new Date().toISOString() }).eq('member_id', member.id).eq('status', 'pending');
    return await reply();
  }

  if (action === 'profile_save') {
    const p = await profileOf(member.id);
    if (!p) return json({ error: 'no_profile' }, 409);
    const { data: l } = await db.from('listings').select('id, description, website, instagram, details').eq('id', p.id).maybeSingle();
    if (!l) return json({ error: 'no_profile' }, 409);
    const patch: Record<string, unknown> = {}, edits: { field: string; old_value: unknown; new_value: unknown }[] = [];
    if (typeof body.title === 'string') {
      const v = clean(body.title, 200), old = l.details?.person?.title || '';
      if (v !== old) { patch.details = { ...(l.details || {}), person: { ...(l.details?.person || {}), title: v } }; edits.push({ field: 'person_title', old_value: old || null, new_value: v || null }); }
    }
    if (typeof body.bio === 'string') {
      const v = clean(body.bio, 2000);
      if (v !== (l.description || '')) {
        patch.description = v || null; edits.push({ field: 'description', old_value: l.description || null, new_value: v || null });
        const d: any = patch.details || { ...(l.details || {}) };
        d.person = { ...(d.person || {}), bio_source: 'owner' }; patch.details = d;
      }
    }
    if (typeof body.website === 'string') {
      let v = clean(body.website, 500);
      if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v;
      if (v && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(v)) return json({ error: 'bad_link', message: 'That website does not look right.' }, 400);
      if (v !== (l.website || '')) { patch.website = v || null; edits.push({ field: 'website', old_value: l.website || null, new_value: v || null }); }
    }
    if (typeof body.instagram === 'string') {
      const v = handleOf('instagram', body.instagram);
      if (body.instagram && !v) return json({ error: 'bad_instagram', message: 'That Instagram handle does not look right.' }, 400);
      if (v !== (l.instagram || '')) { patch.instagram = v || null; edits.push({ field: 'instagram', old_value: l.instagram || null, new_value: v || null }); }
    }
    if (edits.length) {
      patch.updated_at = new Date().toISOString();
      const { error } = await db.from('listings').update(patch).eq('id', l.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      await db.from('ve_listing_edits').insert(edits.map((e) => ({ listing_id: l.id, member_id: member.id, field: e.field, old_value: e.old_value, new_value: e.new_value, meta: { source: 'ambassador_door' } })));
    }
    return await reply();
  }

  if (action === 'platforms_save') {
    await ensureRow(member.id);
    const { data: row } = await db.from('ve_ambassador_door').select('platforms').eq('member_id', member.id).maybeSingle();
    const old: any[] = row?.platforms || [];
    const input: any[] = Array.isArray(body.platforms) ? body.platforms : [];
    const out: any[] = [];
    for (const kind of KINDS) {
      const p = input.find((x) => x && x.kind === kind);
      if (!p) { const o = old.find((x) => x.kind === kind); if (o) out.push(o); continue; }
      const handle = handleOf(kind, p.handle);
      if (!handle) { if (clean(p.handle, 300)) return json({ error: 'bad_handle', kind, message: `That ${kind === 'podcast' ? 'podcast link' : kind + ' handle'} does not look right.` }, 400); continue; }
      let followers = Math.max(0, Math.min(1e9, Math.round(Number(p.followers) || 0)));
      let url = urlOf(kind, handle), verified = false;
      if (kind === 'youtube') {
        const y = await youtubeSubs(handle);
        if (y) { followers = y.followers; url = y.url; verified = true; }
      }
      out.push({ kind, handle, url, followers, verified, checked_at: new Date().toISOString() });
    }
    await db.from('ve_ambassador_door').update({ platforms: out, updated_at: new Date().toISOString() }).eq('member_id', member.id);
    return await reply();
  }

  if (action === 'rates_save') {
    await ensureRow(member.id);
    const r = body.rates || {};
    const rates: Record<string, unknown> = {};
    for (const k of RATE_KEYS) { const v = Math.round(Number(r[k])); if (v > 0 && v <= 100000) rates[k] = v; }
    const notes = clean(r.notes, 500); if (notes) rates.notes = notes;
    const skills = (Array.isArray(body.skills) ? body.skills : []).filter((s: string) => SKILLS.includes(s));
    const chapters = (Array.isArray(body.chapters) ? body.chapters : []).filter((s: string) => CHAPTERS.includes(s));
    await db.from('ve_ambassador_door').update({ rates, skills, chapters, rates_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('member_id', member.id);
    return await reply();
  }

  if (action === 'payout_start' || action === 'payout_status') {
    await ensureRow(member.id);
    const { data: row } = await db.from('ve_ambassador_door').select('stripe_account_id, stripe_test').eq('member_id', member.id).maybeSingle();
    let acct = row?.stripe_account_id || null;
    const test = acct ? !!row?.stripe_test : await isTestAccount(member.email);
    if (action === 'payout_status') {
      if (!acct) return await reply();
      const { ok, d } = await stripe(test, 'GET', `accounts/${acct}`);
      if (ok) await db.from('ve_ambassador_door').update({ payouts_ready: !!(d.payouts_enabled && d.details_submitted), payouts_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('member_id', member.id);
      return await reply();
    }
    try {
      if (!acct) {
        const { ok, d } = await stripe(test, 'POST', 'accounts', {
          type: 'express', country: 'US', email: member.email || '',
          'capabilities[transfers][requested]': 'true', 'metadata[member_id]': member.id, 'metadata[source]': 've-ambassador',
        });
        if (!ok) {
          console.error('stripe account', d);
          if (/restricted/i.test(String(d?.error?.message || ''))) await sendOne(SEAN_EMAIL, '[Ambassadors] Stripe refused a payouts account', wrap(`<p>Stripe refused to make a payouts account for <b>${esc(member.name || '')}</b> (${esc(member.email || '')}):</p><p>${esc(String(d.error.message))}</p><p>Confirm it in the Stripe Dashboard (Vegans Explore), then they can press Get paid again.</p>`));
          const msg = String(d?.error?.message || '');
          return json({ error: 'stripe', message: /signed up for Connect/i.test(msg) ? 'Payouts are not switched on yet. We will let you know as soon as they are.' : /restricted/i.test(msg) ? 'Payouts could not be set up right now. Our team has been told and will let you know.' : 'Stripe did not open. Try again in a minute.', detail: isAdmin ? msg : undefined }, 400);
        }
        acct = d.id;
        await db.from('ve_ambassador_door').update({ stripe_account_id: acct, stripe_test: test, updated_at: new Date().toISOString() }).eq('member_id', member.id);
      }
      const { ok, d } = await stripe(test, 'POST', 'account_links', {
        account: acct!, type: 'account_onboarding',
        refresh_url: `${DOOR}?step=paid&stripe=refresh`, return_url: `${DOOR}?step=paid&stripe=return`,
      });
      if (!ok) { console.error('stripe link', d); return json({ error: 'stripe', message: 'Stripe did not open. Try again in a minute.', detail: isAdmin ? String(d?.error?.message || '') : undefined }, 400); }
      return json({ ok: true, url: d.url, test_mode: test });
    } catch (e) {
      console.error('payout_start', e);
      return json({ error: 'stripe', message: 'Stripe did not open. Try again in a minute.' }, 500);
    }
  }

  return json({ error: 'unknown_action' }, 400);
});
