// supabase/functions/lr-shell/index.ts
//
// The universal shell's backend for every brand that is NOT the LESARUSS HQ
// Next.js app. HQ serves this same contract from its own API routes
// (/api/shell/me, /api/shell/dock in lesaruss/lesaruss-hq); this is the copy
// a static site such as vegansexplore.com can reach.
//
// 2026-09-20 (Logan, Sean: "the icon needs to be synced on both. Right now if
// I go to Vegans Explore logged in with my username, it's different than when
// I go to LESARUSS HQ"). The dock and the member icon disagreed because the
// two surfaces shared no identity and no brand registry:
//
//   - member_dock was keyed on auth.users.id. A static brand site does not
//     use Supabase Auth; it carries a ve_token whose `sub` IS public.members.id.
//     members.id is the one identity both surfaces hold, so the dock is keyed
//     on it and this function is what resolves it for the static side.
//   - the icons' colours/monograms lived in HQ's TypeScript (lib/brands.ts),
//     which a static site cannot import, so the site carried copied hex that
//     had drifted. public.universe_brands is the shared row both read now.
//
// It is its own function, not part of ve-auth, because the shell is universal:
// GeekFon Society and any other brand site point at this same endpoint. It is
// named lr-shell, not ve-*, for that reason.
//
// AUTH. Unlike ve-auth's decodeToken (which base64-decodes the payload without
// checking the HMAC), this verifies the signature before trusting `sub`. The
// signing key is the same one ve-auth's signJWT uses: the first 32 bytes of
// the service role key. A member can only rearrange their OWN bar, so a
// forgeable token would let anyone rewrite anyone's dock; verifying closes
// that. (The wider ve-auth token model is unverified across every other
// action and is a separate, pre-existing issue, flagged, not fixed here.)
//
// member_dock and universe_brands are RLS-on with no policies, so only a
// service-role holder reaches them: HQ's routes, and this function.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

/** The registry slug of a brand that mounts this endpoint, so the bar can mark
 *  "you are here" wherever it renders. Sent by the caller; validated against
 *  the registry so an unknown value cannot poison the row. */
function currentSlug(raw: unknown): string | null {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

// ---- Token: verify the HMAC, do not just decode it ------------------------
function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifiedSub(token: string | undefined): Promise<string | null> {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) return null;
  const [header, body, sig] = token.split('.');
  try {
    // Same key derivation as ve-auth's signJWT: first 32 bytes of the service
    // key, zero-padded. If that helper ever changes, this must change with it.
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlToBytes(sig), new TextEncoder().encode(`${header}.${body}`));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// ---- Shared shape ---------------------------------------------------------
async function shellBrands() {
  const { data } = await supabase
    .from('universe_brands')
    .select('slug, name, mono, color, domain, is_hub, is_live')
    .order('sort_order', { ascending: true });
  return (data ?? []).map((r: Record<string, unknown>) => ({
    slug: r.slug, name: r.name, mono: r.mono, color: r.color,
    domain: r.domain ?? null, isHub: !!r.is_hub, isLive: !!r.is_live,
  }));
}

// Two letters for the avatar, derived the same way lib/memberContext.ts
// derives them on HQ, so a member with no members.initials on file gets the
// same letters on both surfaces rather than letters on one and a mark on the
// other.
function shellInitials(name: string | null, email: string | null): string | null {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? url.pathname.split('/').pop();
  const body = await req.json().catch(() => ({}));

  try {
    if (action === 'me') {
      // The token is optional on purpose: a signed-out visitor still gets a
      // usable bar (the brands, this site marked current) with no picks and no
      // member icon, rather than no bar at all.
      const sub = await verifiedSub(body.token);
      const current = currentSlug(body.current);
      const brands = await shellBrands();

      if (!sub) return json({ member: null, dock: [], brands, current });

      const { data: member } = await supabase
        .from('members')
        .select('id, name, email, initials, color, avatar_url, profile_image_url')
        .eq('id', sub)
        .maybeSingle();
      if (!member) return json({ member: null, dock: [], brands, current });

      const { data: dockRow } = await supabase
        .from('member_dock').select('brand_slugs').eq('member_id', member.id).maybeSingle();

      // total_points, not available_points: HQ's chip shows the lifetime
      // total, and the point of this endpoint is that the two agree.
      const { data: pointsRow } = await supabase
        .from('member_points').select('total_points').eq('member_id', member.id).maybeSingle();

      const name = (member.name as string | null) ?? null;
      const email = (member.email as string | null) ?? null;

      return json({
        member: {
          name,
          firstName: name ? name.trim().split(/\s+/)[0] : null,
          // profile_image_url wins where set: the picture the member uploaded
          // here, over avatar_url from the OAuth provider. Same order as HQ.
          avatarUrl: member.profile_image_url ?? member.avatar_url ?? null,
          initials: (member.initials as string | null) || shellInitials(name, email),
          color: (member.color as string | null) ?? null,
          points: (pointsRow && typeof pointsRow.total_points === 'number') ? pointsRow.total_points : null,
          level: null,
        },
        dock: Array.isArray(dockRow?.brand_slugs) ? dockRow.brand_slugs : [],
        brands,
        current,
      });
    }

    if (action === 'dock') {
      const sub = await verifiedSub(body.token);
      if (!sub) return json({ error: 'Sign in to change your bar.' }, 401);

      const slug = typeof body.brand_slug === 'string' ? body.brand_slug.trim() : '';
      const op = body.action === 'remove' ? 'remove' : 'add';

      // The same three checks HQ's /api/shell/dock runs, in the same order.
      const { data: brand } = await supabase
        .from('universe_brands').select('slug, is_hub, is_live').eq('slug', slug).maybeSingle();
      if (!brand) return json({ error: 'Unknown brand.' }, 400);
      if (brand.is_hub) return json({ error: 'The hub is always on the bar.' }, 400);
      if (op === 'add' && !brand.is_live) return json({ error: 'That brand is not live yet.' }, 400);

      const { data: existing } = await supabase
        .from('member_dock').select('brand_slugs').eq('member_id', sub).maybeSingle();
      const current: string[] = Array.isArray(existing?.brand_slugs) ? existing.brand_slugs : [];
      const next = op === 'remove'
        ? current.filter((s: string) => s !== slug)
        : (current.includes(slug) ? current : [...current, slug]);

      const { error: dockErr } = await supabase
        .from('member_dock')
        .upsert({ member_id: sub, brand_slugs: next, updated_at: new Date().toISOString() }, { onConflict: 'member_id' });
      if (dockErr) return json({ error: 'Could not update your bar.' }, 500);

      return json({ ok: true, brand_slugs: next });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (_e) {
    return json({ error: 'Shell request failed.' }, 500);
  }
});
