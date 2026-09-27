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
//   POST { action: 'verified_start', listing_id, tier, return_url }  -> { url }  an owner already
//     holding the listing buys VE Verified ($250/yr) or VE Verified Plus ($500/yr)
//
// VE Verified (playbook ve-verified-tours-hunt, group A): a yearly Stripe SUBSCRIPTION on the VE
// account, so renewal is automatic and the renewal date is Stripe's current_period_end. Each
// purchase is a ve_verified_memberships row; a trigger keeps listings.ve_verified_tier /
// ve_verified_until / ve_verified (badge: paid AND the VE visit has happened) in step.
// ve-stripe-webhook records renewals and cancellations; the return trip and the Depot list also
// read the subscription straight from Stripe, so a missed webhook heals itself.
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
// VE Verified tiers (Sean, 2026-09-27). Yearly, renewing.
const TIERS: Record<string, { cents: number; name: string }> = {
  verified: { cents: 25000, name: 'VE Verified' },
  plus: { cents: 50000, name: 'VE Verified Plus' },
};
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
async function verifiedCheckout(row: any, listing: any, member: any, back: string, claimId?: string): Promise<{ url?: string; error?: string }> {
  const t = TIERS[row.tier];
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': (row.test ? '[TEST] ' : '') + `${t.name} (yearly) - ${listing.name}`.slice(0, 120),
    'line_items[0][price_data][unit_amount]': String(t.cents),
    'line_items[0][price_data][recurring][interval]': 'year',
    'line_items[0][quantity]': '1',
    success_url: `${FN_URL}?verified_confirm={CHECKOUT_SESSION_ID}`,
    cancel_url: withParam(back, 'verified', 'cancelled'),
    customer_email: member.email,
    billing_address_collection: 'auto',
  });
  const meta: Record<string, string> = { type: 've_verified', verified_id: row.id, listing_id: listing.id, member_id: member.id, tier: row.tier };
  if (claimId) meta.claim_id = claimId;
  if (row.test) meta.test = 'true';
  for (const [k, v] of Object.entries(meta)) { params.set(`metadata[${k}]`, v); params.set(`subscription_data[metadata][${k}]`, v); }
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
// Paid: activate the membership from the Stripe session (the return trip and the webhook both land here).
async function activateVerified(sessionId: string): Promise<{ row: any; listing: any } | null> {
  const { data: row } = await db.from('ve_verified_memberships').select('*').eq('stripe_session_id', sessionId).maybeSingle();
  if (!row) return null;
  const { data: listing } = await db.from('listings').select('id, name, slug, address_city').eq('id', row.listing_id).maybeSingle();
  if (row.status !== 'awaiting_payment') return { row, listing };
  const { ok, body: s } = await stripe(row.test, `checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`);
  if (!ok || s.status !== 'complete' || s.metadata?.verified_id !== row.id || !s.subscription) return null;
  const sub = typeof s.subscription === 'string' ? (await stripe(row.test, `subscriptions/${s.subscription}`)).body : s.subscription;
  const p = period(sub), now = new Date().toISOString();
  const { data: upd } = await db.from('ve_verified_memberships').update({
    status: subStatus(sub.status) === 'awaiting_payment' ? 'active' : subStatus(sub.status), stripe_subscription_id: sub.id,
    stripe_customer_id: typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null,
    paid_at: now, last_paid_at: now, current_period_start: p.start || now, renews_at: p.end, updated_at: now,
  }).eq('id', row.id).eq('status', 'awaiting_payment').select('*').maybeSingle();
  if (!upd) return { row, listing }; // the other path got here first
  // A purchase makes the buyer a member, the same as a claim contribution.
  if (row.member_id) await db.from('members').update({ membership_status: 'active', entry_paid_at: now, updated_at: now }).eq('id', row.member_id).neq('membership_status', 'active');
  if (row.claim_id) {
    await db.from('ve_listing_claims').update({ status: 'submitted', paid_cents: s.amount_total ?? row.amount_cents, paid_at: now, updated_at: now }).eq('id', row.claim_id).eq('status', 'awaiting_contribution');
    await db.from('listings').update({ claim_status: 'pending', claim_submitted_at: now }).eq('id', row.listing_id).neq('claim_status', 'verified');
  }
  const t = TIERS[row.tier], renew = p.end ? new Date(p.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : '';
  await mail(`${row.test ? '[TEST] ' : ''}${t.name}: ${listing?.name || 'a listing'}, $${(t.cents / 100).toFixed(0)}/yr`,
    `<p><b>${esc(listing?.name || '')}</b> (${esc(listing?.address_city || '')}) bought <b>${t.name}</b> at $${(t.cents / 100).toFixed(0)} a year${renew ? `, renewing ${esc(renew)}` : ''}.</p>` +
    `<p>${esc(row.contact_name || '')}<br>${esc(row.contact_email || '')}</p>` +
    (row.claim_id ? '<p>This came with a listing claim, which is waiting for your review.</p>' : '') +
    `<p>Next: schedule the visit and photo shoot. Track it in the Depot: <a href="https://vegansexplore.com/admin/depot/verified">vegansexplore.com/admin/depot/verified</a></p>`, row.contact_email || undefined);
  if (row.contact_email && RESEND_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [row.contact_email], reply_to: 'hello@vegansexplore.com',
          subject: `Welcome to ${t.name}`,
          html: `<p>Thank you for joining ${t.name}${listing?.name ? ' with ' + esc(listing.name) : ''}.</p>` +
            `<p>Next, someone from Vegans Explore will reach out to schedule an in-person visit and your photo shoot. Your Verified badge goes on your listing once we have visited.</p>` +
            `<p>Your membership renews yearly${renew ? ' (next on ' + esc(renew) + ')' : ''}. Questions? Reply to this email.</p>` +
            `<p>The Vegans Explore team</p>` }),
      });
    } catch (e) { console.error('verified welcome email failed', e); }
  }
  return { row: upd, listing };
}

// ---- Stripe return: confirm the contribution and send the visitor back.
async function confirm(sessionId: string): Promise<Response> {
  const fallback = 'https://vegansexplore.com/claim';
  const { data: claim } = await db.from('ve_listing_claims').select('*').eq('stripe_session_id', sessionId).maybeSingle();
  if (!claim) return Response.redirect(fallback, 302);
  const { data: listing } = await db.from('listings').select('id, name, slug, address_city').eq('id', claim.listing_id).maybeSingle();
  const back = withParam(`https://vegansexplore.com/claim?listing=${encodeURIComponent(listing?.slug || '')}`, 'claim', 'submitted');
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
  await mail(`${claim.test ? '[TEST] ' : ''}Listing claim: ${listing?.name || 'a listing'}, $${dollars}`,
    `<p><b>${esc(listing?.name || '')}</b> (${esc(listing?.address_city || '')}) was claimed with a <b>$${dollars}</b> contribution.</p>` +
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
      return Response.redirect(`https://vegansexplore.com/claim?listing=${encodeURIComponent(r.listing?.slug || '')}&verified=active`, 302);
    } catch (e) { console.error('verified confirm failed', e); return Response.redirect('https://vegansexplore.com/claim?verified=unpaid', 302); }
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
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
      let v = await liveMembership(lid);
      if (v && (v.member_id === memberId || l?.owner_member_id === memberId || member.is_superadmin)) {
        v = await syncFromStripe(v);
        verified = { tier: v.tier, status: v.status, renews_at: v.renews_at, cancel_at_period_end: v.cancel_at_period_end, visit_done: !!v.visit_done_at, source: v.source };
      }
      return json({ claim: data || null, verified, owner: !!l && l.owner_member_id === memberId });
    }
    return json({ claim: data || null, verified });
  }

  // An owner who already holds the listing buys VE Verified.
  if (body.action === 'verified_start') {
    const id = String(body.listing_id || ''), tier = String(body.tier || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !TIERS[tier]) return json({ error: 'bad_request' }, 400);
    const { data: listing } = await db.from('listings').select('id, name, slug, owner_member_id, claimed_by_member_id, claim_status').eq('id', id).eq('status', 'approved').maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    if (listing.owner_member_id !== memberId && listing.claimed_by_member_id !== memberId) return json({ error: 'not_owner' }, 403);
    if (await liveMembership(id)) return json({ error: 'already_verified' }, 409);
    const test = await isTestAccount(member.email);
    const back = backTo(body.return_url, `https://vegansexplore.com/claim?listing=${encodeURIComponent(listing.slug)}`);
    const row = await verifiedRow(id, member, tier, test, {});
    const r = await verifiedCheckout(row, listing, member, back);
    return r.url ? json({ url: r.url, test_mode: test }) : json({ error: r.error }, 400);
  }

  if (body.action === 'start') {
    const id = String(body.listing_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_id' }, 400);
    const { data: listing } = await db.from('listings').select('id, name, slug, claim_status').eq('id', id).eq('status', 'approved').maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    if (listing.claim_status === 'verified') return json({ error: 'already_claimed' }, 409);
    const tier = body.tier ? String(body.tier) : '';
    if (tier && !TIERS[tier]) return json({ error: 'bad_tier' }, 400);
    if (tier && await liveMembership(id)) return json({ error: 'already_verified' }, 409);
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
    if (!proposed.vegan_status || !proposed.description) return json({ error: 'missing_details' }, 400);
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
    if (tier) {
      // Claim and VE Verified in one yearly subscription checkout; the claim is confirmed when it is paid.
      const vrow = await verifiedRow(id, member, tier, test, { name: contact_name, email: contact_email }, claim.id);
      const r = await verifiedCheckout(vrow, listing, member, back, claim.id);
      if (!r.url) return json({ error: r.error }, 400);
      await db.from('ve_listing_claims').update({ stripe_session_id: null }).eq('id', claim.id);
      return json({ url: r.url, test_mode: test });
    }
    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': (test ? '[TEST] ' : '') + `Vegans Explore - contribution with listing claim (${listing.name})`.slice(0, 120),
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
      'metadata[claim_id]': claim.id,
      'metadata[listing_id]': id,
    });
    if (test) params.set('metadata[test]', 'true');
    const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString(),
    });
    const s = await sres.json();
    if (!sres.ok) { console.error('stripe error', s); return json({ error: s.error?.message ?? 'stripe_error' }, 400); }
    await db.from('ve_listing_claims').update({ stripe_session_id: s.id }).eq('id', claim.id);
    return json({ url: s.url, test_mode: test });
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
    return json({ rows: out.filter((r) => r.status !== 'awaiting_payment' || Date.now() - new Date(r.created_at).getTime() < 2 * 864e5) });
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
    const renews = body.renews_at ? new Date(String(body.renews_at)) : new Date(new Date(paid).setFullYear(paid.getFullYear() + 1));
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
      const { error } = await db.from('listings').update(patch).eq('id', claim.listing_id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
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
