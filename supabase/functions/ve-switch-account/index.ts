// ve-switch-account: a super admin signs in as another account to see the site as it does (Sean, 2026-10-26: "the same way
// I do view as, I want to have that option to choose from the super admin... so I can log in and see that experience").
// View As only paints the page over Sean's own session; a switch is a real sign-in, so the server treats every action as that
// member. Only accounts in ve_switch_accounts (migration 20261026_ve_switch_accounts.sql: Logan Russell, the six Guides) can be
// switched into, and only from a super admin signed in as themselves (a switched token carries switched_by and is refused
// here, so a switch never chains). The way back is the super admin's own token, kept in their browser by nav.js.
// Playbook ve-guide-accounts.
//
// POST { action: 'list' }                 a super admin: { accounts: [{ member_id, label, kind, guide_slug, note, avatar_url,
//                                          membership_status, points }] }
// POST { action: 'switch', member_id }    a super admin: { token, member } in the same shape as ve-auth login; 8 hours
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const MEMBER_FIELDS = 'id, name, email, initials, color, membership_tier, ve_role, ve_tier, referral_code, is_superadmin, home_community, membership_status, avatar_url';
const SWITCH_HOURS = 8;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Same key derivation as ve-auth's signJWT / decodeToken.
async function hmacKey(use: 'sign' | 'verify') {
  const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
  return crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [use]);
}
async function verifyToken(token: string): Promise<Record<string, any> | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    if (!(await crypto.subtle.verify('HMAC', await hmacKey('verify'), b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d : null;
  } catch { return null; }
}
async function signToken(payload: Record<string, unknown>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + SWITCH_HOURS * 3600 }));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey('sign'), new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  // A super admin signed in as themselves, never a switched session.
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const claims = token ? await verifyToken(token) : null;
  if (!claims) return json({ error: 'sign_in' }, 401);
  if (claims.switched_by) return json({ error: 'switched', message: 'Go back to your own account first.' }, 403);
  const { data: admin } = await db.from('members').select('id, name, is_superadmin').eq('id', claims.sub).maybeSingle();
  if (!admin?.is_superadmin) return json({ error: 'forbidden' }, 403);

  if (body.action === 'list') {
    const { data: rows, error } = await db.from('ve_switch_accounts')
      .select('member_id, label, kind, guide_slug, note, sort, members!inner(avatar_url, membership_status)').order('sort');
    if (error) return json({ error: 'list_failed' }, 500);
    const ids = (rows || []).map((r: any) => r.member_id);
    const { data: pts } = ids.length ? await db.from('member_points').select('member_id, available_points').in('member_id', ids) : { data: [] };
    const byId = new Map((pts || []).map((p: any) => [p.member_id, p.available_points]));
    return json({ accounts: (rows || []).map((r: any) => ({
      member_id: r.member_id, label: r.label, kind: r.kind, guide_slug: r.guide_slug, note: r.note,
      avatar_url: r.members?.avatar_url || null, membership_status: r.members?.membership_status || null,
      points: byId.get(r.member_id) ?? 0,
    })) });
  }

  if (body.action === 'switch') {
    if (!isId(body.member_id)) return json({ error: 'member_id' }, 400);
    const { data: allowed } = await db.from('ve_switch_accounts').select('label').eq('member_id', body.member_id).maybeSingle();
    if (!allowed) return json({ error: 'not_switchable' }, 403);
    const { data: member } = await db.from('members').select(MEMBER_FIELDS).eq('id', body.member_id).maybeSingle();
    if (!member) return json({ error: 'not_found' }, 404);
    const [{ data: comms }, { data: hidden }] = await Promise.all([
      db.from('member_communities').select('community_slug').eq('member_id', member.id),
      db.from('member_hidden_modules').select('module_key').eq('member_id', member.id),
    ]);
    const switched = await signToken({ sub: member.id, email: member.email, tier: member.membership_tier, brand: 'vegans-explore', switched_by: admin.id });
    await db.from('stream_events').insert({
      owner: 'logan', station: 'vegans-explore', status: 'completed',
      summary: `${admin.name || 'A super admin'} switched into ${allowed.label} (ve-switch-account).`,
      keywords: ['vegans-explore', 'switch-account'],
    });
    return json({
      token: switched,
      expires_in: SWITCH_HOURS * 3600,
      member: { ...member, communities: (comms || []).map((c: any) => c.community_slug), hidden_modules: (hidden || []).map((h: any) => h.module_key) },
    });
  }

  return json({ error: 'unknown_action' }, 400);
});
