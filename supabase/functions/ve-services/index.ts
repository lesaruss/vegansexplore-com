// ve-services: "Need just one thing?" a la carte services for Vegans Explore businesses
// (Business Offer v2, playbook ve-verified-tours-hunt, locked by Sean 2026-09-27). Any business
// that holds its listing can book one service without a quarterly tier. Services they already
// need, from people they can trust; if something isn't done right, VE makes it right.
//
// Public:
//   POST { action: 'catalog' }  -> { services }
// Member (Authorization: Bearer <ve_token>, and the member holds the listing):
//   POST { action: 'order', service, listing_id, notes?, return_url }  -> { url }  Stripe Checkout (one-time)
//   POST { action: 'mine' }  -> { orders, listings }  this member's orders and the listings they hold
//   GET  ?confirm=<session id>  marks the order paid, emails the business and Sean, back to return_url
//     (ve-stripe-webhook's generic VE branch calls the same URL: metadata type ve_service, confirm_fn ve-services)
// Superadmin (the Depot > Services):
//   POST { action: 'admin_orders' }  -> { orders }
//   POST { action: 'admin_order', id, status?, scheduled_for?, admin_notes? }
//
// verify_jwt is false: the VE app token is HMAC-verified the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's own Stripe account
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-services`;
const SEAN_EMAIL = 'contact@lesaruss.com';

// Business Offer v2 prices (Sean 2026-09-27). The one-month Challenge stop is the trial.
const SERVICES: Record<string, { name: string; cents: number; desc: string }> = {
  challenge_month: { name: 'Passport Challenge stop, one month', cents: 10000, desc: 'Your pin on one month of the Passport Challenge map, with the register card, staff sheet and window sticker. The easiest way to try it.' },
  photo_shoot: { name: 'Photo shoot', cents: 15000, desc: 'About 10 edited photos of your food and space, yours to keep.' },
  reel: { name: 'Short reel or video', cents: 20000, desc: 'A short vertical video for your socials and listing.' },
  social_post: { name: 'Social feature post', cents: 7500, desc: 'A feature post about your business across Vegans Explore channels.' },
  event_table: { name: 'Sampling table at a VE event', cents: 10000, desc: 'A table to sample your food or products at a Vegans Explore event.' },
};
const STATUSES = ['paid', 'scheduled', 'done', 'canceled', 'refunded'];

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const plain = (v: unknown, n: number) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isId = (v: unknown) => /^[0-9a-f-]{36}$/.test(String(v || ''));

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
async function send(to: string[], subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY || !to.filter(Boolean).length) return;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: to.filter(Boolean), subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }) });
  } catch (e) { console.error('service email failed', e); }
}
function backTo(url: unknown, fallback: string): string {
  try { const u = new URL(String(url || '')); if (u.protocol === 'https:' && /(^|\.)vegansexplore\.com$/.test(u.hostname)) return u.toString(); } catch { /* fall through */ }
  return fallback;
}
const withParam = (url: string, k: string, v: string) => { const u = new URL(url); u.searchParams.set(k, v); return u.toString(); };

async function confirm(sessionId: string): Promise<Response> {
  const { data: o } = await db.from('ve_service_orders').select('*, listing:listings(name, slug, address_city)').eq('stripe_session_id', sessionId).maybeSingle();
  const home = 'https://vegansexplore.com/business';
  if (!o) return Response.redirect(home, 302);
  const back = withParam(home, 'booked', o.service);
  if (o.status !== 'awaiting_payment') return Response.redirect(back, 302);
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(o.test)}` } });
  const s = await res.json();
  if (!res.ok || s.payment_status !== 'paid' || s.metadata?.order_id !== o.id) return Response.redirect(withParam(home, 'booked', 'unpaid'), 302);
  const now = new Date().toISOString();
  const { data: upd } = await db.from('ve_service_orders').update({ status: 'paid', paid_at: now, updated_at: now }).eq('id', o.id).eq('status', 'awaiting_payment').select('id');
  if (upd?.length) {
    const sv = SERVICES[o.service], biz = o.listing?.name || 'your business', price = (o.amount_cents / 100).toFixed(0);
    await send([o.contact_email], `Booked: ${sv?.name || o.service} for ${biz}`,
      `<p>Thank you. Your <b>${esc(sv?.name || o.service)}</b> for ${esc(biz)} ($${price}) is booked.</p>` +
      `<p>Someone from Vegans Explore will reach out to schedule it. If something isn't done right, we make it right.</p><p>The Vegans Explore team</p>`, 'hello@vegansexplore.com');
    await send([SEAN_EMAIL], `${o.test ? '[TEST] ' : ''}Service booked: ${sv?.name || o.service}, ${biz}, $${price}`,
      `<p><b>${esc(biz)}</b> (${esc(o.listing?.address_city || '')}) booked <b>${esc(sv?.name || o.service)}</b> for $${price}.</p>` +
      (o.notes ? `<p>Their note: ${esc(o.notes)}</p>` : '') + `<p>Contact: ${esc(o.contact_email || '')}</p>` +
      `<p>Schedule it in the Depot: <a href="https://vegansexplore.com/admin/depot/services">vegansexplore.com/admin/depot/services</a></p>`, o.contact_email || undefined);
  }
  return Response.redirect(back, 302);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirm(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return Response.redirect('https://vegansexplore.com/business?booked=unpaid', 302); }
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  if (body.action === 'catalog') return json({ services: Object.entries(SERVICES).map(([id, s]) => ({ id, ...s })) });

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token && token.split('.').length === 3 ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, email, name, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'not_authenticated' }, 401);

  if (body.action === 'mine') {
    const { data: listings } = await db.from('listings').select('id, name, slug, address_city').or(`owner_member_id.eq.${memberId},claimed_by_member_id.eq.${memberId}`).eq('status', 'approved').order('name');
    const { data: orders } = await db.from('ve_service_orders').select('id, service, amount_cents, status, scheduled_for, created_at, listing:listings(name, slug)').eq('member_id', memberId).neq('status', 'abandoned').order('created_at', { ascending: false }).limit(50);
    return json({ listings: listings || [], orders: (orders || []).filter((o: any) => o.status !== 'awaiting_payment') });
  }

  if (body.action === 'order') {
    const sv = SERVICES[String(body.service || '')];
    if (!sv) return json({ error: 'bad_service' }, 400);
    if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
    const { data: listing } = await db.from('listings').select('id, name, slug, owner_member_id, claimed_by_member_id, ve_contact_email').eq('id', body.listing_id).eq('status', 'approved').maybeSingle();
    if (!listing) return json({ error: 'not_found' }, 404);
    if (listing.owner_member_id !== memberId && listing.claimed_by_member_id !== memberId && !member.is_superadmin) return json({ error: 'not_owner' }, 403);
    const test = await isTestAccount(member.email);
    const { data: order, error } = await db.from('ve_service_orders').insert({ listing_id: listing.id, member_id: memberId, service: body.service, amount_cents: sv.cents,
      notes: plain(body.notes, 600) || null, contact_email: member.email || listing.ve_contact_email || null, test }).select('id').single();
    if (error || !order) return json({ error: 'save_failed', message: error?.message }, 500);
    const back = backTo(body.return_url, 'https://vegansexplore.com/business');
    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': (test ? '[TEST] ' : '') + `${sv.name} - ${listing.name}`.slice(0, 120),
      'line_items[0][price_data][unit_amount]': String(sv.cents),
      'line_items[0][quantity]': '1',
      success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: withParam(back, 'booked', 'cancelled'),
      customer_email: member.email,
      'payment_intent_data[receipt_email]': member.email,
      'metadata[type]': 've_service', 'metadata[confirm_fn]': 've-services',
      'metadata[order_id]': order.id, 'metadata[listing_id]': listing.id, 'metadata[service]': String(body.service),
    });
    if (test) params.set('metadata[test]', 'true');
    const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const s = await sres.json();
    if (!sres.ok) { console.error('stripe error', s); await db.from('ve_service_orders').update({ status: 'abandoned' }).eq('id', order.id); return json({ error: s.error?.message ?? 'stripe_error' }, 400); }
    await db.from('ve_service_orders').update({ stripe_session_id: s.id }).eq('id', order.id);
    return json({ url: s.url, test_mode: test });
  }

  // ---- The Depot (superadmins only).
  if (!String(body.action || '').startsWith('admin_')) return json({ error: 'unknown_action' }, 400);
  if (!member.is_superadmin) return json({ error: 'no_access' }, 403);

  if (body.action === 'admin_orders') {
    const { data } = await db.from('ve_service_orders').select('*, listing:listings(name, slug, address_city, ve_contact_name, ve_contact_phone, phone), member:members(name, email)')
      .not('status', 'in', '(awaiting_payment,abandoned)').order('created_at', { ascending: false }).limit(300);
    return json({ orders: data || [], services: SERVICES });
  }

  if (body.action === 'admin_order') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { updated_at: now };
    if (body.status !== undefined) { if (!STATUSES.includes(body.status)) return json({ error: 'bad_status' }, 400); patch.status = body.status; patch.done_at = body.status === 'done' ? now : null; }
    if (body.scheduled_for !== undefined) patch.scheduled_for = /^\d{4}-\d{2}-\d{2}$/.test(String(body.scheduled_for)) ? body.scheduled_for : null;
    if (body.admin_notes !== undefined) patch.admin_notes = plain(body.admin_notes, 1000) || null;
    const { data, error } = await db.from('ve_service_orders').update(patch).eq('id', body.id).select('*').single();
    if (error) return json({ error: 'save_failed' }, 400);
    return json({ ok: true, order: data });
  }

  return json({ error: 'unknown_action' }, 400);
});
