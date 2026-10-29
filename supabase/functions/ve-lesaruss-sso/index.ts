import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ve-lesaruss-sso: Continue with LESARUSS on Vegans Explore (Sean, 2026-10-29; migration 20261029_lesaruss_sign_in.sql).
// /auth/lesaruss posts the one-time code hq.lesaruss.ai/connect sent back; we trade it once (lesaruss_sso_consume) and sign
// that email in here with the same token ve-auth mints (signJWT below is ve-auth's, byte for byte).
//   - One email is one members row across every brand (idx_members_email_unique_global), so the account found here may
//     be their LESARUSS.ai one. A Diplomat (lesaruss_is_diplomat: the $111 membership) is that row, active, so they are
//     in with nothing more to pay; when the membership ends its status ends with it.
//   - diplomat_since and ve_diplomat_sync stay for an account that is ever made active here for being a Diplomat; today
//     nothing sets it.
//   - Anyone else is signed in as their Vegans Explore account is: a Passport holder is in; a new or unpaid account waits
//     for its $11 Passport, exactly like Continue with Google (the page opens the Passport window).
// POST { code, redirect_uri } -> { token, member, diplomat }. verify_jwt off: the code is the credential.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
// The same fields ve-auth returns, plus membership_status (MEMBER_FIELDS in ve-auth).
const MEMBER_FIELDS = 'id, name, email, initials, color, membership_tier, ve_role, ve_tier, referral_code, is_superadmin, home_community, membership_status';
const ROW_FIELDS = MEMBER_FIELDS + ', tenant_id';

const ORIGINS = [/^https:\/\/(www\.)?vegansexplore\.com$/, /^https:\/\/vegansexplore-[a-z0-9]+-contact-2245s-projects\.vercel\.app$/];
function cors(req: Request) {
  const o = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.some((r) => r.test(o)) ? o : 'https://vegansexplore.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
async function signJWT(payload: Record<string, unknown>): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }));
  const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}
async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  const headers = { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers });
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const b = await req.json().catch(() => ({}));
    const code = String(b.code || ''), redirect = String(b.redirect_uri || '');
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(code)) return json({ error: 'bad_code' }, 400);

    const { data: rows, error } = await supabase.rpc('lesaruss_sso_consume', { p_code_hash: await sha256Hex(code), p_client: 'vegans-explore', p_redirect: redirect });
    if (error) { console.error('consume', error); return json({ error: 'internal_error' }, 500); }
    const hit = (rows ?? [])[0] as { email: string } | undefined;
    if (!hit?.email) return json({ error: 'expired', message: 'That sign-in has expired or was already used. Please try again.' }, 401);
    const email = hit.email.toLowerCase();

    const { data: diplomat } = await supabase.rpc('lesaruss_is_diplomat', { p_email: email });
    // Any brand's row for this email (there is at most one), the way ve-auth's findMemberByEmail looks.
    const { data: found } = await supabase.from('members').select(ROW_FIELDS)
      .ilike('email', email.replace(/[%_\\]/g, '\\$&')).limit(1);
    let member = (found ?? [])[0] as Record<string, any> | undefined;

    // Another brand's account is let in here only as a Diplomat. Its status is that brand's, not ours: a free LESARUSS.ai
    // account reads as active, and must not open Vegans Explore without its Passport (Sean, 2026-10-29).
    // ve_member_entitled (migration 20261029_brand_memberships.sql): their own Vegans Explore Passport on record also counts.
    if (member && member.tenant_id !== VE_TENANT_ID && diplomat !== true && !member.is_superadmin) {
      const { data: entitled } = await supabase.rpc('ve_member_entitled', { p_member: member.id });
      if (entitled !== true) {
        // Their $11 checkout is made here, the way ve-auth does it, so no session token reaches the browser.
        let checkout_url: string | null = null;
        try {
          const t = await signJWT({ sub: member.id, email: member.email, tier: member.membership_tier, brand: 'vegans-explore' });
          const r = await fetch(`${SUPABASE_URL}/functions/v1/ve-entry-checkout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
            body: JSON.stringify({ amount_cents: 1100, success_url: 'https://vegansexplore.com/login?passport=paid', cancel_url: 'https://vegansexplore.com/passport' }),
          });
          const d = await r.json().catch(() => ({}));
          if (typeof d.url === 'string') checkout_url = d.url;
        } catch (e) { console.error('passport_needed checkout', e); }
        return json({ error: 'passport_needed', checkout_url, message: 'Your LESARUSS account opens Vegans Explore with its $11 Passport, one time, with 1,100 welcome points. A Diplomat membership opens every LESARUSS community.' }, 403);
      }
    }
    if (member && member.membership_status !== 'active' && member.membership_status !== 'pending_payment') {
      return json({ error: 'suspended', message: 'This account is not active. Write to contact@lesaruss.com.' }, 403);
    }
    if (!member) {
      // No account on any brand yet (a LESARUSS sign-in with no members row): start them here, waiting for the Passport.
      const name = email.split('@')[0];
      const initials = name.split(/\s+/).map((w) => w[0] || '').join('').toUpperCase().slice(0, 2) || 'VE';
      const { data: made, error: insErr } = await supabase.from('members').insert({
        email, name, initials, color: '#22C55E', referral_code: `VE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        membership_tier: 'free', membership_status: 'pending_payment', ve_role: 'member', ve_tier: 'free',
        auth_methods: ['lesaruss'], email_verified: true, tenant_id: VE_TENANT_ID,
      }).select(ROW_FIELDS).single();
      if (insErr || !made) { console.error('insert', insErr); return json({ error: 'internal_error' }, 500); }
      member = made as Record<string, any>;
      try { await supabase.rpc('apply_member_points_delta', { p_member_id: member.id, p_delta: 0 }); } catch { /* points row is made on first use too */ }
    }
    await supabase.from('members').update({ last_activity_at: new Date().toISOString() }).eq('id', member.id);

    const [{ data: comms }, { data: hidden }] = await Promise.all([
      supabase.from('member_communities').select('community_slug').eq('member_id', member.id).order('joined_at', { ascending: true }),
      supabase.from('member_hidden_modules').select('module_key').eq('member_id', member.id),
    ]);
    const token = await signJWT({ sub: member.id, email: member.email, tier: member.membership_tier, brand: 'vegans-explore' });
    const { tenant_id: _t, ...out } = member;
    return json({
      token, diplomat: diplomat === true,
      member: { ...out, communities: (comms ?? []).map((r: any) => r.community_slug), hidden_modules: (hidden ?? []).map((r: any) => r.module_key) },
    });
  } catch (e) {
    console.error('ve-lesaruss-sso', e);
    return json({ error: 'internal_error' }, 500);
  }
});
