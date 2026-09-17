import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ve-passport-checkout
// Starts (or resumes billing management for) the Vegans Explore Passport
// sustaining subscription -- $11/month or $111/year. Locked into the
// universal cross-brand points ladder (exploration-universal-points-ladder,
// LOCKED 2026-08-08): 1,100 Points credited on signup and again on every
// successful monthly renewal (annual credits once at signup and once per
// year, on the annual invoice.payment_succeeded event -- see ve-stripe-webhook).
//
// 2026-09-17 (Sean + V design session): added the annual option ($111/year,
// ~16% off monthly, matching the existing "$111" price point already used
// elsewhere -- e.g. ADA Unlocked's course). The monthly price keeps using
// its existing fixed Stripe Price ID (unchanged, still live); annual is
// built inline via price_data on the same product rather than requiring a
// second pre-created Price object, mirroring ve-entry-checkout's pattern.
// Both carry metadata.period so ve-stripe-webhook can record which one this
// was (subscription_period: 'monthly' | 'annual') instead of hardcoding it.
//
// 2026-09-06 (Sean field note + stress test find): this was WRONGLY wired to
// the shared LESARUSS Stripe account (STRIPE_SECRET_KEY_LESARUSS) and a price
// ID that only ever existed on that account, belonging to GeekFon's "GeekFon
// Passport" product -- not Vegans Explore's own. VE has its own dedicated
// Stripe account (business_profile name "Vegans Explore", contact@vegansexplore.com,
// acct_1Q8MzdP0w5C9oZhv) reached via the undecorated STRIPE_SECRET_KEY secret --
// ve-checkout already used it correctly, this function did not. Confirmed zero
// real Passport subscribers existed under the old wiring, so no migration was
// needed. Sean created the real "Vegans Explore Passport" product + $11/month
// price directly in VE's own Stripe dashboard on 2026-09-06; price ID below
// verified live against STRIPE_SECRET_KEY before being wired in here.
//
// Auth pattern copied exactly from ve-points-checkout: verifies the custom
// HMAC-signed token minted by ve-auth's signJWT(). verify_jwt is deliberately
// OFF at the platform level (matches ve-points-checkout) since Supabase's own
// JWT check would reject this custom token before the function body runs.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's OWN dedicated Stripe account -- never STRIPE_SECRET_KEY_LESARUSS here.

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const PASSPORT_PRICE_ID = 'price_1UCpOAP0w5C9oZhvbHnGeSIA'; // Vegans Explore Passport, $11/month, VE's own Stripe account
const ANNUAL_AMOUNT_CENTS = 11100; // $111/year

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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'not_authenticated' }, 401);
    const auth = await verifyToken(token);
    if (!auth) return json({ error: 'invalid_token' }, 401);

    const { data: member } = await supabase.from('members').select('id, email, membership_status, stripe_subscription_id, stripe_customer_id, membership_tier').eq('id', auth.sub).maybeSingle();
    if (!member || member.membership_status !== 'active') {
      return json({ error: 'member_not_found' }, 404);
    }

    const body = await req.json().catch(() => ({}));
    const period: 'monthly' | 'annual' = body.period === 'annual' ? 'annual' : 'monthly';
    const successUrl = body.success_url ?? 'https://vegansexplore.com/passport?subscribe=success';
    const cancelUrl = body.cancel_url ?? 'https://vegansexplore.com/passport?subscribe=cancelled';

    // Already an active Passport subscriber -> send to the Billing Portal instead
    // of starting a second subscription.
    if (member.stripe_subscription_id && member.membership_tier === 'passport' && member.stripe_customer_id) {
      const portalParams = new URLSearchParams({ customer: member.stripe_customer_id, return_url: successUrl });
      const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: portalParams.toString(),
      });
      const portalSession = await portalRes.json();
      if (portalRes.ok) return json({ url: portalSession.url, kind: 'portal' });
      // fall through to a fresh checkout if portal lookup failed for any reason
    }

    const params = new URLSearchParams({
      'mode': 'subscription',
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'customer_email': member.email,
      'billing_address_collection': 'auto',
      'metadata[type]': 'passport_subscription',
      'metadata[member_id]': member.id,
      'metadata[period]': period,
    });

    if (period === 'annual') {
      params.set('line_items[0][price_data][currency]', 'usd');
      params.set('line_items[0][price_data][product_data][name]', 'Vegans Explore Passport (Annual)');
      params.set('line_items[0][price_data][unit_amount]', String(ANNUAL_AMOUNT_CENTS));
      params.set('line_items[0][price_data][recurring][interval]', 'year');
      params.set('line_items[0][quantity]', '1');
    } else {
      params.set('line_items[0][price]', PASSPORT_PRICE_ID);
      params.set('line_items[0][quantity]', '1');
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe error:', session);
      return json({ error: session.error?.message ?? 'stripe_error' }, 400);
    }

    return json({ url: session.url, id: session.id, kind: 'checkout' });
  } catch (err) {
    console.error('ve-passport-checkout error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
