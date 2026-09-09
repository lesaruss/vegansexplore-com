import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GMAIL_CLIENT_ID') ?? '554053879127-o0vp4rrjp5qgeoq4fbje3qtbrvlupt59.apps.googleusercontent.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const VALID_COMMUNITIES = ['atlanta','central-florida','dmv','london','los-angeles','new-york','philadelphia','south-florida'];

// Tenant the Vegans Explore front door writes to (2026-09-09, Sean, Fieldy
// field note behind dashboard items 5-7). Both signup paths below used to
// hardcode 00000000-0000-4000-a000-000000000001, which is the LESARUSS
// tenant, so every real Vegans Explore registrant was stamped as a LESARUSS
// identity in the shared public.members table. That is the write side of
// error_registry MEMBERS-TABLE-TENANT-HARDCODED-VE: the read side was fixed
// inside notify_new_member() on 2026-08-19, but the writer kept producing
// mislabeled rows, so the member count and the leaderboard on the dashboard
// could never be scoped to this brand.
const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
function sanitizeCommunity(v: unknown): string | null {
  return typeof v === 'string' && VALID_COMMUNITIES.includes(v) ? v : null;
}

// Podcast "select-to-follow" model (2026-09-07, Sean direction). These are the
// four real shows live in ve_pulse_content.podcast_show today (confirmed via
// direct query: 169+59+31+19 = 278 published episodes, matching the table's
// total published-row count exactly -- every published row is a podcast
// episode). Hardcoded the same way VALID_COMMUNITIES is, since this is a
// small fixed set, not a table that needs its own CRUD.
const VALID_PODCAST_SHOWS = ['Vegans Explore Podcast', 'SoFlo Vegans Podcast', 'Vegans Who Lift Podcast', 'Pre-Vegans Podcast'];
function sanitizePodcastShow(v: unknown): string | null {
  return typeof v === 'string' && VALID_PODCAST_SHOWS.includes(v) ? v : null;
}

const VALID_MODULES = ['tour','opportunities','showcase','directory','pulse','guides','podcasts','communities'];
function sanitizeModule(v: unknown): string | null {
  return typeof v === 'string' && VALID_MODULES.includes(v) ? v : null;
}

const VALID_LAYOUT_MODULES = VALID_MODULES.concat(['sa-members', 'sa-events', 'sa-leads', 'cm-initiatives', 'cm-handbook', 'guide-maya', 'guide-theo', 'guide-nori', 'guide-dani', 'guide-river']);
const VALID_LAYOUT_SECTIONS = ['superadmin', 'media', 'guides', 'tools'];
function sanitizeLayoutModule(v: unknown): string | null {
  return typeof v === 'string' && VALID_LAYOUT_MODULES.includes(v) ? v : null;
}
function sanitizeLayoutSection(v: unknown): string | null {
  return typeof v === 'string' && VALID_LAYOUT_SECTIONS.includes(v) ? v : null;
}

async function isValidInitiativeSlug(slug: unknown): Promise<string | null> {
  if (typeof slug !== 'string' || !slug) return null;
  const { data } = await supabase.from('campaigns').select('id').eq('initiative_slug', slug).eq('status', 'active').maybeSingle();
  return data ? slug : null;
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
  const sigStr = base64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${header}.${body}.${sigStr}`;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [, saltHex, hashHex] = stored.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const checkHex = Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
    return checkHex === hashHex;
  } catch { return false; }
}

async function verifyGoogleToken(idToken: string): Promise<{ sub: string; email: string; name: string; picture?: string } | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.aud !== GOOGLE_CLIENT_ID && !data.aud?.includes(GOOGLE_CLIENT_ID)) return null;
    return { sub: data.sub, email: data.email, name: data.name, picture: data.picture };
  } catch { return null; }
}

async function ensureMemberPointsRow(memberId: string): Promise<void> {
  try {
    await supabase.rpc('apply_member_points_delta', { p_member_id: memberId, p_delta: 0 });
  } catch (e) {
    console.error('ensureMemberPointsRow failed:', e);
  }
}

async function awardReferralBounty(referrerId: string, newMemberId: string): Promise<void> {
  try {
    await supabase.rpc('award_points_bounty', {
      p_member_id: referrerId,
      p_brand: 'vegans-explore',
      p_action_type: 'referral_signup',
      p_ref_id: `referral_signup:${newMemberId}`,
      p_reason: 'referral',
    });
  } catch (e) {
    console.error('awardReferralBounty failed:', e);
  }
}

async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
        to: email,
        subject: 'Your Passport is ready',
        html: `
<div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#fff;padding:40px 32px;">
  <div style="background:#1A1A1A;padding:20px 24px;border-radius:8px;margin-bottom:32px;">
    <span style="color:#22C55E;font-size:18px;font-weight:700;letter-spacing:0.05em;">VEGANS EXPLORE</span>
  </div>
  <h1 style="font-size:24px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Welcome, ${name}.</h1>
  <p style="color:#555;margin:0 0 24px;line-height:1.6;">Your Passport is active. You can now vote for your favorite businesses, save listings to your list, comment on the Daily Pulse, and join Communities.</p>
  <a href="https://vegansexplore.com/directory" style="display:inline-block;background:#22C55E;color:#fff;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">Explore the Directory</a>
  <p style="margin:32px 0 0;font-size:12px;color:#999;">VEGANS EXPLORE - The community for everyone exploring vegan life.</p>
</div>`,
      }),
    });
  } catch (e) {
    console.error('Welcome email failed:', e);
  }
}

function generateResetToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const link = `https://vegansexplore.com/reset-password?token=${token}`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'VEGANS EXPLORE <hello@vegansexplore.com>',
        to: email,
        subject: 'Reset your VEGANS EXPLORE password',
        html: `
<div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#fff;padding:40px 32px;">
  <div style="background:#1A1A1A;padding:20px 24px;border-radius:8px;margin-bottom:32px;">
    <span style="color:#22C55E;font-size:18px;font-weight:700;letter-spacing:0.05em;">VEGANS EXPLORE</span>
  </div>
  <h1 style="font-size:24px;font-weight:700;color:#1A1A1A;margin:0 0 8px;">Reset your password</h1>
  <p style="color:#555;margin:0 0 24px;line-height:1.6;">Hi ${name || 'there'}, we received a request to reset the password on your VEGANS EXPLORE Passport. This link expires in 1 hour and can only be used once. If you did not request this, you can safely ignore this email.</p>
  <a href="${link}" style="display:inline-block;background:#22C55E;color:#fff;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">Reset Password</a>
  <p style="margin:24px 0 0;font-size:12px;color:#999;word-break:break-all;">Or paste this link into your browser:<br>${link}</p>
  <p style="margin:32px 0 0;font-size:12px;color:#999;">VEGANS EXPLORE - The community for everyone exploring vegan life.</p>
</div>`,
      }),
    });
  } catch (e) {
    console.error('Password reset email failed:', e);
  }
}

async function findMemberByEmail(email: string): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('members')
    .select('id')
    .eq('email', email)
    .limit(1);
  return data?.[0] ?? null;
}

async function getMemberCommunities(memberId: string): Promise<string[]> {
  const { data } = await supabase
    .from('member_communities')
    .select('community_slug')
    .eq('member_id', memberId)
    .order('joined_at', { ascending: true });
  return (data ?? []).map((r: { community_slug: string }) => r.community_slug);
}

async function getMemberCampaigns(memberId: string): Promise<string[]> {
  const { data } = await supabase
    .from('member_campaigns')
    .select('initiative_slug')
    .eq('member_id', memberId)
    .order('joined_at', { ascending: true });
  return (data ?? []).map((r: { initiative_slug: string }) => r.initiative_slug);
}

async function getMemberPodcastFollows(memberId: string): Promise<string[]> {
  const { data } = await supabase
    .from('member_podcast_follows')
    .select('podcast_show')
    .eq('member_id', memberId)
    .order('followed_at', { ascending: true });
  return (data ?? []).map((r: { podcast_show: string }) => r.podcast_show);
}

async function getMemberHiddenModules(memberId: string): Promise<string[]> {
  const { data } = await supabase
    .from('member_hidden_modules')
    .select('module_key')
    .eq('member_id', memberId);
  return (data ?? []).map((r: { module_key: string }) => r.module_key);
}

async function isSuperadmin(memberId: string): Promise<boolean> {
  const { data } = await supabase.from('members').select('is_superadmin').eq('id', memberId).maybeSingle();
  return !!data?.is_superadmin;
}

async function getMemberLayout(memberId: string): Promise<{ module_key: string; section_key: string; sort_order: number }[]> {
  const { data } = await supabase
    .from('member_dashboard_layout')
    .select('module_key, section_key, sort_order')
    .eq('member_id', memberId)
    .order('section_key', { ascending: true })
    .order('sort_order', { ascending: true });
  return data ?? [];
}

function decodeToken(token: string): { sub: string; exp: number } | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch { return null; }
}

// ---- Guide front door additions (2026-09-06, Logan, storyboard
// vegans-explore-onboarding-playbook). Two new actions:
//   city_status   -- does this city already have a launched chapter?
//   join_city     -- join/found a city, launched or not
//   guide_chat_send -- points-gated real Guide conversation (character-respond)
// -------------------------------------------------------------------------

function slugifyCity(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s || null;
}

// Guards against gibberish being accepted as a new city (Sean's stress-test
// find, 2026-09-06: typing keyboard-mash text produced "let's start a
// chapter of <gibberish>"). Not real geocoding -- there's no places API wired
// up here -- just a cheap heuristic that rejects the obvious mash-the-
// keyboard case while staying permissive for real place names worldwide:
// letters/spaces/apostrophe/period/hyphen only, must contain a vowel, no
// character repeated 3+ times in a row, no run of 6+ consonants.
function isPlausibleCityName(raw: string): boolean {
  const s = raw.trim();
  if (s.length < 2 || s.length > 60) return false;
  if (!/^[a-zA-ZÀ-ɏ\s'.-]+$/.test(s)) return false;
  if (!/[aeiouyAEIOUYÀ-ɏ]/.test(s)) return false;
  if (/(.)\1{2,}/i.test(s)) return false;
  if (/[^aeiouyAEIOUY\s'.-]{6,}/.test(s)) return false;
  return true;
}

const COMMUNITY_DISPLAY: Record<string, string> = {
  'atlanta': 'Atlanta', 'central-florida': 'Central Florida', 'dmv': 'DMV',
  'london': 'London', 'los-angeles': 'Los Angeles', 'new-york': 'New York',
  'philadelphia': 'Philadelphia', 'south-florida': 'South Florida',
};

// Metro-area aliasing (2026-09-07, Sean's field note): typing a real city
// inside an already-launched chapter's metro area -- e.g. "Clermont" near
// Orlando -- must resolve to that chapter, not read as a brand-new city.
// v1, hand-built list per launched chapter; extend as gaps surface.
const CITY_ALIASES: Record<string, string> = {
  // south-florida (Miami-Dade / Broward / Palm Beach)
  'miami': 'south-florida', 'fort-lauderdale': 'south-florida', 'ft-lauderdale': 'south-florida',
  'pompano-beach': 'south-florida', 'boca-raton': 'south-florida',
  'west-palm-beach': 'south-florida', 'palm-beach': 'south-florida', 'hialeah': 'south-florida',
  'coral-springs': 'south-florida', 'davie': 'south-florida', 'plantation': 'south-florida',
  'sunrise': 'south-florida', 'miramar': 'south-florida', 'pembroke-pines': 'south-florida',
  'homestead': 'south-florida', 'aventura': 'south-florida', 'doral': 'south-florida',
  'coral-gables': 'south-florida', 'delray-beach': 'south-florida', 'boynton-beach': 'south-florida',
  // central-florida (Orlando metro)
  'orlando': 'central-florida', 'kissimmee': 'central-florida', 'altamonte-springs': 'central-florida',
  'winter-park': 'central-florida', 'clermont': 'central-florida', 'claremont': 'central-florida',
  'apopka': 'central-florida', 'sanford': 'central-florida', 'deltona': 'central-florida',
  'daytona-beach': 'central-florida', 'lakeland': 'central-florida', 'the-villages': 'central-florida',
  'winter-garden': 'central-florida', 'oviedo': 'central-florida', 'casselberry': 'central-florida',
  // atlanta
  'decatur': 'atlanta', 'marietta': 'atlanta', 'sandy-springs': 'atlanta', 'alpharetta': 'atlanta',
  'roswell': 'atlanta', 'smyrna': 'atlanta', 'stone-mountain': 'atlanta', 'college-park': 'atlanta',
  // new-york (five boroughs + close-in NJ)
  'nyc': 'new-york', 'new-york-city': 'new-york',
  'brooklyn': 'new-york', 'queens': 'new-york', 'the-bronx': 'new-york', 'bronx': 'new-york',
  'manhattan': 'new-york', 'staten-island': 'new-york', 'jersey-city': 'new-york', 'hoboken': 'new-york',
  // los-angeles
  'la': 'los-angeles',
  'santa-monica': 'los-angeles', 'pasadena': 'los-angeles', 'long-beach': 'los-angeles',
  'burbank': 'los-angeles', 'glendale': 'los-angeles', 'culver-city': 'los-angeles',
  'west-hollywood': 'los-angeles', 'venice': 'los-angeles', 'inglewood': 'los-angeles',
  // london
  'camden': 'london', 'hackney': 'london', 'brixton': 'london', 'croydon': 'london',
  'greenwich': 'london', 'islington': 'london', 'shoreditch': 'london',
  // philadelphia
  'philly': 'philadelphia', 'king-of-prussia': 'philadelphia', 'norristown': 'philadelphia',
  'upper-darby': 'philadelphia', 'camden-nj': 'philadelphia',
  // dmv (DC / Maryland / Northern Virginia)
  'dc': 'dmv', 'd-c': 'dmv',
  'washington': 'dmv', 'washington-dc': 'dmv', 'arlington': 'dmv', 'alexandria': 'dmv',
  'bethesda': 'dmv', 'silver-spring': 'dmv', 'rockville': 'dmv', 'fairfax': 'dmv', 'tysons': 'dmv',
};

// City+state disambiguation (2026-09-07, Sean field note): a bare city name
// like "Hollywood" is genuinely ambiguous -- Hollywood, FL (South Florida
// metro) and Hollywood, CA (Los Angeles metro, distinct from "West
// Hollywood") are both real places inside two different launched chapters.
// Keyed by "city-slug|state-slug". Extend as more ambiguous names surface.
const CITY_STATE_ALIASES: Record<string, string> = {
  'hollywood|fl': 'south-florida',
  'hollywood|florida': 'south-florida',
  'hollywood|ca': 'los-angeles',
  'hollywood|california': 'los-angeles',
};

// City names known to collide across launched-chapter metro areas. When one
// of these comes in with no state (or a state we don't have an alias for),
// we must NOT guess -- fall through to "new/unlaunched" instead.
const AMBIGUOUS_CITIES = new Set(['hollywood']);

// State and country qualifiers people type into a single city field
// ("New York, NY", "Hollywood, FL", "London, UK"). slugifyCity folds the
// whole string into one slug, so the qualifier has to be split back off
// before the chapter lookup can match. Trailing token only; a bare 'la' or
// 'dc' as the WHOLE city is handled by CITY_ALIASES above instead.
const STATE_QUALIFIERS = new Set([
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me',
  'md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa',
  'ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc',
  'usa','us','uk','gb','england','scotland','wales','united-kingdom','united-states','d-c',
  'florida','california','georgia','pennsylvania','maryland','virginia','texas','new-york',
]);

function splitTrailingQualifier(slug: string): { base: string; qualifier: string | null } {
  const parts = slug.split('-');
  for (let take = 2; take >= 1; take--) {
    if (parts.length <= take) continue;
    const tail = parts.slice(parts.length - take).join('-');
    if (STATE_QUALIFIERS.has(tail)) {
      return { base: parts.slice(0, parts.length - take).join('-'), qualifier: tail };
    }
  }
  return { base: slug, qualifier: null };
}

// "New York City" -> "new-york"; leaves "kansas-city" alone in the sense
// that "kansas" simply has no launched chapter, so it still reads as new.
function stripCitySuffix(slug: string): string | null {
  return slug.length > 5 && slug.endsWith('-city') ? slug.slice(0, -5) : null;
}

// Resolves a raw city slug (optionally qualified by a state slug) to a
// launched chapter's community_slug, checking the chapter names themselves
// first, then state-qualified aliases, then the plain metro-area alias list.
// Returns null when the city genuinely has no launched chapter yet, or when
// it's a known-ambiguous name with no state (or an unrecognized state) to
// disambiguate it -- safe default is "unlaunched", never a guess.
function resolveExactCommunity(citySlug: string, stateSlug?: string | null): string | null {
  if (VALID_COMMUNITIES.includes(citySlug)) return citySlug;

  if (stateSlug) {
    const stateMatch = CITY_STATE_ALIASES[`${citySlug}|${stateSlug}`];
    if (stateMatch) return stateMatch;
  }

  if (AMBIGUOUS_CITIES.has(citySlug)) return null;

  return CITY_ALIASES[citySlug] ?? null;
}

// Normalizing wrapper (2026-09-09, Sean, Fieldy field note: registering for
// New York City came back as "no chapter"). Typing a launched chapter's own
// name in its natural form was being read as a brand new city, because
// slugifyCity turns "New York City" into new-york-city, which matches
// neither VALID_COMMUNITIES ('new-york') nor any alias. Confirmed live:
// ve_chapter_requests carries a community_slug 'new-york-city' row created
// 2026-09-09 08:36 UTC from Sean's own test. Fixed as a class rather than as
// one more alias entry: strip a trailing state or country qualifier, strip a
// trailing "city", and re-run the same resolver on the base name. A stripped
// qualifier is fed back in as the state, so genuinely ambiguous names still
// disambiguate ("Hollywood, FL" resolves to South Florida) instead of being
// guessed, and a bare ambiguous name still falls through to unlaunched.
function resolveLaunchedCommunity(citySlug: string, stateSlug?: string | null): string | null {
  const direct = resolveExactCommunity(citySlug, stateSlug);
  if (direct) return direct;

  const split = splitTrailingQualifier(citySlug);
  if (split.qualifier) {
    const effectiveState = stateSlug || split.qualifier;
    const viaQualifier = resolveExactCommunity(split.base, effectiveState);
    if (viaQualifier) return viaQualifier;
    const baseWithoutCity = stripCitySuffix(split.base);
    if (baseWithoutCity) {
      const viaBoth = resolveExactCommunity(baseWithoutCity, effectiveState);
      if (viaBoth) return viaBoth;
    }
  }

  const withoutCity = stripCitySuffix(citySlug);
  if (withoutCity) return resolveExactCommunity(withoutCity, stateSlug);

  return null;
}

async function currentMonthPeriod(): Promise<string> {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? url.pathname.split('/').pop();

  try {
    const body = await req.json().catch(() => ({}));

    if (action === 'signup') {
      const { email, password, name, referral_code } = body;
      const home_community = sanitizeCommunity(body.home_community);
      if (!email || !password || !name) return new Response(JSON.stringify({ error: 'email, password, and name required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (password.length < 8) return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const existing = await findMemberByEmail(email.toLowerCase());
      if (existing) return new Response(JSON.stringify({ error: 'An account with that email already exists.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const password_hash = await hashPassword(password);
      const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      const colors = ['#22C55E','#16A34A','#4ADE80','#86EFAC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const ref_code = `VE-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

      let referred_by: string | null = null;
      if (referral_code) {
        const { data: referrer } = await supabase.from('members').select('id').eq('referral_code', referral_code).maybeSingle();
        if (referrer) referred_by = referrer.id;
      }

      const { data: member, error: insertErr } = await supabase.from('members').insert({
        email: email.toLowerCase(), password_hash, name,
        initials, color, referral_code: ref_code, referred_by,
        membership_tier: 'free', membership_status: 'active', ve_role: 'member', ve_tier: 'free',
        auth_methods: ['email'], home_community,
        tenant_id: VE_TENANT_ID,
      }).select(MEMBER_FIELDS).single();

      if (insertErr) throw new Error(`signup insert failed: ${insertErr.message}`);

      if (home_community) {
        await supabase.from('member_communities').insert({ member_id: member.id, community_slug: home_community }).select().maybeSingle();
      }

      await ensureMemberPointsRow(member.id);
      if (referred_by) await awardReferralBounty(referred_by, member.id);
      await sendWelcomeEmail(email.toLowerCase(), name);
      const token = await signJWT({ sub: member.id, email: member.email, tier: 'free', brand: 'vegans-explore' });
      return new Response(JSON.stringify({ token, member: { ...member, communities: home_community ? [home_community] : [], hidden_modules: [] } }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'google') {
      const { id_token } = body;
      const home_community = sanitizeCommunity(body.home_community);
      if (!id_token) return new Response(JSON.stringify({ error: 'id_token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const gUser = await verifyGoogleToken(id_token);
      if (!gUser) return new Response(JSON.stringify({ error: 'Invalid Google token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: existing } = await supabase.from('members').select(MEMBER_FIELDS + ', membership_status').eq('google_id', gUser.sub).maybeSingle();

      if (existing) {
        if (existing.membership_status !== 'active') return new Response(JSON.stringify({ error: 'Account suspended.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const token = await signJWT({ sub: existing.id, email: existing.email, tier: existing.membership_tier, brand: 'vegans-explore' });
        await supabase.from('members').update({ last_activity_at: new Date().toISOString() }).eq('id', existing.id);
        const communities = await getMemberCommunities(existing.id);
        const hidden_modules = await getMemberHiddenModules(existing.id);
        return new Response(JSON.stringify({ token, member: { ...existing, communities, hidden_modules } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const byEmail = await findMemberByEmail(gUser.email.toLowerCase());
      if (byEmail) {
        await supabase.from('members').update({ google_id: gUser.sub, avatar_url: gUser.picture }).eq('id', byEmail.id);
        const { data: linked } = await supabase.from('members').select(MEMBER_FIELDS).eq('id', byEmail.id).single();
        if (!linked) throw new Error('Failed to load linked member after google_id update');
        await ensureMemberPointsRow(linked.id);
        const token = await signJWT({ sub: linked.id, email: linked.email, tier: linked.membership_tier, brand: 'vegans-explore' });
        const communities = await getMemberCommunities(linked.id);
        const hidden_modules = await getMemberHiddenModules(linked.id);
        return new Response(JSON.stringify({ token, member: { ...linked, communities, hidden_modules } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const initials = gUser.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      const ref_code = `VE-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      const { data: member, error: insertErr } = await supabase.from('members').insert({
        email: gUser.email.toLowerCase(), name: gUser.name, google_id: gUser.sub,
        avatar_url: gUser.picture, initials, color: '#22C55E', referral_code: ref_code,
        membership_tier: 'free', membership_status: 'active', ve_role: 'member', ve_tier: 'free',
        auth_methods: ['google'], home_community,
        tenant_id: VE_TENANT_ID,
      }).select(MEMBER_FIELDS + ', avatar_url').single();

      if (insertErr) throw new Error(`google insert failed: ${insertErr.message}`);
      if (home_community) {
        await supabase.from('member_communities').insert({ member_id: member.id, community_slug: home_community }).select().maybeSingle();
      }
      await ensureMemberPointsRow(member.id);
      await sendWelcomeEmail(gUser.email.toLowerCase(), gUser.name);
      const token = await signJWT({ sub: member.id, email: member.email, tier: 'free', brand: 'vegans-explore' });
      return new Response(JSON.stringify({ token, member: { ...member, communities: home_community ? [home_community] : [], hidden_modules: [] } }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'login') {
      const { email, password } = body;
      if (!email || !password) return new Response(JSON.stringify({ error: 'email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: member } = await supabase.from('members').select(MEMBER_FIELDS + ', membership_status, password_hash, avatar_url').eq('email', email.toLowerCase()).limit(1).single();
      if (!member) return new Response(JSON.stringify({ error: 'No account found with that email.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (member.membership_status !== 'active') return new Response(JSON.stringify({ error: 'Account is not active.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (!member.password_hash) return new Response(JSON.stringify({ error: 'This account uses Google or Apple sign-in. Please use that method.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const valid = await verifyPassword(password, member.password_hash);
      if (!valid) return new Response(JSON.stringify({ error: 'Incorrect password.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      await supabase.from('members').update({ last_activity_at: new Date().toISOString() }).eq('id', member.id);
      const token = await signJWT({ sub: member.id, email: member.email, tier: member.membership_tier, brand: 'vegans-explore' });
      const { password_hash: _, ...safeMember } = member;
      const communities = await getMemberCommunities(member.id);
      const hidden_modules = await getMemberHiddenModules(member.id);
      return new Response(JSON.stringify({ token, member: { ...safeMember, communities, hidden_modules } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'forgot_password') {
      const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
      const generic = { ok: true, message: 'If an account exists for that email, a reset link has been sent.' };
      if (!email) return new Response(JSON.stringify({ error: 'email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: member } = await supabase.from('members').select('id, name, email, password_hash').eq('email', email).limit(1).maybeSingle();
      if (member && member.password_hash) {
        const token = generateResetToken();
        const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const { error: insertErr } = await supabase.from('password_reset_tokens').insert({ member_id: member.id, token, expires_at });
        if (insertErr) {
          console.error('forgot_password token insert failed:', insertErr.message);
        } else {
          await sendPasswordResetEmail(member.email, member.name, token);
        }
      }
      return new Response(JSON.stringify(generic), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reset_password') {
      const token = typeof body.token === 'string' ? body.token.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!token) return new Response(JSON.stringify({ error: 'Reset link is invalid or missing.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (password.length < 8) return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: reset } = await supabase.from('password_reset_tokens').select('id, member_id, expires_at, used_at').eq('token', token).maybeSingle();
      if (!reset) return new Response(JSON.stringify({ error: 'This reset link is invalid.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (reset.used_at) return new Response(JSON.stringify({ error: 'This reset link has already been used.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (new Date(reset.expires_at).getTime() < Date.now()) return new Response(JSON.stringify({ error: 'This reset link has expired. Please request a new one.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const password_hash = await hashPassword(password);
      const { error: updateErr } = await supabase.from('members').update({ password_hash }).eq('id', reset.member_id);
      if (updateErr) throw new Error(`reset_password member update failed: ${updateErr.message}`);

      await supabase.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('id', reset.id);
      await supabase.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('member_id', reset.member_id).is('used_at', null);

      return new Response(JSON.stringify({ ok: true, message: 'Password updated. You can now sign in.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'complete_onboarding') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const {
        guide_slug, display_name, interests, journey_stage,
        city, city_country, city_state, brings_reasons, biggest_focus,
        has_vegan_business, language,
      } = body;

      if (!guide_slug) return new Response(JSON.stringify({ error: 'guide_slug required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const assessment_answers = {
        language: language ?? null,
        journey_stage: journey_stage ?? null,
        brings_reasons: Array.isArray(brings_reasons) ? brings_reasons : [],
        biggest_focus: Array.isArray(biggest_focus) ? biggest_focus : [],
        has_vegan_business: typeof has_vegan_business === 'boolean' ? has_vegan_business : null,
        interests: Array.isArray(interests) ? interests : [],
        city: city || null,
        city_country: city_country || null,
        city_state: city_state || null,
      };
      const location = [city, city_state, city_country].filter(Boolean).join(', ') || null;

      const updatePayload: Record<string, unknown> = {
        guide_slug,
        assessment_answers,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };
      if (location) updatePayload.location = location;
      if (typeof display_name === 'string' && display_name.trim().length >= 2) updatePayload.name = display_name.trim();

      const { data: updated, error: updateErr } = await supabase
        .from('members')
        .update(updatePayload)
        .eq('id', decoded.sub)
        .select(MEMBER_FIELDS + ', onboarding_completed, guide_slug')
        .maybeSingle();
      if (updateErr) throw new Error(`complete_onboarding update failed: ${updateErr.message}`);
      if (!updated) return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      let pointsResult: unknown = null;
      try {
        const { data } = await supabase.rpc('award_points_bounty', {
          p_member_id: decoded.sub,
          p_brand: 'vegans-explore',
          p_action_type: 'onboarding_completed',
          p_ref_id: `onboarding_completed:${decoded.sub}`,
          p_reason: 'profile_complete',
        });
        pointsResult = data;
      } catch (e) {
        console.error('onboarding points award failed:', e);
      }

      return new Response(JSON.stringify({ member: updated, points: pointsResult }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set_home_community') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const home_community = sanitizeCommunity(body.home_community);
      if (!home_community) return new Response(JSON.stringify({ error: 'Unrecognized community.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: updated, error: updateErr } = await supabase
        .from('members')
        .update({ home_community })
        .eq('id', decoded.sub)
        .select(MEMBER_FIELDS)
        .maybeSingle();
      if (updateErr) throw new Error(`set_home_community update failed: ${updateErr.message}`);
      if (!updated) return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      return new Response(JSON.stringify({ member: updated }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'join_community') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const community_slug = sanitizeCommunity(body.community_slug);
      if (!community_slug) return new Response(JSON.stringify({ error: 'Unrecognized community.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: insertErr } = await supabase
        .from('member_communities')
        .insert({ member_id: decoded.sub, community_slug });
      if (insertErr && insertErr.code !== '23505') throw new Error(`join_community insert failed: ${insertErr.message}`);

      const communities = await getMemberCommunities(decoded.sub);
      return new Response(JSON.stringify({ communities }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'leave_community') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const community_slug = sanitizeCommunity(body.community_slug);
      if (!community_slug) return new Response(JSON.stringify({ error: 'Unrecognized community.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: deleteErr } = await supabase
        .from('member_communities')
        .delete()
        .eq('member_id', decoded.sub)
        .eq('community_slug', community_slug);
      if (deleteErr) throw new Error(`leave_community delete failed: ${deleteErr.message}`);

      const communities = await getMemberCommunities(decoded.sub);
      return new Response(JSON.stringify({ communities }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'join_campaign') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const initiative_slug = await isValidInitiativeSlug(body.initiative_slug);
      if (!initiative_slug) return new Response(JSON.stringify({ error: 'Unrecognized campaign.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: insertErr } = await supabase
        .from('member_campaigns')
        .insert({ member_id: decoded.sub, initiative_slug });
      if (insertErr && insertErr.code !== '23505') throw new Error(`join_campaign insert failed: ${insertErr.message}`);

      const campaigns = await getMemberCampaigns(decoded.sub);
      return new Response(JSON.stringify({ campaigns }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'leave_campaign') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const initiative_slug = typeof body.initiative_slug === 'string' ? body.initiative_slug : null;
      if (!initiative_slug) return new Response(JSON.stringify({ error: 'Unrecognized campaign.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: deleteErr } = await supabase
        .from('member_campaigns')
        .delete()
        .eq('member_id', decoded.sub)
        .eq('initiative_slug', initiative_slug);
      if (deleteErr) throw new Error(`leave_campaign delete failed: ${deleteErr.message}`);

      const campaigns = await getMemberCampaigns(decoded.sub);
      return new Response(JSON.stringify({ campaigns }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'follow_podcast') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const podcast_show = sanitizePodcastShow(body.podcast_show);
      if (!podcast_show) return new Response(JSON.stringify({ error: 'Unrecognized podcast show.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: insertErr } = await supabase
        .from('member_podcast_follows')
        .insert({ member_id: decoded.sub, podcast_show });
      if (insertErr && insertErr.code !== '23505') throw new Error(`follow_podcast insert failed: ${insertErr.message}`);

      const podcast_follows = await getMemberPodcastFollows(decoded.sub);
      return new Response(JSON.stringify({ podcast_follows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'unfollow_podcast') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const podcast_show = sanitizePodcastShow(body.podcast_show);
      if (!podcast_show) return new Response(JSON.stringify({ error: 'Unrecognized podcast show.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: deleteErr } = await supabase
        .from('member_podcast_follows')
        .delete()
        .eq('member_id', decoded.sub)
        .eq('podcast_show', podcast_show);
      if (deleteErr) throw new Error(`unfollow_podcast delete failed: ${deleteErr.message}`);

      const podcast_follows = await getMemberPodcastFollows(decoded.sub);
      return new Response(JSON.stringify({ podcast_follows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_layout') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      if (!(await isSuperadmin(decoded.sub))) return new Response(JSON.stringify({ error: 'Superadmin only.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const layout = await getMemberLayout(decoded.sub);
      return new Response(JSON.stringify({ layout }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'save_layout') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      if (!(await isSuperadmin(decoded.sub))) return new Response(JSON.stringify({ error: 'Superadmin only.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const rawLayout = Array.isArray(body.layout) ? body.layout : null;
      if (!rawLayout) return new Response(JSON.stringify({ error: 'layout array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const rows: { member_id: string; module_key: string; section_key: string; sort_order: number }[] = [];
      for (const entry of rawLayout) {
        const module_key = sanitizeLayoutModule(entry?.module_key);
        const section_key = sanitizeLayoutSection(entry?.section_key);
        const sort_order = Number.isFinite(entry?.sort_order) ? Number(entry.sort_order) : 0;
        if (!module_key || !section_key) continue;
        rows.push({ member_id: decoded.sub, module_key, section_key, sort_order });
      }

      const { error: deleteErr } = await supabase.from('member_dashboard_layout').delete().eq('member_id', decoded.sub);
      if (deleteErr) throw new Error(`save_layout delete failed: ${deleteErr.message}`);

      if (rows.length) {
        const { error: insertErr } = await supabase.from('member_dashboard_layout').insert(rows);
        if (insertErr) throw new Error(`save_layout insert failed: ${insertErr.message}`);
      }

      const layout = await getMemberLayout(decoded.sub);
      return new Response(JSON.stringify({ layout }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'hide_module') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const module_key = sanitizeModule(body.module_key);
      if (!module_key) return new Response(JSON.stringify({ error: 'Unrecognized tool.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: insertErr } = await supabase
        .from('member_hidden_modules')
        .insert({ member_id: decoded.sub, module_key });
      if (insertErr && insertErr.code !== '23505') throw new Error(`hide_module insert failed: ${insertErr.message}`);

      const hidden_modules = await getMemberHiddenModules(decoded.sub);
      return new Response(JSON.stringify({ hidden_modules }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'show_module') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const module_key = sanitizeModule(body.module_key);
      if (!module_key) return new Response(JSON.stringify({ error: 'Unrecognized tool.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: deleteErr } = await supabase
        .from('member_hidden_modules')
        .delete()
        .eq('member_id', decoded.sub)
        .eq('module_key', module_key);
      if (deleteErr) throw new Error(`show_module delete failed: ${deleteErr.message}`);

      const hidden_modules = await getMemberHiddenModules(decoded.sub);
      return new Response(JSON.stringify({ hidden_modules }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'save_listing') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const listing_id = typeof body.listing_id === 'string' ? body.listing_id : null;
      if (!listing_id) return new Response(JSON.stringify({ error: 'listing_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: insertErr } = await supabase
        .from('ve_listing_saves')
        .insert({ member_id: decoded.sub, listing_id });
      if (insertErr && insertErr.code !== '23505') throw new Error(`save_listing insert failed: ${insertErr.message}`);

      return new Response(JSON.stringify({ saved: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'unsave_listing') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const listing_id = typeof body.listing_id === 'string' ? body.listing_id : null;
      if (!listing_id) return new Response(JSON.stringify({ error: 'listing_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error: deleteErr } = await supabase
        .from('ve_listing_saves')
        .delete()
        .eq('member_id', decoded.sub)
        .eq('listing_id', listing_id);
      if (deleteErr) throw new Error(`unsave_listing delete failed: ${deleteErr.message}`);

      return new Response(JSON.stringify({ saved: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'list_saved_listings') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data, error } = await supabase
        .from('ve_listing_saves')
        .select('listing_id, saved_at, listings ( id, name, slug, category, logo_url, cover_url, tagline, address_city, vegan_status )')
        .eq('member_id', decoded.sub)
        .order('saved_at', { ascending: false });
      if (error) throw new Error(`list_saved_listings failed: ${error.message}`);

      const items = (data ?? [])
        .filter((r: { listings: unknown }) => !!r.listings)
        .map((r: { listing_id: string; saved_at: string; listings: Record<string, unknown> }) => ({ ...r.listings, saved_at: r.saved_at }));
      return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'me') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { data: member } = await supabase.from('members').select(MEMBER_FIELDS + ', avatar_url, onboarding_completed, membership_status, created_at').eq('id', decoded.sub).maybeSingle();
      if (!member) return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const communities = await getMemberCommunities(member.id);
      const hidden_modules = await getMemberHiddenModules(member.id);
      const podcast_follows = await getMemberPodcastFollows(member.id);
      // Points balance for the front-and-center dashboard stats bar (2026-09-07,
      // Logan, Sean direction). member_points is keyed by member_id (matches
      // apply_member_points_delta, the RPC that writes these rows) -- default
      // to 0 rather than leaving it undefined so a member with no points row
      // yet still gets a real number on the tile, not a blank/dash. total_points
      // added (2026-09-07, Logan, Sean follow-up: dashboard restructure, needs
      // lifetime points alongside the current/available balance) -- it is a
      // running cumulative total that member_points already tracks separately
      // from available_points (which drops when points are spent), so this is
      // a read of an existing column, not a new points concept.
      const { data: pointsRow } = await supabase.from('member_points').select('available_points, total_points').eq('member_id', member.id).maybeSingle();
      const points = (pointsRow && typeof pointsRow.available_points === 'number') ? pointsRow.available_points : 0;
      const total_points = (pointsRow && typeof pointsRow.total_points === 'number') ? pointsRow.total_points : 0;
      return new Response(JSON.stringify({ member: { ...member, communities, hidden_modules, podcast_follows, points, total_points } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- Guide front door: city_status --------------------------------
    if (action === 'city_status') {
      const raw = typeof body.city === 'string' ? body.city.trim() : '';
      if (!raw) return new Response(JSON.stringify({ error: 'city required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const stateRaw = typeof body.state === 'string' ? body.state.trim() : '';
      const stateSlug = stateRaw ? slugifyCity(stateRaw) : null;
      const slug = slugifyCity(raw);
      const launchedSlug = slug ? resolveLaunchedCommunity(slug, stateSlug) : null;
      if (launchedSlug) {
        return new Response(JSON.stringify({ status: 'active', community_slug: launchedSlug, display_name: COMMUNITY_DISPLAY[launchedSlug] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Not one of our launched chapters -- before treating it as a real
      // "new city" founding candidate, reject obvious gibberish (2026-09-06
      // stress-test find). A launched chapter always passes above regardless
      // of this check; this only gates the "new" branch.
      if (!isPlausibleCityName(raw)) {
        return new Response(JSON.stringify({ error: 'invalid_city' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ status: 'new', community_slug: slug, display_name: raw }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- Guide front door: join_city -----------------------------------
    // Handles BOTH cases city_status can return:
    //  - status 'active' (one of the 8 launched chapters): behaves exactly
    //    like join_community, plus awards the existing join_community bounty.
    //  - status 'new' (no real chapter yet): records interest/founding intent
    //    in ve_chapter_requests without touching the launched-chapter enum.
    //    founding=true additionally requires an active Passport (checked
    //    against members.membership_tier, the same field ve-passport-checkout
    //    treats as authoritative) -- the Passport purchase itself always
    //    happens first, this call is what runs right after it succeeds.
    if (action === 'join_city') {
      const token = body.token;
      if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const decoded = decodeToken(token);
      if (!decoded) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const rawCity = typeof body.city === 'string' ? body.city.trim() : '';
      if (!rawCity) return new Response(JSON.stringify({ error: 'city required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const rawState = typeof body.state === 'string' ? body.state.trim() : '';
      const stateSlug = rawState ? slugifyCity(rawState) : null;
      const wantsFounding = body.founding === true;
      const rawSlug = slugifyCity(rawCity);
      if (!rawSlug) return new Response(JSON.stringify({ error: 'Unrecognized city.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const launchedSlug = resolveLaunchedCommunity(rawSlug, stateSlug);
      const slug = launchedSlug ?? rawSlug;

      // 2026-09-06 (Sean stress-test find, defense-in-depth): city_status
      // already rejects gibberish before the client gets here, but this is
      // the action that actually inserts a ve_chapter_requests row -- a
      // launched-chapter match is never gated, only the "found a new city"
      // path below it.
      if (!launchedSlug && !isPlausibleCityName(rawCity)) {
        return new Response(JSON.stringify({ error: 'invalid_city' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (launchedSlug) {
        const { error: insertErr } = await supabase.from('member_communities').insert({ member_id: decoded.sub, community_slug: launchedSlug });
        if (insertErr && insertErr.code !== '23505') throw new Error(`join_city (launched) insert failed: ${insertErr.message}`);
        if (!insertErr) {
          try {
            await supabase.rpc('award_points_bounty', {
              p_member_id: decoded.sub, p_brand: 'vegans-explore', p_action_type: 'join_community',
              p_ref_id: `join_community:${decoded.sub}:${launchedSlug}`, p_reason: 'join_community',
            });
          } catch (e) { console.error('join_city bounty award failed:', e); }
        }
        const communities = await getMemberCommunities(decoded.sub);
        return new Response(JSON.stringify({ chapter: 'launched', community_slug: launchedSlug, is_founding: false, communities }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (wantsFounding) {
        const { data: member } = await supabase.from('members').select('membership_tier').eq('id', decoded.sub).maybeSingle();
        if (!member || member.membership_tier !== 'passport') {
          return new Response(JSON.stringify({ error: 'passport_required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      const { data: existingReq } = await supabase
        .from('ve_chapter_requests')
        .select('id, is_founding, founding_number')
        .eq('member_id', decoded.sub)
        .eq('community_slug', slug)
        .maybeSingle();

      if (existingReq) {
        if (wantsFounding && !existingReq.is_founding) {
          const { count } = await supabase
            .from('ve_chapter_requests')
            .select('id', { count: 'exact', head: true })
            .eq('community_slug', slug)
            .eq('is_founding', true);
          const founding_number = (count ?? 0) + 1;
          await supabase.from('ve_chapter_requests').update({ is_founding: true, founding_number }).eq('id', existingReq.id);
          return new Response(JSON.stringify({ chapter: 'pending', community_slug: slug, is_founding: true, founding_number }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ chapter: 'pending', community_slug: slug, is_founding: existingReq.is_founding, founding_number: existingReq.founding_number }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let founding_number: number | null = null;
      if (wantsFounding) {
        const { count } = await supabase
          .from('ve_chapter_requests')
          .select('id', { count: 'exact', head: true })
          .eq('community_slug', slug)
          .eq('is_founding', true);
        founding_number = (count ?? 0) + 1;
      }

      const { error: reqErr } = await supabase.from('ve_chapter_requests').insert({
        member_id: decoded.sub, city: rawCity, community_slug: slug,
        is_founding: wantsFounding, founding_number,
      });
      if (reqErr && reqErr.code !== '23505') throw new Error(`join_city (pending) insert failed: ${reqErr.message}`);

      return new Response(JSON.stringify({ chapter: 'pending', community_slug: slug, is_founding: wantsFounding, founding_number }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- Guide front door: guide_chat_send -----------------------------
    // Points-gated real conversation with a Vegans Explore Guide, running
    // through the shared character-respond engine. Anonymous (pre-signup,
    // during onboarding) messages are free and just rate-limited by
    // character-respond itself; once a member is authenticated this spends
    // real points (4/message) against a monthly allotment granted the first
    // time they chat each month (60 free / 300 Passport).
    if (action === 'guide_chat_send') {
      const agent_slug = typeof body.agent_slug === 'string' ? body.agent_slug : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      if (!agent_slug || !message) return new Response(JSON.stringify({ error: 'agent_slug and message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const CHAT_COST = 4;
      let speakerKey: string;
      let speakerName: string | undefined;
      let balance: number | null = null;

      const token = typeof body.token === 'string' ? body.token : '';
      const decoded = token ? decodeToken(token) : null;

      if (decoded) {
        const { data: member } = await supabase.from('members').select('id, name, membership_tier').eq('id', decoded.sub).maybeSingle();
        if (!member) return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        await ensureMemberPointsRow(member.id);
        const period = await currentMonthPeriod();
        const isPassport = member.membership_tier === 'passport';
        try {
          await supabase.rpc('award_points_bounty', {
            p_member_id: member.id, p_brand: 'vegans-explore',
            p_action_type: isPassport ? 'guide_chat_monthly_passport' : 'guide_chat_monthly_free',
            p_ref_id: `guide_chat_monthly:${member.id}:${period}`, p_reason: 'guide_chat_allotment',
          });
        } catch (e) { console.error('guide chat monthly allotment failed:', e); }

        const { data: spend } = await supabase.rpc('spend_points_for_chat', { p_member_id: member.id, p_cost: CHAT_COST, p_agent_slug: agent_slug });
        if (spend?.error) {
          return new Response(JSON.stringify({ error: spend.error, balance: spend.balance ?? 0 }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        balance = spend?.balance ?? null;
        speakerKey = member.id;
        speakerName = member.name;
      } else {
        const anonKey = typeof body.anon_key === 'string' && body.anon_key ? body.anon_key : null;
        if (!anonKey) return new Response(JSON.stringify({ error: 'anon_key required for guest chat' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        speakerKey = `anon-${anonKey}`;
      }

      const roomSlug = `ve-guide-${agent_slug}-${speakerKey}`;

      const { data: priorRows } = await supabase
        .from('character_agent_conversations')
        .select('role, content, created_at')
        .eq('character_slug', agent_slug)
        .eq('room_slug', roomSlug)
        .order('created_at', { ascending: true })
        .limit(20);
      const history = (priorRows ?? []).map((r: { role: string; content: string }) => ({ role: r.role, content: r.content }));

      const respondRes = await fetch(`${SUPABASE_URL}/functions/v1/character-respond`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_slug, message, room_slug: roomSlug, history,
          speaker: { key: speakerKey, name: speakerName },
        }),
      });
      const respondData = await respondRes.json().catch(() => ({}));
      if (!respondRes.ok) {
        return new Response(JSON.stringify({ error: respondData?.error || 'guide_unavailable' }), { status: respondRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ reply: respondData.reply, display_name: respondData.display_name, balance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2026-09-07 (Sean field note): voice input on the Guide open-question
    // step. Browser records a short clip and posts it here as base64; this
    // transcribes it with Whisper and hands back plain text, which the client
    // then sends through guide_chat_send exactly like a typed question.
    // Reads OPENAI_API_KEY from lesaruss_secrets, same convention fieldy-ingest
    // uses for FIELDY_API_KEY, rather than assuming a Deno env secret is set.
    if (action === 'transcribe_audio') {
      const audioB64 = typeof body.audio_b64 === 'string' ? body.audio_b64 : '';
      const mime = typeof body.mime === 'string' && body.mime ? body.mime : 'audio/webm';
      if (!audioB64) return new Response(JSON.stringify({ error: 'audio_b64 required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data: secretRow, error: secretErr } = await supabase
        .from('lesaruss_secrets')
        .select('value')
        .eq('key', 'OPENAI_API_KEY')
        .single();
      if (secretErr || !secretRow?.value) {
        return new Response(JSON.stringify({ error: 'transcription_unavailable' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const openaiKey = secretRow.value as string;

      let bytes: Uint8Array;
      try {
        const bin = atob(audioB64);
        bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      } catch {
        return new Response(JSON.stringify({ error: 'invalid_audio_encoding' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (bytes.length > 15 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'audio_too_large' }), { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
      const form = new FormData();
      form.append('file', new Blob([bytes], { type: mime }), `voice.${ext}`);
      form.append('model', 'whisper-1');

      let openaiRes: Response;
      try {
        openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openaiKey}` },
          body: form,
        });
      } catch (e) {
        console.error('transcribe_audio fetch error:', e);
        return new Response(JSON.stringify({ error: 'transcription_failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const openaiData = await openaiRes.json().catch(() => ({}));
      if (!openaiRes.ok) {
        console.error('transcribe_audio openai error:', JSON.stringify(openaiData));
        return new Response(JSON.stringify({ error: 'transcription_failed' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ text: openaiData.text || '' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('ve-auth error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

const MEMBER_FIELDS = 'id, name, email, initials, color, membership_tier, ve_role, ve_tier, referral_code, is_superadmin, home_community';
