// ve-community-manager: the decision end of the Community Manager page
// (Sean, 2026-09-25: the page recruits, the candidate decides, and registering
// plus confirming is their acceptance).
//
// POST { action: 'question', name, email, message, city, hp? }       (no login)
//   Stores the question and emails it to Sean, reply-to the candidate.
// POST { action: 'confirm', city, acknowledgements }  Authorization: Bearer <ve_token>
//   Requires an active (paid) membership and every acknowledgement. Records the
//   confirmation and emails Sean. Invited candidates (ve_staff_invites, which
//   already set their Community Manager role at sign-up) are 'confirmed';
//   anyone else is 'pending_review' for Sean to decide.
// POST { action: 'status' }  Authorization: Bearer <ve_token>
//   Whether this member has confirmed, and whether they were invited.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SEAN_EMAIL = 'contact@lesaruss.com';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const ACKS = ['lead_city', 'trial', 'time', 'certification'];
const CITY_NAMES: Record<string, string> = {
  'south-florida': 'South Florida', 'orlando-north-central-florida': 'Orlando and North Central Florida',
  'philadelphia': 'Philadelphia', 'new-york': 'New York', 'los-angeles': 'Los Angeles',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

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

async function sendEmail(subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [SEAN_EMAIL], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return res.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const citySlug = CITY_NAMES[String(body.city || '')] ? String(body.city) : null;
  const cityName = citySlug ? CITY_NAMES[citySlug] : 'your city';

  if (action === 'question') {
    if (body.hp) return json({ ok: true }); // honeypot
    const name = String(body.name || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 4000);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) return json({ error: 'name, email and a question are required' }, 400);
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db.from('ve_cm_candidates').select('id', { count: 'exact', head: true }).eq('kind', 'question').eq('email', email).gte('created_at', since);
    if ((count ?? 0) >= 3) return json({ error: 'You have sent a few questions already. We will be in touch soon.' }, 429);
    await db.from('ve_cm_candidates').insert({ kind: 'question', email, name, city_slug: citySlug, message });
    const sent = await sendEmail(`Community Manager question from ${name} (${cityName})`,
      `<p><strong>${esc(name)}</strong> (${esc(email)}) has a question about the ${esc(cityName)} Community Manager role:</p><blockquote style="border-left:3px solid #3A9B3E;padding-left:12px;">${esc(message).replace(/\n/g, '<br>')}</blockquote><p>Reply to this email to answer them directly.</p>`, email);
    return json({ ok: true, emailed: sent });
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, email, name, ve_role, membership_status, home_community').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'member_not_found' }, 404);
  const { data: invite } = await db.from('ve_staff_invites').select('email, city_slug').ilike('email', member.email).maybeSingle();
  const invited = !!invite || member.ve_role === 'community_manager';

  if (action === 'status') {
    const { data: row } = await db.from('ve_cm_candidates').select('status, city_slug, created_at').eq('member_id', memberId).eq('kind', 'confirmation').order('created_at', { ascending: false }).limit(1).maybeSingle();
    return json({ confirmed: !!row, status: row?.status ?? null, invited, membership_status: member.membership_status });
  }

  if (action === 'confirm') {
    if (member.membership_status !== 'active') return json({ error: 'membership_required' }, 402);
    const acks = body.acknowledgements || {};
    if (!ACKS.every((k) => acks[k] === true)) return json({ error: 'confirm_every_item' }, 400);
    const status = invited ? 'confirmed' : 'pending_review';
    const { data: existing } = await db.from('ve_cm_candidates').select('id, status').eq('member_id', memberId).eq('kind', 'confirmation').maybeSingle();
    if (!existing) {
      await db.from('ve_cm_candidates').insert({ kind: 'confirmation', member_id: memberId, email: member.email, name: member.name, city_slug: citySlug ?? invite?.city_slug ?? null, acknowledgements: acks, invited, status });
      await sendEmail(`${member.name || member.email} confirmed: Community Manager, ${cityName}`,
        `<p><strong>${esc(member.name || '')}</strong> (${esc(member.email)}) confirmed they want to be the Vegans Explore Community Manager for <strong>${esc(cityName)}</strong>.</p><ul><li>Wants to lead the city</li><li>Understands the three-month trial</li><li>Can give about 3 hours a week</li><li>Will complete the certification</li></ul><p>${invited ? 'They were invited, so their Community Manager access is already set up and the certification is waiting in their dashboard.' : '<strong>They were not invited.</strong> Their membership is active, but they do not have Community Manager access until you add an invite for them.'}</p>`, member.email);
    }
    return json({ ok: true, invited, status: existing?.status ?? status });
  }

  return json({ error: 'unknown_action' }, 400);
});
