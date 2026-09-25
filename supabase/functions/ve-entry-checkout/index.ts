import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ve-entry-checkout
// One-time "become a member" contribution of any amount the member types in,
// paired with ve-passport-checkout's $11/month subscription as the other path
// to the same outcome. Both are the two ways a Vegans Explore account clears
// the pay-or-pledge gate added 2026-09-17 (Sean): new signups land with
// membership_status = 'pending_payment' and full community access (posting,
// joining a chapter, following, saving/voting) is withheld until either path
// completes. Browsing, the Guide chat, and onboarding stay free either way --
// this only unlocks the participation surface.
//
// Reuses the Founders-pledge point rate already locked in canon
// (canon-ve-founders-pledge-points-2026-08-29: $1 = 100 points), so a $5
// contribution credits 500 points exactly like a $5 Founders pledge would.
// 2026-09-24 (Sean): this is now the Founding Membership, a flat $11 one-time
// contribution that never renews and replaces the free tier. $11 is the floor;
// someone may choose to give more. The 2026-09-17 any-amount experiment is over.
//
// Auth pattern copied exactly from ve-points-checkout / ve-passport-checkout:
// verifies the custom HMAC-signed token minted by ve-auth's signJWT().
// verify_jwt is deliberately OFF at the platform level for the same reason
// those two functions have it off -- Supabase's own JWT check would reject
// this custom token before the function body runs.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's OWN dedicated Stripe account.

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const MIN_AMOUNT_CENTS = 1100; // Founding Membership, $11 one time (Sean, 2026-09-24).
const MAX_AMOUNT_CENTS = 100000; // $1,000 sanity ceiling against fat-fingered input; raise if Sean asks.

// Test checkouts (2026-09-25, Sean: "let's do a test transaction so I can log in
// with a test credit card"). Only members whose email is in
// ve_test_checkout_allowlist (RLS on, no policies: service role only) get a
// Stripe TEST-mode session. Vegans Explore has no test key on file, so test
// sessions run on the LESARUSS account's test key, read from lesaruss_secrets
// only on this path. No money moves. There is no test-mode webhook, so the
// session's success_url comes back here (GET ?test_confirm=cs_...), which
// verifies the paid test session and activates the member, then redirects to
// the page the member started on. Points are NOT credited for test sessions,
// so no fake purchase lands in the points ledger or revenue reporting.
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-entry-checkout`;
async function isTestAccount(email: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabase.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
async function testStripeKey(): Promise<string> {
  const { data } = await supabase.from('lesaruss_secrets').select('value').eq('key', 'STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST').maybeSingle();
  const key = data?.value ?? '';
  if (!key.startsWith('sk_test_')) throw new Error('test key missing');
  return key;
}
function safeReturn(url: string): string {
  try { const u = new URL(url); if (u.protocol === 'https:' && (u.hostname === 'vegansexplore.com' || u.hostname === 'www.vegansexplore.com')) return u.toString(); } catch { /* fall through */ }
  return 'https://vegansexplore.com/dashboard';
}
async function confirmTestSession(sessionId: string): Promise<Response> {
  const key = await testStripeKey();
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { 'Authorization': `Bearer ${key}` } });
  const session = await res.json();
  const back = safeReturn(session?.metadata?.test_return ?? '');
  if (!res.ok || session.livemode !== false || session.payment_status !== 'paid' || session.metadata?.type !== 'entry_contribution' || session.metadata?.test !== 'true') {
    return Response.redirect(back.replace('activate=success', 'activate=cancelled'), 302);
  }
  const { data: member } = await supabase.from('members').select('id, email').eq('id', session.metadata.member_id).maybeSingle();
  if (!member || !(await isTestAccount(member.email))) return Response.redirect(back.replace('activate=success', 'activate=cancelled'), 302);
  await supabase.from('members').update({ membership_status: 'active', entry_paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', member.id);
  console.log('TEST entry contribution activated (no points credited):', member.id, session.id);
  return Response.redirect(back, 302);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlDecodeToString(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const secretBytes = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = b64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${headerB64}.${payloadB64}`));
    if (!valid) return null;

    const payload = JSON.parse(b64urlDecodeToString(payloadB64));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub) return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method === 'GET') {
    const sid = new URL(req.url).searchParams.get('test_confirm') ?? '';
    if (/^cs_test_[A-Za-z0-9]+$/.test(sid)) {
      try { return await confirmTestSession(sid); } catch (e) { console.error('test confirm error:', e); return Response.redirect('https://vegansexplore.com/dashboard', 302); }
    }
    return json({ error: 'method_not_allowed' }, 405);
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'not_authenticated' }, 401);
    const auth = await verifyToken(token);
    if (!auth) return json({ error: 'invalid_token' }, 401);

    const { data: member } = await supabase.from('members').select('id, email, membership_status').eq('id', auth.sub).maybeSingle();
    if (!member) return json({ error: 'member_not_found' }, 404);

    const body = await req.json().catch(() => ({}));
    const amountCents = Math.round(Number(body.amount_cents));
    if (!Number.isFinite(amountCents) || amountCents < MIN_AMOUNT_CENTS || amountCents > MAX_AMOUNT_CENTS) {
      return json({ error: 'invalid_amount', min_cents: MIN_AMOUNT_CENTS, max_cents: MAX_AMOUNT_CENTS }, 400);
    }

    const successUrl = body.success_url ?? 'https://vegansexplore.com/passport?activate=success';
    const cancelUrl = body.cancel_url ?? 'https://vegansexplore.com/passport?activate=cancelled';

    const testMode = await isTestAccount(member.email);
    const stripeKey = testMode ? await testStripeKey() : STRIPE_SECRET;

    const params = new URLSearchParams({
      'mode': 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': (testMode ? '[TEST] ' : '') + 'Vegans Explore - Founding Membership (one time)',
      'line_items[0][price_data][unit_amount]': String(amountCents),
      'line_items[0][quantity]': '1',
      'success_url': testMode ? `${FN_URL}?test_confirm={CHECKOUT_SESSION_ID}` : successUrl,
      'cancel_url': cancelUrl,
      'customer_email': member.email,
      'billing_address_collection': 'auto',
      'payment_intent_data[receipt_email]': member.email,
      'metadata[type]': 'entry_contribution',
      'metadata[member_id]': member.id,
      'metadata[amount_cents]': String(amountCents),
    });
    if (testMode) { params.set('metadata[test]', 'true'); params.set('metadata[test_return]', safeReturn(successUrl)); }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe error:', session);
      return json({ error: session.error?.message ?? 'stripe_error' }, 400);
    }

    return json({ url: session.url, id: session.id, test_mode: testMode });
  } catch (err) {
    console.error('ve-entry-checkout error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
