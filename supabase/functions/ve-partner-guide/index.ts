import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ve-partner-guide
// Backend for The Explore Season Partners Guide (/partners and the member
// platform Opportunities section). Playbook: explore-season-partners-guide,
// locked 2026-09-24.
//
//   GET  ?action=catalog   offers, cities and Activation Partner spots left
//   POST ?action=checkout  self-serve offers under $8K -> Stripe Checkout URL
//   POST ?action=inquire   kind: question | meeting | reserve | notify
//
// Every purchase or inquiry writes one public.sponsors row tagged with tier,
// offer, city and assigned_manager_id. Payment is confirmed by the
// partner_guide_purchase branch in ve-stripe-webhook, which flips the row to
// active and grants membership when the offer includes it.
//
// Public endpoint, so verify_jwt is OFF. A signed-in visitor may pass the VE
// app token in body.token (same HMAC token ve-auth mints) so a purchase links
// to their member row; nobody has to be signed in to buy.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY') ?? ''; // Vegans Explore's OWN Stripe account.
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
const SEAN_EMAIL = 'contact@lesaruss.com';
const SEAN_MEMBER_ID = '72712a4a-ea0e-4ef4-a29e-d382496ef8da';
const MEETING_URL = 'https://calendly.com/lesaruss/vegans-explore-partner-discovery-call-30-min';
const SITE = 'https://vegansexplore.com';
const HOLD_DAYS = 7;
const AUDIENCES = ['attendee', 'local_business', 'national_brand', 'nonprofit', 'chef'];
const MAX_SUBMISSIONS_PER_HOUR = 8;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const secretBytes = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, b64urlToBytes(sigB64), new TextEncoder().encode(`${headerB64}.${payloadB64}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000) || !payload.sub) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

function clean(v: unknown, max = 300): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY || !to.length) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) {
    console.error('Resend failed:', e);
    return false;
  }
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:#1a1a1a;padding:24px 32px;"><span style="color:#ffffff;font-size:16px;font-weight:800;letter-spacing:0.06em;">VEGANS EXPLORE</span></td></tr>
<tr><td style="padding:32px;"><h1 style="margin:0 0 14px;font-size:21px;font-weight:800;color:#111;">${title}</h1>${bodyHtml}</td></tr>
<tr><td style="background:#f9f9f9;padding:14px 32px;border-top:1px solid #eee;"><p style="margin:0;font-size:11px;color:#6b6b6b;">VEGANS EXPLORE | contact@vegansexplore.com | <a href="${SITE}/partners" style="color:#6b6b6b;">vegansexplore.com/partners</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#333;">${text}</p>`;
}

function detailsTable(rows: [string, string][]): string {
  return '<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:8px 0 16px;border-collapse:collapse;">' +
    rows.filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 8px 6px 0;font-size:13px;color:#6b6b6b;vertical-align:top;width:140px;">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#111;">${esc(v)}</td></tr>`).join('') +
    '</table>';
}

async function loadCity(slug: string) {
  const { data } = await supabase.from('ve_partner_cities').select('*').eq('slug', slug).maybeSingle();
  return data;
}

// Local asks go to the city's Community Manager with Sean copied; national
// brands go to Sean. A city with no manager email on file routes to Sean.
function routeFor(audience: string, city: any): { to: string[]; managerId: string } {
  if (audience !== 'national_brand' && city?.manager_email) {
    return { to: [city.manager_email, SEAN_EMAIL], managerId: city.manager_member_id ?? SEAN_MEMBER_ID };
  }
  return { to: [SEAN_EMAIL], managerId: (audience !== 'national_brand' && city?.manager_member_id) || SEAN_MEMBER_ID };
}

async function activationSpotsLeft(): Promise<number> {
  const { data: offer } = await supabase.from('ve_partner_offers').select('capacity').eq('slug', 'activation-partner').maybeSingle();
  const capacity = offer?.capacity ?? 5;
  const nowIso = new Date().toISOString();
  const { count: signed } = await supabase.from('sponsors').select('id', { count: 'exact', head: true })
    .eq('offer_slug', 'activation-partner').in('status', ['active', 'completed']);
  const { count: held } = await supabase.from('sponsors').select('id', { count: 'exact', head: true })
    .eq('offer_slug', 'activation-partner').eq('status', 'reserved').gt('hold_expires_at', nowIso);
  return Math.max(0, capacity - (signed ?? 0) - (held ?? 0));
}

async function tooManySubmissions(email: string): Promise<boolean> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from('sponsors').select('id', { count: 'exact', head: true })
    .eq('contact_email', email).gt('created_at', since);
  return (count ?? 0) >= MAX_SUBMISSIONS_PER_HOUR;
}

type Contact = { name: string; email: string; company: string; phone: string; website: string; audience: string; city: string; message: string; answers: Record<string, string> };

function readContact(body: any): Contact | { error: string } {
  const c: Contact = {
    name: clean(body.name, 120),
    email: clean(body.email, 200).toLowerCase(),
    company: clean(body.company, 160),
    phone: clean(body.phone, 40),
    website: clean(body.company_website, 200),
    audience: clean(body.audience, 40),
    city: clean(body.city, 60) || 'south-florida',
    message: clean(body.message, 2000),
    answers: {},
  };
  if (body.answers && typeof body.answers === 'object') {
    for (const [k, v] of Object.entries(body.answers).slice(0, 12)) c.answers[clean(k, 40)] = clean(v, 200);
  }
  if (!c.name) return { error: 'name_required' };
  if (!EMAIL_RE.test(c.email)) return { error: 'valid_email_required' };
  if (!AUDIENCES.includes(c.audience)) return { error: 'audience_required' };
  return c;
}

const AUDIENCE_LABEL: Record<string, string> = {
  attendee: 'Attendee', local_business: 'Local business', national_brand: 'National brand', nonprofit: 'Nonprofit', chef: 'Chef',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const action = new URL(req.url).searchParams.get('action') ?? '';

  try {
    if (action === 'catalog') {
      const [{ data: offers }, { data: cities }, spots] = await Promise.all([
        supabase.from('ve_partner_offers').select('slug,name,tagline,price_cents,price_label,price_note,exit,audiences,goals,min_budget_cents,includes,includes_membership,capacity,event_choices,early_sign_note,sort').eq('active', true).order('sort'),
        supabase.from('ve_partner_cities').select('slug,name,status,manager_name,sort').order('sort'),
        activationSpotsLeft(),
      ]);
      return json({ offers: offers ?? [], cities: cities ?? [], activation_spots_left: spots, meeting_url: MEETING_URL });
    }

    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    const body = await req.json().catch(() => ({}));
    if (clean(body.hp_field)) return json({ ok: true }); // honeypot: bots fill every field

    const contact = readContact(body);
    if ('error' in contact) return json({ error: contact.error }, 400);
    if (await tooManySubmissions(contact.email)) return json({ error: 'too_many_requests' }, 429);

    let memberId: string | null = null;
    if (typeof body.token === 'string' && body.token) {
      const auth = await verifyToken(body.token);
      if (auth) memberId = auth.sub;
    }

    const city = await loadCity(contact.city);
    if (!city) return json({ error: 'unknown_city' }, 400);
    const route = routeFor(contact.audience, city);

    const offerSlug = clean(body.offer, 60);
    let offer: any = null;
    if (offerSlug) {
      const { data } = await supabase.from('ve_partner_offers').select('*').eq('slug', offerSlug).eq('active', true).maybeSingle();
      if (!data) return json({ error: 'unknown_offer' }, 400);
      offer = data;
    }

    const baseRow = {
      tenant_id: VE_TENANT_ID,
      member_id: memberId,
      company_name: contact.company || contact.name,
      company_website: contact.website || null,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_phone: contact.phone || null,
      audience: contact.audience,
      city_slug: city.slug,
      answers: contact.answers,
      message: contact.message || null,
      assigned_manager_id: route.managerId,
      routed_to: route.to,
      source: clean(body.source, 40) || 'partners_page',
      offer_slug: offer?.slug ?? null,
      tier: offer?.sponsor_tier ?? null,
      kind: offer?.sponsor_kind ?? (contact.audience === 'attendee' ? 'member' : 'partner'),
      includes_membership: offer?.includes_membership ?? false,
      includes_community_night: offer ? offer.slug.startsWith('community-table') || offer.slug === 'activation-partner' : false,
      campaign_name: 'The Explore Season',
    };

    if (action === 'checkout') {
      if (!offer || offer.exit !== 'checkout' || !offer.price_cents) return json({ error: 'offer_not_self_serve' }, 400);
      if (city.status !== 'live') return json({ error: 'city_not_live' }, 400);
      const eventChoice = clean(body.answers?.event, 120);
      if (offer.event_choices?.length && !offer.event_choices.includes(eventChoice)) return json({ error: 'event_choice_required', choices: offer.event_choices }, 400);

      const { data: row, error: insErr } = await supabase.from('sponsors')
        .insert({ ...baseRow, status: 'pending', exit_type: 'checkout', amount_cents: offer.price_cents, budget_cents: offer.price_cents })
        .select('id').single();
      if (insErr || !row) {
        console.error('sponsors insert error:', insErr);
        return json({ error: 'could_not_record' }, 500);
      }

      const productName = `Vegans Explore - ${offer.name}${eventChoice ? ` (${eventChoice})` : ''}`;
      const params = new URLSearchParams({
        'mode': 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': productName,
        'line_items[0][price_data][unit_amount]': String(offer.price_cents),
        'line_items[0][quantity]': '1',
        'success_url': `${SITE}/partners?checkout=success&offer=${encodeURIComponent(offer.slug)}`,
        'cancel_url': `${SITE}/partners?checkout=cancelled&offer=${encodeURIComponent(offer.slug)}`,
        'customer_email': contact.email,
        'billing_address_collection': 'auto',
        'client_reference_id': row.id,
        'metadata[type]': 'partner_guide_purchase',
        'metadata[sponsor_id]': row.id,
        'metadata[offer_slug]': offer.slug,
        'metadata[city_slug]': city.slug,
        'payment_intent_data[metadata][type]': 'partner_guide_purchase',
        'payment_intent_data[metadata][sponsor_id]': row.id,
      });
      if (memberId) params.set('metadata[member_id]', memberId);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const session = await stripeRes.json();
      if (!stripeRes.ok) {
        console.error('Stripe error:', session);
        await supabase.from('sponsors').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', row.id);
        return json({ error: session.error?.message ?? 'stripe_error' }, 400);
      }
      await supabase.from('sponsors').update({ stripe_session_id: session.id }).eq('id', row.id);
      return json({ url: session.url, id: session.id });
    }

    if (action === 'inquire') {
      const kind = clean(body.kind, 20);
      if (!['question', 'meeting', 'reserve', 'notify'].includes(kind)) return json({ error: 'unknown_kind' }, 400);
      if ((kind === 'meeting' || kind === 'reserve') && (!offer || offer.exit !== 'meeting')) return json({ error: 'offer_requires_meeting_tier' }, 400);
      if (kind === 'question' && !contact.message) return json({ error: 'message_required' }, 400);

      let holdUntil: string | null = null;
      if (kind === 'reserve') {
        if (offer.capacity && (await activationSpotsLeft()) <= 0 && offer.slug === 'activation-partner') return json({ error: 'sold_out' }, 409);
        holdUntil = new Date(Date.now() + HOLD_DAYS * 86400_000).toISOString();
      }

      const { data: row, error: insErr } = await supabase.from('sponsors')
        .insert({ ...baseRow, status: kind === 'reserve' ? 'reserved' : 'pending', exit_type: kind, hold_expires_at: holdUntil, budget_cents: offer?.min_budget_cents || null })
        .select('id').single();
      if (insErr || !row) {
        console.error('sponsors insert error:', insErr);
        return json({ error: 'could_not_record' }, 500);
      }

      const kindLabel = { question: 'Question', meeting: 'Meeting request', reserve: 'Reserved spot (7-day hold)', notify: 'Notify me' }[kind]!;
      const rows: [string, string][] = [
        ['Type', kindLabel], ['Offer', offer?.name ?? ''], ['City', city.name], ['Who', AUDIENCE_LABEL[contact.audience]],
        ['Name', contact.name], ['Company', contact.company], ['Email', contact.email], ['Phone', contact.phone], ['Website', contact.website],
        ...Object.entries(contact.answers).map(([k, v]) => [k.replace(/_/g, ' '), v] as [string, string]),
        ['Hold until', holdUntil ? new Date(holdUntil).toDateString() : ''],
      ];
      const managerNote = contact.audience !== 'national_brand' && !city.manager_email
        ? p(`<em>No Community Manager email is on file for ${esc(city.name)} yet, so this came straight to Sean.</em>`) : '';
      await sendEmail(route.to, `[Explore Season] ${kindLabel}: ${contact.company || contact.name}${offer ? ` - ${offer.name}` : ''}`,
        emailShell(`${kindLabel} from the Partners Guide`, detailsTable(rows) + (contact.message ? p('<strong>Message</strong><br>' + esc(contact.message).replace(/\n/g, '<br>')) : '') + managerNote + p(`Reply to this email to answer ${esc(contact.name.split(' ')[0])} directly.`)),
        contact.email);

      const first = esc(contact.name.split(' ')[0]);
      const confirmBody = {
        question: p(`Thanks, ${first}. Your question reached the Vegans Explore team${city.status === 'live' ? ` in ${esc(city.name)}` : ''}. Expect a reply by email within two business days.`),
        meeting: p(`Thanks, ${first}. Pick a time for your discovery call with Sean here: <a href="${MEETING_URL}">${MEETING_URL}</a>. If none of the times work, reply to this email.`),
        reserve: p(`Thanks, ${first}. Your ${esc(offer?.name ?? '')} spot is held until <strong>${holdUntil ? new Date(holdUntil).toDateString() : ''}</strong> while we finalize pricing together. Book your call with Sean here: <a href="${MEETING_URL}">${MEETING_URL}</a>.`),
        notify: p(`Thanks, ${first}. We will email you the moment ${offer ? esc(offer.name) : 'this'} opens${city.status !== 'live' ? ` or when ${esc(city.name)} goes live` : ''}.`),
      }[kind]!;
      await sendEmail([contact.email], kind === 'reserve' ? 'Your Explore Season spot is held for 7 days' : 'We got it - Vegans Explore', emailShell('We got it.', confirmBody));

      return json({ ok: true, id: row.id, hold_expires_at: holdUntil, meeting_url: (kind === 'meeting' || kind === 'reserve') ? MEETING_URL : null });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    console.error('ve-partner-guide error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
