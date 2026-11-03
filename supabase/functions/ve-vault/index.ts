// ve-vault: monthly Passport Challenge stops, business gift cards and the Vault (Sean, 2026-11-01, canon
// canon-ve-earn-your-passport; migration 20261101_passport_challenge_stops_vault.sql).
//
// Public
//   { action: 'vault', chapter? }        the Vault: cards open (and those opening on the 1st), by chapter, with the top bid and
//                                         when the week's bidding ends; signed in, your own bid on each. Plus this month's stops.
//   { action: 'offer', slug }             a business's offer: its chapter, the month it can still apply for (the team locks the five
//                                         by the 10th of the month before), slots taken, what we ask and what they get.
// Signed in (any account; a business that is not a member yet applies from its checkout account)
//   { action: 'apply', slug, month, name, agree, pin }   the form is the agreement: typed name, I agree, a 4 to 6 digit staff PIN
//   { action: 'my_stops' }                your slots and how many of your cards were won and redeemed (counts only)
//   { action: 'pin', slot_id, pin }       change the staff PIN (the slot's signer or the listing's owner)
// Members
//   { action: 'bid', card_id, points }    ve_vault_bid: points are only taken from the winner when the week ends
//   { action: 'mine' }                    your bids and the cards you won (code, expiry, status)
//   { action: 'redeem', card_id, pin }    at the restaurant: staff type their PIN on your phone; the card is used once
// Super admins
//   { action: 'admin_list', month? }      every slot for a month by chapter; approve or decline with admin_decide
//   { action: 'admin_decide', slot_id, decision: 'approve'|'decline', note? }
//   { action: 'settle' }                  runs ve_vault_settle now (it also runs every 15 minutes by cron)
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const TEAM = 'contact@lesaruss.com';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
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
async function sha(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
}
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'passport_challenge').maybeSingle();
  return { pilot_chapters: ['south-florida'], slots_per_chapter: 5, cards_per_slot: 4, card_cents: 2500, lock_day: 10, auction_days: 7,
    card_months: 12, min_bid: 100, agreement_version: '2026-11-01', ...((data as any)?.value || {}) };
}
async function mail(to: string, subject: string, html: string, replyTo?: string) {
  if (!RESEND_KEY || !to) return;
  try {
    await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }) });
  } catch (e) { console.error('mail', e); }
}
// Eastern dates. The month a business can still apply for: next month until the 10th, then the month after.
function eastern() { const [y, m, d] = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).split('-').map(Number); return { y, m, d }; }
function monthStr(y: number, m: number) { while (m > 12) { m -= 12; y++; } return `${y}-${String(m).padStart(2, '0')}-01`; }
function openMonth(lockDay: number) { const t = eastern(); return monthStr(t.y, t.m + (t.d <= lockDay ? 1 : 2)); }
function deadlineFor(month: string, lockDay: number) { const [y, m] = month.split('-').map(Number); const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y; return `${py}-${String(pm).padStart(2, '0')}-${String(lockDay).padStart(2, '0')}`; }
function monthWords(month: string) { const [y, m] = month.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
const shortName = (n: unknown) => { const p = String(n || '').trim().split(/\s+/); return p[0] ? p[0] + (p[1] ? ' ' + p[1][0] + '.' : '') : 'A member'; };

// Abuse watch (Sean 2026-11-03): a suspended or banned member may read but not write. A DB error means not blocked.
async function standingBlocked(db: any, memberId: string | null): Promise<boolean> {
  if (!memberId) return false;
  const { data } = await db.from('members').select('standing').eq('id', memberId).maybeSingle();
  return !!data?.standing && data.standing !== 'good';
}
// Pure reads, plus settle (cron or super admin only). Anything not listed is treated as a write.
const READ_ACTIONS = new Set(['vault', 'offer', 'my_stops', 'mine', 'admin_list', 'settle']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  const { data: me } = memberId ? await db.from('members').select('id, name, email, membership_status, is_superadmin, member_class').eq('id', memberId).maybeSingle() : { data: null };
  const cfg = await settings();
  if (me && !READ_ACTIONS.has(action) && await standingBlocked(db, me.id)) {
    return json({ error: 'account_not_in_good_standing', message: 'Your account is on hold. Write to contact@lesaruss.com and we will help.' }, 403);
  }

  // ---------- Public ----------
  if (action === 'vault') {
    let q = db.from('ve_vault_cards').select('id, chapter, value_cents, status, opens_at, auction_ends_at, listing_id, listings(name, slug, logo_url, address_city)')
      .in('status', ['available', 'scheduled']).order('auction_ends_at').limit(300);
    if (body.chapter) q = q.eq('chapter', String(body.chapter));
    const { data: cards } = await q;
    const ids = (cards || []).map((c: any) => c.id);
    const { data: bids } = ids.length ? await db.from('ve_vault_bids').select('card_id, member_id, points').in('card_id', ids) : { data: [] };
    const top = new Map<string, { points: number; n: number }>(), mine = new Map<string, number>();
    for (const b of (bids || []) as any[]) {
      const t = top.get(b.card_id) || { points: 0, n: 0 }; t.n++; if (b.points > t.points) t.points = b.points; top.set(b.card_id, t);
      if (b.member_id === memberId) mine.set(b.card_id, b.points);
    }
    const nowMonth = monthStr(eastern().y, eastern().m);
    const { data: stops } = await db.from('ve_pc_slots').select('chapter, month, listings(name, slug, logo_url, address_city)').eq('status', 'approved').gte('month', nowMonth).order('month').limit(200);
    return json({ ok: true, min_bid: cfg.min_bid, signed_in: !!me, member: me?.membership_status === 'active',
      cards: (cards || []).map((c: any) => ({ id: c.id, chapter: c.chapter, value_cents: c.value_cents, status: c.status, opens_at: c.opens_at, ends_at: c.auction_ends_at,
        listing: { name: c.listings?.name, slug: c.listings?.slug, logo_url: c.listings?.logo_url, city: c.listings?.address_city },
        top: top.get(c.id)?.points || 0, bids: top.get(c.id)?.n || 0, mine: mine.get(c.id) || null })),
      stops: (stops || []).map((s: any) => ({ chapter: s.chapter, month: s.month, name: s.listings?.name, slug: s.listings?.slug, logo_url: s.listings?.logo_url, city: s.listings?.address_city })) });
  }

  if (action === 'offer') {
    const slug = String(body.slug || '');
    const { data: l } = await db.from('listings').select('id, name, slug, logo_url, address_city, address_state, owner_member_id, category').eq('slug', slug).eq('status', 'approved').maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    const { data: chapter } = await db.rpc('ve_chapter_of', { p_city: l.address_city, p_state: l.address_state });
    const month = openMonth(cfg.lock_day);
    const { count } = chapter ? await db.from('ve_pc_slots').select('id', { count: 'exact', head: true }).eq('chapter', chapter).eq('month', month).eq('status', 'approved') : { count: 0 };
    const { data: applied } = await db.from('ve_pc_slots').select('status, month').eq('listing_id', l.id).gte('month', monthStr(eastern().y, eastern().m)).order('month');
    return json({ ok: true, listing: { name: l.name, slug: l.slug, logo_url: l.logo_url, city: l.address_city }, chapter,
      in_pilot: !!chapter && (cfg.pilot_chapters as string[]).includes(chapter as string), month, month_words: monthWords(month), deadline: deadlineFor(month, cfg.lock_day),
      slots: cfg.slots_per_chapter, taken: count || 0, cards: cfg.cards_per_slot, card_cents: cfg.card_cents, card_months: cfg.card_months,
      owned_by_other: !!l.owner_member_id && l.owner_member_id !== memberId, yours: !!l.owner_member_id && l.owner_member_id === memberId,
      member: me?.membership_status === 'active', signed_in: !!me, applied: applied || [], agreement_version: cfg.agreement_version });
  }

  if (action === 'settle') {
    const secret = req.headers.get('x-cron-secret');
    let okCron = false;
    if (secret) { const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle(); okCron = data?.value === secret; }
    if (!okCron && !me?.is_superadmin) return json({ error: 'forbidden' }, 403);
    const { data, error } = await db.rpc('ve_vault_settle');
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, ...(data || {}) });
  }

  if (!me) return json({ error: 'not_authenticated' }, 401);

  // ---------- Businesses ----------
  if (action === 'apply') {
    if (me.member_class === 'agent') return json({ error: 'not_for_this_account' }, 400);
    const { data: l } = await db.from('listings').select('id, name, slug, address_city, address_state, owner_member_id').eq('slug', String(body.slug || '')).eq('status', 'approved').maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    if (l.owner_member_id && l.owner_member_id !== me.id) return json({ error: 'owned_by_someone_else', message: 'This page belongs to another account. Ask its owner to apply.' }, 409);
    const { data: chapter } = await db.rpc('ve_chapter_of', { p_city: l.address_city, p_state: l.address_state });
    if (!chapter || !(cfg.pilot_chapters as string[]).includes(chapter as string)) return json({ error: 'not_in_pilot', message: 'Passport Challenge stops start in South Florida. We will tell you when your chapter opens.' }, 409);
    const month = openMonth(cfg.lock_day);
    if (String(body.month || '') !== month) return json({ error: 'month_closed', month }, 409);
    const { count } = await db.from('ve_pc_slots').select('id', { count: 'exact', head: true }).eq('chapter', chapter).eq('month', month).eq('status', 'approved');
    if ((count || 0) >= cfg.slots_per_chapter) return json({ error: 'full', message: 'Every slot for that month is taken.' }, 409);
    const name = String(body.name || '').replace(/\s+/g, ' ').trim();
    if (name.length < 3 || name.length > 120) return json({ error: 'name', message: 'Type your full name to sign.' }, 400);
    if (body.agree !== true) return json({ error: 'agree', message: 'Tick I agree to sign.' }, 400);
    const pin = String(body.pin || '');
    if (!/^\d{4,6}$/.test(pin)) return json({ error: 'pin', message: 'The staff PIN is 4 to 6 numbers.' }, 400);
    const { data: ex } = await db.from('ve_pc_slots').select('id, status').eq('listing_id', l.id).eq('month', month).maybeSingle();
    if (ex && ex.status !== 'withdrawn') return json({ error: 'already_applied', status: ex.status }, 409);
    const row = { listing_id: l.id, chapter, month, member_id: me.id, status: 'applied', signed_name: name, signed_at: new Date().toISOString(),
      agreement_version: cfg.agreement_version, signed_ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null, pin_set_at: new Date().toISOString() };
    const ins = ex ? await db.from('ve_pc_slots').update(row).eq('id', ex.id).select('id').single() : await db.from('ve_pc_slots').insert(row).select('id').single();
    if (ins.error || !ins.data) return json({ error: 'save_failed' }, 500);
    await db.from('ve_pc_slots').update({ pin_hash: await sha(`${ins.data.id}:${pin}`) }).eq('id', ins.data.id);
    const test = /\[TEST\]/i.test(name);
    if (!test) await mail(TEAM, `Passport Challenge stop: ${l.name} for ${monthWords(month)}`,
      `<p><b>${esc(l.name)}</b> (${esc(l.address_city || '')}) applied to be a Passport Challenge stop in ${esc(monthWords(month))}, offering ${cfg.cards_per_slot} gift cards of $${cfg.card_cents / 100}.</p><p>Signed by ${esc(name)} (${esc(me.email || '')}).</p><p>Approve or decline in <a href="${SITE}/admin/depot/challenge-stops">Depot &gt; Passport Challenge stops</a> by the ${cfg.lock_day}th.</p>`, me.email || undefined);
    // Email D of the Passport Challenge offer (Earn your Passport part 5, 2026-11-01): what happens next, from the team.
    const deadline = new Date(deadlineFor(month, cfg.lock_day) + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
    if (!test && me.email) await mail(me.email, `You applied to be a ${monthWords(month).split(' ')[0]} stop`,
      `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a"><p>Hi ${esc(l.name)},</p>` +
      `<p>We have your application for ${esc(monthWords(month).split(' ')[0])}. Here is what happens next:</p><ol style="padding-left:20px">` +
      `<li>We choose the five stops by ${esc(deadline)} and email you either way.</li>` +
      `<li>If you're chosen, your four cards go live in the Vault on the 1st, your page is yours, and your membership starts.</li>` +
      `<li>Make sure your staff know the PIN you set. If someone leaves, reply to this email and we'll change it.</li></ol><p>Vegans Explore team</p></div>`, 'contact@lesaruss.com');
    return json({ ok: true, slot_id: ins.data.id, month, status: 'applied' });
  }

  if (action === 'my_stops') {
    const { data: owned } = await db.from('listings').select('id').eq('owner_member_id', me.id);
    const lids = (owned || []).map((x: any) => x.id);
    let q = db.from('ve_pc_slots').select('id, month, chapter, status, listing_id, listings(name, slug)').order('month', { ascending: false });
    q = lids.length ? q.or(`member_id.eq.${me.id},listing_id.in.(${lids.join(',')})`) : q.eq('member_id', me.id);
    const { data: slots } = await q;
    const ids = (slots || []).map((s: any) => s.id);
    const { data: cards } = ids.length ? await db.from('ve_vault_cards').select('slot_id, status').in('slot_id', ids) : { data: [] };
    return json({ ok: true, stops: (slots || []).map((s: any) => {
      const cs = (cards || []).filter((c: any) => c.slot_id === s.id);
      return { id: s.id, month: s.month, month_words: monthWords(s.month), status: s.status, listing: s.listings,
        cards: cs.length, won: cs.filter((c: any) => ['won', 'redeemed', 'expired'].includes(c.status)).length, redeemed: cs.filter((c: any) => c.status === 'redeemed').length };
    }) });
  }

  if (action === 'pin') {
    if (!isId(body.slot_id) || !/^\d{4,6}$/.test(String(body.pin || ''))) return json({ error: 'pin', message: 'The staff PIN is 4 to 6 numbers.' }, 400);
    const { data: s } = await db.from('ve_pc_slots').select('id, member_id, listing_id, listings(owner_member_id)').eq('id', body.slot_id).maybeSingle();
    if (!s || (s.member_id !== me.id && (s as any).listings?.owner_member_id !== me.id && !me.is_superadmin)) return json({ error: 'forbidden' }, 403);
    await db.from('ve_pc_slots').update({ pin_hash: await sha(`${s.id}:${body.pin}`), pin_set_at: new Date().toISOString() }).eq('id', s.id);
    return json({ ok: true });
  }

  // ---------- Members ----------
  if (action === 'bid') {
    if (!isId(body.card_id)) return json({ error: 'card_id' }, 400);
    const { data, error } = await db.rpc('ve_vault_bid', { p_member: me.id, p_card: body.card_id, p_points: Math.floor(Number(body.points)) });
    if (error) return json({ error: error.message }, 500);
    return json(data?.error ? { ok: false, ...data } : data);
  }

  if (action === 'mine') {
    const { data: bids } = await db.from('ve_vault_bids').select('card_id, points, ve_vault_cards(status, auction_ends_at, value_cents, listings(name, slug))').eq('member_id', me.id).order('updated_at', { ascending: false }).limit(50);
    const ids = (bids || []).map((b: any) => b.card_id);
    const { data: all } = ids.length ? await db.from('ve_vault_bids').select('card_id, points').in('card_id', ids) : { data: [] };
    const top = new Map<string, number>(); for (const b of (all || []) as any[]) top.set(b.card_id, Math.max(top.get(b.card_id) || 0, b.points));
    const { data: won } = await db.from('ve_vault_cards').select('id, status, code, value_cents, won_at, expires_at, redeemed_at, winning_points, listings(name, slug, logo_url, address_city)').eq('winner_member_id', me.id).order('won_at', { ascending: false });
    return json({ ok: true,
      bids: (bids || []).filter((b: any) => b.ve_vault_cards?.status === 'available').map((b: any) => ({ card_id: b.card_id, points: b.points, top: top.get(b.card_id) || b.points, leading: b.points >= (top.get(b.card_id) || 0), ends_at: b.ve_vault_cards?.auction_ends_at, listing: b.ve_vault_cards?.listings })),
      cards: (won || []).map((c: any) => ({ id: c.id, status: c.status, code: c.code, value_cents: c.value_cents, won_at: c.won_at, expires_at: c.expires_at, redeemed_at: c.redeemed_at, points: c.winning_points, listing: c.listings, holder: shortName(me.name) })) });
  }

  if (action === 'redeem') {
    if (!isId(body.card_id) || !/^\d{4,6}$/.test(String(body.pin || ''))) return json({ ok: false, why: 'pin' }, 400);
    const { data: c } = await db.from('ve_vault_cards').select('id, slot_id, status, winner_member_id, expires_at').eq('id', body.card_id).maybeSingle();
    if (!c || c.winner_member_id !== me.id) return json({ ok: false, why: 'not_yours' }, 404);
    if (c.status === 'redeemed') return json({ ok: false, why: 'used' }, 409);
    if (c.status !== 'won' || (c.expires_at && Date.parse(c.expires_at) < Date.now())) return json({ ok: false, why: 'expired' }, 409);
    const { data: s } = await db.from('ve_pc_slots').select('pin_hash').eq('id', c.slot_id).maybeSingle();
    if (!s?.pin_hash || s.pin_hash !== await sha(`${c.slot_id}:${body.pin}`)) return json({ ok: false, why: 'wrong_pin' }, 403);
    const { data: done } = await db.from('ve_vault_cards').update({ status: 'redeemed', redeemed_at: new Date().toISOString() }).eq('id', c.id).eq('status', 'won').select('id, redeemed_at');
    if (!done || !done.length) return json({ ok: false, why: 'used' }, 409);
    return json({ ok: true, redeemed_at: done[0].redeemed_at });
  }

  // ---------- Super admins ----------
  if (action === 'admin_list' || action === 'admin_decide') {
    if (!me.is_superadmin) return json({ error: 'forbidden' }, 403);
    if (action === 'admin_list') {
      const month = /^\d{4}-\d{2}-01$/.test(String(body.month || '')) ? String(body.month) : openMonth(cfg.lock_day);
      const { data: slots } = await db.from('ve_pc_slots').select('id, chapter, month, status, signed_name, signed_at, note, created_at, members(name, email, membership_status), listings(name, slug, logo_url, address_city)').eq('month', month).order('created_at');
      const ids = (slots || []).map((s: any) => s.id);
      const { data: cards } = ids.length ? await db.from('ve_vault_cards').select('slot_id, status').in('slot_id', ids) : { data: [] };
      const { data: months } = await db.from('ve_pc_slots').select('month').order('month', { ascending: false }).limit(500);
      return json({ ok: true, month, month_words: monthWords(month), deadline: deadlineFor(month, cfg.lock_day), open_month: openMonth(cfg.lock_day), slots_per_chapter: cfg.slots_per_chapter,
        months: [...new Set([openMonth(cfg.lock_day), ...(months || []).map((m: any) => m.month)])],
        slots: (slots || []).map((s: any) => { const cs = (cards || []).filter((c: any) => c.slot_id === s.id);
          return { id: s.id, chapter: s.chapter, status: s.status, signed_name: s.signed_name, signed_at: s.signed_at, note: s.note, member: s.members, listing: s.listings,
            cards: cs.length, won: cs.filter((c: any) => ['won', 'redeemed', 'expired'].includes(c.status)).length, redeemed: cs.filter((c: any) => c.status === 'redeemed').length }; }) });
    }
    if (!isId(body.slot_id) || !['approve', 'decline'].includes(body.decision)) return json({ error: 'bad_request' }, 400);
    const { data: s } = await db.from('ve_pc_slots').select('id, month, status, member_id, signed_name, members(email), listings(name)').eq('id', body.slot_id).maybeSingle();
    if (!s) return json({ error: 'not_found' }, 404);
    const note = String(body.note || '').trim().slice(0, 500) || null;
    if (body.decision === 'approve') {
      const { data, error } = await db.rpc('ve_pc_slot_approve', { p_slot: s.id, p_admin: me.id });
      if (error) return json({ error: error.message }, 500);
      if (data?.error) return json({ ok: false, ...data });
      if (note) await db.from('ve_pc_slots').update({ note }).eq('id', s.id);
    } else {
      if (s.status !== 'applied') return json({ ok: false, error: 'not_waiting' });
      await db.from('ve_pc_slots').update({ status: 'declined', note, decided_by: me.id, decided_at: new Date().toISOString() }).eq('id', s.id);
    }
    const to = (s as any).members?.email, biz = (s as any).listings?.name || 'your business';
    if (to && !/\[TEST\]/i.test(s.signed_name || '')) await mail(to, body.decision === 'approve' ? `${biz} is a Passport Challenge stop in ${monthWords(s.month)}` : `About your Passport Challenge stop`,
      body.decision === 'approve'
        ? `<p>${esc(biz)} is one of the Passport Challenge stops in ${esc(monthWords(s.month))}.</p><p>Your membership is open and your page is yours. Your four $25 cards go into the Vault on the 1st, and members who win one will show it on their phone. Your staff type your PIN on the member's phone to redeem it, once.</p><p>Vegans Explore team</p>`
        : `<p>Thank you for applying. ${esc(biz)} was not picked as a Passport Challenge stop for ${esc(monthWords(s.month))}${note ? ': ' + esc(note) : '.'}</p><p>You can apply for another month any time.</p><p>Vegans Explore team</p>`, TEAM);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
