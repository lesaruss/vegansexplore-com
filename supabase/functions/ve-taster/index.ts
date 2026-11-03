// ve-taster: the Taster account and A Taste of Vegans Explore (Sean, 2026-11-01, canon canon-ve-earn-your-passport; migration
// 20261101_taster_accounts.sql). A name and an email make a Taster (ve_tasters, never a members row); a long-lived Taster key opens
// the sampler, and later their challenges and emails. It is signed with a different secret from member sessions, so no member
// function can ever take it for a member.
//
//   { action: 'join', name, email, why, chapter, journey, consent?, source? }   -> { ok, token, taster } | { member: true }
//       London asks for the unticked box (consent: true); everywhere else the form says plainly they will get our emails.
//       An email that already belongs to a member is told to sign in instead. Joining again with the same email updates the answers.
//       Day 0's email carries their sampler link, which signs them in on any device and confirms the email.
//   { action: 'guide_join', email, guide }  -> { ok, token } : a door Guide's one-field sign-up (ve_guides.door); see migration 20261103_door_guides.sql
//   { action: 'me', token }            -> the Taster (name, chapter, answers, the suggested Guide) or { member: true } once converted
//   { action: 'confirm', token }       -> marks the email confirmed (they opened the emailed link)
//   { action: 'unsubscribe', token }   -> stops our emails to them
//   { action: 'admin_list' }           -> super admins (member token): the latest 200 Tasters and the totals
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const b64uStr = (s: string) => b64u(new TextEncoder().encode(s));
function fromB64u(s: string) { const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''; const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }

const likeEsc = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);
const WHY = ['food', 'going', 'vegan', 'animals', 'business', 'creator'];
const JOURNEY = ['curious', 'flexitarian', 'vegetarian', 'new', 'years'];
const CHAPTERS = ['south-florida', 'central-florida', 'north-florida', 'atlanta', 'washington-dc', 'delaware', 'maryland', 'virginia', 'west-virginia', 'new-york', 'philadelphia', 'los-angeles', 'london', 'elsewhere'];
// The Guide we suggest, from what brought them here and where they are on their journey.
function suggest(why: string, journey: string) {
  if (why === 'business') return 'vegan-restaurant-guide';
  if (why === 'creator') return 'creator-guide';
  if (why === 'animals') return 'nonprofit-guide';
  if (why === 'vegan') return journey === 'years' ? 'airport-guide' : 'nutrition-guide';
  if (why === 'going') return journey === 'curious' || journey === 'flexitarian' ? 'vegan-dairy-guide' : 'nutrition-guide';
  return 'vegan-dairy-guide';
}

// The Taster key: a different secret from member sessions (bytes 32 to 64 of the service key).
async function key(use: 'sign' | 'verify') {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(32, 64).padEnd(32, '1')), { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
}
async function signTaster(id: string) {
  const h = b64uStr(JSON.stringify({ alg: 'HS256', typ: 'TASTER' })), p = b64uStr(JSON.stringify({ sub: id, k: 'taster', exp: Math.floor(Date.now() / 1000) + 400 * 86400 }));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key('sign'), new TextEncoder().encode(`${h}.${p}`)));
  return `${h}.${p}.${b64u(sig)}`;
}
async function readTaster(token: unknown): Promise<string | null> {
  try {
    const [h, p, s] = String(token || '').split('.');
    if (!h || !p || !s) return null;
    if (!(await crypto.subtle.verify('HMAC', await key('verify'), fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k === 'taster' && typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
// Member sessions, for admin_list.
async function memberFrom(req: Request): Promise<string | null> {
  try {
    const [h, p, s] = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').split('.');
    if (!h || !p || !s) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
const out = (t: any) => ({ id: t.id, name: t.name, first_name: String(t.name || '').trim().split(/\s+/)[0], chapter: t.chapter, why: t.why, journey: t.journey,
  suggested_guide: t.suggested_guide, confirmed: !!t.confirmed_at, unsubscribed: !!t.unsubscribed_at, member: !!t.member_id });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  if (action === 'join') {
    const name = String(body.name || '').replace(/\s+/g, ' ').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const why = String(body.why || ''), journey = String(body.journey || ''), chapter = String(body.chapter || '');
    if (name.length < 2 || name.length > 80) return json({ error: 'name', message: 'Tell us your name.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return json({ error: 'email', message: 'That email does not look right.' }, 400);
    if (!WHY.includes(why) || !JOURNEY.includes(journey) || !CHAPTERS.includes(chapter)) return json({ error: 'answers', message: 'Answer the three questions.' }, 400);
    if (chapter === 'london' && body.consent !== true) return json({ error: 'consent', message: 'Tick the box to get our emails.' }, 400);
    const { data: m } = await db.from('members').select('id, membership_status').ilike('email', likeEsc(email)).maybeSingle();
    if (m && m.membership_status === 'active') return json({ ok: false, member: true, message: 'You are already a member. Sign in and everything is open to you.' });
    // A few tries a day per email, so nobody floods someone else's inbox.
    const { data: ex } = await db.from('ve_tasters').select('*').ilike('email', likeEsc(email)).maybeSingle();
    if (ex && ex.updated_at && Date.now() - Date.parse(ex.updated_at) < 60e3) return json({ error: 'slow_down', message: 'Give it a minute and try again.' }, 429);
    const row = { email, name, why, journey, chapter, suggested_guide: suggest(why, journey), consent_basis: chapter === 'london' ? 'checkbox' : 'notice',
      consent_at: new Date().toISOString(), source: String(body.source || '').slice(0, 60) || null, unsubscribed_at: null, updated_at: new Date().toISOString() };
    const res = ex ? await db.from('ve_tasters').update(row).eq('id', ex.id).select('*').single() : await db.from('ve_tasters').insert(row).select('*').single();
    if (res.error || !res.data) return json({ error: 'save_failed' }, 500);
    const t = res.data, token = await signTaster(t.id);
    const test = /\[TEST\]/i.test(name);
    if (RESEND_KEY && !test) {
      const link = `${SITE}/guides/taste?t=${encodeURIComponent(token)}`, unsub = `${SITE}/guides/taste?unsub=${encodeURIComponent(token)}`;
      const first = esc(String(name).split(/\s+/)[0]);
      await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [email], reply_to: 'contact@lesaruss.com', subject: 'Your Taste of Vegans Explore',
          html: `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a"><p>Hi ${first},</p>` +
            `<p>Here is your Taste of Vegans Explore: a piece of every one of our Guides, walked through by the whole cast. Open it any time, on any device, from this link.</p>` +
            `<p style="margin:26px 0"><a href="${link}" style="display:inline-block;background:#1f5f22;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:14px 26px;border-radius:6px;text-decoration:none">Open your Taste</a></p>` +
            `<p>We will send you a few notes about what is happening in your city. You are not a member, and nothing is charged.</p><p>Vegans Explore team</p>` +
            `<p style="margin-top:26px;font-size:12px;color:#777">You are getting this because you asked for A Taste of Vegans Explore. <a href="${unsub}" style="color:#777">Stop these emails</a>. LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p></div>`,
          headers: { 'List-Unsubscribe': `<${unsub}>` } }) }).catch((e) => console.error('mail', e));
    }
    return json({ ok: true, token, taster: out(t) });
  }

  // Door Guides (Sean, 2026-11-02, canon-ve-door-guides): one field, the email, asked inside a door Guide. Makes a Taster with no
  // questions answered (name from the email's first part), tagged with the Guide, and sends one email with the Guide's link.
  if (action === 'guide_join') {
    const email = String(body.email || '').trim().toLowerCase();
    const guide = String(body.guide || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) return json({ error: 'email', message: 'That email does not look right.' }, 400);
    const { data: g } = await db.from('ve_guides').select('slug, title, door').eq('slug', guide).eq('door', true).maybeSingle();
    if (!g) return json({ error: 'not_door', message: 'That Guide is not open this way.' }, 400);
    const { data: m } = await db.from('members').select('id, membership_status').ilike('email', likeEsc(email)).maybeSingle();
    if (m && m.membership_status === 'active') return json({ ok: false, member: true, message: 'You are already a member. Sign in and everything is open to you.' });
    const { count: recent } = await db.from('ve_tasters').select('id', { count: 'exact', head: true }).like('source', 'door:%').gte('updated_at', new Date(Date.now() - 10 * 60e3).toISOString());
    if ((recent ?? 0) > 60) return json({ error: 'busy', message: 'Try again in a few minutes.' }, 429);
    const { data: ex } = await db.from('ve_tasters').select('*').ilike('email', likeEsc(email)).maybeSingle();
    if (ex && ex.updated_at && Date.now() - Date.parse(ex.updated_at) < 60e3) return json({ error: 'slow_down', message: 'Give it a minute and try again.' }, 429);
    const now = new Date().toISOString();
    const guides = Array.from(new Set([...(ex?.door_guides || []), g.slug]));
    let res;
    if (ex) res = await db.from('ve_tasters').update({ door_guides: guides, unsubscribed_at: null, source: ex.source || `door:${g.slug}`, updated_at: now }).eq('id', ex.id).select('*').single();
    else {
      const local = email.split('@')[0].replace(/[._+\-]+/g, ' ').replace(/\d+/g, '').trim();
      const name = (local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Friend').slice(0, 80);
      res = await db.from('ve_tasters').insert({ email, name, consent_basis: 'notice', consent_at: now, source: `door:${g.slug}`, door_guides: guides, updated_at: now }).select('*').single();
    }
    if (res.error || !res.data) return json({ error: 'save_failed' }, 500);
    const t = res.data, token = await signTaster(t.id);
    if (RESEND_KEY && !/\[TEST\]/i.test(t.name) && !/\+test@|@example\./i.test(email)) {
      const link = `${SITE}/guides/${g.slug}?t=${encodeURIComponent(token)}`, unsub = `${SITE}/guides/${g.slug}?unsub=${encodeURIComponent(token)}`;
      await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [email], reply_to: 'contact@lesaruss.com', subject: `Your ${esc(g.title || 'Guide')}`,
          html: `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a"><p>Hi,</p>` +
            `<p>Here is the ${esc(g.title || 'Guide')}, open to you on any device from this link. It also confirms your email.</p>` +
            `<p style="margin:26px 0"><a href="${link}" style="display:inline-block;background:#1f5f22;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:14px 26px;border-radius:6px;text-decoration:none">Open the Guide</a></p>` +
            `<p>You are not a member and nothing is charged.</p><p>Vegans Explore team</p>` +
            `<p style="margin-top:26px;font-size:12px;color:#777">You are getting this because you asked for the ${esc(g.title || 'Guide')}. <a href="${unsub}" style="color:#777">Stop these emails</a>. LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p></div>`,
          headers: { 'List-Unsubscribe': `<${unsub}>` } }) }).catch((e) => console.error('mail', e));
    }
    return json({ ok: true, token, taster: out(t) });
  }

  if (action === 'me' || action === 'confirm' || action === 'unsubscribe') {
    const id = await readTaster(body.token);
    if (!id) return json({ error: 'bad_token' }, 401);
    const patch: Record<string, unknown> = { last_seen_at: new Date().toISOString() };
    if (action === 'confirm') patch.confirmed_at = new Date().toISOString();
    if (action === 'unsubscribe') patch.unsubscribed_at = new Date().toISOString();
    const { data: t } = await db.from('ve_tasters').update(patch).eq('id', id).select('*').maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    return json({ ok: true, taster: out(t) });
  }

  if (action === 'admin_list') {
    const mid = await memberFrom(req);
    const { data: m } = mid ? await db.from('members').select('is_superadmin').eq('id', mid).maybeSingle() : { data: null };
    if (!m?.is_superadmin) return json({ error: 'forbidden' }, 403);
    const { data } = await db.from('ve_tasters').select('id, name, email, chapter, why, journey, suggested_guide, confirmed_at, unsubscribed_at, member_id, converted_at, created_at').order('created_at', { ascending: false }).limit(200);
    const rows = data || [];
    return json({ ok: true, total: rows.length, converted: rows.filter((r: any) => r.member_id).length, tasters: rows });
  }

  return json({ error: 'unknown_action' }, 400);
});
