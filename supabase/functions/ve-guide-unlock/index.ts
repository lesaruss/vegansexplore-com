import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ve-guide-unlock: access to a Vegans Explore Guide.
//
// Pricing (Sean, 2026-10-10, canon-ve-guide-pricing v3): every paid Guide is $11 or 1 Guide credit, never a points
// price. The Founding Membership comes with 1 credit, Passport gives 1 a month, credits roll over up to 3, and about
// 2,500 points become 1 credit. A Guide a member unlocks is theirs to keep. Free Guides open for everyone.
//
// Access rules, per ve_guides.access_rule:
//   credit      a member unlocks it with a credit (ve_credit_unlock) or buys it for $11 (checkout).
//   free        (the Welcome Guide, the Partner Guide): open to everyone.
//   points      (v2, until a Guide moves to credit): spend_points_for_guide.
//   membership  (legacy): any active member has it.
//   Anyone with a ve_guide_purchases row has the Guide, whatever the rule.
//
// Actions (POST ?action=):
//   status   {slug, token?}  -> {loggedIn, unlocked, via, balance, credits, cost, access_rule, membership_status, passport,
//                               credit_cap, points_per_credit}; a Passport member's credit for this month lands here too
//   open     {slug, token}   -> status fields, plus {html} with the Guide's members-only screens (ve_guides.content_html)
//                               when unlocked. This is the only way the members-only content leaves the server.
//   unlock   {slug, token}   -> credit Guides: spend 1 credit; points Guides: spend points
//   exchange {slug, token}   -> about 2,500 points become 1 credit (ve_credit_from_points)
//   checkout {slug, token, return_url} -> {url}: a Stripe checkout for this one Guide, $11
//   GET ?confirm=<session id>  marks it bought (the Stripe webhook calls this too: metadata type ve_guide_purchase,
//                               confirm_fn ve-guide-unlock) and goes back to the Guide with ?guide=bought
//
// verify_jwt stays OFF: the site sends the anon key as apikey and the VE app token
// (minted by ve-auth signJWT) in body.token; verifyToken() checks the HMAC itself.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-guide-unlock`;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's own Stripe account
const GUIDE_PRICE_CENTS = 1100;
const CREDIT_CAP = 3, POINTS_PER_CREDIT = 2500;

// Test accounts (ve_test_checkout_allowlist) check out on the test Stripe key, the way ve-tours does.
async function isTestAccount(email: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabase.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
async function stripeKey(test: boolean): Promise<string> {
  if (!test) return STRIPE_SECRET;
  const { data } = await supabase.from('lesaruss_secrets').select('value').eq('key', 'STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST').maybeSingle();
  if (!String(data?.value || '').startsWith('sk_test_')) throw new Error('test key missing');
  return data!.value;
}
// Back to our own site only.
function backTo(u: unknown, fallback: string): string {
  try { const x = new URL(String(u)); if (x.origin === 'https://vegansexplore.com' || x.origin === 'https://www.vegansexplore.com') return x.href; } catch { /* fall through */ }
  return fallback;
}
function withParam(u: string, k: string, v: string): string { const x = new URL(u); x.searchParams.set(k, v); return x.href; }

// Back from Stripe (or the webhook's self-confirm): mark the Guide bought if the session is paid.
async function confirm(sessionId: string): Promise<Response> {
  const go = (u: string) => new Response(null, { status: 302, headers: { Location: u } });
  const fallback = 'https://vegansexplore.com/guides';
  for (const test of [false, true]) {
    let res: Response;
    try { res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(test)}` } }); }
    catch { continue; }
    if (!res.ok) continue;
    const s = await res.json();
    const back = backTo(s.metadata?.return_url, fallback);
    if (s.metadata?.type !== 've_guide_purchase' || !s.metadata?.member_id || !s.metadata?.guide_slug) return go(fallback);
    if (s.payment_status !== 'paid') return go(withParam(back, 'guide', 'unpaid'));
    const { error } = await supabase.rpc('ve_guide_purchase_paid', { p_member: s.metadata.member_id, p_slug: s.metadata.guide_slug });
    if (error) { console.error('ve_guide_purchase_paid error:', error); return go(withParam(back, 'guide', 'unpaid')); }
    return go(withParam(back, 'guide', 'bought'));
  }
  return go(fallback);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
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

// Verifies the custom HMAC-signed token minted by the ve-auth function.
// Mirrors ve-auth's signJWT() exactly: HS256 over `${header}.${payload}`,
// secret = SERVICE_KEY.slice(0,32).padEnd(32,'0').
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirm(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return new Response(null, { status: 302, headers: { Location: 'https://vegansexplore.com/guides' } }); }
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const action = url.searchParams.get('action');

  try {
    const body = await req.json().catch(() => ({}));
    const slug = body.slug;
    if (!slug) return json({ error: 'slug_required' }, 400);

    const { data: guide } = await supabase
      .from('ve_guides')
      .select('id, cost_lesars, published, access_rule')
      .eq('slug', slug)
      .maybeSingle();

    if (!guide || !guide.published) return json({ error: 'guide_not_found' }, 404);

    const auth = body.token ? await verifyToken(body.token) : null;

    // Who this person is, and whether they have this Guide.
    // via says why it is open: free, purchase or membership.
    async function access() {
      const free = guide!.access_rule === 'free';
      if (!auth) return { loggedIn: false, unlocked: free, via: free ? 'free' : null, balance: 0, credits: 0, membership_status: null as string | null, passport: false, email: '' };
      // A Passport member's credit for this month (once a month; the daily ve-passport-credits job does the same).
      await supabase.rpc('ve_passport_credit', { p_member: auth.sub });
      const [{ data: purchase }, { data: member }] = await Promise.all([
        supabase.from('ve_guide_purchases').select('id').eq('member_id', auth.sub).eq('guide_id', guide!.id).maybeSingle(),
        supabase.from('members').select('lesars_balance, guide_credits, membership_status, membership_tier, email').eq('id', auth.sub).maybeSingle(),
      ]);
      const status = member?.membership_status ?? null;
      const via = free ? 'free' : !member ? null : purchase ? 'purchase'
        : guide!.access_rule === 'membership' && status === 'active' ? 'membership' : null;
      return { loggedIn: !!member, unlocked: !!via, via, balance: member?.lesars_balance ?? 0, credits: member?.guide_credits ?? 0,
        membership_status: status, passport: status === 'active' && member?.membership_tier === 'passport', email: member?.email ?? '' };
    }

    if (action === 'status' || action === 'open') {
      const { email: _email, ...a } = await access();
      const out: Record<string, unknown> = { ...a, cost: guide.cost_lesars, access_rule: guide.access_rule, credit_cap: CREDIT_CAP, points_per_credit: POINTS_PER_CREDIT };
      if (action === 'open' && a.unlocked) {
        const { data: full } = await supabase.from('ve_guides').select('content_html').eq('id', guide.id).maybeSingle();
        out.html = full?.content_html ?? '';
      }
      return json(out);
    }

    if (action === 'unlock' && guide.access_rule === 'credit') {
      if (!auth) return json({ error: 'not_authenticated' }, 401);
      const { data, error } = await supabase.rpc('ve_credit_unlock', { p_member: auth.sub, p_slug: slug });
      if (error) { console.error('ve_credit_unlock error:', error); return json({ error: 'internal_error' }, 500); }
      return json(data);
    }

    if (action === 'exchange') {
      if (!auth) return json({ error: 'not_authenticated' }, 401);
      const { data, error } = await supabase.rpc('ve_credit_from_points', { p_member: auth.sub });
      if (error) { console.error('ve_credit_from_points error:', error); return json({ error: 'internal_error' }, 500); }
      return json(data);
    }

    // Buy this one Guide now, $11.
    if (action === 'checkout') {
      if (!auth) return json({ error: 'not_authenticated' }, 401);
      if (guide.access_rule !== 'credit') return json({ error: 'not_for_sale' }, 400);
      const a = await access();
      if (!a.loggedIn) return json({ error: 'not_authenticated' }, 401);
      if (a.unlocked) return json({ unlocked: true, already: true });
      const test = await isTestAccount(a.email);
      const back = backTo(body.return_url, 'https://vegansexplore.com/guides');
      const { data: g } = await supabase.from('ve_guides').select('title').eq('id', guide.id).maybeSingle();
      const params = new URLSearchParams({
        mode: 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': ((test ? '[TEST] ' : '') + 'Vegans Explore Guide - ' + (g?.title || slug)).slice(0, 120),
        'line_items[0][price_data][unit_amount]': String(GUIDE_PRICE_CENTS),
        'line_items[0][quantity]': '1',
        success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
        cancel_url: withParam(back, 'guide', 'cancelled'),
        'metadata[type]': 've_guide_purchase', 'metadata[confirm_fn]': 've-guide-unlock',
        'metadata[member_id]': auth.sub, 'metadata[guide_slug]': slug, 'metadata[return_url]': back,
      });
      if (a.email) { params.set('customer_email', a.email); params.set('payment_intent_data[receipt_email]', a.email); }
      if (test) params.set('metadata[test]', 'true');
      const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
      const s = await sres.json();
      if (!sres.ok) { console.error('stripe error', s); return json({ error: s.error?.message ?? 'stripe_error' }, 400); }
      return json({ url: s.url, test_mode: test });
    }

    if (action === 'unlock') {
      if (!auth) return json({ error: 'not_authenticated' }, 401);
      if (guide.access_rule !== 'points') return json({ error: guide.access_rule === 'free' ? 'free_guide' : 'membership_guide' }, 400);
      // Never charge twice for a Guide someone already has.
      const a = await access();
      if (a.unlocked) return json({ unlocked: true, already: true, via: a.via, balance: a.balance });
      const { data, error } = await supabase.rpc('spend_points_for_guide', {
        p_member_id: auth.sub,
        p_guide_slug: slug,
      });
      if (error) {
        console.error('spend_points_for_guide error:', error);
        return json({ error: 'internal_error' }, 500);
      }
      return json(data);
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-guide-unlock error:', e);
    return json({ error: 'internal_error' }, 500);
  }
});
