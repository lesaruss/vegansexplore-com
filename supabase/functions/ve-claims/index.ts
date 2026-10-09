// ve-claims: a business claims its directory listing (Sean, 2026-09-27). Claiming is the
// second way a vegan-friendly listing reaches the public directory; the first is votes
// from 10 different people. The business completes its details and makes a contribution
// to the cause, open ended with an $11 minimum, which also makes the claimant a Founding
// Member. Sean reviews every claim in the Depot (Claims tab) before it counts.
//
// Member (Authorization: Bearer <ve_token>):
//   POST { action: 'start', listing_id, contact_name, contact_role, contact_email, contact_phone,
//          proposed: { tagline, description, website, phone, instagram, vegan_status }, amount_cents, return_url,
//          tier?: 'verified' | 'plus' }   (tier: claim and buy VE Verified in one checkout, no amount_cents)
//     -> { url }  Stripe Checkout. The session carries the same metadata ve-entry-checkout uses
//        (type entry_contribution, member_id, amount_cents), so ve-stripe-webhook activates the
//        membership and credits Points exactly as it does for the $11 Founding Membership, plus
//        claim_id. Test accounts (ve_test_checkout_allowlist) get a Stripe test session.
//   POST { action: 'mine', listing_id }  -> { claim, verified } this member's latest claim, and the
//     listing's live VE Verified membership if this member is its owner or bought it
//   POST { action: 'verified_start', listing_id, tier, return_url }  -> { url } or { reserved }  an owner
//     already holding the listing takes Passport Stop ($250 a quarter) or Passport Anchor ($500 a quarter)
//   POST { action: 'founding_checkout', listing_id, return_url }  -> { url }  a founding spot whose billing
//     the Depot has opened: subscribe now, first charge on the business's first Challenge month
//   POST { action: 'commit_year', listing_id }  four quarters for the price of three, offered at renewal
//   POST { action: 'results', id } / { action: 'results_list', listing_id }  quarterly results sheets
//   POST { action: 'brand_stats', listing_id, days? }  -> { stats, plan, admin }  what visitors did on the listing
// Brand Partner home (Sean, 2026-10-09: "once they're in... their dashboard is essentially their page"). A partner is the
// member who holds the listing's live brand membership (trialing counts: Front Row Start), its owner, or a super admin.
//   POST { action: 'partner_status', listing_id }                 -> { partner, confirmed, plan, interests, admin }
//   POST { action: 'partner_interest', listing_id, campaign, label, on }  a campaign they want in on (ve_initiative_interest)
//   POST { action: 'media_upload_url', listing_id, file_name, content_type, bytes, kind, note } -> { id, signed_url }
//   POST { action: 'media_done', id }  /  { action: 'media_list', listing_id }  /  { action: 'media_remove', id }
//   POST { action: 'product_photo_url', listing_id, product_id, file_name, content_type, bytes } -> { path, signed_url }
//   POST { action: 'product_update', listing_id, product_id, variant_key?, image_path?, description? }  a partner swaps a
//     product's (or a version's) photo or its description; photos under 1000 px on the short side are refused
//   POST { action: 'listing_apply', business }  any Vegan business applies to be listed (Depot > Claims reviews it)
//   POST { action: 'partner_ask', listing_id, message }  a question Maya has no saved answer for, sent to the account
//     manager (listings.details.brand_door.account_manager_email, else Sean), Reply-To the partner
//     (ve_listing_stats: views, products opened, stores' Vegan aisles opened, videos played) for its owner or a super admin
// Public (no sign-in):
//   POST { action: 'offer', listing_id? }  -> { hub, founding: { open, full, cap, taken }, extra }
//
// Business Offer v2 (playbook ve-verified-tours-hunt, locked by Sean 2026-09-27 after a panel):
// Passport Stop ($250) and Passport Anchor ($500) are QUARTERLY Stripe subscriptions on the VE account
// (internal tier keys stay 'verified' and 'plus'). The Verified badge is earned by the in-person visit
// and comes with both tiers; it is never sold on its own. Each purchase is a ve_verified_memberships
// row; a trigger keeps listings.ve_verified_tier / ve_verified_until / ve_verified (badge: paid AND
// visited) in step. ve-stripe-webhook records renewals and cancellations; the return trip and the
// Depot list also read the subscription from Stripe, so a missed webhook heals itself.
// Founding spots: while a hub's Passport Challenge is not launched (ve-hunt's challenge_launch), a
// business reserves for free (status 'reserved', price locked in amount_cents), capped per hub
// (ve_site_settings.founding_caps, else the stops on the hub's first Challenge). The Depot opens
// billing with the first Challenge month (bill_from); the subscription starts then, via a trial.
// Four quarters for three is offered from the first results sheet on (or 60 days in): the
// subscription moves to a yearly price of 3x the locked quarterly amount from the next renewal.
// Brand Partner (Sean, 2026-10-08): a product brand (Oatly) takes tier 'brand', $111 a quarter, the same quarterly
// subscription and the same claim path. It is a seat at the table: a featured brand page, the brand dashboard
// (brand_stats), front-row access to campaigns, and sponsorships a la carte. No founding spots and no Passport results
// sheet (brands are not stops on the map).
// Results sheets: a daily cron (GET ?cron=results, x-cron-secret) writes one per completed quarter
// (every 3 months from paid_at) from ve_results_data() and emails it to the business and Sean.
//
// Stripe return:
//   GET ?confirm=<session id>  checks the session is paid, marks the claim submitted with what
//     was actually paid, activates the member (test sessions have no webhook), emails Sean,
//     and sends the visitor back to the claim page.
//   GET ?verified_confirm=<session id>  activates a VE Verified purchase (and the claim it came
//     with). ve-stripe-webhook calls the same URL, so activation lives in one place.
// Superadmin (the Depot):
//   POST { action: 'admin_list' }                          -> { claims, trust }
//   POST { action: 'admin_review', id, decision: 'approve' | 'reject', note? }
//     approve: listing claim_status 'verified' (it now shows to the public), owner set, and
//     the details they sent written onto the listing.
//   POST { action: 'admin_trust', enabled, min_voters }    the public directory rule
//   POST { action: 'admin_listing', listing_id, category?, extra_categories?, vegan_status?, business_status?,
//          name?, address?: { online, street, city, state, zip }, details?: { atmosphere, accommodations,
//          indoor_seating, late_hours, high_speed_wifi, owned: [...] } }
//     The quick editor on the city hubs and listing pages (Sean, 2026-09-27): rename it, move it,
//     change its sub-section (or add more in the same section), set how Vegan it is, mark it
//     closed, and fill in the At a Glance details that restaurants and cafes show.
//   POST { action: 'admin_verified_list' }   -> { rows } every VE Verified and Plus business (refreshed from Stripe)
//   POST { action: 'admin_verified_mark', id, visit_done?, shoot_done?, notes? }  visit / shoot done (true, false or a date)
//   POST { action: 'admin_verified_grant', listing_id, tier, paid_at?, renews_at?, notes? }  a membership paid
//     outside Stripe (cash, invoice, comp). No auto-renewal; it lapses on renews_at unless extended.
//   POST { action: 'admin_verified_end', id }   end a membership now (and cancel its Stripe subscription)
//   POST { action: 'admin_founding_open', id, bill_from }  open billing for a founding spot (emails the business)
//   POST { action: 'admin_offer_settings', caps?, extras? }  founding caps per hub, each quarter's extra
//   POST { action: 'admin_results', membership_id }  sheets so far plus the current quarter to date
//   POST { action: 'admin_results_send', id }  email a sheet again
//
// verify_jwt is false: the VE app token is checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's own Stripe account
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-claims`;
const SEAN_EMAIL = 'contact@lesaruss.com';
const MIN_CENTS = 1100, MAX_CENTS = 1000000; // $11 minimum (Sean), $10,000 sanity ceiling
const BRAND_CATS = /^(Food Brands|Brands)$/; // product brands: no restaurant questions
const STATUSES = ['fully_vegan', 'vegan_friendly', 'vegan_options'];
// Every sub-section the city hubs know (CAT_MAP in /public/ve-region-directory.js), by section.
const CATEGORIES = [
  'Restaurants', 'Bakeries & Cafes', 'Food Trucks & Vendors', 'Markets', 'Food Brands', 'Catering', 'Meal Prep',
  'Brands', 'Clothing and Fashion', 'Beauty and Personal Care', 'Fitness and Athletics', 'E-Commerce & Marketplaces',
  'Health and Wellness', 'Coaches and Consultants', 'Marketing & Growth', 'Branding & Creative Assets', 'Content Creation & Media',
  'Web & Development', 'AI & Automation', 'Business Operations',
  'Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books', 'Media',
  'Community Partner', 'Nonprofits', 'Events', 'Uncategorized'];
// At a Glance, which listing.html shows for restaurants and cafes.
const ATMOSPHERES = ['casual', 'upscale', 'fine-dining', 'fast-casual', 'bar-lounge'];
const ACCOMMODATIONS = ['Dine-in', 'Takeout', 'Delivery', 'Outdoor Seating', 'Reservations', 'WiFi', 'Parking', 'Dog-Friendly',
  'Wheelchair Accessible', 'BYOB', 'Live Music', 'Family-Friendly', 'Catering'];
const OWNED = ['is_black_owned', 'is_women_owned', 'is_latino_owned', 'is_asian_owned', 'is_immigrant_owned', 'is_veteran_owned',
  'is_family_owned', 'is_lgbtq_owned', 'is_indigenous_owned'];
const BUSINESS = ['OPERATIONAL', 'CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY'];
// Business Offer v2 tiers (Sean, 2026-09-27). Quarterly, renewing. Keys are the stored tier values.
const TIERS: Record<string, { cents: number; name: string }> = {
  verified: { cents: 25000, name: 'Passport Stop' },
  plus: { cents: 50000, name: 'Passport Anchor' },
  brand: { cents: 11100, name: 'Brand Partner' },
};
// The Partner plan for every business (Sean, 2026-10-09: "I would rather give everybody the Oatly style offer... the way
// in"): tier 'brand' is the $111 quarterly Partner plan for any listing. A product brand sees it as Brand Partner,
// everyone else as Vegans Explore Partner; Front Row Start applies to both.
function tierName(tier: string, category?: string | null): string {
  if (tier !== 'brand') return TIERS[tier]?.name || 'Passport';
  return BRAND_CATS.test(category || '') ? 'Brand Partner' : 'Vegans Explore Partner';
}
// Front Row Start (Sean, 2026-10-09; named after a panel): a business that joins the Partner plan before January 1, 2027 gets
// the rest of 2026 on us. The card is saved today and the first quarter is charged on January 1, 2027 (noon Eastern;
// Stripe needs a trial to end at least 48 hours out, so a last-minute signup is charged a day or two later), then every
// quarter. Only the brand tier, only when the page asks for it (offer: 'front-row'), only before the deadline.
const FRONT_ROW_END = Date.parse('2027-01-01T05:00:00Z');
function frontRowTrialEnd(tier: string, offer: unknown): number {
  if (tier !== 'brand' || offer !== 'front-row' || Date.now() >= FRONT_ROW_END) return 0;
  return Math.floor(Math.max(Date.parse('2027-01-01T17:00:00Z'), Date.now() + 49 * 3600e3) / 1000);
}
// The city hubs, matching /public/ve-hubs.js (a listing is in a hub when its city and state fit).
const HUBS: Record<string, { name: string; cities?: string[]; states?: string[] }> = {
  'south-florida': { name: 'South Florida', cities: ['Miami','Miami Beach','North Miami','North Miami Beach','Aventura','Bal Harbour','Sunny Isles Beach','Surfside','Doral','Hialeah','Miami Gardens','Miami Lakes','Miami Springs','Coral Gables','South Miami','Key Biscayne','Pinecrest','Palmetto Bay','Cutler Bay','Homestead','Florida City','Fort Lauderdale','Hollywood','Sunrise','Pompano Beach','Coral Springs','Margate','Miramar','Pembroke Pines','Weston','Davie','Cooper City','Plantation','Lauderhill','Lauderdale Lakes','North Lauderdale','Tamarac','Oakland Park','Wilton Manors','Dania Beach','Hallandale','Hallandale Beach','Deerfield Beach','Lighthouse Point','Coconut Creek','Parkland','Lauderdale-by-the-Sea','Southwest Ranches','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach','Palm Beach Gardens','Jupiter','Lake Worth','Lake Worth Beach','Tequesta','Loxahatchee','Riviera Beach','Royal Palm Beach','Wellington','North Palm Beach','Palm Beach','Greenacres','Lantana','Lake Park','Juno Beach','Palm Springs','Highland Beach','Belle Glade'] },
  'central-florida': { name: 'Central Florida', states: ['FL'], cities: ['Orlando','Altamonte Springs','Apopka','Lakeland','The Villages','Winter Haven','Ocala'] },
  atlanta: { name: 'Atlanta', states: ['GA'] }, dmv: { name: 'DMV', states: ['DC', 'MD', 'VA'] }, 'new-york': { name: 'New York', states: ['NY'] },
  philadelphia: { name: 'Philadelphia', states: ['PA'] }, 'los-angeles': { name: 'Los Angeles', cities: ['Los Angeles','West Hollywood','North Hollywood','Reseda','Canoga Park'] },
  london: { name: 'London', cities: ['London'] },
};
function hubOf(l: any): string | null {
  for (const [slug, h] of Object.entries(HUBS)) {
    if (h.cities && !h.cities.includes(l?.address_city)) continue;
    if (h.states && !h.states.includes(String(l?.address_state || '').toUpperCase())) continue;
    if (!h.cities && !h.states) continue;
    return slug;
  }
  return null;
}
const monthsLater = (d: Date, n: number) => { const x = new Date(d); x.setUTCMonth(x.getUTCMonth() + n); return x; };
const LIVE = ['active', 'past_due'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
const plain = (v: unknown, n: number) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function webUrl(v: unknown): string {
  let t = plain(v, 300); if (!t) return '';
  if (!/^https?:\/\//i.test(t)) t = 'https://' + t;
  try { const u = new URL(t); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.toString() : ''; } catch { return ''; }
}
function backTo(url: unknown, fallback: string): string {
  try { const u = new URL(String(url || '')); if (u.protocol === 'https:' && /(^|\.)vegansexplore\.com$/.test(u.hostname)) return u.toString(); } catch { /* fall through */ }
  return fallback;
}
const withParam = (url: string, k: string, v: string) => { const u = new URL(url); u.searchParams.set(k, v); return u.toString(); };

async function isTestAccount(email: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await db.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
async function stripeKey(test: boolean): Promise<string> {
  if (!test) return STRIPE_SECRET;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST').maybeSingle();
  if (!String(data?.value || '').startsWith('sk_test_')) throw new Error('test key missing');
  return data!.value;
}
async function mail(subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [SEAN_EMAIL], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
  } catch (e) { console.error('claim email failed', e); }
}

// ---- Brand Partner home helpers.
// The partner's relation to a listing: the holder of its live brand membership, its owner, or a super admin.
async function partnerOf(listingId: string, member: any) {
  if (!/^[0-9a-f-]{36}$/.test(listingId)) return null;
  const { data: listing } = await db.from('listings').select('id, name, slug, owner_member_id, claimed_by_member_id, claim_status, details').eq('id', listingId).maybeSingle();
  if (!listing) return null;
  const v = await liveMembership(listingId);
  const holds = !!v && v.tier === 'brand' && v.member_id === member.id;
  const owner = listing.owner_member_id === member.id || listing.claimed_by_member_id === member.id;
  if (!holds && !owner && !member.is_superadmin) return null;
  return { listing, membership: v && v.tier === 'brand' ? v : null, holds, owner, admin: !!member.is_superadmin && !holds && !owner };
}
// Who answers for this brand: its account manager, else Sean.
function accountManager(listing: any): string {
  const e = String(listing?.details?.brand_door?.account_manager_email || '');
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : SEAN_EMAIL;
}
async function mailTo(to: string[], subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [...new Set(to)], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return r.ok;
  } catch (e) { console.error('partner email failed', e); return false; }
}
const MEDIA_KINDS = ['logo', 'product_photo', 'graphic', 'video', 'other'];
// Product photos must be sharp (Sean, 2026-10-09: "if it's low quality it can give them a warning and let them know that
// they have to upload a higher quality"): at least this many pixels on the shorter side.
const PRODUCT_PHOTO_MIN = 1000;
// Width and height from the file header: PNG, JPEG or WebP. null when it cannot tell.
function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const u16 = (i: number) => (b[i] << 8) | b[i + 1], u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le16 = (i: number) => b[i] | (b[i + 1] << 8), le24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { w: u32(16), h: u32(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: u16(i + 7), h: u16(i + 5) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (b.length > 30 && String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP') {
    const f = String.fromCharCode(...b.slice(12, 16));
    if (f === 'VP8 ') return { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff };
    if (f === 'VP8L') { const x = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { w: (x & 0x3fff) + 1, h: ((x >> 14) & 0x3fff) + 1 }; }
    if (f === 'VP8X') return { w: le24(24) + 1, h: le24(27) + 1 };
  }
  return null;
}

// ---- VE Verified helpers.
async function stripe(test: boolean, path: string, form?: URLSearchParams, method = form ? 'POST' : 'GET') {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method, headers: { Authorization: `Bearer ${await stripeKey(test)}`, ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: form ? form.toString() : undefined,
  });
  return { ok: res.ok, body: await res.json() };
}
const iso = (sec: unknown) => (typeof sec === 'number' && sec > 0 ? new Date(sec * 1000).toISOString() : null);
// A subscription's billing period; newer API versions keep it on the item rather than the subscription.
function period(sub: any) {
  const item = sub?.items?.data?.[0] || {};
  return { start: iso(sub?.current_period_start ?? item.current_period_start), end: iso(sub?.current_period_end ?? item.current_period_end) };
}
function subStatus(s: string): string {
  if (s === 'active' || s === 'trialing') return 'active';
  if (s === 'past_due' || s === 'unpaid') return 'past_due';
  if (s === 'canceled' || s === 'incomplete_expired') return 'canceled';
  return 'awaiting_payment';
}
// Read a membership's subscription from Stripe and store what it says.
async function syncFromStripe(row: any): Promise<any> {
  if (row.source !== 'stripe' || !row.stripe_subscription_id) return row;
  const { ok, body: sub } = await stripe(row.test, `subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`);
  if (!ok) return row;
  const p = period(sub), now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: subStatus(sub.status), current_period_start: p.start, renews_at: p.end,
    cancel_at_period_end: !!sub.cancel_at_period_end, canceled_at: iso(sub.canceled_at), updated_at: now };
  if (patch.status === row.status && p.end === row.renews_at && patch.cancel_at_period_end === row.cancel_at_period_end) return row;
  const { data } = await db.from('ve_verified_memberships').update(patch).eq('id', row.id).select('*').single();
  return data || row;
}
// Create the Stripe subscription checkout for a ve_verified_memberships row.
async function verifiedCheckout(row: any, listing: any, member: any, back: string, claimId?: string, trialEnd = 0): Promise<{ url?: string; error?: string }> {
  const t = { ...TIERS[row.tier], name: tierName(row.tier, listing.category) };
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': (row.test ? '[TEST] ' : '') + `${t.name} (quarterly)${row.founding ? ', founding' : ''} - ${listing.name}`.slice(0, 120),
    // A founding spot pays the price it reserved at; everyone else pays today's tier price.
    'line_items[0][price_data][unit_amount]': String(row.founding && row.amount_cents ? row.amount_cents : t.cents),
    'line_items[0][price_data][recurring][interval]': 'month',
    'line_items[0][price_data][recurring][interval_count]': '3',
    'line_items[0][quantity]': '1',
    success_url: `${FN_URL}?verified_confirm={CHECKOUT_SESSION_ID}`,
    cancel_url: withParam(back, 'verified', 'cancelled'),
    customer_email: member.email,
    billing_address_collection: 'auto',
  });
  const meta: Record<string, string> = { type: 've_verified', verified_id: row.id, listing_id: listing.id, member_id: member.id, tier: row.tier };
  if (claimId) meta.claim_id = claimId;
  if (row.test) meta.test = 'true';
  if (row.founding) meta.founding = 'true';
  if (trialEnd) meta.offer = 'front-row';
  for (const [k, v] of Object.entries(meta)) { params.set(`metadata[${k}]`, v); params.set(`subscription_data[metadata][${k}]`, v); }
  // Founding: the card is saved now and the first quarter is charged on the first Challenge month.
  if (row.founding && row.bill_from) {
    const at = Math.floor(new Date(row.bill_from + 'T12:00:00Z').getTime() / 1000);
    if (at > Math.floor(Date.now() / 1000) + 3 * 86400) params.set('subscription_data[trial_end]', String(at));
  }
  // Front Row Start: nothing today, the first quarter on January 1, 2027.
  if (trialEnd) params.set('subscription_data[trial_end]', String(trialEnd));
  const { ok, body: s } = await stripe(row.test, 'checkout/sessions', params);
  if (!ok) { console.error('stripe error', s); return { error: s.error?.message ?? 'stripe_error' }; }
  await db.from('ve_verified_memberships').update({ stripe_session_id: s.id, updated_at: new Date().toISOString() }).eq('id', row.id);
  return { url: s.url };
}
// A fresh awaiting_payment row for this member and listing (reusing an unpaid one).
async function verifiedRow(listingId: string, member: any, tier: string, test: boolean, contact: { name?: string; email?: string }, claimId?: string) {
  const row = { listing_id: listingId, member_id: member.id, tier, amount_cents: TIERS[tier].cents, test, status: 'awaiting_payment', source: 'stripe',
    contact_name: contact.name || member.name || null, contact_email: contact.email || member.email || null, claim_id: claimId || null, updated_at: new Date().toISOString() };
  const { data: open } = await db.from('ve_verified_memberships').select('id').eq('member_id', member.id).eq('listing_id', listingId).eq('status', 'awaiting_payment').maybeSingle();
  const { data, error } = open
    ? await db.from('ve_verified_memberships').update({ ...row, stripe_session_id: null }).eq('id', open.id).select('*').single()
    : await db.from('ve_verified_memberships').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}
async function liveMembership(listingId: string) {
  const { data } = await db.from('ve_verified_memberships').select('*').eq('listing_id', listingId).in('status', LIVE).maybeSingle();
  return data;
}
async function reservedMembership(listingId: string) {
  const { data } = await db.from('ve_verified_memberships').select('*').eq('listing_id', listingId).eq('status', 'reserved').maybeSingle();
  return data;
}
async function setting(key: string) {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', key).maybeSingle();
  return data?.value || {};
}
// Founding window for a hub: open until its Passport Challenge launches; capped per hub.
async function foundingState(hub: string | null) {
  if (!hub) return { open: false, full: false, cap: null as number | null, taken: 0 };
  const launched = (await setting('challenge_launch')).communities || [];
  const set = +(await setting('founding_caps'))[hub];
  let cap: number | null = Number.isFinite(set) && set > 0 ? set : null;
  if (cap === null) {
    const { data: first } = await db.from('ve_hunts').select('id').eq('community_slug', hub).order('starts_on').limit(1).maybeSingle();
    if (first) { const { count } = await db.from('ve_hunt_stops').select('id', { count: 'exact', head: true }).eq('hunt_id', first.id); cap = count || null; }
  }
  const { count: taken } = await db.from('ve_verified_memberships').select('id', { count: 'exact', head: true }).eq('founding', true).eq('hub', hub)
    .in('status', ['reserved', 'awaiting_payment', 'active', 'past_due']);
  const open = !launched.includes(hub);
  return { open, full: open && cap !== null && (taken || 0) >= cap, cap, taken: taken || 0 };
}
// A free founding reservation (price locked at today's tier price).
async function reserve(listing: any, member: any, tier: string, hub: string, test: boolean, contact: { name?: string; email?: string }, claimId?: string) {
  const row = { listing_id: listing.id, member_id: member.id, tier, amount_cents: TIERS[tier].cents, test, status: 'reserved', source: 'stripe', founding: true, hub,
    contact_name: contact.name || member.name || null, contact_email: contact.email || member.email || null, claim_id: claimId || null, updated_at: new Date().toISOString() };
  const { data, error } = await db.from('ve_verified_memberships').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  const t = TIERS[tier];
  await mail(`${test ? '[TEST] ' : ''}Founding spot reserved: ${listing.name}, ${t.name}`,
    `<p><b>${esc(listing.name)}</b> reserved a founding <b>${t.name}</b> spot in ${esc(HUBS[hub]?.name || hub)} at $${(t.cents / 100).toFixed(0)} a quarter, locked.</p>` +
    `<p>${esc(row.contact_name || '')}<br>${esc(row.contact_email || '')}</p>` + (claimId ? '<p>It came with a listing claim; the claim is confirmed when the first payment goes through.</p>' : '') +
    `<p>Open their billing when their first Challenge month is set: <a href="https://vegansexplore.com/admin/depot/verified">vegansexplore.com/admin/depot/verified</a></p>`, row.contact_email || undefined);
  await sendTo(row.contact_email, `Your founding ${t.name} spot is reserved`,
    `<p>Thank you${listing.name ? ', ' + esc(listing.name) : ''}. Your founding <b>${t.name}</b> spot in ${esc(HUBS[hub]?.name || hub)} is reserved, and your price is locked at $${(t.cents / 100).toFixed(0)} a quarter for as long as you stay.</p>` +
    `<p>You pay nothing until your first Passport Challenge month starts. We will email you before then to set up billing and schedule your visit.</p>` +
    `<p>Our promise: if your pin, register kit and staff training aren't ready before your month starts, that month is on us. Anything else we deliver that isn't right, we make it right.</p><p>The Vegans Explore team</p>`);
  return data;
}
async function sendTo(to: string | null, subject: string, html: string) {
  if (!to || !RESEND_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [to], reply_to: 'hello@vegansexplore.com', subject, html }) });
  } catch (e) { console.error('business email failed', e); }
}
// Four quarters for three: from the first results sheet, or once the business is 60 days in.
async function canCommit(row: any): Promise<boolean> {
  if (!row || row.source !== 'stripe' || !LIVE.includes(row.status) || row.committed_at || !row.stripe_subscription_id) return false;
  if (row.paid_at && Date.now() - new Date(row.paid_at).getTime() >= 60 * 864e5) return true;
  const { count } = await db.from('ve_results_sheets').select('id', { count: 'exact', head: true }).eq('membership_id', row.id);
  return (count || 0) > 0;
}
const QUARTER_LABEL = (d = new Date()) => `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
async function currentExtra() {
  const extras = await setting('quarter_extras');
  const e = extras[QUARTER_LABEL()];
  return e && e.title ? { quarter: QUARTER_LABEL(), title: String(e.title), text: String(e.text || '') } : null;
}
// Write (or find) the results sheet for one completed quarter, and email it once.
async function resultsSheet(row: any, start: Date, end: Date, send: boolean) {
  const { data: have } = await db.from('ve_results_sheets').select('*').eq('membership_id', row.id).eq('period_end', end.toISOString()).maybeSingle();
  let sheet = have;
  if (!sheet) {
    const { data: d } = await db.rpc('ve_results_data', { p_listing: row.listing_id, p_from: start.toISOString(), p_to: end.toISOString() });
    const { data: ins } = await db.from('ve_results_sheets').insert({ membership_id: row.id, listing_id: row.listing_id, period_start: start.toISOString(), period_end: end.toISOString(), data: d || {} })
      .select('*').maybeSingle();
    sheet = ins;
  }
  if (sheet && send && !sheet.sent_at) {
    const { data: l } = await db.from('listings').select('name').eq('id', row.listing_id).maybeSingle();
    const link = `https://vegansexplore.com/business/results?id=${sheet.id}`, d = sheet.data || {};
    const commit = await canCommit(row);
    const body = `<p>Your ${esc(TIERS[row.tier]?.name || 'Passport')} results for ${esc(l?.name || 'your business')}, ${new Date(sheet.period_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} to ${new Date(sheet.period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}:</p>` +
      `<p>Passport Challenge stamps: <b>${d.stamps ?? 0}</b><br>Members who stamped: <b>${d.members ?? 0}</b><br>First-time visitors: <b>${d.first_time ?? 0}</b><br>Tour guests: <b>${d.tour_guests ?? 0}</b></p>` +
      `<p>The full sheet: <a href="${link}">${link}</a></p>` +
      (commit ? `<p>Keep your pin and get a quarter free: switch to four quarters for the price of three from your next renewal. It is one click on the sheet.</p>` : '') + '<p>The Vegans Explore team</p>';
    await sendTo(row.contact_email, `Your quarter with Vegans Explore: ${l?.name || ''}`.trim(), body);
    await mail(`${row.test ? '[TEST] ' : ''}Results sheet sent: ${l?.name || row.listing_id}`, body);
    await db.from('ve_results_sheets').update({ sent_at: new Date().toISOString() }).eq('id', sheet.id);
  }
  return sheet;
}
async function runResultsCron() {
  const { data: rows } = await db.from('ve_verified_memberships').select('*').in('status', LIVE).not('paid_at', 'is', null).neq('tier', 'brand');
  let made = 0;
  for (const r of rows || []) {
    const paid = new Date(r.paid_at);
    for (let k = 1; k <= 40; k++) {
      const end = monthsLater(paid, 3 * k);
      if (end.getTime() > Date.now()) break;
      const { data: have } = await db.from('ve_results_sheets').select('id, sent_at').eq('membership_id', r.id).eq('period_end', end.toISOString()).maybeSingle();
      if (have?.sent_at) continue;
      await resultsSheet(r, monthsLater(paid, 3 * (k - 1)), end, true); made++;
    }
  }
  return made;
}
// Paid: activate the membership from the Stripe session (the return trip and the webhook both land here).
async function activateVerified(sessionId: string): Promise<{ row: any; listing: any } | null> {
  const { data: row } = await db.from('ve_verified_memberships').select('*').eq('stripe_session_id', sessionId).maybeSingle();
  if (!row) return null;
  const { data: listing } = await db.from('listings').select('id, name, slug, address_city, category').eq('id', row.listing_id).maybeSingle();
  if (row.status !== 'awaiting_payment' && row.status !== 'reserved') return { row, listing };
  const { ok, body: s } = await stripe(row.test, `checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`);
  if (!ok || s.status !== 'complete' || s.metadata?.verified_id !== row.id || !s.subscription) return null;
  const sub = typeof s.subscription === 'string' ? (await stripe(row.test, `subscriptions/${s.subscription}`)).body : s.subscription;
  const p = period(sub), now = new Date().toISOString();
  const { data: upd } = await db.from('ve_verified_memberships').update({
    status: subStatus(sub.status) === 'awaiting_payment' ? 'active' : subStatus(sub.status), stripe_subscription_id: sub.id,
    stripe_customer_id: typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null,
    paid_at: now, last_paid_at: now, current_period_start: p.start || now, renews_at: p.end, updated_at: now,
  }).eq('id', row.id).in('status', ['awaiting_payment', 'reserved']).select('*').maybeSingle();
  if (!upd) return { row, listing }; // the other path got here first
  // A purchase makes the buyer a member, the same as a claim contribution.
  if (row.member_id) await db.from('members').update({ membership_status: 'active', entry_paid_at: now, updated_at: now }).eq('id', row.member_id).neq('membership_status', 'active');
  if (row.claim_id) {
    await db.from('ve_listing_claims').update({ status: 'submitted', paid_cents: s.amount_total ?? row.amount_cents, paid_at: now, updated_at: now }).eq('id', row.claim_id).eq('status', 'awaiting_contribution');
    await db.from('listings').update({ claim_status: 'pending', claim_submitted_at: now }).eq('id', row.listing_id).neq('claim_status', 'verified');
  }
  const t = { ...TIERS[row.tier], name: tierName(row.tier, listing?.category) }, renew = p.end ? new Date(p.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : '';
  const price = ((row.founding && row.amount_cents ? row.amount_cents : t.cents) / 100).toFixed(0);
  const trial = sub.status === 'trialing', brand = row.tier === 'brand';
  await mail(`${row.test ? '[TEST] ' : ''}${t.name}: ${listing?.name || 'a listing'}, $${price}/quarter${row.founding ? ' (founding)' : ''}`,
    `<p><b>${esc(listing?.name || '')}</b> (${esc(listing?.address_city || '')}) ${trial ? 'set up billing for' : 'bought'} <b>${t.name}</b> at $${price} a quarter${row.founding ? ', founding price' : ''}${renew ? `, ${trial ? 'first charge' : 'renewing'} ${esc(renew)}` : ''}.</p>` +
    `<p>${esc(row.contact_name || '')}<br>${esc(row.contact_email || '')}</p>` +
    (row.claim_id ? '<p>This came with a listing claim, which is waiting for your review.</p>' : '') +
    (brand ? `<p>${trial ? 'Front Row Start: nothing charged today. ' : ''}Next: approve the claim in the Depot so their dashboard opens, and welcome them. <a href="https://vegansexplore.com/admin/depot/verified">vegansexplore.com/admin/depot/verified</a></p>`
      : `<p>Next: schedule the visit and photo shoot. Track it in the Depot: <a href="https://vegansexplore.com/admin/depot/verified">vegansexplore.com/admin/depot/verified</a></p>`), row.contact_email || undefined);
  if (row.contact_email && RESEND_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [row.contact_email], reply_to: 'hello@vegansexplore.com',
          subject: `Welcome to ${t.name}`,
          html: brand ? `<p>Thank you for joining ${t.name}${listing?.name ? ' with ' + esc(listing.name) : ''}.</p>` +
            `<p>We review every claim; once yours is approved, your Partner Dashboard opens on your page (sign in with this email). You get a front-row seat on our campaigns: we will send each one before it opens, so you can choose where you fit.</p>` +
            `<p>${trial ? 'Front Row Start: the rest of 2026 is on us. Your first quarter is charged on ' + esc(renew) + ', then every three months' : 'Your membership renews every quarter' + (renew ? ' (next on ' + esc(renew) + ')' : '')}. To cancel, reply to this email.</p>` +
            `<p>The Vegans Explore team</p>`
          : `<p>Thank you for joining ${t.name}${listing?.name ? ' with ' + esc(listing.name) : ''}.</p>` +
            `<p>Next, someone from Vegans Explore will reach out to schedule an in-person visit and your photo shoot. The Verified badge goes on your listing once we have visited: Verified means we visited, and it can't be bought.</p>` +
            `<p>${trial ? 'Your first quarter is charged on ' + esc(renew) + ', when your first Passport Challenge month starts' : 'Your membership renews every quarter' + (renew ? ' (next on ' + esc(renew) + ')' : '')}. Every quarter you get a results sheet showing who came through your door. Questions? Reply to this email.</p>` +
            `<p>Our promise: if your pin, register kit and staff training aren't ready before your month starts, that month is on us. Anything else we deliver that isn't right, we make it right.</p>` +
            `<p>The Vegans Explore team</p>` }),
      });
    } catch (e) { console.error('verified welcome email failed', e); }
  }
  return { row: upd, listing };
}

// The one-time contribution (from $11) that locks in a claim or an application to be listed: a Stripe payment checkout that
// comes back through ?confirm=, which marks the claim submitted and makes the member a Founding Member.
async function contributionCheckout(claimId: string, listing: { id: string; name: string }, member: { id: string; email: string }, cents: number, back: string, test: boolean, what: string): Promise<{ url?: string; error?: string }> {
  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': (test ? '[TEST] ' : '') + `Vegans Explore - ${what} (${listing.name})`.slice(0, 120),
    'line_items[0][price_data][unit_amount]': String(cents),
    'line_items[0][quantity]': '1',
    success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
    cancel_url: withParam(back, 'claim', 'cancelled'),
    customer_email: member.email,
    billing_address_collection: 'auto',
    'payment_intent_data[receipt_email]': member.email,
    'metadata[type]': 'entry_contribution',
    'metadata[member_id]': member.id,
    'metadata[amount_cents]': String(cents),
    'metadata[claim_id]': claimId,
    'metadata[listing_id]': listing.id,
  });
  if (test) params.set('metadata[test]', 'true');
  const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
  });
  const s = await sres.json();
  if (!sres.ok) { console.error('stripe error', s); return { error: s.error?.message ?? 'stripe_error' }; }
  await db.from('ve_listing_claims').update({ stripe_session_id: s.id }).eq('id', claimId);
  return { url: s.url };
}

// ---- Stripe return: confirm the contribution and send the visitor back.
async function confirm(sessionId: string): Promise<Response> {
  const fallback = 'https://vegansexplore.com/claim';
  const { data: claim } = await db.from('ve_listing_claims').select('*').eq('stripe_session_id', sessionId).maybeSingle();
  if (!claim) return Response.redirect(fallback, 302);
  const { data: listing } = await db.from('listings').select('id, name, slug, address_city').eq('id', claim.listing_id).maybeSingle();
  const app = !!(claim.proposed && claim.proposed.application);
  const back = app ? withParam(`https://vegansexplore.com/claim?applied=${encodeURIComponent(listing?.slug || '')}`, 'claim', 'submitted')
    : withParam(`https://vegansexplore.com/claim?listing=${encodeURIComponent(listing?.slug || '')}`, 'claim', 'submitted');
  if (claim.status !== 'awaiting_contribution') return Response.redirect(back, 302); // already confirmed
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(claim.test)}` } });
  const s = await res.json();
  if (!res.ok || s.payment_status !== 'paid' || s.metadata?.claim_id !== claim.id) return Response.redirect(withParam(back, 'claim', 'unpaid'), 302);
  const now = new Date().toISOString();
  await db.from('ve_listing_claims').update({ status: 'submitted', paid_cents: s.amount_total ?? claim.contribution_cents, paid_at: now, updated_at: now }).eq('id', claim.id);
  // The webhook activates live members too; doing it here as well means no wait (and test sessions have no webhook).
  await db.from('members').update({ membership_status: 'active', entry_paid_at: now, updated_at: now }).eq('id', claim.member_id).neq('membership_status', 'active');
  await db.from('listings').update({ claim_status: 'pending', claim_submitted_at: now }).eq('id', claim.listing_id).neq('claim_status', 'verified');
  const p = claim.proposed || {};
  const dollars = ((s.amount_total ?? claim.contribution_cents) / 100).toFixed(2);
  await mail(`${claim.test ? '[TEST] ' : ''}${app ? 'New business wants to be listed' : 'Listing claim'}: ${listing?.name || 'a listing'}, $${dollars}`,
    `<p><b>${esc(listing?.name || '')}</b> (${esc(listing?.address_city || '')}) ${app ? 'applied to be listed' : 'was claimed'} with a <b>$${dollars}</b> contribution.</p>` +
    (app && p.description ? `<p>${esc(String(p.description))}</p>` : '') + (app ? '<p>Approving it in the Depot lists it and makes them the owner.</p>' : '') +
    `<p>${esc(claim.contact_name || '')}${claim.contact_role ? ', ' + esc(claim.contact_role) : ''}<br>${esc(claim.contact_email || '')}${claim.contact_phone ? '<br>' + esc(claim.contact_phone) : ''}</p>` +
    (p.vegan_status ? `<p>Says they are: ${esc(String(p.vegan_status).replace('_', ' '))}</p>` : '') +
    `<p>Review it in the Depot: <a href="https://vegansexplore.com/admin/depot/claims">vegansexplore.com/admin/depot/claims</a></p>`, claim.contact_email || undefined);
  return Response.redirect(back, 302);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirm(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return Response.redirect('https://vegansexplore.com/claim?claim=unpaid', 302); }
  }
  if (req.method === 'GET' && url.searchParams.get('verified_confirm')) {
    try {
      const r = await activateVerified(url.searchParams.get('verified_confirm')!);
      if (!r) return Response.redirect('https://vegansexplore.com/claim?verified=unpaid', 302);
      // A Brand Partner goes straight home: its page, Getting Started, where Maya welcomes it to the front row. Any other
      // Partner, and a business that joined while applying to be listed, lands on Join the Directory's "you're in".
      if (r.row?.tier === 'brand') {
        const slug = encodeURIComponent(r.listing?.slug || '');
        const { data: c } = r.row.claim_id ? await db.from('ve_listing_claims').select('proposed').eq('id', r.row.claim_id).maybeSingle() : { data: null };
        if (c?.proposed?.application) return Response.redirect(`https://vegansexplore.com/claim?applied=${slug}&claim=submitted&joined=partner`, 302);
        if (BRAND_CATS.test(r.listing?.category || '')) return Response.redirect(`https://vegansexplore.com/directory/${slug}?tab=brand&welcome=1`, 302);
        return Response.redirect(`https://vegansexplore.com/claim?listing=${slug}&claim=submitted&joined=partner`, 302);
      }
      return Response.redirect(`https://vegansexplore.com/claim?listing=${encodeURIComponent(r.listing?.slug || '')}&verified=active`, 302);
    } catch (e) { console.error('verified confirm failed', e); return Response.redirect('https://vegansexplore.com/claim?verified=unpaid', 302); }
  }
  if (url.searchParams.get('cron') === 'results') {
    const { data: sec } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
    if (!sec?.value || req.headers.get('x-cron-secret') !== sec.value) return json({ error: 'forbidden' }, 403);
    return json({ ok: true, sheets: await runResultsCron() });
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  // Public: what a listing can take today (founding spot or a paid quarter) and this quarter's extra.
  if (body.action === 'offer') {
    let hub: string | null = HUBS[String(body.hub || '')] ? String(body.hub) : null;
    if (/^[0-9a-f-]{36}$/.test(String(body.listing_id || ''))) {
      const { data: l } = await db.from('listings').select('address_city, address_state').eq('id', body.listing_id).maybeSingle();
      hub = hubOf(l);
    }
    const f = await foundingState(hub);
    return json({ hub, hub_name: hub ? HUBS[hub].name : null, founding: f, extra: await currentExtra(), tiers: TIERS });
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, email, name, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'not_authenticated' }, 401);

  if (body.action === 'mine') {
    const { data } = await db.from('ve_listing_claims').select('id, status, paid_cents, created_at').eq('member_id', memberId).eq('listing_id', String(body.listing_id || ''))
      .neq('status', 'cancelled').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const lid = String(body.listing_id || '');
    let verified = null;
    if (/^[0-9a-f-]{36}$/.test(lid)) {
      const { data: l } = await db.from('listings').select('owner_member_id').eq('id', lid).maybeSingle();
      let v = (await liveMembership(lid)) || (await reservedMembership(lid));
      if (v && (v.member_id === memberId || l?.owner_member_id === memberId || member.is_superadmin)) {
        if (v.status !== 'reserved') v = await syncFromStripe(v);
        const { data: sheets } = await db.from('ve_results_sheets').select('id, period_start, period_end').eq('membership_id', v.id).order('period_end', { ascending: false }).limit(8);
        verified = { tier: v.tier, name: TIERS[v.tier]?.name, status: v.status, renews_at: v.renews_at, cancel_at_period_end: v.cancel_at_period_end, visit_done: !!v.visit_done_at, source: v.source,
          founding: !!v.founding, amount_cents: v.amount_cents, bill_from: v.bill_from, billing_open: !!v.billing_opened_at, committed: !!v.committed_at,
          can_commit: await canCommit(v), sheets: sheets || [] };
      }
      return json({ claim: data || null, verified, owner: !!l && l.owner_member_id === memberId });
    }
    return json({ claim: data || null, verified });
  }

  // ---- Brand Partner home (Sean, 2026-10-09).
  if (body.action === 'partner_status') {
    const pt = await partnerOf(String(body.listing_id || ''), member);
    if (!pt) return json({ partner: false });
    const v = pt.membership ? (pt.membership.status !== 'reserved' ? await syncFromStripe(pt.membership) : pt.membership) : null;
    const { data: ints } = await db.from('ve_initiative_interest').select('initiative_slug').eq('member_id', memberId).contains('tags', ['brand-partner', pt.listing.slug]);
    return json({ partner: true, admin: pt.admin, confirmed: pt.listing.claim_status === 'verified' && (pt.owner || pt.admin),
      plan: v ? { status: v.status, renews_at: v.renews_at, cancel_at_period_end: v.cancel_at_period_end } : null,
      interests: (ints || []).map((x: any) => x.initiative_slug) });
  }
  if (body.action === 'partner_interest') {
    const pt = await partnerOf(String(body.listing_id || ''), member);
    if (!pt) return json({ error: 'not_partner' }, 403);
    const campaign = String(body.campaign || '').toLowerCase();
    if (!/^[a-z0-9-]{3,80}$/.test(campaign)) return json({ error: 'bad_campaign' }, 400);
    const label = plain(body.label, 120) || campaign;
    const { data: had } = await db.from('ve_initiative_interest').select('id').eq('member_id', memberId).eq('initiative_slug', campaign).contains('tags', ['brand-partner', pt.listing.slug]).maybeSingle();
    if (body.on === false) {
      if (had) await db.from('ve_initiative_interest').delete().eq('id', had.id);
      return json({ ok: true, on: false });
    }
    if (!had) {
      await db.from('ve_initiative_interest').insert({ initiative_slug: campaign, member_id: memberId, action_type: 'sponsor_tier', tier_label: 'Brand Partner interest',
        note: pt.listing.name + ': interested in ' + label, status: 'new', email: member.email, name: member.name, tags: ['brand-partner', pt.listing.slug], source: 'form' });
      await mailTo([accountManager(pt.listing), SEAN_EMAIL], `${pt.listing.name} wants in: ${label}`,
        `<p><b>${esc(pt.listing.name)}</b> marked interest in <b>${esc(label)}</b> from their Opportunities tab.</p><p>${esc(member.name || '')} &middot; ${esc(member.email || '')}</p>` +
        `<p>Reply to this email to reach them. It is on <a href="https://vegansexplore.com/dashboard/leads">/dashboard/leads</a> under ${esc(campaign)}.</p>`, member.email || undefined);
    }
    return json({ ok: true, on: true });
  }
  if (body.action === 'media_upload_url') {
    const pt = await partnerOf(String(body.listing_id || ''), member);
    if (!pt) return json({ error: 'not_partner' }, 403);
    const name = String(body.file_name || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-90) || 'file';
    const type = String(body.content_type || '');
    if (!/^(image\/(png|jpe?g|webp|gif|svg\+xml)|video\/(mp4|quicktime|webm)|application\/(pdf|zip))$/.test(type)) return json({ error: 'file_type' }, 400);
    const bytes = Number(body.bytes) || 0;
    if (bytes <= 0 || bytes > 524288000) return json({ error: 'file_size' }, 400);
    const kind = MEDIA_KINDS.includes(String(body.kind)) ? String(body.kind) : (type.startsWith('video/') ? 'video' : 'other');
    const path = `${pt.listing.slug}/${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}-${name}`;
    const { data: row, error } = await db.from('ve_brand_media').insert({ listing_id: pt.listing.id, member_id: memberId, path, file_name: String(body.file_name || name).slice(0, 200),
      content_type: type, bytes, kind, note: plain(body.note, 500) || null }).select('id').single();
    if (error || !row) return json({ error: 'save_failed', message: error?.message }, 500);
    const { data: up, error: upErr } = await db.storage.from('brand-partner-media').createSignedUploadUrl(path);
    if (upErr || !up) return json({ error: 'upload_url_failed', message: upErr?.message }, 500);
    return json({ id: row.id, signed_url: up.signedUrl });
  }
  if (body.action === 'media_done' || body.action === 'media_remove') {
    const id = String(body.id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: m } = await db.from('ve_brand_media').select('*').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    const pt = await partnerOf(m.listing_id, member);
    if (!pt) return json({ error: 'not_partner' }, 403);
    if (body.action === 'media_remove') {
      await db.storage.from('brand-partner-media').remove([m.path]);
      await db.from('ve_brand_media').update({ status: 'removed', updated_at: new Date().toISOString() }).eq('id', id);
      return json({ ok: true });
    }
    const folder = m.path.split('/').slice(0, -1).join('/'), file = m.path.split('/').pop();
    const { data: found } = await db.storage.from('brand-partner-media').list(folder, { search: file });
    if (!(found || []).some((f: any) => f.name === file)) return json({ error: 'not_uploaded' }, 409);
    await db.from('ve_brand_media').update({ status: 'received', updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'uploading');
    await mailTo([accountManager(pt.listing)], `${pt.listing.name} sent media: ${m.file_name}`,
      `<p><b>${esc(pt.listing.name)}</b> uploaded <b>${esc(m.file_name)}</b> (${esc(m.kind)}, ${Math.round((m.bytes || 0) / 1024)} KB)${m.note ? ': ' + esc(m.note) : ''}.</p>` +
      `<p>It is on their page under Media: <a href="https://vegansexplore.com/directory/${encodeURIComponent(pt.listing.slug)}?tab=media">vegansexplore.com/directory/${esc(pt.listing.slug)}?tab=media</a></p>`, member.email || undefined);
    return json({ ok: true });
  }
  if (body.action === 'media_list') {
    const pt = await partnerOf(String(body.listing_id || ''), member);
    if (!pt) return json({ error: 'not_partner' }, 403);
    const { data: rows } = await db.from('ve_brand_media').select('id, path, file_name, content_type, bytes, kind, note, status, created_at').eq('listing_id', pt.listing.id).in('status', ['received', 'in_use']).order('created_at', { ascending: false }).limit(200);
    const list = rows || [];
    const { data: signed } = list.length ? await db.storage.from('brand-partner-media').createSignedUrls(list.map((r: any) => r.path), 3600) : { data: [] };
    return json({ media: list.map((r: any, i: number) => ({ ...r, path: undefined, url: signed?.[i]?.signedUrl || null })) });
  }
  if (body.action === 'partner_ask') {
    const pt = await partnerOf(String(body.listing_id || ''), member);
    if (!pt) return json({ error: 'not_partner' }, 403);
    const message = plain(body.message, 1000);
    if (!message) return json({ error: 'message_required' }, 400);
    const since = new Date(Date.now() - 864e5).toISOString();
    const { count } = await db.from('guide_kb_questions').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('outcome', 'sent_to_person').gte('created_at', since);
    if ((count ?? 0) >= 10) return json({ error: 'daily_limit' }, 429);
    const ok = await mailTo([accountManager(pt.listing)], `${pt.listing.name} asked Maya: ${message.slice(0, 60)}`,
      `<p style="color:#666">A Brand Partner asked Maya on their page and there was no saved answer, so it came to you.</p>` +
      `<blockquote style="margin:12px 0;padding:12px 16px;background:#f3faf5;border-left:4px solid #16a34a;font-size:16px">${esc(message)}</blockquote>` +
      `<p><b>${esc(pt.listing.name)}</b> &middot; ${esc(member.name || '')} &middot; ${esc(member.email || '')}</p>` +
      `<p style="color:#666">Reply to this email and it goes straight to them. If other brands will ask the same thing, send the answer to Logan and it becomes a saved answer.</p>`, member.email || undefined);
    if (!ok) return json({ error: 'send_failed' }, 502);
    await db.from('guide_kb_questions').insert({ brand_slug: 'vegans-explore', member_id: memberId, guide_slug: 'maya', question: message, outcome: 'sent_to_person' });
    return json({ ok: true });
  }

  // A partner's products: swap the photo (or a version's) and the description in the brand's own words. The format stays
  // ours: name, ingredients and the cited Nutrition Facts are not editable here.
  if (body.action === 'product_photo_url' || body.action === 'product_update') {
    const pt = await partnerOf(String(body.listing_id || ''), member);
    if (!pt) return json({ error: 'not_partner' }, 403);
    const pid = String(body.product_id || '');
    if (!/^[0-9a-f-]{36}$/.test(pid)) return json({ error: 'bad_product' }, 400);
    const { data: prod } = await db.from('ve_products').select('id, slug, name, image_url, brand_says, variants, brand_listing_id').eq('id', pid).maybeSingle();
    if (!prod || prod.brand_listing_id !== pt.listing.id) return json({ error: 'not_your_product' }, 403);
    if (body.action === 'product_photo_url') {
      const type = String(body.content_type || '');
      const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[type];
      if (!ext) return json({ error: 'file_type' }, 400);
      const bytes = Number(body.bytes) || 0;
      if (bytes <= 0 || bytes > 15728640) return json({ error: 'file_size' }, 400);
      const path = `media/products/${prod.slug}/partner-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_url_failed', message: error?.message }, 500);
      return json({ path, signed_url: up.signedUrl });
    }
    const vkey = body.variant_key ? String(body.variant_key) : null;
    const variants = Array.isArray(prod.variants) ? prod.variants.slice() : [];
    const vi = vkey ? variants.findIndex((v: any) => v && v.key === vkey) : -1;
    if (vkey && vi < 0) return json({ error: 'bad_version' }, 400);
    const edits: any[] = [], patch: Record<string, unknown> = {};
    if (body.image_path) {
      const path = String(body.image_path);
      if (!path.startsWith(`media/products/${prod.slug}/partner-`) || path.includes('..')) return json({ error: 'bad_path' }, 400);
      const { data: file, error } = await db.storage.from('vegan-media').download(path);
      if (error || !file) return json({ error: 'not_uploaded' }, 409);
      const size = imageSize(new Uint8Array(await file.arrayBuffer()));
      if (!size || Math.min(size.w, size.h) < PRODUCT_PHOTO_MIN) {
        await db.storage.from('vegan-media').remove([path]);
        return json({ error: 'low_quality', width: size?.w ?? null, height: size?.h ?? null, min: PRODUCT_PHOTO_MIN }, 422);
      }
      const url = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/vegan-media/${path}`;
      if (vkey) { edits.push({ field: 'image', old_value: variants[vi].image || null, new_value: url, meta: size }); variants[vi] = { ...variants[vi], image: url }; }
      else { edits.push({ field: 'image', old_value: prod.image_url, new_value: url, meta: size }); patch.image_url = url; }
    }
    if (typeof body.description === 'string') {
      const text = plain(body.description, 1000);
      if (vkey) { if (text !== (variants[vi].description || '')) { edits.push({ field: 'description', old_value: variants[vi].description || null, new_value: text }); variants[vi] = { ...variants[vi], description: text }; } }
      else if (text !== (prod.brand_says || '')) { edits.push({ field: 'description', old_value: prod.brand_says, new_value: text }); patch.brand_says = text || null; }
    }
    if (!edits.length) return json({ ok: true, changed: 0 });
    if (vkey) patch.variants = variants;
    patch.updated_at = new Date().toISOString();
    const { error: upErr } = await db.from('ve_products').update(patch).eq('id', prod.id);
    if (upErr) return json({ error: 'save_failed', message: upErr.message }, 500);
    await db.from('ve_product_edits').insert(edits.map((e) => ({ product_id: prod.id, listing_id: pt.listing.id, member_id: memberId, variant_key: vkey, field: e.field, old_value: e.old_value, new_value: e.new_value, meta: e.meta || {} })));
    await mailTo([accountManager(pt.listing)], `${pt.listing.name} updated ${prod.name}`,
      `<p><b>${esc(pt.listing.name)}</b> changed ${edits.map((e) => e.field === 'image' ? 'the photo' : 'the description').join(' and ')} of <b>${esc(prod.name)}</b>${vkey ? ' (' + esc(String(variants[vi].name || vkey)) + ')' : ''}.</p>` +
      `<p><a href="https://vegansexplore.com/directory/${encodeURIComponent(pt.listing.slug)}?tab=products&product=${encodeURIComponent(prod.slug)}">See it on the page</a>. The old version is kept in ve_product_edits if it needs undoing.</p>`, member.email || undefined);
    return json({ ok: true, changed: edits.length, image_url: patch.image_url || (vkey && patch.variants ? variants[vi].image : undefined) });
  }
  // Any Vegan business, anywhere, applies to be listed (Sean, 2026-10-09: "any vegan business can apply to be part of the
  // directory... and that then brings them into our whole ecosystem"). The listing is made unlisted (quarantined) with a
  // claim waiting in Depot > Claims; approving it lists the business and makes the applicant its owner.
  if (body.action === 'listing_apply') {
    // Join the Directory (Sean, 2026-10-09: "once they sign up, it's the $11 just to lock in"): the application is locked in
    // with the same contribution as a claim, from $11. Until it is paid the listing stays unlisted and nobody is emailed.
    const b = body.business || {};
    const name = plain(b.name, 120), category = plain(b.category, 60), city = plain(b.city, 80), state = plain(b.state, 40);
    const description = plain(b.description, 2000), contact_name = plain(b.contact_name, 120), contact_email = plain(b.contact_email, 200).toLowerCase();
    const vegan_status = STATUSES.includes(String(b.vegan_status)) ? String(b.vegan_status) : '';
    // The way in for a new business is the Partner plan with Front Row Start (tier 'brand'), or the one-time contribution.
    // The page before Join the Directory sent neither; it still files a free application until every page is updated.
    const partner = body.tier === 'brand';
    const free = !partner && body.amount_cents == null;
    const cents = free ? 0 : partner ? TIERS.brand.cents : Math.round(Number(body.amount_cents));
    if (!name || !category || !city || !description || !vegan_status) return json({ error: 'missing_details' }, 400);
    if (!contact_name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact_email)) return json({ error: 'missing_contact' }, 400);
    if (!free && (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS)) return json({ error: 'invalid_amount', min_cents: MIN_CENTS }, 400);
    const proposed = { application: true, vegan_status, description, tagline: plain(b.tagline, 140), website: webUrl(b.website), instagram: plain(b.instagram, 60).replace(/^@/, ''), phone: plain(b.phone, 40), category, city, state };
    const fields = { name, category, specialty: category, description, tagline: proposed.tagline || null, location: [city, state].filter(Boolean).join(', '), address_city: city, address_state: state || null,
      website: proposed.website || '', instagram: proposed.instagram || null, phone: proposed.phone || null, vegan_status, ve_contact_name: contact_name, ve_contact_email: contact_email };
    const claimRow = { member_id: memberId, status: free ? 'submitted' : 'awaiting_contribution', contact_name, contact_email, contact_role: plain(b.contact_role, 120), contact_phone: plain(b.contact_phone, 40),
      contribution_cents: cents, tier: partner ? 'brand' : null, proposed, test: false, updated_at: new Date().toISOString() };
    const test = await isTestAccount(member.email); claimRow.test = test;
    // Coming back from a cancelled checkout: reuse their unpaid application for the same business instead of making another.
    const { data: unpaid } = await db.from('ve_listing_claims').select('id, listing_id').eq('member_id', memberId).eq('status', 'awaiting_contribution').contains('proposed', { application: true });
    const ids = (unpaid || []).map((c) => c.listing_id);
    const { data: same } = ids.length ? await db.from('listings').select('id, name').in('id', ids).eq('status', 'quarantined') : { data: [] };
    const hit = (same || []).find((l) => String(l.name).trim().toLowerCase() === name.toLowerCase());
    const open = hit ? (unpaid || []).find((c) => c.listing_id === hit.id) : null;
    let listing: { id: string; slug: string; name: string } | null = null, claimId = '';
    if (open && !free) {
      const { data: l } = await db.from('listings').update(fields).eq('id', open.listing_id).select('id, slug, name').single();
      await db.from('ve_listing_claims').update(claimRow).eq('id', open.id);
      listing = l; claimId = open.id;
    } else {
      const since = new Date(Date.now() - 864e5).toISOString();
      const { count } = await db.from('ve_listing_claims').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gte('created_at', since).contains('proposed', { application: true });
      if ((count ?? 0) >= 3) return json({ error: 'daily_limit' }, 429);
      const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'business';
      let slug = base;
      for (let k = 2; k < 50; k++) { const { data: taken } = await db.from('listings').select('id').eq('slug', slug).maybeSingle(); if (!taken) break; slug = `${base}-${k}`; }
      const initials = name.split(/\s+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase() || 'VE';
      const { data: l, error } = await db.from('listings').insert({ ...fields, slug, initials, status: 'quarantined', tags: ['ve-application'],
        claim_status: free ? 'pending' : 'unclaimed', claim_submitted_at: free ? new Date().toISOString() : null }).select('id, slug, name').single();
      if (error || !l) return json({ error: 'save_failed', message: error?.message }, 500);
      const { data: c, error: ce } = await db.from('ve_listing_claims').insert({ ...claimRow, listing_id: l.id }).select('id').single();
      if (ce || !c) return json({ error: 'save_failed', message: ce?.message }, 500);
      listing = l; claimId = c.id;
    }
    if (!listing) return json({ error: 'save_failed' }, 500);
    if (free) {
      await mailTo([SEAN_EMAIL], `New business wants to be listed: ${name}`,
        `<p><b>${esc(name)}</b> (${esc(category)}, ${esc([city, state].filter(Boolean).join(', '))}) applied to be listed on Vegans Explore.</p><p>${esc(description)}</p>` +
        `<p>${esc(contact_name)} &middot; ${esc(contact_email)}</p><p>Review it in <a href="https://vegansexplore.com/admin/depot/claims">Depot &gt; Claims</a>. Approving lists it and makes them the owner.</p>`, contact_email);
      return json({ ok: true, slug: listing.slug });
    }
    const back = backTo(body.return_url, 'https://vegansexplore.com/claim?add=1');
    if (partner) {
      const vrow = await verifiedRow(listing.id, member, 'brand', test, { name: contact_name, email: contact_email }, claimId);
      const pr = await verifiedCheckout(vrow, { ...listing, category }, member, back, claimId, frontRowTrialEnd('brand', body.offer));
      return pr.url ? json({ url: pr.url, slug: listing.slug, test_mode: test }) : json({ error: pr.error }, 400);
    }
    const r = await contributionCheckout(claimId, listing, member, cents, back, test, 'contribution with application to be listed');
    return r.url ? json({ url: r.url, slug: listing.slug, test_mode: test }) : json({ error: r.error }, 400);
  }

  // A brand's dashboard: what visitors did on its listing. Its owner, or a super admin showing it to the brand.
  if (body.action === 'brand_stats') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_request' }, 400);
    const { data: l } = await db.from('listings').select('id, owner_member_id, claimed_by_member_id').eq('id', id).maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    const owner = l.owner_member_id === memberId || l.claimed_by_member_id === memberId;
    if (!owner && !member.is_superadmin) return json({ error: 'not_owner' }, 403);
    const days = Math.min(365, Math.max(1, Math.round(Number(body.days) || 30)));
    const { data: stats, error } = await db.rpc('ve_listing_stats', { p_listing: id, p_days: days });
    if (error) return json({ error: 'stats_failed' }, 500);
    const v = await liveMembership(id);
    return json({ stats, plan: v ? { tier: v.tier, name: TIERS[v.tier]?.name, status: v.status, renews_at: v.renews_at } : null, admin: !owner });
  }

  // An owner who already holds the listing buys VE Verified.
  if (body.action === 'verified_start') {
    const id = String(body.listing_id || ''), tier = String(body.tier || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !TIERS[tier]) return json({ error: 'bad_request' }, 400);
    const { data: listing } = await db.from('listings').select('id, name, slug, category, owner_member_id, claimed_by_member_id, claim_status, address_city, address_state').eq('id', id).eq('status', 'approved').maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    if (listing.owner_member_id !== memberId && listing.claimed_by_member_id !== memberId) return json({ error: 'not_owner' }, 403);
    if (await liveMembership(id)) return json({ error: 'already_verified' }, 409);
    if (await reservedMembership(id)) return json({ error: 'already_reserved' }, 409);
    const test = await isTestAccount(member.email);
    const hub = tier === 'brand' ? null : hubOf(listing), f = await foundingState(hub);
    if (f.open) {
      if (f.full) return json({ error: 'founding_full', hub }, 409);
      await reserve(listing, member, tier, hub!, test, {});
      return json({ reserved: true, hub });
    }
    const back = backTo(body.return_url, `https://vegansexplore.com/claim?listing=${encodeURIComponent(listing.slug)}`);
    const row = await verifiedRow(id, member, tier, test, {});
    const r = await verifiedCheckout(row, listing, member, back, undefined, frontRowTrialEnd(tier, body.offer));
    return r.url ? json({ url: r.url, test_mode: test }) : json({ error: r.error }, 400);
  }

  if (body.action === 'start') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: listing } = await db.from('listings').select('id, name, slug, category, claim_status, address_city, address_state').eq('id', id).eq('status', 'approved').maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    if (listing.claim_status === 'verified') return json({ error: 'already_claimed' }, 409);
    const tier = body.tier ? String(body.tier) : '';
    if (tier && !TIERS[tier]) return json({ error: 'bad_tier' }, 400);
    if (tier && await liveMembership(id)) return json({ error: 'already_verified' }, 409);
    if (tier && await reservedMembership(id)) return json({ error: 'already_reserved' }, 409);
    const hub = tier && tier !== 'brand' ? hubOf(listing) : null, f = tier ? await foundingState(hub) : { open: false, full: false };
    if (tier && f.open && f.full) return json({ error: 'founding_full', hub }, 409);
    const cents = tier ? TIERS[tier].cents : Math.round(Number(body.amount_cents));
    if (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS) return json({ error: 'invalid_amount', min_cents: MIN_CENTS }, 400);
    const contact_name = plain(body.contact_name, 120), contact_email = plain(body.contact_email, 200).toLowerCase();
    if (!contact_name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact_email)) return json({ error: 'missing_contact' }, 400);
    const p = body.proposed || {};
    const proposed = {
      tagline: plain(p.tagline, 140), description: plain(p.description, 2000), website: webUrl(p.website),
      phone: plain(p.phone, 40), instagram: plain(p.instagram, 60).replace(/^@/, ''),
      vegan_status: STATUSES.includes(String(p.vegan_status)) ? String(p.vegan_status) : '',
    };
    // A product brand (Brand Partner) is not asked how Vegan it is or to describe itself: its page is built from our Guides.
    // Join the Directory (Sean, 2026-10-09): a brand can also claim with the $11 lock-in, without the restaurant questions.
    if (!BRAND_CATS.test(listing.category || '') && (!proposed.vegan_status || !proposed.description)) return json({ error: 'missing_details' }, 400);
    const test = await isTestAccount(member.email);
    const back = backTo(body.return_url, `https://vegansexplore.com/claim?listing=${encodeURIComponent(listing.slug)}`);
    const row = { listing_id: id, member_id: memberId, status: 'awaiting_contribution', contact_name, contact_role: plain(body.contact_role, 120),
      contact_email, contact_phone: plain(body.contact_phone, 40), proposed, contribution_cents: cents, tier: tier || null, test, updated_at: new Date().toISOString() };
    // One open claim per member and listing: reuse it if they come back before paying.
    const { data: open } = await db.from('ve_listing_claims').select('id').eq('member_id', memberId).eq('listing_id', id).eq('status', 'awaiting_contribution').maybeSingle();
    const { data: claim, error } = open
      ? await db.from('ve_listing_claims').update(row).eq('id', open.id).select('id').single()
      : await db.from('ve_listing_claims').insert(row).select('id').single();
    if (error || !claim) return json({ error: 'save_failed', message: error?.message }, 500);
    if (tier && f.open) {
      // Founding spot with a claim: reserved free; the claim is confirmed with the first payment.
      await reserve(listing, member, tier, hub!, test, { name: contact_name, email: contact_email }, claim.id);
      return json({ reserved: true, hub });
    }
    if (tier) {
      // Claim and a Passport tier in one quarterly subscription checkout; the claim is confirmed when it is paid.
      const vrow = await verifiedRow(id, member, tier, test, { name: contact_name, email: contact_email }, claim.id);
      const r = await verifiedCheckout(vrow, listing, member, back, claim.id, frontRowTrialEnd(tier, body.offer));
      if (!r.url) return json({ error: r.error }, 400);
      await db.from('ve_listing_claims').update({ stripe_session_id: null }).eq('id', claim.id);
      return json({ url: r.url, test_mode: test });
    }
    const r = await contributionCheckout(claim.id, listing, member, cents, back, test, 'contribution with listing claim');
    return r.url ? json({ url: r.url, test_mode: test }) : json({ error: r.error }, 400);
  }

  // A founding spot whose billing the Depot opened: subscribe now, first charge on the first Challenge month.
  if (body.action === 'founding_checkout') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const row = await reservedMembership(id);
    const { data: listing } = await db.from('listings').select('id, name, slug, owner_member_id').eq('id', id).maybeSingle();
    if (!row || !listing) return json({ error: 'not_found' }, 404);
    if (row.member_id !== memberId && listing.owner_member_id !== memberId && !member.is_superadmin) return json({ error: 'not_owner' }, 403);
    if (!row.billing_opened_at) return json({ error: 'billing_not_open' }, 409);
    const back = backTo(body.return_url, `https://vegansexplore.com/claim?listing=${encodeURIComponent(listing.slug)}`);
    const r = await verifiedCheckout(row, listing, member, back, row.claim_id || undefined);
    return r.url ? json({ url: r.url, test_mode: row.test }) : json({ error: r.error }, 400);
  }

  // Four quarters for the price of three, from the next renewal.
  if (body.action === 'commit_year') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const row = await liveMembership(id);
    const { data: listing } = await db.from('listings').select('owner_member_id').eq('id', id).maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    if (row.member_id !== memberId && listing?.owner_member_id !== memberId && !member.is_superadmin) return json({ error: 'not_owner' }, 403);
    if (!(await canCommit(row))) return json({ error: 'not_eligible' }, 409);
    const { ok, body: sub } = await stripe(row.test, `subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`);
    const item = sub?.items?.data?.[0];
    if (!ok || !item) return json({ error: 'stripe_error' }, 400);
    const product = typeof item.price?.product === 'string' ? item.price.product : item.price?.product?.id;
    const quarterly = item.price?.unit_amount || row.amount_cents || TIERS[row.tier].cents;
    const pr = await stripe(row.test, 'prices', new URLSearchParams({ currency: 'usd', product, unit_amount: String(quarterly * 3), 'recurring[interval]': 'year',
      nickname: `${TIERS[row.tier].name}, four quarters for three` }));
    if (!pr.ok) return json({ error: pr.body?.error?.message || 'stripe_error' }, 400);
    const up = await stripe(row.test, `subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`, new URLSearchParams({
      'items[0][id]': item.id, 'items[0][price]': pr.body.id, proration_behavior: 'none', 'metadata[committed]': 'four_for_three' }));
    if (!up.ok) return json({ error: up.body?.error?.message || 'stripe_error' }, 400);
    const now = new Date().toISOString();
    await db.from('ve_verified_memberships').update({ committed_at: now, updated_at: now }).eq('id', row.id);
    await mail(`${row.test ? '[TEST] ' : ''}Four for three: ${id}`, `<p>A ${esc(TIERS[row.tier].name)} business switched to four quarters for the price of three ($${(quarterly * 3 / 100).toFixed(0)} a year) from its next renewal.</p>`);
    return json({ ok: true, yearly_cents: quarterly * 3 });
  }

  // Results sheets: the business that holds the listing, or a superadmin.
  if (body.action === 'results' || body.action === 'results_list') {
    const q = body.action === 'results'
      ? db.from('ve_results_sheets').select('*, membership:ve_verified_memberships(tier, member_id, listing_id), listing:listings(id, name, slug, owner_member_id, logo_url)').eq('id', String(body.id || ''))
      : db.from('ve_results_sheets').select('id, period_start, period_end, data, membership:ve_verified_memberships(tier, member_id), listing:listings(id, name, slug, owner_member_id)').eq('listing_id', String(body.listing_id || '')).order('period_end', { ascending: false });
    const { data } = await q;
    const list = (data || []).filter((x: any) => member.is_superadmin || x.listing?.owner_member_id === memberId || x.membership?.member_id === memberId);
    if (body.action === 'results') {
      if (!list[0]) return json({ error: 'not_found' }, 404);
      const lv = await liveMembership(list[0].listing_id);
      return json({ sheet: list[0], tier_name: TIERS[list[0].membership?.tier]?.name, can_commit: lv ? await canCommit(lv) : false });
    }
    return json({ sheets: list });
  }

  // ---- The Depot (superadmins only).
  if (!String(body.action || '').startsWith('admin_')) return json({ error: 'unknown_action' }, 400);
  if (!member.is_superadmin) return json({ error: 'no_access' }, 403);

  if (body.action === 'admin_list') {
    const { data: claims, error } = await db.from('ve_listing_claims')
      .select('id, status, tier, contact_name, contact_role, contact_email, contact_phone, proposed, contribution_cents, paid_cents, paid_at, test, review_note, reviewed_at, created_at, listing:listings(id, name, slug, address_city, vegan_status, logo_url, claim_status), member:members(id, name, email)')
      .neq('status', 'cancelled').order('created_at', { ascending: false }).limit(300);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    const { data: trust } = await db.from('ve_site_settings').select('value').eq('key', 'directory_trust').maybeSingle();
    return json({ claims: claims || [], trust: trust?.value || { enabled: false, min_voters: 10 } });
  }

  if (body.action === 'admin_trust') {
    const min = Math.round(Number(body.min_voters));
    const value = { enabled: !!body.enabled, min_voters: Number.isFinite(min) && min >= 1 && min <= 1000 ? min : 10 };
    const { error } = await db.from('ve_site_settings').upsert({ key: 'directory_trust', value, updated_at: new Date().toISOString(), updated_by: memberId });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, trust: value });
  }

  if (body.action === 'admin_listing') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.category !== undefined) { if (!CATEGORIES.includes(String(body.category))) return json({ error: 'bad_category' }, 400); patch.category = String(body.category); }
    if (body.extra_categories !== undefined) {
      const main = String(patch.category ?? body.category ?? '');
      patch.extra_categories = [...new Set((Array.isArray(body.extra_categories) ? body.extra_categories : []).map(String))]
        .filter((c) => CATEGORIES.includes(c) && c !== main).slice(0, 6);
    }
    if (body.vegan_status !== undefined) { if (!STATUSES.includes(String(body.vegan_status))) return json({ error: 'bad_vegan_status' }, 400); patch.vegan_status = String(body.vegan_status); }
    if (body.business_status !== undefined) { if (!BUSINESS.includes(String(body.business_status))) return json({ error: 'bad_business_status' }, 400); patch.business_status = String(body.business_status); }
    if (body.name !== undefined) { const n = plain(body.name, 160); if (!n) return json({ error: 'bad_name' }, 400); patch.name = n; }
    if (body.address) {
      const a = body.address;
      if (a.online) Object.assign(patch, { address_street: null, address_city: null, address_state: null, address_zip: null, location: 'Online', latitude: null, longitude: null });
      else {
        const city = plain(a.city, 80), state = plain(a.state, 40).toUpperCase();
        if (!city) return json({ error: 'bad_city' }, 400);
        // The map pin follows the street address (listing.html links to Google Maps by address);
        // the old coordinates would point at the old place, so they go.
        Object.assign(patch, { address_street: plain(a.street, 160) || null, address_city: city, address_state: state || null, address_zip: plain(a.zip, 12) || null,
          location: city + (state ? ', ' + state : ''), latitude: null, longitude: null });
      }
    }
    if (body.details) {
      const d = body.details;
      patch.atmosphere = ATMOSPHERES.includes(String(d.atmosphere)) ? String(d.atmosphere) : null;
      patch.accommodations = (Array.isArray(d.accommodations) ? d.accommodations : []).map(String).filter((x: string) => ACCOMMODATIONS.includes(x));
      for (const k of ['indoor_seating', 'late_hours', 'high_speed_wifi']) patch[k] = !!d[k];
      const owned = (Array.isArray(d.owned) ? d.owned : []).map(String);
      for (const k of OWNED) patch[k] = owned.includes(k);
      patch.lgbtq_friendly = owned.includes('is_lgbtq_owned'); // At a Glance reads this one for LGBTQ+-Owned
    }
    const { data, error } = await db.from('listings').update(patch).eq('id', id)
      .select('id, slug, name, category, extra_categories, vegan_status, business_status, address_street, address_city, address_state, address_zip, location, atmosphere, accommodations, indoor_seating, late_hours, high_speed_wifi, ' + OWNED.join(', ')).single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, listing: data });
  }

  if (body.action === 'admin_verified_list') {
    const { data: rows, error } = await db.from('ve_verified_memberships')
      .select('*, listing:listings(id, name, slug, address_city, logo_url, color, claim_status, ve_verified), member:members(id, name, email)')
      .neq('status', 'abandoned').order('created_at', { ascending: false }).limit(500);
    if (error) return json({ error: 'list_failed', message: error.message }, 500);
    // Heal anything a missed webhook left behind: live Stripe rows near or past renewal, and any flagged to cancel.
    const soon = Date.now() + 14 * 864e5;
    const out = [];
    for (const r of rows || []) {
      const stale = LIVE.includes(r.status) && r.source === 'stripe' && (!r.renews_at || new Date(r.renews_at).getTime() < soon || r.cancel_at_period_end);
      out.push(stale ? { ...r, ...(await syncFromStripe(r)), listing: r.listing, member: r.member } : r);
    }
    const caps = await setting('founding_caps'), extras = await setting('quarter_extras');
    const hubs = [];
    for (const h of Object.keys(HUBS)) hubs.push({ slug: h, name: HUBS[h].name, ...(await foundingState(h)), set_cap: Number.isFinite(+caps[h]) && +caps[h] > 0 ? +caps[h] : null });
    return json({ rows: out.filter((r) => r.status !== 'awaiting_payment' || Date.now() - new Date(r.created_at).getTime() < 2 * 864e5), hubs, extras, quarter: QUARTER_LABEL() });
  }

  if (body.action === 'admin_founding_open') {
    const id = String(body.id || ''), from = String(body.bill_from || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(from)) return json({ error: 'bad_request' }, 400);
    const { data: row } = await db.from('ve_verified_memberships').select('*, listing:listings(name, slug)').eq('id', id).eq('status', 'reserved').maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    const now = new Date().toISOString();
    await db.from('ve_verified_memberships').update({ bill_from: from, billing_opened_at: now, updated_at: now }).eq('id', id);
    const link = `https://vegansexplore.com/claim?listing=${encodeURIComponent(row.listing?.slug || '')}&founding=start`;
    const day = new Date(from + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    await sendTo(row.contact_email, `Your founding ${TIERS[row.tier].name} spot starts ${day}`,
      `<p>Good news: your first Passport Challenge month in ${esc(HUBS[row.hub]?.name || '')} starts ${esc(day)}.</p>` +
      `<p>Set up billing here: <a href="${link}">${link}</a>. Your card is saved today and your first quarter, at your founding price of $${(row.amount_cents / 100).toFixed(0)}, is charged on ${esc(day)}.</p>` +
      `<p>We will be in touch to schedule your visit, photo shoot and staff training before your month starts. If they aren't ready in time, that month is on us.</p><p>The Vegans Explore team</p>`);
    return json({ ok: true, link });
  }

  if (body.action === 'admin_offer_settings') {
    const now = new Date().toISOString();
    if (body.caps !== undefined) {
      const caps: Record<string, number> = {};
      for (const [k, v] of Object.entries(body.caps || {})) if (HUBS[k] && Number.isFinite(+(v as number)) && +(v as number) > 0) caps[k] = Math.min(500, Math.round(+(v as number)));
      await db.from('ve_site_settings').upsert({ key: 'founding_caps', value: caps, updated_at: now, updated_by: memberId });
    }
    if (body.extras !== undefined) {
      const extras: Record<string, { title: string; text: string }> = {};
      for (const [k, v] of Object.entries(body.extras || {})) {
        const e = v as any;
        if (/^\d{4}-Q[1-4]$/.test(k) && plain(e?.title, 120)) extras[k] = { title: plain(e.title, 120), text: plain(e.text, 600) };
      }
      await db.from('ve_site_settings').upsert({ key: 'quarter_extras', value: extras, updated_at: now, updated_by: memberId });
    }
    return json({ ok: true, caps: await setting('founding_caps'), extras: await setting('quarter_extras') });
  }

  if (body.action === 'admin_results') {
    const id = String(body.membership_id || '');
    const { data: row } = await db.from('ve_verified_memberships').select('*').eq('id', id).maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    const { data: sheets } = await db.from('ve_results_sheets').select('*').eq('membership_id', id).order('period_end', { ascending: false });
    let current = null;
    if (row.paid_at) {
      const paid = new Date(row.paid_at); let k = 0;
      while (monthsLater(paid, 3 * (k + 1)).getTime() <= Date.now() && k < 40) k++;
      const from = monthsLater(paid, 3 * k), to = monthsLater(paid, 3 * (k + 1));
      const { data: d } = await db.rpc('ve_results_data', { p_listing: row.listing_id, p_from: from.toISOString(), p_to: new Date().toISOString() });
      current = { period_start: from.toISOString(), period_end: to.toISOString(), data: d };
    }
    return json({ sheets: sheets || [], current });
  }

  if (body.action === 'admin_results_send') {
    const { data: sh } = await db.from('ve_results_sheets').select('*').eq('id', String(body.id || '')).maybeSingle();
    if (!sh) return json({ error: 'not_found' }, 404);
    const { data: row } = await db.from('ve_verified_memberships').select('*').eq('id', sh.membership_id).single();
    await db.from('ve_results_sheets').update({ sent_at: null }).eq('id', sh.id);
    await resultsSheet(row, new Date(sh.period_start), new Date(sh.period_end), true);
    return json({ ok: true });
  }

  if (body.action === 'admin_verified_mark') {
    const id = String(body.id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const when = (v: unknown) => (v === true ? new Date().toISOString() : v === false || v === null ? null : (() => { const d = new Date(String(v)); return isNaN(d.getTime()) ? undefined : d.toISOString(); })());
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.visit_done !== undefined) { const w = when(body.visit_done); if (w === undefined) return json({ error: 'bad_date' }, 400); patch.visit_done_at = w; }
    if (body.shoot_done !== undefined) { const w = when(body.shoot_done); if (w === undefined) return json({ error: 'bad_date' }, 400); patch.shoot_done_at = w; }
    if (body.notes !== undefined) patch.notes = plain(body.notes, 1000) || null;
    const { data, error } = await db.from('ve_verified_memberships').update(patch).eq('id', id).select('id, visit_done_at, shoot_done_at, notes').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, row: data });
  }

  if (body.action === 'admin_verified_grant') {
    const id = String(body.listing_id || ''), tier = String(body.tier || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !TIERS[tier]) return json({ error: 'bad_request' }, 400);
    const { data: listing } = await db.from('listings').select('id, name, owner_member_id, ve_contact_name, ve_contact_email').eq('id', id).maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    if (await liveMembership(id)) return json({ error: 'already_verified' }, 409);
    const paid = body.paid_at ? new Date(String(body.paid_at)) : new Date();
    const renews = body.renews_at ? new Date(String(body.renews_at)) : monthsLater(paid, 3);
    if (isNaN(paid.getTime()) || isNaN(renews.getTime()) || renews <= new Date()) return json({ error: 'bad_date' }, 400);
    const { data, error } = await db.from('ve_verified_memberships').insert({
      listing_id: id, member_id: listing.owner_member_id || null, tier, status: 'active', source: 'manual', amount_cents: Math.max(0, Math.round(Number(body.amount_cents ?? TIERS[tier].cents)) || 0),
      contact_name: listing.ve_contact_name || null, contact_email: listing.ve_contact_email || null,
      paid_at: paid.toISOString(), last_paid_at: paid.toISOString(), current_period_start: paid.toISOString(), renews_at: renews.toISOString(),
      notes: plain(body.notes, 1000) || null, created_by: memberId,
    }).select('id').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, id: data.id });
  }

  if (body.action === 'admin_verified_end') {
    const id = String(body.id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: row } = await db.from('ve_verified_memberships').select('*').eq('id', id).maybeSingle();
    if (!row) return json({ error: 'not_found' }, 404);
    if (row.source === 'stripe' && row.stripe_subscription_id && LIVE.includes(row.status)) {
      const { ok, body: b } = await stripe(row.test, `subscriptions/${encodeURIComponent(row.stripe_subscription_id)}`, undefined, 'DELETE');
      if (!ok && b?.error?.code !== 'resource_missing') return json({ error: b?.error?.message || 'stripe_error' }, 400);
    }
    const now = new Date().toISOString();
    const { error } = await db.from('ve_verified_memberships').update({ status: 'canceled', canceled_at: now, updated_at: now }).eq('id', id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  if (body.action === 'admin_review') {
    const id = String(body.id || ''), decision = String(body.decision || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !['approve', 'reject'].includes(decision)) return json({ error: 'bad_request' }, 400);
    const { data: claim } = await db.from('ve_listing_claims').select('*').eq('id', id).maybeSingle();
    if (!claim) return json({ error: 'not_found' }, 404);
    const now = new Date().toISOString();
    if (decision === 'approve') {
      const p = claim.proposed || {};
      const patch: Record<string, unknown> = {
        claim_status: 'verified', claimed_by_member_id: claim.member_id, owner_member_id: claim.member_id, updated_at: now,
        ve_contact_name: claim.contact_name, ve_contact_email: claim.contact_email, ve_contact_phone: claim.contact_phone || null,
      };
      for (const k of ['tagline', 'description', 'website', 'phone', 'instagram', 'vegan_status']) if (p[k]) patch[k] = p[k];
      // An application to be listed goes live when approved.
      if (p.application) { patch.status = 'approved'; patch.tags = ['ve-application-approved']; }
      const { error } = await db.from('listings').update(patch).eq('id', claim.listing_id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      // A Brand Partner hears that its dashboard is open (Sean, 2026-10-09: "what happens to the Oatly rep once they sign up?").
      if (claim.tier === 'brand' && claim.contact_email && !BRAND_CATS.test((await db.from('listings').select('category').eq('id', claim.listing_id).maybeSingle()).data?.category || '')) {
        const { data: pl } = await db.from('listings').select('name, slug').eq('id', claim.listing_id).maybeSingle();
        await mailTo([claim.contact_email], `${pl?.name || 'Your business'}: your page is confirmed`,
          `<p>Hi ${esc(claim.contact_name || '')},</p><p>We confirmed it is you, so ${esc(pl?.name || 'your')}'s Partner Dashboard is open on your page: <a href="https://vegansexplore.com/directory/${encodeURIComponent(pl?.slug || '')}?tab=brand">vegansexplore.com/directory/${esc(pl?.slug || '')}</a> (sign in with this email).</p>` +
          `<p>You have a front-row seat on our campaigns: we send each one to you before it opens, so you can choose where you fit. Questions? Reply to this email.</p><p>The Vegans Explore team</p>`, 'hello@vegansexplore.com');
      } else if (claim.tier === 'brand' && claim.contact_email) {
        const { data: bl } = await db.from('listings').select('name, slug').eq('id', claim.listing_id).maybeSingle();
        await mailTo([claim.contact_email], `${bl?.name || 'Your brand'}: your page is confirmed`,
          `<p>Hi ${esc(claim.contact_name || '')},</p><p>We confirmed it is you, so ${esc(bl?.name || 'your')}'s full dashboard is open: views, visitors, the products people open and the store aisles they look for you in.</p>` +
          `<p>Your page is your home with us. Maya walks you through Getting Started, then Opportunities, Media and Ask Maya: <a href="https://vegansexplore.com/directory/${encodeURIComponent(bl?.slug || '')}?tab=brand">vegansexplore.com/directory/${esc(bl?.slug || '')}</a> (sign in with this email).</p>` +
          `<p>Questions? Reply to this email.</p><p>The Vegans Explore team</p>`, 'hello@vegansexplore.com');
      }
      // Anyone else waiting on the same listing is turned down, with the reason.
      await db.from('ve_listing_claims').update({ status: 'rejected', review_note: 'Another claim for this listing was approved.', reviewed_by: memberId, reviewed_at: now, updated_at: now })
        .eq('listing_id', claim.listing_id).neq('id', id).in('status', ['awaiting_contribution', 'submitted']);
    } else {
      const { count } = await db.from('ve_listing_claims').select('id', { count: 'exact', head: true }).eq('listing_id', claim.listing_id).eq('status', 'submitted').neq('id', id);
      if (!count) await db.from('listings').update({ claim_status: 'unclaimed', updated_at: now }).eq('id', claim.listing_id).eq('claim_status', 'pending');
    }
    const { error } = await db.from('ve_listing_claims').update({ status: decision === 'approve' ? 'approved' : 'rejected', review_note: plain(body.note, 500) || null, reviewed_by: memberId, reviewed_at: now, updated_at: now }).eq('id', id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
