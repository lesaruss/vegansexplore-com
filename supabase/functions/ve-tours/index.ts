// ve-tours: Vegans Explore Tours (playbook ve-verified-tours-hunt, group B, Sean 2026-09-27).
// Monthly in South Florida, $50 a guest, about 12 guests, three tastings in one neighborhood and
// then an attraction. Each tour on sale is also an approved row in public.events, so it shows in
// the city hub's Events list with a link to its booking page (/tours?id=).
//
// Public (a signed-in visitor may send the VE app token so the booking is tied to them):
//   POST { action: 'list', community? }  -> { tours }  on sale and upcoming, with seats left
//   POST { action: 'get', id }            -> { tour, waiver }
//   POST { action: 'book', tour_id, buyer: { name, email, phone }, guests: [{ name, dietary, allergies }],
//          waiver_signed_name, agree: true, return_url } -> { url }  Stripe Checkout (seats held 30 minutes)
//   GET  ?confirm=<session id>  marks the order paid, emails the buyer and Sean, back to /tours?id=&booked=1
// Superadmin (the Depot):
//   admin_tours, admin_save_tour, admin_roster { tour_id }, admin_ticket { id, status | checked_in },
//   admin_waiver (read), admin_save_waiver { text }, admin_plus { city }
//
// Ticket sales stay closed until the waiver text is saved in the Depot (Sean writes the wording).
// verify_jwt is false: the VE app token, when sent, is HMAC-verified the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's own Stripe account
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-tours`;
const SEAN_EMAIL = 'contact@lesaruss.com';
const VE_TENANT = '00000000-0000-4000-a000-000000000002';
const MAX_GUESTS = 4;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const plain = (v: unknown, n: number) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isId = (v: unknown) => /^[0-9a-f-]{36}$/.test(String(v || ''));
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

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
  if (!RESEND_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }) });
  } catch (e) { console.error('tour email failed', e); }
}
function backTo(url: unknown, fallback: string): string {
  try { const u = new URL(String(url || '')); if (u.protocol === 'https:' && /(^|\.)vegansexplore\.com$/.test(u.hostname)) return u.toString(); } catch { /* fall through */ }
  return fallback;
}
async function waiver() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'tour_waiver').maybeSingle();
  const v = data?.value || {};
  return v.text ? { text: String(v.text), version: String(v.version || '1') } : null;
}
const when = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

async function publicTour(t: any) {
  const taken = (await db.rpc('ve_tour_seats_taken', { p_tour: t.id })).data || 0;
  const ids = (t.stops || []).map((s: any) => s.listing_id).filter(isId);
  const { data: ls } = ids.length ? await db.from('listings').select('id, name, slug, logo_url, color, ve_verified, ve_verified_tier').in('id', ids) : { data: [] };
  const byId: Record<string, any> = {}; (ls || []).forEach((l: any) => { byId[l.id] = l; });
  return { id: t.id, title: t.title, city: t.city, neighborhood: t.neighborhood, starts_at: t.starts_at, ends_at: t.ends_at, price_cents: t.price_cents,
    capacity: t.capacity, seats_left: Math.max(0, t.capacity - taken), status: t.status, attraction: t.attraction, pickup: t.pickup, dropoff: t.dropoff,
    rain_plan: t.rain_plan, host_name: t.host_name, description: t.description, image_url: t.image_url,
    stops: (t.stops || []).map((s: any) => { const l = byId[s.listing_id] || {}; return { name: l.name || s.name, slug: l.slug, logo_url: l.logo_url, color: l.color, tier: l.ve_verified ? l.ve_verified_tier : null }; }) };
}

// Keep the tour's events row in step: on sale shows it in the hub's Events list; draft or canceled hides it.
async function syncEvent(t: any, authorId: string) {
  const show = ['on_sale', 'closed', 'done'].includes(t.status);
  if (!show) { if (t.event_id) await db.from('events').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', t.event_id); return t.event_id; }
  const stops = (t.stops || []).map((s: any) => s.name).filter(Boolean).join(', ');
  const row = { tenant_id: VE_TENANT, title: t.title, description: (t.description || `Three tastings in ${t.neighborhood}${stops ? ' (' + stops + ')' : ''}, then ${t.attraction || 'time to hang out together'}. About ${t.capacity} guests, with a host on board.`),
    event_type: 'in_person', starts_at: t.starts_at, ends_at: t.ends_at, timezone: 'America/New_York', location_name: t.neighborhood, city: t.city, state: 'FL', country: 'US',
    category: 'food', capacity: t.capacity, is_free: false, price_cents: t.price_cents, ticket_url: `https://vegansexplore.com/tours?id=${t.id}`, image_url: t.image_url || null,
    status: 'approved', updated_at: new Date().toISOString() };
  if (t.event_id) { await db.from('events').update(row).eq('id', t.event_id); return t.event_id; }
  const { data } = await db.from('events').insert({ ...row, author_id: authorId }).select('id').single();
  if (data) await db.from('ve_tours').update({ event_id: data.id }).eq('id', t.id);
  return data?.id || null;
}

async function confirm(sessionId: string): Promise<Response> {
  const { data: rows } = await db.from('ve_tour_tickets').select('*').eq('stripe_session_id', sessionId);
  if (!rows?.length) return Response.redirect('https://vegansexplore.com/tours', 302);
  const tourId = rows[0].tour_id, back = `https://vegansexplore.com/tours?id=${tourId}`;
  if (rows.every((r: any) => r.status === 'paid')) return Response.redirect(back + '&booked=1', 302);
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(rows[0].test)}` } });
  const s = await res.json();
  if (!res.ok || s.payment_status !== 'paid' || s.metadata?.order_id !== rows[0].order_id) return Response.redirect(back + '&booked=unpaid', 302);
  const now = new Date().toISOString();
  const { data: upd } = await db.from('ve_tour_tickets').update({ status: 'paid', paid_at: now, updated_at: now }).eq('stripe_session_id', sessionId).eq('status', 'holding').select('id');
  if (upd?.length) {
    const { data: t } = await db.from('ve_tours').select('*').eq('id', tourId).single();
    const r0 = rows[0], names = rows.map((r: any) => r.guest_name);
    const diet = rows.filter((r: any) => r.dietary || r.allergies).map((r: any) => `${esc(r.guest_name)}: ${esc([r.dietary, r.allergies && 'allergies: ' + r.allergies].filter(Boolean).join('; '))}`);
    await send([r0.buyer_email], `You're booked: ${t.title}`,
      `<p>Thank you, ${esc(r0.buyer_name.split(' ')[0])}. You're booked on <b>${esc(t.title)}</b>, ${esc(when(t.starts_at))} (Eastern).</p>` +
      `<p>Guests: ${esc(names.join(', '))}</p>` +
      (t.pickup ? `<p>Pickup: ${esc(t.pickup)}</p>` : '') + (t.dropoff ? `<p>Drop-off: ${esc(t.dropoff)}</p>` : '') +
      (t.rain_plan ? `<p>If it rains: ${esc(t.rain_plan)}</p>` : '') +
      `<p>Tour details: <a href="${back}">${back}</a>. Questions? Reply to this email.</p><p>The Vegans Explore team</p>`, 'hello@vegansexplore.com');
    const { count } = await db.from('ve_tour_tickets').select('id', { count: 'exact', head: true }).eq('tour_id', tourId).eq('status', 'paid');
    await send([SEAN_EMAIL], `${r0.test ? '[TEST] ' : ''}Tour booking: ${t.title}, ${rows.length} guest${rows.length > 1 ? 's' : ''} (${count}/${t.capacity} booked)`,
      `<p>${esc(r0.buyer_name)} (${esc(r0.buyer_email)}${r0.buyer_phone ? ', ' + esc(r0.buyer_phone) : ''}) booked ${rows.length} for <b>${esc(t.title)}</b>.</p>` +
      `<p>Guests: ${esc(names.join(', '))}</p>` + (diet.length ? `<p>Dietary notes:<br>${diet.join('<br>')}</p>` : '') +
      `<p>Roster: <a href="https://vegansexplore.com/admin/depot/tours">vegansexplore.com/admin/depot/tours</a></p>`, r0.buyer_email);
  }
  return Response.redirect(back + '&booked=1', 302);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirm(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return Response.redirect('https://vegansexplore.com/tours?booked=unpaid', 302); }
  }
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token && token.split('.').length === 3 ? await verifyToken(token) : null;

  if (body.action === 'list') {
    const { data } = await db.from('ve_tours').select('*').eq('community_slug', plain(body.community, 60) || 'south-florida').eq('status', 'on_sale').gte('starts_at', new Date().toISOString()).order('starts_at').limit(12);
    return json({ tours: await Promise.all((data || []).map(publicTour)) });
  }
  if (body.action === 'get') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const { data: t } = await db.from('ve_tours').select('*').eq('id', body.id).neq('status', 'draft').maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    return json({ tour: await publicTour(t), waiver: await waiver() });
  }

  if (body.action === 'book') {
    if (!isId(body.tour_id)) return json({ error: 'bad_id' }, 400);
    const w = await waiver();
    if (!w) return json({ error: 'waiver_missing' }, 409);
    const b = body.buyer || {};
    const buyer = { name: plain(b.name, 120), email: plain(b.email, 200).toLowerCase(), phone: plain(b.phone, 40) };
    if (!buyer.name || !isEmail(buyer.email)) return json({ error: 'missing_buyer' }, 400);
    const guests = (Array.isArray(body.guests) ? body.guests : []).slice(0, MAX_GUESTS).map((g: any) => ({ name: plain(g?.name, 120), dietary: plain(g?.dietary, 300), allergies: plain(g?.allergies, 300) }));
    if (!guests.length || guests.some((g: any) => !g.name)) return json({ error: 'missing_guests' }, 400);
    const signed = plain(body.waiver_signed_name, 120);
    if (body.agree !== true || !signed) return json({ error: 'waiver_required' }, 400);
    const test = await isTestAccount(buyer.email);
    const rows = guests.map((g: any) => ({ member_id: memberId || '', guest_name: g.name, buyer_name: buyer.name, buyer_email: buyer.email, buyer_phone: buyer.phone,
      dietary: g.dietary, allergies: g.allergies, waiver_signed_name: signed, waiver_version: w.version, test }));
    const { data: hold, error } = await db.rpc('ve_tour_hold', { p_tour: body.tour_id, p_rows: rows });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    if (hold?.error) return json(hold, 409);
    const back = backTo(body.return_url, `https://vegansexplore.com/tours?id=${body.tour_id}`);
    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': (test ? '[TEST] ' : '') + `Vegans Explore Tour - ${hold.title}`.slice(0, 120),
      'line_items[0][price_data][unit_amount]': String(hold.price_cents),
      'line_items[0][quantity]': String(guests.length),
      success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
      cancel_url: back + (back.includes('?') ? '&' : '?') + 'booked=cancelled',
      customer_email: buyer.email,
      'payment_intent_data[receipt_email]': buyer.email,
      expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60),
      'metadata[type]': 've_tour_ticket', 'metadata[confirm_fn]': 've-tours',
      'metadata[order_id]': hold.order_id, 'metadata[tour_id]': body.tour_id, 'metadata[guests]': String(guests.length),
    });
    if (test) params.set('metadata[test]', 'true');
    const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const s = await sres.json();
    if (!sres.ok) {
      console.error('stripe error', s);
      await db.from('ve_tour_tickets').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('order_id', hold.order_id);
      return json({ error: s.error?.message ?? 'stripe_error' }, 400);
    }
    await db.from('ve_tour_tickets').update({ stripe_session_id: s.id }).eq('order_id', hold.order_id);
    return json({ url: s.url, test_mode: test });
  }

  // ---- The Depot (superadmins only).
  if (!String(body.action || '').startsWith('admin_')) return json({ error: 'unknown_action' }, 400);
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member?.is_superadmin) return json({ error: 'no_access' }, 403);
  const now = new Date().toISOString();

  if (body.action === 'admin_tours') {
    const { data } = await db.from('ve_tours').select('*').order('starts_at', { ascending: false }).limit(60);
    const out = [];
    for (const t of data || []) {
      const { data: tk } = await db.from('ve_tour_tickets').select('status').eq('tour_id', t.id);
      out.push({ ...t, paid: (tk || []).filter((x: any) => x.status === 'paid').length });
    }
    return json({ tours: out, waiver: await waiver() });
  }

  if (body.action === 'admin_save_tour') {
    const t = body.tour || {};
    const stops = (Array.isArray(t.stops) ? t.stops : []).filter((s: any) => isId(s?.listing_id)).slice(0, 3).map((s: any) => ({ listing_id: s.listing_id, name: plain(s.name, 160) }));
    const row: Record<string, unknown> = {
      title: plain(t.title, 140), city: plain(t.city, 80), neighborhood: plain(t.neighborhood, 120), starts_at: t.starts_at || null, ends_at: t.ends_at || null,
      price_cents: Math.max(0, Math.round(+t.price_cents)) || 5000, capacity: Math.min(60, Math.max(1, Math.round(+t.capacity) || 12)), stops,
      attraction: plain(t.attraction, 200) || null, pickup: plain(t.pickup, 300) || null, dropoff: plain(t.dropoff, 300) || null, rain_plan: plain(t.rain_plan, 500) || null,
      host_name: plain(t.host_name, 120) || null, description: plain(t.description, 1500) || null,
      image_url: /^https:\/\//.test(String(t.image_url || '')) ? plain(t.image_url, 500) : null, notes: plain(t.notes, 1000) || null,
      status: ['draft', 'on_sale', 'closed', 'done', 'canceled'].includes(t.status) ? t.status : 'draft', updated_at: now,
    };
    if (!row.title || !row.city || !row.neighborhood || !row.starts_at || isNaN(new Date(String(row.starts_at)).getTime())) return json({ error: 'missing_fields' }, 400);
    if (row.status === 'on_sale') {
      if (stops.length < 3 || !row.attraction || !row.pickup || !row.dropoff || !row.rain_plan) return json({ error: 'not_ready', need: 'three restaurants, the attraction, pickup, drop-off and a rain plan' }, 400);
      if (!(await waiver())) return json({ error: 'waiver_missing' }, 400);
    }
    const { data, error } = isId(t.id)
      ? await db.from('ve_tours').update(row).eq('id', t.id).select('*').single()
      : await db.from('ve_tours').insert({ ...row, created_by: memberId }).select('*').single();
    if (error) return json({ error: 'save_failed', message: error.message }, 400);
    const eventId = await syncEvent(data, memberId);
    return json({ ok: true, tour: { ...data, event_id: eventId } });
  }

  if (body.action === 'admin_roster') {
    if (!isId(body.tour_id)) return json({ error: 'bad_id' }, 400);
    const { data } = await db.from('ve_tour_tickets').select('*').eq('tour_id', body.tour_id).neq('status', 'holding').order('created_at');
    const { data: holds } = await db.from('ve_tour_tickets').select('id').eq('tour_id', body.tour_id).eq('status', 'holding').gt('created_at', new Date(Date.now() - 30 * 60e3).toISOString());
    return json({ tickets: data || [], holding: (holds || []).length });
  }

  if (body.action === 'admin_ticket') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    const patch: Record<string, unknown> = { updated_at: now };
    if (body.status !== undefined) { if (!['paid', 'canceled', 'refunded'].includes(body.status)) return json({ error: 'bad_status' }, 400); patch.status = body.status; }
    if (body.checked_in !== undefined) patch.checked_in_at = body.checked_in ? now : null;
    const { data, error } = await db.from('ve_tour_tickets').update(patch).eq('id', body.id).select('*').single();
    if (error) return json({ error: 'save_failed' }, 400);
    return json({ ok: true, ticket: data });
  }

  if (body.action === 'admin_waiver') return json({ waiver: await waiver() });

  if (body.action === 'admin_save_waiver') {
    const text = String(body.text ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 12000);
    const cur = await waiver();
    const version = text && text !== cur?.text ? String((parseInt(cur?.version || '0', 10) || 0) + 1) : (cur?.version || '1');
    const { error } = await db.from('ve_site_settings').upsert({ key: 'tour_waiver', value: text ? { text, version } : {}, updated_at: now, updated_by: memberId });
    if (error) return json({ error: 'save_failed', message: error.message }, 400);
    return json({ ok: true, waiver: text ? { text, version } : null });
  }

  // Plus businesses are first in line for tours in their area; Verified next.
  if (body.action === 'admin_plus') {
    const city = plain(body.city, 80);
    const q = db.from('listings').select('id, name, slug, address_city, category, ve_verified_tier, ve_verified_until, ve_contact_name, ve_contact_phone, phone')
      .eq('status', 'approved').not('ve_verified_tier', 'is', null).order('name');
    const { data } = city ? await q.eq('address_city', city) : await q;
    const live = (data || []).filter((l: any) => !l.ve_verified_until || new Date(l.ve_verified_until).getTime() > Date.now() - 3 * 864e5);
    live.sort((a: any, b: any) => (b.ve_verified_tier === 'plus' ? 1 : 0) - (a.ve_verified_tier === 'plus' ? 1 : 0));
    return json({ businesses: live });
  }

  return json({ error: 'unknown_action' }, 400);
});
