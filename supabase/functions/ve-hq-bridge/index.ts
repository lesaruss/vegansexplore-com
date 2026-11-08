// ve-hq-bridge: BrandDesk (HQ) acts as the signed-in super admin on the Vegans Explore functions the Depot uses (Sean, 2026-11-08:
// "figure out how we can put all that into the outreach... I don't need those to sit idle"). The Depot's tools move into BrandDesk >
// Outreach one at a time; instead of teaching each function a second way in, HQ asks here for a short session token for the super
// admin who is signed in to HQ, then calls the same function with it, exactly as the Depot page did.
// POST { as_member } with Authorization: Bearer <LESARUSS_ADMIN_TOKEN>. Only a super admin in good standing, never a Guide (agent) or
// a quarantined account. The token lasts 15 minutes, carries hq_bridge: true, and every issue is logged to stream_events.
// verify_jwt is false: the admin token is checked here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MINUTES = 15;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const base64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

// Same key derivation as ve-auth's signJWT / decodeToken.
async function hmacKey() {
  const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function signToken(payload: Record<string, unknown>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + MINUTES * 60 }));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}
async function adminToken(): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  return data?.value ?? null;
}
function sameSecret(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const admin = await adminToken();
  if (!admin || !sameSecret(bearer, admin)) return json({ error: 'forbidden' }, 403);
  let body: any = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (!isId(body.as_member)) return json({ error: 'as_member_required' }, 400);
  const { data: m } = await db.from('members')
    .select('id, email, membership_tier, is_superadmin, member_class, standing')
    .eq('id', body.as_member).maybeSingle();
  if (!m || !m.is_superadmin || m.member_class === 'agent' || m.member_class === 'quarantined' || (m.standing && m.standing !== 'good')) {
    return json({ error: 'not_a_super_admin' }, 403);
  }
  const token = await signToken({ sub: m.id, email: m.email, tier: m.membership_tier, brand: 'vegans-explore', hq_bridge: true });
  await db.from('stream_events').insert({
    owner: 'logan', station: 'vegans-explore', status: 'completed',
    summary: `branddesk-production-wing: BrandDesk session issued for ${m.email}`, keywords: ['vegans-explore', 'hq-bridge'],
  }).then(() => {}, () => {});
  return json({ token, expires_in: MINUTES * 60 });
});
