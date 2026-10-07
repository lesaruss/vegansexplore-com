import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ve-guide-unlock: access to a Vegans Explore Guide.
//
// Two access rules, per ve_guides.access_rule:
//   points      (Vegan Restaurant Survival Guide): a member unlocks it by spending
//               points (spend_points_for_guide), which writes ve_guide_purchases.
//   membership  (The Vegan Dairy Guide, Sean 2026-10-07): the Guide comes with the
//               $11 Founding Membership. Any member whose membership_status is
//               'active' (Founding Member, Passport, or a membership on us) has it,
//               and so does anyone with a ve_guide_purchases row.
//
// Actions (POST ?action=):
//   status  {slug, token?}  -> {loggedIn, unlocked, balance, cost, access_rule, membership_status}
//   unlock  {slug, token}   -> spend points (points guides only)
//   open    {slug, token}   -> status fields, plus {html} with the Guide's members-only
//                              screens (ve_guides.content_html) when unlocked. This is
//                              the only way the members-only content leaves the server:
//                              it is not in the public page file.
//
// verify_jwt stays OFF: the site sends the anon key as apikey and the VE app token
// (minted by ve-auth signJWT) in body.token; verifyToken() checks the HMAC itself.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = new URL(req.url);
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
    async function access() {
      if (!auth) return { loggedIn: false, unlocked: false, balance: 0, membership_status: null as string | null };
      const [{ data: purchase }, { data: member }] = await Promise.all([
        supabase.from('ve_guide_purchases').select('id').eq('member_id', auth.sub).eq('guide_id', guide!.id).maybeSingle(),
        supabase.from('members').select('lesars_balance, membership_status').eq('id', auth.sub).maybeSingle(),
      ]);
      const status = member?.membership_status ?? null;
      const viaMembership = guide!.access_rule === 'membership' && status === 'active';
      return { loggedIn: !!member, unlocked: !!member && (!!purchase || viaMembership), balance: member?.lesars_balance ?? 0, membership_status: status };
    }

    if (action === 'status' || action === 'open') {
      const a = await access();
      const out: Record<string, unknown> = { ...a, cost: guide.cost_lesars, access_rule: guide.access_rule };
      if (action === 'open' && a.unlocked) {
        const { data: full } = await supabase.from('ve_guides').select('content_html').eq('id', guide.id).maybeSingle();
        out.html = full?.content_html ?? '';
      }
      return json(out);
    }

    if (action === 'unlock') {
      if (!auth) return json({ error: 'not_authenticated' }, 401);
      if (guide.access_rule === 'membership') return json({ error: 'membership_guide' }, 400);
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
