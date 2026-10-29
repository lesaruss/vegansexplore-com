// ve-group: a group's life on Vegans Explore, live (Sean, 2026-10-29). Migration 20261029_group_live.sql.
// "build the live announcements for real groups", and "a way where the organizer can gift a Vegans Explore membership. It would cost
// whatever our half of the $11 would be based on where they are in the commission split. It would be deducted from their payout and
// be applied by them issuing an invite link to a specific address."
//
// verify_jwt off; the VE member token is checked here. Ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member, for tests.
// Public (a token is optional):
//   POST { action: 'page', listing_id }  -> { announcements (newest three, a pinned one first), total, members, viewer {signed_in,
//        active, joined, email_ok}, can_post }        the group's Overview and its Join card
//   POST { action: 'msg_get' | 'msg_stop' | 'msg_leave' | 'msg_report', token, note? }   a member's link from an announcement email
//        (/messages#g/<token>): read it, stop the group's emails, leave the group, or report it (pauses the group's emails)
// Members (a Passport):
//   POST { action: 'join', listing_id, email_ok } | { action: 'leave', listing_id } | { action: 'email_pref', listing_id, email_ok }
// The organizer (the listing's owner or the Group Partner lead; super admins too):
//   POST { action: 'dash', listing_id }  -> ve_group_dash: announcements, members, and the partnership (rate, link, events,
//        earnings, gift, gifts) once the group is a Group Partner
//   POST { action: 'group_announce', listing_id, title, body, email, pin }  posts it under About; email: to the members who said yes,
//        through us, at most emails_per_week (2) in 7 days; never while the group's emails are paused
//   POST { action: 'announce_remove', listing_id, id }
// The Group Partner's lead only:
//   POST { action: 'group_gift', listing_id, name, email, note?, send }  -> { url }   a Passport for one email, at our share of the $11
//        at the group's rate today (1,100 points with it), taken from the group's cleared earnings; send: we email it, else they copy
//        the link. Cleared earnings (Sean, 2026-10-29: "that balance will only count after the 30-day period") are commissions past
//        their 30-day hold and not paid out, less gifts (ve_group_balance); money still held never counts. Short of it: error 'balance'
//        with can_buy, and the organizer pays for the gift by card instead, at the same price:
//   POST { action: 'gift_checkout', listing_id, name, email, note?, send }  -> { url }   Stripe checkout; GET ?confirm=<session> (the
//        return trip and ve-stripe-webhook) makes the gift once (universe_invites.paid_session) and goes back to the dashboard
//   POST { action: 'gift_send', listing_id, id } | { action: 'gift_cancel', listing_id, id }   cancel gives the cost back (to the group's
//        balance for a gift bought by card)
// Tickets, guest passes and check-in (Sean, 2026-10-29: "Move forward"; migration 20261029_group_tickets.sql). On an event hosted by a
// Group Partner (onboarding or active):
//   POST { action: 'event_tickets', event_id }  public: its ticket types with what a buyer pays, the refund policy, whether a guest pass
//        is open (a free event), and the viewer's own tickets and guest pass
//   POST { action: 'ticket_checkout', event_id, type_id, quantity }  an active Passport holder only -> { url }: Stripe checkout for the
//        ticket price, our 5% when the group passes it on, and card processing; GET ?confirm=<session> (the return trip and
//        ve-stripe-webhook) makes the tickets once (ve_ticket_order_paid) and emails the door codes
//   POST { action: 'guest_pass', event_id, name, email }  a free event, someone without a Passport, one guest pass a person ever
// The organizer (as above):
//   POST { action: 'tickets', listing_id, event_id }  ticket types, orders, the door list (tickets and guest passes), the refund policy
//   POST { action: 'ticket_type_save', listing_id, event_id, id?, name, price_cents, quantity?, pass_fee, active }  a Group Partner's
//        events only; the price is fixed once a ticket of the type is sold
//   POST { action: 'refund_policy_save', listing_id, event_id, text }
//   POST { action: 'checkin', listing_id, event_id, code, undo? }  a ticket or a guest pass by its door code
//   POST { action: 'ticket_refund', listing_id, order_id }  gives back what the tickets cost, our 5% included, not card processing
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const DAY_MS = 24 * 60 * 60 * 1000;
const FN_URL = `${SUPABASE_URL}/functions/v1/ve-group`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there';
const shortName = (n: string) => { const p = String(n || '').trim().split(/\s+/); return p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''); };
const money = (c: number) => '$' + (c / 100).toFixed(2);

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
// Same key derivation as ve-auth's signJWT.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function memberOf(req: Request, body: any): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  if (admin && token.length === admin.length && token === admin) return isId(body.as_member) ? body.as_member : null;
  return await verifyToken(token);
}

async function sendOne(to: string, subject: string, html: string, replyTo = SEAN_EMAIL): Promise<string | null> {
  if (!RESEND_KEY) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: replyTo, to: [to], subject, html }),
    });
    const d = res.ok ? await res.json() : null;
    if (!res.ok) console.error('Resend error:', await res.text());
    return d?.id ?? null;
  } catch (e) { console.error('Resend failed:', e); return null; }
}
async function sendBatch(items: { to: string; subject: string; html: string }[]) {
  const ids: (string | null)[] = [];
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((m) => ({ from: FROM, reply_to: SEAN_EMAIL, to: [m.to], subject: m.subject, html: m.html }))),
      });
      const d = res.ok ? await res.json() : null;
      if (!res.ok) console.error('Resend batch error:', await res.text());
      chunk.forEach((_m, k) => ids.push(d?.data?.[k]?.id || null));
    } catch (e) { console.error('Resend batch failed:', e); chunk.forEach(() => ids.push(null)); }
  }
  return ids;
}
const FOOT = `<p style="font-size:12px;color:#777;margin:18px 0 0">Vegans Explore, a LESARUSS brand. 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p>`;

// One announcement, as a member gets it: from Vegans Explore with the group's name, the organizer's words as plain text, and the
// member's own link to read it, stop the group's emails, leave or report it. No email address is shown either way; replies come to us.
function announcementEmail(group: any, a: { title: string; body: string }, token: string, name: string) {
  const link = `${SITE}/messages#g/${token}`;
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="font-size:13px;color:#555;margin:0 0 14px">An announcement from <b>${esc(group.name)}</b>, sent through Vegans Explore.</p>` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(name))},</p>` +
    `<div style="border-left:3px solid #3A9B3E;background:#f7f8f7;padding:14px 16px;border-radius:6px;margin:0 0 18px"><b>${esc(a.title)}</b><br>${esc(a.body).replace(/\r?\n/g, '<br>')}</div>` +
    `<p style="font-size:13px;color:#555;margin:0 0 8px">You are getting this because you joined ${esc(group.name)} on Vegans Explore and said yes to its announcements. ${esc(group.name)} does not see your email address.</p>` +
    `<p style="font-size:13px;margin:0"><a href="${SITE}/directory/${encodeURIComponent(group.slug)}" style="color:#1f5f22;font-weight:700">See ${esc(group.name)}</a> &middot; <a href="${link}" style="color:#1f5f22;font-weight:700">Stop these emails</a> &middot; <a href="${link}" style="color:#1f5f22;font-weight:700">Report this</a></p>${FOOT}</div>`;
}
// The gift: one person, one link, from the organizer and their group.
function giftEmail(group: any, giver: string, inv: any, note: string) {
  const url = `${SITE}/invite?c=${inv.code}`;
  const pts = Number(inv.points || 0).toLocaleString('en-US');
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(inv.name))},</p>` +
    `<p style="margin:0 0 12px"><b>${esc(giver)}</b> of <b>${esc(group.name)}</b> gave you a Vegans Explore Passport: a Founding Membership, on them, with <b>${pts} points</b> to start.</p>` +
    (note ? `<div style="border-left:3px solid #3A9B3E;background:#f7f8f7;padding:14px 16px;border-radius:6px;margin:0 0 14px">${esc(note).replace(/\r?\n/g, '<br>')}</div>` : '') +
    `<p style="margin:0 0 12px">Vegans Explore is a community for Vegans, city by city: the places, the events, the groups and the people. Your Passport opens all of it, and ${esc(group.name)} is waiting for you there.</p>` +
    `<p style="margin:0 0 16px"><a href="${url}" style="display:inline-block;background:#2d7d31;color:#fff;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:6px">Accept your Passport</a></p>` +
    `<p style="font-size:13px;color:#555;margin:0">This gift is just for ${esc(inv.email)} and works once, until ${esc(new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' }))}. Nothing to pay.</p>${FOOT}</div>`;
}

async function groupOf(lid: unknown) {
  if (!isId(lid)) return null;
  const { data } = await db.from('listings').select('id, name, slug, category, status, owner_member_id, claimed_by_member_id, claim_status').eq('id', lid).maybeSingle();
  return data && data.status === 'approved' && data.category === 'Groups' ? data : null;
}
async function partnerOf(lid: string) {
  const { data } = await db.from('ve_group_partners').select('id, listing_id, lead_member_id, status, code').eq('listing_id', lid).maybeSingle();
  return data;
}
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'group_partner_program').maybeSingle();
  return (data?.value ?? {}) as any;
}
// Stripe, the way ve-restaurant-audit does it: test accounts (ve_test_checkout_allowlist) pay on the test key.
async function stripeKey(test: boolean) {
  if (!test) return Deno.env.get('STRIPE_SECRET_KEY') ?? '';
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST').maybeSingle();
  const k = String(data?.value || '');
  if (!k.startsWith('sk_test_')) throw new Error('test key missing');
  return k;
}
async function isTestAccount(email: string | null) {
  if (!email) return false;
  const { data } = await db.from('ve_test_checkout_allowlist').select('email').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}
const dayName = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' });

// Who the gift is for, checked the same way for a gift from earnings and one paid by card. Returns the price and the balance too.
async function giftCheck(g: any, partner: any, body: any) {
  const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase(), note = clean(body.note, 501);
  if (!name) return { err: json({ error: 'missing', message: 'Who is it for? Give their name.' }, 400) };
  if (!isEmail(email)) return { err: json({ error: 'bad_email', message: 'That email does not look right.' }, 400) };
  if (note.length > 500) return { err: json({ error: 'too_long', message: 'Keep the note to 500 characters.' }, 400) };
  const cfg = await settings();
  const { data: reg } = await db.from('members').select('id, membership_status').ilike('email', email).limit(1);
  if (reg?.length && reg[0].membership_status === 'active') return { err: json({ error: 'member', message: 'They are already a member. Nothing to gift.' }, 409) };
  const { data: open } = await db.from('universe_invites').select('id, email').eq('points_to', 'gift').eq('listing_id', g.id).in('status', ['ready', 'sent', 'opened']);
  if ((open || []).some((x: any) => String(x.email).toLowerCase() === email)) return { err: json({ error: 'open', message: 'You already have a gift waiting for that email.' }, 409) };
  if ((open || []).length >= (cfg.gift_open_max ?? 20)) return { err: json({ error: 'too_many', message: `${cfg.gift_open_max ?? 20} gifts can wait at once. Cancel one or wait for them to be used.` }, 429) };
  const [{ data: rate }, { data: bal }, { data: held }] = await Promise.all([
    db.rpc('ve_group_rate', { p_group: partner.id }), db.rpc('ve_group_balance', { p_group: partner.id }),
    db.from('ve_affiliate_commissions').select('commission_cents, hold_until').eq('group_partner_id', partner.id).eq('status', 'pending').order('hold_until').limit(200),
  ]);
  const ratePct = Number((rate as any)?.rate_pct ?? 20);
  const cost = Math.round(1100 * (100 - ratePct) / 100);
  const credit = Number(cfg.gift_credit_cents ?? 0);
  const holding = (held || []).reduce((t: number, x: any) => t + Number(x.commission_cents || 0), 0);
  return { name, email, note, cfg, ratePct, cost, balance: Number(bal || 0), credit, holding, nextClear: (held || [])[0]?.hold_until || null };
}

// Makes the gift: the invitation for one email and, from earnings, its cost as a negative commission row. paid: bought by card.
async function makeGift(o: { g: any; partner: any; giver: any; name: string; email: string; note: string; send: boolean; ratePct: number; cost: number; cfg: any;
  paid?: { session: string; cents: number } }) {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
  const now = new Date();
  const { data: inv, error } = await db.from('universe_invites').insert({
    code, brand: 'vegans-explore', name: o.name, email: o.email, comp: true, points: Number(o.cfg.gift_points ?? 1100), reason: o.note || null, points_to: 'gift', listing_id: o.g.id,
    status: 'sent', sent_via: o.send ? 'email' : 'copied', sent_at: now.toISOString(),
    expires_at: new Date(now.getTime() + Number(o.cfg.gift_days ?? 30) * DAY_MS).toISOString(), created_by: `member:${o.giver.id}`, pool: 'group-gift',
    paid_session: o.paid?.session ?? null, paid_cents: o.paid?.cents ?? null,
  }).select('*').single();
  if (error || !inv) {
    // The webhook and the buyer's return trip both confirm a card gift: the second finds the first one's gift.
    if (o.paid && (error as any)?.code === '23505') {
      const { data: had } = await db.from('universe_invites').select('*').eq('paid_session', o.paid.session).maybeSingle();
      if (had) return { inv: had, dup: true };
    }
    return { error: error?.message || 'save_failed' };
  }
  if (!o.paid) {
    const { error: ce } = await db.from('ve_affiliate_commissions').insert({
      group_partner_id: o.partner.id, product: 'gift', product_ref: inv.id, ref: `gift:${inv.id}`, sale_cents: 1100, level: 0, rate_pct: o.ratePct,
      commission_cents: -o.cost, route: 'group', route_listing_id: o.g.id, status: 'ready', hold_until: now.toISOString(), note: `A Passport gift to ${o.name} (${o.email})`,
    });
    if (ce) { await db.from('universe_invites').delete().eq('id', inv.id); return { error: ce.message }; }
  }
  let emailed = false;
  if (o.send) {
    const id = await sendOne(o.email, `${firstName(o.giver.name)} of ${o.g.name} gave you a Vegans Explore Passport`, giftEmail(o.g, shortName(o.giver.name), inv, o.note));
    emailed = !!id;
    await db.from('universe_invites').update(id ? { resend_email_id: id } : { sent_via: 'copied' }).eq('id', inv.id);
  }
  return { inv, emailed };
}

// A card gift's checkout came back (the buyer, or ve-stripe-webhook): check it is paid, make the gift once, back to the dashboard.
async function confirmGift(sessionId: string): Promise<Response> {
  const go = (u: string) => new Response(null, { status: 302, headers: { Location: u } });
  const test = sessionId.startsWith('cs_test_');
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(test)}` } });
  if (!res.ok) return go(SITE);
  const s = await res.json(), m = s.metadata || {};
  if (m.type !== 've_group_gift' || !isId(m.listing_id) || !isId(m.member_id)) return go(SITE);
  const g = await groupOf(m.listing_id);
  if (!g) return go(SITE);
  const back = `${SITE}/directory/${encodeURIComponent(g.slug)}?tab=brand&pd=gift`;
  if (s.payment_status !== 'paid') return go(`${back}&gift=unpaid`);
  const partner = await partnerOf(g.id);
  const { data: giver } = await db.from('members').select('id, name').eq('id', m.member_id).maybeSingle();
  if (!partner || !giver) return go(back);
  const cfg = await settings();
  const r: any = await makeGift({ g, partner, giver, name: clean(m.name, 120), email: clean(m.email, 200).toLowerCase(), note: clean(m.note, 500), send: m.send === '1',
    ratePct: Number(m.rate_pct || 0), cost: Number(s.amount_total || 0), cfg, paid: { session: s.id, cents: Number(s.amount_total || 0) } });
  if (!r.inv) { console.error('card gift not made', s.id, r.error); return go(`${back}&gift=error`); }
  return go(`${back}&gift=paid&code=${r.inv.code}${r.emailed || (r.dup && r.inv.resend_email_id) ? '&emailed=1' : ''}`);
}

// ---- Tickets
// What a buyer pays and what the group keeps: our fee is a share of the tickets (5%), passed on to the buyer when the group chooses;
// card processing (2.9% + 30 cents on what is charged) is always the buyer's, worked out so the processing is covered in full.
function priceFor(unit: number, qty: number, passFee: boolean, feePct: number) {
  const tickets = unit * qty;
  const fee = Math.round(tickets * feePct / 100);
  const base = tickets + (passFee ? fee : 0);
  const total = Math.ceil((base + 30) / (1 - 0.029));
  return { tickets, fee, processing: total - base, total, group: tickets - (passFee ? 0 : fee) };
}
const isOver = (e: any) => new Date(e.ends_at || new Date(e.starts_at).getTime() + 6 * 3600000).getTime() < Date.now();
const whenText = (e: any) => new Date(e.starts_at).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: e.timezone || 'America/New_York' });
const codeOk = (v: unknown) => typeof v === 'string' && /^[A-Z2-9]{8}$/.test(v.trim().toUpperCase());

// An event that sells through us: approved, hosted by a Groups listing whose Group Partnership is onboarding or active.
async function saleOf(eventId: unknown) {
  if (!isId(eventId)) return null;
  const { data: e } = await db.from('events').select('id, title, starts_at, ends_at, timezone, location_name, address, city, status, host_listing_id, refund_policy, tenant_id')
    .eq('id', eventId).maybeSingle();
  if (!e || e.status !== 'approved' || !e.host_listing_id) return null;
  const g = await groupOf(e.host_listing_id);
  if (!g) return null;
  const partner = await partnerOf(g.id);
  return { e, g, partner: partner && ['onboarding', 'active'].includes(partner.status) ? partner : null };
}

function ticketEmail(e: any, g: any, codes: string[], name: string) {
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(name))},</p>` +
    `<p style="margin:0 0 12px">You're going to <b>${esc(e.title)}</b> with <b>${esc(g.name)}</b>: ${esc(whenText(e))}${e.location_name ? `, ${esc(e.location_name)}` : ''}${e.city ? `, ${esc(e.city)}` : ''}.</p>` +
    `<p style="margin:0 0 8px">Your ${codes.length === 1 ? 'ticket. Show this code' : codes.length + ' tickets. Show these codes'} at the door:</p>` +
    `<p style="font:800 22px/1.5 monospace;letter-spacing:.12em;margin:0 0 14px">${codes.map(esc).join('<br>')}</p>` +
    (e.refund_policy ? `<p style="font-size:13px;color:#555;margin:0 0 12px"><b>Refunds:</b> ${esc(e.refund_policy)}</p>` : '') +
    `<p style="margin:0 0 12px"><a href="${SITE}/events#event/${e.id}" style="color:#1f5f22;font-weight:700">The event and your tickets</a></p>${FOOT}</div>`;
}
function guestPassEmail(e: any, g: any, code: string, name: string) {
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(name))},</p>` +
    `<p style="margin:0 0 12px">You're on the guest list for <b>${esc(e.title)}</b> with <b>${esc(g.name)}</b>: ${esc(whenText(e))}${e.location_name ? `, ${esc(e.location_name)}` : ''}${e.city ? `, ${esc(e.city)}` : ''}.</p>` +
    `<p style="margin:0 0 8px">This is your guest pass, your one free event as our guest. Show this code at the door:</p>` +
    `<p style="font:800 22px/1.5 monospace;letter-spacing:.12em;margin:0 0 14px">${esc(code)}</p>` +
    `<p style="margin:0 0 12px">Want to keep coming? From your next event, you join with the Vegans Explore Passport: $11, one time, with 1,100 points, and every group and event in every city opens.</p>` +
    `<p style="margin:0 0 12px"><a href="${SITE}/passport" style="color:#1f5f22;font-weight:700">See the Passport</a> &middot; <a href="${SITE}/events#event/${e.id}" style="color:#1f5f22;font-weight:700">The event</a></p>${FOOT}</div>`;
}

// A ticket checkout came back (the buyer, or ve-stripe-webhook): check it is paid and for this order, make the tickets once, email
// the codes, and go back to the event.
async function confirmTicket(s: any): Promise<Response> {
  const go = (u: string) => new Response(null, { status: 302, headers: { Location: u } });
  const m = s.metadata || {};
  const { data: o } = isId(m.order_id) ? await db.from('ve_ticket_orders').select('*').eq('id', m.order_id).maybeSingle() : { data: null };
  if (!o) return go(SITE + '/events');
  const back = `${SITE}/events#event/${o.event_id}`;
  if (s.payment_status !== 'paid' || Number(s.amount_total) !== o.total_cents) return go(`${SITE}/events?tickets=unpaid#event/${o.event_id}`);
  const intent = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id || null;
  const { data: r } = await db.rpc('ve_ticket_order_paid', { p_order: o.id, p_session: s.id, p_intent: intent });
  if (!r?.ok) { console.error('ticket order not made', o.id, r); return go(`${SITE}/events?tickets=error#event/${o.event_id}`); }
  if (!r.dup) {
    const x = await saleOf(o.event_id);
    const { data: buyer } = await db.from('members').select('name, email').eq('id', o.member_id).maybeSingle();
    if (x && buyer?.email) await sendOne(buyer.email, `Your tickets: ${x.e.title}`, ticketEmail(x.e, x.g, (r.codes || []) as string[], buyer.name));
  }
  return go(`${SITE}/events?tickets=paid#event/${o.event_id}`);
}
async function confirmSession(sessionId: string): Promise<Response> {
  const test = sessionId.startsWith('cs_test_');
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await stripeKey(test)}` } });
  if (!res.ok) return new Response(null, { status: 302, headers: { Location: SITE } });
  const s = await res.json();
  if (s.metadata?.type === 've_ticket') return await confirmTicket(s);
  return await confirmGift(sessionId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  if (req.method === 'GET' && url.searchParams.get('confirm')) {
    try { return await confirmSession(url.searchParams.get('confirm')!); }
    catch (e) { console.error('confirm failed', e); return new Response(null, { status: 302, headers: { Location: SITE } }); }
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const memberId = await memberOf(req, body);
  const { data: member } = memberId ? await db.from('members').select('id, name, email, membership_status, is_superadmin').eq('id', memberId).maybeSingle() : { data: null };
  const active = member?.membership_status === 'active';

  // ---- A member's link from an announcement email (no sign-in: the link is theirs alone).
  if (action.startsWith('msg_')) {
    const tok = typeof body.token === 'string' && /^[0-9a-f]{64}$/.test(body.token) ? body.token : '';
    const { data: d } = tok ? await db.from('ve_group_announcement_deliveries').select('id, member_id, announcement_id, read_at, reported_at').eq('token', tok).maybeSingle() : { data: null };
    const { data: a } = d ? await db.from('ve_group_announcements').select('id, listing_id, title, body, created_at').eq('id', d.announcement_id).maybeSingle() : { data: null };
    const g = a ? await groupOf(a.listing_id) : null;
    if (!d || !a || !g) return json({ error: 'not_found' }, 404);
    const { data: gm } = await db.from('ve_group_members').select('email_ok, left_at').eq('listing_id', g.id).eq('member_id', d.member_id).maybeSingle();
    if (action === 'msg_get') {
      if (!d.read_at) await db.from('ve_group_announcement_deliveries').update({ read_at: new Date().toISOString() }).eq('id', d.id);
      return json({ group: { name: g.name, slug: g.slug }, title: a.title, body: a.body, sent_at: a.created_at,
        stopped: !gm?.email_ok, left: !!gm?.left_at, reported: !!d.reported_at });
    }
    if (action === 'msg_stop') { await db.from('ve_group_members').update({ email_ok: false, email_ok_at: new Date().toISOString() }).eq('listing_id', g.id).eq('member_id', d.member_id); return json({ ok: true }); }
    if (action === 'msg_leave') { await db.from('ve_group_members').update({ left_at: new Date().toISOString(), email_ok: false }).eq('listing_id', g.id).eq('member_id', d.member_id); return json({ ok: true }); }
    if (action === 'msg_report') {
      if (d.reported_at) return json({ ok: true });
      const at = new Date().toISOString(), note = clean(body.note, 1000);
      await db.from('ve_group_announcement_deliveries').update({ reported_at: at, report_note: note || null }).eq('id', d.id);
      await db.from('ve_group_members').update({ email_ok: false, email_ok_at: at }).eq('listing_id', g.id).eq('member_id', d.member_id);
      // A report pauses the group's emails until the team looks (the page posts stay).
      await db.from('ve_group_mail_holds').upsert({ listing_id: g.id, paused_at: at, reason: 'A member reported an announcement' }, { onConflict: 'listing_id' });
      await sendOne(SEAN_EMAIL, `[Groups] A member reported ${g.name}'s announcement`,
        `<p>A member reported an announcement from <b>${esc(g.name)}</b>. Its emails are paused until the team looks (delete the group's row in ve_group_mail_holds to resume).</p>` +
        `<p><b>${esc(a.title)}</b><br>${esc(a.body).replace(/\r?\n/g, '<br>')}</p>${note ? `<p>Why they reported it: ${esc(note)}</p>` : ''}` +
        `<p><a href="${SITE}/directory/${encodeURIComponent(g.slug)}">The group's page</a></p>`);
      return json({ ok: true });
    }
    return json({ error: 'unknown_action' }, 400);
  }

  // ---- Tickets and guest passes, on the event (no listing_id).
  if (['event_tickets', 'ticket_checkout', 'guest_pass'].includes(action)) {
    const x = await saleOf(body.event_id);
    if (!x || !x.partner) return json({ sale: false });
    const { e, g: hg, partner: hp } = x;
    const cfg = await settings(), feePct = Number(cfg.ticket_fee_pct ?? 5), over = isOver(e);
    const { data: types } = await db.from('ve_ticket_types').select('id, name, price_cents, quantity, sold, pass_fee, active, sort').eq('event_id', e.id).eq('active', true)
      .order('sort').order('price_cents');
    const paid = (types || []).length > 0;

    if (action === 'event_tickets') {
      let mine: string[] = [], pass: string | null = null;
      if (member) {
        const { data: os } = await db.from('ve_ticket_orders').select('id').eq('event_id', e.id).eq('member_id', member.id).eq('status', 'paid');
        if (os?.length) {
          const { data: ts } = await db.from('ve_tickets').select('code').in('order_id', os.map((o: any) => o.id)).is('voided_at', null).order('created_at');
          mine = (ts || []).map((t: any) => t.code);
        }
        if (member.email) { const { data: gp } = await db.from('ve_guest_passes').select('code').eq('event_id', e.id).ilike('email', member.email).maybeSingle(); pass = gp?.code || null; }
      }
      return json({ sale: true, group: { name: hg.name, slug: hg.slug }, over, refund_policy: e.refund_policy || '', fee_pct: feePct, max: Number(cfg.ticket_max_per_order ?? 10),
        types: (types || []).map((t: any) => ({ id: t.id, name: t.name, price_cents: t.price_cents, buyer_cents: priceFor(t.price_cents, 1, t.pass_fee, feePct).total,
          left: t.quantity == null ? null : Math.max(0, t.quantity - t.sold) })),
        guest_pass: !paid && !over, viewer: { signed_in: !!member, active, tickets: mine, guest_pass: pass } });
    }

    if (over) return json({ error: 'over', message: 'This event is over.' }, 400);

    if (action === 'ticket_checkout') {
      if (!member) return json({ error: 'not_authenticated' }, 401);
      if (!active) return json({ error: 'members_only', message: 'Tickets are for Passport holders.' }, 403);
      const t = (types || []).find((y: any) => y.id === body.type_id);
      if (!t) return json({ error: 'not_found', message: 'That ticket is not on sale.' }, 404);
      const qty = Math.floor(Number(body.quantity) || 1), max = Number(cfg.ticket_max_per_order ?? 10);
      if (qty < 1 || qty > max) return json({ error: 'quantity', message: `Up to ${max} tickets at a time.` }, 400);
      if (t.quantity != null && t.sold + qty > t.quantity) return json({ error: 'sold_out', message: t.sold >= t.quantity ? 'Those tickets are sold out.' : `Only ${t.quantity - t.sold} left.` }, 409);
      const pr = priceFor(t.price_cents, qty, t.pass_fee, feePct);
      const test = await isTestAccount(member.email);
      const { data: o, error: oe } = await db.from('ve_ticket_orders').insert({ event_id: e.id, ticket_type_id: t.id, member_id: member.id, group_partner_id: hp.id, quantity: qty,
        unit_cents: t.price_cents, fee_cents: pr.fee, processing_cents: pr.processing, total_cents: pr.total, group_cents: pr.group, pass_fee: t.pass_fee, test }).select('id').single();
      if (oe || !o) return json({ error: 'save_failed' }, 500);
      const params = new URLSearchParams({
        mode: 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': ((test ? '[TEST] ' : '') + `${qty} x ${t.name}: ${e.title}`).slice(0, 120),
        'line_items[0][price_data][product_data][description]': `${money(pr.tickets)} in tickets${t.pass_fee ? `, ${money(pr.fee)} service fee` : ''}, ${money(pr.processing)} card processing. Hosted by ${hg.name}.`.slice(0, 300),
        'line_items[0][price_data][unit_amount]': String(pr.total),
        'line_items[0][quantity]': '1',
        success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE}/events?tickets=canceled#event/${e.id}`,
        'metadata[type]': 've_ticket', 'metadata[confirm_fn]': 've-group', 'metadata[order_id]': o.id, 'metadata[event_id]': e.id,
        expires_at: String(Math.floor(Date.now() / 1000) + 30 * 60),
      });
      if (member.email) { params.set('customer_email', member.email); params.set('payment_intent_data[receipt_email]', member.email); }
      if (test) params.set('metadata[test]', 'true');
      const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
      const sj = await sres.json();
      if (!sres.ok) { console.error('stripe', sj); await db.from('ve_ticket_orders').update({ status: 'canceled' }).eq('id', o.id); return json({ error: 'stripe', message: 'Checkout did not open. Try again in a minute.' }, 400); }
      await db.from('ve_ticket_orders').update({ stripe_session: sj.id }).eq('id', o.id);
      return json({ ok: true, url: sj.url, total_cents: pr.total, test_mode: test });
    }

    // guest_pass: someone without a Passport, at a free event, once.
    if (paid) return json({ error: 'paid_event', message: 'This event has tickets. Tickets are for Passport holders.' }, 400);
    if (active) return json({ error: 'member', message: 'You have a Passport: tap I\'m going instead.' }, 400);
    const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase();
    if (!name) return json({ error: 'missing', message: 'Your name, please.' }, 400);
    if (!isEmail(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
    const { data: reg } = await db.from('members').select('membership_status').ilike('email', email).limit(1);
    if (reg?.length && reg[0].membership_status === 'active') return json({ error: 'member', message: 'That email has a Passport. Sign in and tap I\'m going.' }, 400);
    const { data: had } = await db.from('ve_guest_passes').select('event_id, created_at').ilike('email', email).maybeSingle();
    if (had) return json({ error: 'used', message: had.event_id === e.id ? 'You are already on the guest list. Your code is in your email.' :
      'Your guest pass has been used. From your second event, you join with the Vegans Explore Passport: $11, one time.' }, 409);
    const { data: c } = await db.rpc('ve_ticket_code');
    const { error: ge } = await db.from('ve_guest_passes').insert({ email, name, event_id: e.id, listing_id: hg.id, member_id: member?.id || null, code: c });
    if (ge) return json({ error: (ge as any).code === '23505' ? 'used' : 'save_failed', message: 'Your guest pass has been used.' }, (ge as any).code === '23505' ? 409 : 500);
    await sendOne(email, `Your guest pass: ${e.title}`, guestPassEmail(e, hg, String(c), name));
    return json({ ok: true, code: c });
  }

  const g = await groupOf(body.listing_id);
  if (!g) return json({ error: 'not_found' }, 404);
  const partner = await partnerOf(g.id);
  const isLead = !!memberId && !!partner && partner.lead_member_id === memberId && ['onboarding', 'active', 'paused'].includes(partner.status);
  const isOwner = !!memberId && (g.owner_member_id === memberId || g.claimed_by_member_id === memberId);
  const canPost = isLead || isOwner || !!member?.is_superadmin;

  if (action === 'page') {
    const [{ data: anns, count }, { count: members }, { data: me }] = await Promise.all([
      db.from('ve_group_announcements').select('id, title, body, pinned, created_at', { count: 'exact' }).eq('listing_id', g.id).is('removed_at', null)
        .order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
      db.from('ve_group_members').select('member_id', { count: 'exact', head: true }).eq('listing_id', g.id).is('left_at', null),
      memberId ? db.from('ve_group_members').select('email_ok, left_at').eq('listing_id', g.id).eq('member_id', memberId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return json({ announcements: (anns || []).map((a: any) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, at: a.created_at })), total: count || 0,
      members: members || 0, partner: !!partner && ['onboarding', 'active'].includes(partner.status),
      viewer: { signed_in: !!member, active, joined: !!me && !me.left_at, email_ok: !!me && !me.left_at && me.email_ok }, can_post: canPost });
  }

  if (action === 'join' || action === 'leave' || action === 'email_pref') {
    if (!member) return json({ error: 'not_authenticated' }, 401);
    const now = new Date().toISOString();
    if (action === 'leave') {
      await db.from('ve_group_members').update({ left_at: now, email_ok: false }).eq('listing_id', g.id).eq('member_id', member.id);
      return json({ ok: true, joined: false });
    }
    if (!active) return json({ error: 'members_only', message: 'Groups are for Passport holders.' }, 403);
    const ok = body.email_ok === true;
    if (action === 'email_pref') {
      const { data } = await db.from('ve_group_members').update({ email_ok: ok, email_ok_at: now }).eq('listing_id', g.id).eq('member_id', member.id).is('left_at', null).select('member_id');
      if (!data?.length) return json({ error: 'not_joined' }, 400);
      return json({ ok: true, email_ok: ok });
    }
    const { error } = await db.from('ve_group_members').upsert({ listing_id: g.id, member_id: member.id, joined_at: now, left_at: null, email_ok: ok, email_ok_at: now, via: 'page' }, { onConflict: 'listing_id,member_id' });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, joined: true, email_ok: ok });
  }

  // ---- The organizer from here on.
  if (!member) return json({ error: 'not_authenticated' }, 401);
  if (!canPost) return json({ error: 'not_organizer' }, 403);
  const dash = async () => { const { data } = await db.rpc('ve_group_dash', { p_listing: g.id }); return data || {}; };

  if (action === 'dash') return json({ ok: true, ...(await dash()), lead: isLead });

  if (action === 'group_announce') {
    const title = clean(body.title, 121), text = clean(body.body, 1001);
    if (!title) return json({ error: 'missing', message: 'Give it a title.' }, 400);
    if (!text) return json({ error: 'missing', message: 'Write the message.' }, 400);
    if (title.length > 120) return json({ error: 'too_long', message: 'Keep the title to 120 characters.' }, 400);
    if (text.length > 1000) return json({ error: 'too_long', message: 'Keep it to 1,000 characters.' }, 400);
    const cfg = await settings();
    const { count: today } = await db.from('ve_group_announcements').select('id', { count: 'exact', head: true }).eq('listing_id', g.id).gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
    if ((today || 0) >= (cfg.posts_per_day ?? 5)) return json({ error: 'cap', message: `${cfg.posts_per_day ?? 5} announcements a day at most.` }, 429);
    const email = body.email === true;
    if (email) {
      const { data: hold } = await db.from('ve_group_mail_holds').select('listing_id').eq('listing_id', g.id).maybeSingle();
      if (hold) return json({ error: 'paused', message: 'Your emails are paused while our team looks at a member\'s report. You can still post on your page: untick the email.' }, 403);
      const { count: week } = await db.from('ve_group_announcements').select('id', { count: 'exact', head: true }).eq('listing_id', g.id).eq('emailed', true).gte('created_at', new Date(Date.now() - 7 * DAY_MS).toISOString());
      if ((week || 0) >= (cfg.emails_per_week ?? 2)) return json({ error: 'email_cap', message: `${cfg.emails_per_week ?? 2} emails a week at most. Untick the email to post it on your page now.` }, 429);
    }
    if (body.pin === true) await db.from('ve_group_announcements').update({ pinned: false }).eq('listing_id', g.id).eq('pinned', true);
    const { data: a, error } = await db.from('ve_group_announcements').insert({ listing_id: g.id, author_id: member.id, title, body: text, pinned: body.pin === true, emailed: email })
      .select('id, title, body').single();
    if (error || !a) return json({ error: 'save_failed' }, 500);
    let sent = 0, recipients = 0;
    if (email) {
      const { data: gm } = await db.from('ve_group_members').select('member_id').eq('listing_id', g.id).is('left_at', null).eq('email_ok', true).neq('member_id', member.id).limit(5000);
      const ids = (gm || []).map((x: any) => x.member_id);
      const { data: ms } = ids.length ? await db.from('members').select('id, name, email, membership_status').in('id', ids) : { data: [] };
      const who: Record<string, any> = {}; for (const x of ms || []) if (x.email && x.membership_status === 'active') who[x.id] = x;
      const to = ids.filter((id: string) => who[id]);
      recipients = to.length;
      if (to.length) {
        const { data: dels } = await db.from('ve_group_announcement_deliveries').insert(to.map((id: string) => ({ announcement_id: a.id, member_id: id }))).select('id, member_id, token');
        const list = dels || [];
        const out = await sendBatch(list.map((x: any) => ({ to: who[x.member_id].email, subject: `${g.name}: ${a.title}`, html: announcementEmail(g, a, x.token, who[x.member_id].name) })));
        const now = new Date().toISOString();
        await Promise.all(list.map((x: any, k: number) => db.from('ve_group_announcement_deliveries').update(out[k] ? { email_status: 'sent', email_id: out[k], sent_at: now } : { email_status: 'failed' }).eq('id', x.id)));
        sent = out.filter(Boolean).length;
      }
      await db.from('ve_group_announcements').update({ recipients, sent }).eq('id', a.id);
    }
    return json({ ok: true, sent, recipients, ...(await dash()) });
  }

  if (action === 'announce_remove') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    await db.from('ve_group_announcements').update({ removed_at: new Date().toISOString(), removed_by: member.id, pinned: false }).eq('id', body.id).eq('listing_id', g.id);
    return json({ ok: true, ...(await dash()) });
  }

  // ---- Tickets: the organizer's side, on one of the group's events.
  if (['tickets', 'ticket_type_save', 'refund_policy_save', 'checkin', 'ticket_refund'].includes(action)) {
    let eventId = body.event_id;
    if (action === 'ticket_refund') {
      const { data: oo } = isId(body.order_id) ? await db.from('ve_ticket_orders').select('event_id').eq('id', body.order_id).maybeSingle() : { data: null };
      eventId = oo?.event_id;
    }
    const x = await saleOf(eventId);
    if (!x || x.g.id !== g.id) return json({ error: 'not_found', message: 'That event is not one of your group\'s.' }, 404);
    const e = x.e, cfg = await settings(), feePct = Number(cfg.ticket_fee_pct ?? 5);
    const view = async () => {
      const [{ data: types }, { data: orders }, { data: tix }, { data: passes }] = await Promise.all([
        db.from('ve_ticket_types').select('id, name, price_cents, quantity, sold, pass_fee, active, sort').eq('event_id', e.id).order('sort').order('price_cents'),
        db.from('ve_ticket_orders').select('id, ticket_type_id, member_id, quantity, total_cents, group_cents, fee_cents, status, paid_at, refunded_at, refund_cents, test').eq('event_id', e.id).in('status', ['paid', 'refunded']).order('paid_at', { ascending: false }),
        db.from('ve_tickets').select('id, order_id, code, checked_in_at, voided_at').eq('event_id', e.id),
        db.from('ve_guest_passes').select('id, name, code, checked_in_at, created_at, email').eq('event_id', e.id).order('created_at'),
      ]);
      const ids = [...new Set((orders || []).map((o: any) => o.member_id))];
      const { data: ms } = ids.length ? await db.from('members').select('id, name').in('id', ids) : { data: [] };
      const nm: Record<string, string> = {}; for (const m2 of ms || []) nm[m2.id] = shortName(m2.name || 'A member');
      const tname: Record<string, string> = {}; for (const t of types || []) tname[t.id] = t.name;
      const byOrder: Record<string, any> = {}; for (const o of orders || []) byOrder[o.id] = o;
      const door = [
        ...(tix || []).filter((t: any) => !t.voided_at && byOrder[t.order_id]).map((t: any) => ({ kind: 'ticket', id: t.id, code: t.code, name: nm[byOrder[t.order_id].member_id] || 'A member',
          what: tname[byOrder[t.order_id].ticket_type_id] || 'Ticket', checked_in_at: t.checked_in_at })),
        ...(passes || []).map((p2: any) => ({ kind: 'guest_pass', id: p2.id, code: p2.code, name: shortName(p2.name), what: 'Guest pass', checked_in_at: p2.checked_in_at })),
      ].sort((a, b) => a.name.localeCompare(b.name));
      const paidO = (orders || []).filter((o: any) => o.status === 'paid');
      return { ok: true, event: { id: e.id, title: e.title, starts_at: e.starts_at, over: isOver(e), refund_policy: e.refund_policy || '' }, can_sell: !!x.partner, fee_pct: feePct,
        types: (types || []).map((t: any) => ({ ...t, buyer_cents: priceFor(t.price_cents, 1, t.pass_fee, feePct).total, yours_cents: priceFor(t.price_cents, 1, t.pass_fee, feePct).group })),
        orders: (orders || []).map((o: any) => ({ id: o.id, name: nm[o.member_id] || 'A member', type: tname[o.ticket_type_id] || 'Ticket', quantity: o.quantity, total_cents: o.total_cents,
          group_cents: o.group_cents, status: o.status, paid_at: o.paid_at, refunded_at: o.refunded_at, refund_cents: o.refund_cents, test: o.test })),
        door, totals: { sold: paidO.reduce((t: number, o: any) => t + o.quantity, 0), yours_cents: paidO.reduce((t: number, o: any) => t + o.group_cents, 0),
          fee_cents: paidO.reduce((t: number, o: any) => t + o.fee_cents, 0), guest_passes: (passes || []).length, checked_in: door.filter((d) => d.checked_in_at).length } };
    };

    if (action === 'tickets') return json(await view());

    if (action === 'ticket_type_save') {
      if (!x.partner) return json({ error: 'not_partner', message: 'Tickets are for Group Partners. Ask us about the partnership.' }, 403);
      if (isOver(e)) return json({ error: 'over', message: 'This event is over.' }, 400);
      const name = clean(body.name, 81), price = Math.round(Number(body.price_cents)), qty = body.quantity == null || body.quantity === '' ? null : Math.floor(Number(body.quantity));
      if (!name || name.length > 80) return json({ error: 'name', message: 'Give the ticket a name, up to 80 characters (General admission).' }, 400);
      if (!Number.isFinite(price) || price < 100 || price > 100000) return json({ error: 'price', message: 'A ticket is $1 to $1,000. A free event needs no tickets: guests just say they are going.' }, 400);
      if (qty != null && (!Number.isFinite(qty) || qty < 1 || qty > 10000)) return json({ error: 'quantity', message: 'How many, 1 to 10,000, or leave it empty for no limit.' }, 400);
      const row = { name, quantity: qty, pass_fee: body.pass_fee === true, active: body.active !== false, updated_at: new Date().toISOString() };
      if (isId(body.id)) {
        const { data: t } = await db.from('ve_ticket_types').select('id, price_cents, sold').eq('id', body.id).eq('event_id', e.id).maybeSingle();
        if (!t) return json({ error: 'not_found' }, 404);
        if (t.sold > 0 && t.price_cents !== price) return json({ error: 'price_locked', message: 'Tickets of this type are sold, so its price stays. Add a new ticket type for a new price.' }, 409);
        if (qty != null && qty < t.sold) return json({ error: 'quantity', message: `${t.sold} are already sold.` }, 400);
        await db.from('ve_ticket_types').update({ ...row, price_cents: price }).eq('id', t.id);
      } else {
        const { count } = await db.from('ve_ticket_types').select('id', { count: 'exact', head: true }).eq('event_id', e.id);
        if ((count || 0) >= 6) return json({ error: 'too_many', message: 'Six ticket types at most.' }, 400);
        await db.from('ve_ticket_types').insert({ ...row, event_id: e.id, price_cents: price, sort: count || 0, created_by: member.id });
      }
      return json(await view());
    }

    if (action === 'refund_policy_save') {
      const t = clean(body.text, 601);
      if (t.length > 600) return json({ error: 'too_long', message: 'Keep it to 600 characters.' }, 400);
      await db.from('events').update({ refund_policy: t || null }).eq('id', e.id);
      e.refund_policy = t || null;
      return json(await view());
    }

    if (action === 'checkin') {
      if (!codeOk(body.code)) return json({ error: 'code', message: 'A door code is 8 letters and numbers.' }, 400);
      const code = String(body.code).trim().toUpperCase(), at = body.undo === true ? null : new Date().toISOString(), by = body.undo === true ? null : member.id;
      const { data: t } = await db.from('ve_tickets').select('id, checked_in_at, voided_at').eq('event_id', e.id).eq('code', code).maybeSingle();
      if (t) {
        if (t.voided_at) return json({ error: 'void', message: 'That ticket was refunded.' }, 409);
        if (at && t.checked_in_at) return json({ error: 'already', message: `Already checked in at ${new Date(t.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: e.timezone || 'America/New_York' })}.` }, 409);
        await db.from('ve_tickets').update({ checked_in_at: at, checked_in_by: by }).eq('id', t.id);
        return json(await view());
      }
      const { data: p2 } = await db.from('ve_guest_passes').select('id, checked_in_at').eq('event_id', e.id).eq('code', code).maybeSingle();
      if (!p2) return json({ error: 'not_found', message: 'No ticket or guest pass with that code for this event.' }, 404);
      if (at && p2.checked_in_at) return json({ error: 'already', message: 'That guest pass is already checked in.' }, 409);
      await db.from('ve_guest_passes').update({ checked_in_at: at, checked_in_by: by }).eq('id', p2.id);
      return json(await view());
    }

    // ticket_refund: the tickets' cost back to the card (our 5% included), not card processing; then the order is refunded here.
    const { data: o } = await db.from('ve_ticket_orders').select('*').eq('id', body.order_id).maybeSingle();
    if (!o || o.status !== 'paid') return json({ error: 'status', message: 'Only a paid order can be refunded.' }, 409);
    if (!o.payment_intent) return json({ error: 'no_payment', message: 'We could not find the payment for this order. Write to contact@lesaruss.com.' }, 409);
    const amount = o.total_cents - o.processing_cents;
    const rres = await fetch('https://api.stripe.com/v1/refunds', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(o.test)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ payment_intent: o.payment_intent, amount: String(amount), 'metadata[order_id]': o.id, 'metadata[by]': member.id }).toString() });
    const rj = await rres.json();
    if (!rres.ok) { console.error('refund', rj); return json({ error: 'stripe', message: rj?.error?.message || 'The refund did not go through. Try again in a minute.' }, 400); }
    const { data: rr } = await db.rpc('ve_ticket_order_refunded', { p_order: o.id, p_refund_cents: amount, p_by: member.id });
    if (!rr?.ok) console.error('refund recorded?', o.id, rr);
    const { data: buyer } = await db.from('members').select('name, email').eq('id', o.member_id).maybeSingle();
    if (buyer?.email) await sendOne(buyer.email, `Refunded: ${e.title}`, `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px"><p>Hi ${esc(firstName(buyer.name))},</p>` +
      `<p>${esc(g.name)} refunded your ${o.quantity === 1 ? 'ticket' : o.quantity + ' tickets'} to <b>${esc(e.title)}</b>: ${money(amount)} back to your card in the next few days. Card processing is not refunded.</p>${FOOT}</div>`);
    return json(await view());
  }

  // ---- Gifts: the Group Partner's lead only, from the group's cleared earnings, or by card.
  if (['group_gift', 'gift_checkout', 'gift_send', 'gift_cancel'].includes(action)) {
    if (!isLead || !partner || !['onboarding', 'active'].includes(partner.status)) return json({ error: 'not_lead', message: 'Gifts are for a Group Partner\'s lead.' }, 403);
    if (action === 'gift_send' || action === 'gift_cancel') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).eq('points_to', 'gift').eq('listing_id', g.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      if (['joined', 'accepted', 'canceled', 'expired', 'declined'].includes(inv.status)) return json({ error: 'closed', message: 'That gift is closed.' }, 409);
      if (action === 'gift_cancel') {
        await db.from('universe_invites').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('id', inv.id);
        return json({ ok: true, ...(await dash()) });
      }
      const id = await sendOne(inv.email, `${member.name ? firstName(member.name) + ' of ' : ''}${g.name} gave you a Vegans Explore Passport`, giftEmail(g, shortName(member.name), inv, inv.reason || ''));
      if (!id) return json({ error: 'send_failed', message: 'The email did not go out. Copy the link instead, or try again.' }, 502);
      await db.from('universe_invites').update({ sent_via: 'email', sent_at: new Date().toISOString(), resend_email_id: id, updated_at: new Date().toISOString() }).eq('id', inv.id);
      return json({ ok: true, ...(await dash()) });
    }
    const c: any = await giftCheck(g, partner, body);
    if (c.err) return c.err;
    if (action === 'gift_checkout') {
      const test = await isTestAccount(member.email);
      const back = `${SITE}/directory/${encodeURIComponent(g.slug)}?tab=brand&pd=gift`;
      const params = new URLSearchParams({
        mode: 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': ((test ? '[TEST] ' : '') + `A Vegans Explore Passport for ${c.name}, from ${g.name}`).slice(0, 120),
        'line_items[0][price_data][unit_amount]': String(c.cost),
        'line_items[0][quantity]': '1',
        success_url: `${FN_URL}?confirm={CHECKOUT_SESSION_ID}`,
        cancel_url: `${back}&item=new&gift=canceled`,
        'metadata[type]': 've_group_gift', 'metadata[confirm_fn]': 've-group',
        'metadata[listing_id]': g.id, 'metadata[member_id]': member.id, 'metadata[rate_pct]': String(c.ratePct),
        'metadata[name]': c.name, 'metadata[email]': c.email, 'metadata[note]': c.note, 'metadata[send]': body.send === true ? '1' : '0',
      });
      if (member.email) { params.set('customer_email', member.email); params.set('payment_intent_data[receipt_email]', member.email); }
      if (test) params.set('metadata[test]', 'true');
      const sres = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${await stripeKey(test)}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
      const sj = await sres.json();
      if (!sres.ok) { console.error('stripe', sj); return json({ error: 'stripe', message: 'Checkout did not open. Try again in a minute.' }, 400); }
      return json({ ok: true, url: sj.url, cost_cents: c.cost, test_mode: test });
    }
    if (c.balance + c.credit < c.cost) {
      const soon = c.holding > 0 && c.nextClear ? ` ${money(c.holding)} more is on its 30-day hold; the next of it clears ${dayName(c.nextClear)}.` : '';
      return json({ error: 'balance', can_buy: true, cost_cents: c.cost, balance_cents: c.balance, holding_cents: c.holding, next_clear_at: c.nextClear,
        message: `A gift costs ${money(c.cost)}, and your cleared earnings are ${money(Math.max(0, c.balance))}. Earnings count 30 days after each sale.${soon} You can pay for this gift by card instead.` }, 402);
    }
    const r: any = await makeGift({ g, partner, giver: member, name: c.name, email: c.email, note: c.note, send: body.send === true, ratePct: c.ratePct, cost: c.cost, cfg: c.cfg });
    if (!r.inv) return json({ error: 'save_failed', message: r.error }, 500);
    return json({ ok: true, url: `${SITE}/invite?c=${r.inv.code}`, emailed: r.emailed, cost_cents: c.cost, ...(await dash()) });
  }

  return json({ error: 'unknown_action' }, 400);
});
