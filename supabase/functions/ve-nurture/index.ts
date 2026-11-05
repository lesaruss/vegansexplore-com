// ve-nurture: Earn your Passport, part 5 (Sean, 2026-11-01: "Approved, go with your defaults and build it"; canon
// canon-ve-earn-your-passport; migration 20261101_earn_your_passport_emails.sql). Two tracks, both off until Sean turns them on.
//
// THE BUSINESS OFFER (Passport Challenge stops). The team makes an offer for a business (its email and its own tracked link,
// /go/pc-<code> to /business/challenge?listing=<slug>) and sends it (email A). Two days later, on a weekday from 10 AM Eastern, one
// follow-up, "<Month> Passport Challenge stops in <chapter>" (Sean, 2026-11-01: the "what it really costs" email for those who clicked was dropped as
// presumptive; everyone who has not applied gets the same note). Applying (a ve_pc_slots row) is "chosen": ve-vault sends D at once. Two days after the follow-up with no application the
// offer is routed to the Inbox for the chapter's Community Manager. Every email from VEGANS EXPLORE, signed Vegans Explore team.
//
// THE NOT-READY-YET EMAILS (Tasters). Day 3 "This week in <chapter>", Day 7 a story that fits why they came, Day 14 their Guide,
// then the Daily Pulse on Thursdays only for Tasters who said yes to it in the Day 14 email (ve_tasters.pulse_opt_in_at; never two
// emails in six days), and in December three notes on Founding Membership closing.
// Ends when they stop our emails, pay, or earn their membership.
//
//   { action: 'tick' }                               the cron (x-cron-secret) or ops: sends what is due
//   { action: 'settings', offers_on?, tasters_on? }  super admins: reads or sets the two switches
//   { action: 'offers', status? }                    super admins: the offers and their state
//   { action: 'offer_create', slug, email, name? }   super admins: a draft offer and its tracked link
//   { action: 'offer_send', id }                     super admins: sends email A now
//   { action: 'offer_cancel', id }                   super admins: stops an offer
//   { action: 'offer_stop', code }                   anyone with the code (the email's link): stops our emails to that address
//   { action: 'pulse_optin', key }                   a Taster with their key (the Day 14 email's link): the weekly Daily Pulse, yes
//   { action: 'preview', kind, offer_id?, taster_id? }  super admins: {subject, html} of any email, on a real or a sample person
//   { action: 'test', kind, offer_id?, taster_id? }     super admins: that email to the signed-in admin, [Test] in the subject
//   { action: 'tasters' }                            super admins: Tasters on the track, what each was sent and what is next
// Sending (Sean, 2026-11-01: "where is this living? Do we have an email system in the HQ?"): every email goes through email-send, the
// LESARUSS email system HQ > Email reads (brand vegans-explore: VEGANS EXPLORE <hello@mail.lesaruss.ai>, replies to contact@lesaruss.com,
// one-click unsubscribe, the postal address, the brand's suppressions, an email_sends row per email). Each email has one campaign_ref
// (refOf), registered once in email_campaigns as an automatic campaign on its first real send, so HQ > Email lists it with its numbers.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const BRAND = 'vegans-explore';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const DEADLINE = Date.parse('2027-01-01T05:00:00Z');
const DECEMBER = [['dec-1', '2026-12-01'], ['dec-2', '2026-12-18'], ['dec-3', '2026-12-30']];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const likeEsc = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c);
const b64u = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const b64uStr = (s: string) => b64u(new TextEncoder().encode(s));
function fromB64u(s: string) { const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : ''; const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); }

const GUIDES: Record<string, string> = { 'vegan-dairy-guide': 'The Vegan Dairy Guide', 'nutrition-guide': 'The Nutrition Guide', 'vegan-restaurant-guide': 'The Vegan Restaurant Guide',
  'stadium-arena-guide': 'The Stadium & Arena Guide', 'airport-guide': 'The Airport Guide', 'creator-guide': 'The Creator Guide', 'nonprofit-guide': 'The Nonprofit Guide' };
const GUIDE_LINE: Record<string, string> = {
  'vegan-dairy-guide': 'It shows you the Vegan milk, cheese, butter and ice cream worth buying, where to find them, and simple swaps and recipes.',
  'nutrition-guide': 'It covers the nutrients people ask about, B12, protein, iron and the rest: how much you need and where to get it, with the sources named.',
  'vegan-restaurant-guide': 'It walks a Vegan restaurant through getting found online, with a free check of your listing and every fix explained.',
  'stadium-arena-guide': 'It maps the Vegan food inside the stadiums and arenas near you, stand by stand, with directions from your seat.',
  'airport-guide': 'It maps the Vegan food in the airports, terminal by terminal, before and after security, with directions from your gate.',
  'creator-guide': 'It is ten lessons for Vegan creators on building an audience and working with brands.',
  'nonprofit-guide': 'It is ten lessons for people who run Vegan nonprofits, rescues and sanctuaries.' };
const WHY: Record<string, string> = { food: 'finding Vegan food and places', going: 'going Vegan, or eating more Vegan', vegan: 'your Vegan community', animals: 'helping animals', business: 'your business', creator: 'creating content' };
const CHAPTER_NAME: Record<string, string> = { 'south-florida': 'South Florida', 'central-florida': 'Central Florida', 'north-florida': 'North Florida', atlanta: 'Atlanta', 'washington-dc': 'Washington, D.C.',
  delaware: 'Delaware', maryland: 'Maryland', virginia: 'Virginia', 'west-virginia': 'West Virginia', 'new-york': 'New York', philadelphia: 'Philadelphia', 'los-angeles': 'Los Angeles', london: 'London' };

// ---------- Time, Eastern ----------
function eastern(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24, weekday: p.weekday as string, y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}
const weekday = (e: ReturnType<typeof eastern>) => !['Sat', 'Sun'].includes(e.weekday);
function monthStr(y: number, m: number) { while (m > 12) { m -= 12; y++; } return `${y}-${String(m).padStart(2, '0')}-01`; }
const monthWords = (m: string) => new Date(m + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
async function pcSettings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'passport_challenge').maybeSingle();
  return { slots_per_chapter: 5, cards_per_slot: 4, card_cents: 2500, lock_day: 10, card_months: 12, ...((data as any)?.value || {}) };
}
function openMonth(lockDay: number) { const t = eastern(); return monthStr(t.y, t.m + (t.d <= lockDay ? 1 : 2)); }
function deadlineWords(month: string, lockDay: number) {
  const [y, m] = month.split('-').map(Number); const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y;
  return new Date(`${py}-${String(pm).padStart(2, '0')}-${String(lockDay).padStart(2, '0')}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'nurture').maybeSingle();
  return { offers_on: false, tasters_on: false, send_hour: 10, per_tick: 40, ...((data as any)?.value || {}) };
}

// ---------- Keys ----------
async function tasterKey(id: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(32, 64).padEnd(32, '1')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const h = b64uStr(JSON.stringify({ alg: 'HS256', typ: 'TASTER' })), p = b64uStr(JSON.stringify({ sub: id, k: 'taster', exp: Math.floor(Date.now() / 1000) + 400 * 86400 }));
  return `${h}.${p}.${b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${h}.${p}`))))}`;
}
async function tasterFrom(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(32, 64).padEnd(32, '1')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k === 'taster' && isId(d.sub) && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function memberFrom(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, fromB64u(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(fromB64u(p)));
    return d.k !== 'taster' && typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string) {
  const env = Deno.env.get(key); if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}

// ---------- The email ----------
function shell(body: string, foot: string) {
  return `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a">` +
    `<p style="margin:0 0 18px"><img src="${SITE}/public/logo-ve-landscape-v1.svg" alt="Vegans Explore" width="150" style="display:block;border:0"></p>${body}` +
    `<p style="margin-top:28px;font-size:12px;line-height:1.5;color:#777">${foot} <a href="{{unsubscribe_url}}" style="color:#777">Stop these emails</a>. {{postal_address}}.</p></div>`;
}
const btn = (href: string, label: string) => `<p style="margin:22px 0"><a href="${href}" style="display:inline-block;background:#1f5f22;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:13px 24px;border-radius:6px;text-decoration:none">${esc(label)}</a></p>`;
const P = (s: string) => `<p>${s}</p>`;
const sign = P('Vegans Explore team');
const list = (items: string[]) => items.length ? `<ul style="padding-left:20px;margin:10px 0">${items.map((i) => `<li style="margin:4px 0">${i}</li>`).join('')}</ul>` : '';
const utm = (u: string, kind: string) => u + (u.includes('?') ? '&' : '?') + 'utm_source=email&utm_medium=nurture&utm_campaign=' + encodeURIComponent(kind);

// One campaign per email (and per month for the business offer, per date for the weekly Pulse and the December notes).
function refOf(kind: string) {
  const m = openMonth(10).slice(0, 7);
  if (kind === 'offer') return { ref: `ve-pc-offer-${m}`, name: `Passport Challenge offer (${m})` };
  if (kind === 'not_opened') return { ref: `ve-pc-still-open-${m}`, name: `Passport Challenge follow-up: still open (${m})` };
  if (kind.startsWith('pulse-')) return { ref: `ve-taster-pulse-${kind.slice(6)}`, name: `Taster: the Daily Pulse (${kind.slice(6)})` };
  if (kind === 'door-rg-in') return { ref: 've-rg-door-in', name: "Restaurant Guide: You're in" };
  if (kind === 'door-rg-7') return { ref: 've-rg-door-7', name: 'Restaurant Guide: Day 7' };
  const dec = DECEMBER.find(([k]) => k === kind);
  if (dec) return { ref: `ve-taster-founding-${dec[1]}`, name: `Taster: Founding deadline note (${dec[1]})` };
  return { ref: `ve-taster-${kind}`, name: `Taster: ${kind.replace('day-', 'Day ')}` };
}
async function emailSend(payload: Record<string, unknown>) {
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  try {
    const r = await fetch(`${FN_BASE}/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) });
    return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` }));
  } catch (e) { return { ok: false, error: String(e) }; }
}
// Registered once, on the first real send, as an automatic campaign HQ > Email shows (status sent: email-dispatch never picks it up).
async function registerCampaign(ref: string, name: string, subject: string, html: string, kind: string) {
  await db.from('email_campaigns').upsert({ brand_slug: BRAND, campaign_ref: ref, name: `${name}, automatic`, subject, html, status: 'sent',
    audience: { source: 've-nurture', kind, automatic: true }, notes: 'Sent one at a time by ve-nurture (Earn your Passport). Switch it on or off in the Vegans Explore Depot.',
    started_at: new Date().toISOString(), completed_at: new Date().toISOString(), created_by: 've-nurture' }, { onConflict: 'campaign_ref', ignoreDuplicates: true });
}
// result: sent | already_sent | suppressed | invalid | failed
async function send(kind: string, to: string, name: string | null, subject: string, html: string, testTo?: string): Promise<{ result: string; id?: string; error?: string }> {
  const { ref, name: cname } = refOf(kind);
  const res: any = await emailSend({ brand: BRAND, campaign_ref: ref, list_ref: kind.startsWith('pulse-') || kind.startsWith('day-') || kind.startsWith('dec-') || kind.startsWith('door-') ? 've-tasters' : 've-pc-offers',
    subject, html, recipients: [{ email: to, name: name || undefined }], ...(testTo ? { test_to: [testTo] } : {}) });
  const r = res?.results?.[0];
  if (!r) return { result: 'failed', error: res?.error || (res?.errors || []).join('; ') || 'email-send' };
  if (r.result === 'sent' && !testTo) await registerCampaign(ref, cname, subject, html, kind);
  return { result: r.result, id: r.id, error: r.error };
}
async function suppressed(email: string) {
  const { data } = await db.rpc('email_is_suppressed', { p_email: email.toLowerCase().trim(), p_brand: BRAND });
  return data === true;
}

// ---------- Business emails ----------
async function offerContext(o: any) {
  const cfg = await pcSettings();
  const { data: l } = await db.from('listings').select('name, slug, address_city, address_state').eq('id', o.listing_id).maybeSingle();
  const { data: chapter } = await db.rpc('ve_chapter_of', { p_city: l?.address_city, p_state: l?.address_state });
  const month = openMonth(cfg.lock_day);
  return { cfg, l, chapter: (CHAPTER_NAME[chapter as string] || 'your city'), month: monthWords(month).split(' ')[0], deadline: deadlineWords(month, cfg.lock_day),
    link: o.link_code ? `${SITE}/go/${o.link_code}` : `${SITE}/business/challenge?listing=${l?.slug}`, stop: `${SITE}/business/challenge?stop=${o.code}` };
}
async function businessEmail(kind: string, o: any) {
  const c = await offerContext(o);
  const biz = esc(c.l?.name || 'your business'), cards = c.cfg.cards_per_slot, amt = c.cfg.card_cents / 100;
  const foot = `You are getting this because ${biz} is in the Vegans Explore Directory.`;
  if (kind === 'offer') return { subject: `Be a Passport Challenge stop in ${c.month}`, unsub: c.stop, html: shell(
    P(`Hi ${biz},`) + P(`Every month, up to five Vegan businesses in ${esc(c.chapter)} are the stops on our Passport Challenge. Our members come to check in, post about you, and win your gift cards in the Vegans Explore Vault.`) +
    P(`<b>What you give:</b> ${cards} digital gift cards of $${amt}. One per visit, no cash back, good for ${c.cfg.card_months} months after a member wins one.`) +
    P(`<b>What you get:</b> a month of promotion as a featured stop, your Vegans Explore membership and your listing claimed. If we pick you before January 1, you are a Founding Member.`) +
    P(`There are five spots for ${esc(c.month)}, and we choose them on ${esc(c.deadline)}.`) + btn(c.link, 'See the offer') + sign, foot) };
  // The follow-up, reworded by the review panel (2026-11-02): a plain subject, no guess at why they have not answered, the deal in one line.
  const hello = o.name && !/\[TEST\]/i.test(o.name) ? `Hi ${esc(String(o.name).trim().split(/\s+/)[0])},` : 'Hello,';
  return { subject: `${c.month} Passport Challenge stops in ${c.chapter}`, unsub: c.stop, html: shell(
    P(hello) + P(`This follows our earlier note. We choose ${esc(c.month)}'s five Passport Challenge stops in ${esc(c.chapter)} on ${esc(c.deadline)}, and there is still room for ${biz}. A stop gives ${cards} digital gift cards of $${amt} for our members to win, and gets a month of promotion and a membership in return.`) +
    P(`The details are on one page, with a short walkthrough from Liz, one of our Guides. If now isn't the right time, there's nothing you need to do.`) +
    btn(c.link, 'See the offer') + sign, foot) };
}

// ---------- Taster emails ----------
async function tasterEmail(kind: string, t: any) {
  const first = esc(String(t.name || '').trim().split(/\s+/)[0] || 'there');
  const key = await tasterKey(t.id), unsub = `${SITE}/guides/taste?unsub=${encodeURIComponent(key)}`;
  const chapter = t.chapter && t.chapter !== 'elsewhere' ? t.chapter : 'national';
  const city = CHAPTER_NAME[chapter] || 'your city';
  const foot = `You are getting this because you asked for A Taste of Vegans Explore. You are not a member, and nothing is charged.`;
  const challenges = utm(`${SITE}/challenges?t=${encodeURIComponent(key)}`, kind);
  if (kind === 'day-3') {
    const { data: w } = await db.rpc('ve_nurture_city_week', { p_chapter: chapter });
    const ev = ((w as any)?.events || []).map((e: any) => `<a href="${utm(`${SITE}/events?event=${e.id}`, kind)}" style="color:#1f5f22">${esc(e.title)}</a>, ${esc(new Date(e.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }))}${e.city ? ', ' + esc(e.city) : ''}`);
    const pl = ((w as any)?.places || []).map((p: any) => `<a href="${utm(`${SITE}/directory/${p.slug}`, kind)}" style="color:#1f5f22">${esc(p.name)}</a>${p.city ? ', ' + esc(p.city) : ''} (new to the Directory)`);
    const tp = (w as any)?.topic ? [`Today's Daily Pulse: <a href="${utm(`${SITE}/pulse?city=${(w as any).topic.community}&post=${(w as any).topic.id}`, kind)}" style="color:#1f5f22">${esc((w as any).topic.title)}</a>`] : [];
    const items = [...ev, ...pl, ...tp];
    return { subject: chapter === 'national' ? 'This week on Vegans Explore' : `This week in ${city}`, unsub, html: shell(
      P(`Hi ${first},`) + (items.length ? P(`Here's what's happening ${chapter === 'national' ? 'on Vegans Explore' : 'near you'}:`) + list(items) : P(`Here's where to look this week: our <a href="${utm(`${SITE}/events`, kind)}" style="color:#1f5f22">events calendar</a> and the <a href="${utm(`${SITE}/pulse`, kind)}" style="color:#1f5f22">Daily Pulse</a>.`)) +
      P(`<b>Want in?</b> You can earn your Passport instead of paying for it: check in at three Vegan places, bring three friends, or stand up for the animals. Finish one challenge in 30 days and your membership is yours.`) +
      btn(challenges, 'See the challenges') + sign, foot) };
  }
  if (kind === 'day-7') {
    const { data: s } = await db.rpc('ve_nurture_story', { p_why: t.why || 'vegan' });
    const st: any = s || null;
    const body = st ? P(`You told us you're here for ${esc(WHY[t.why] || 'Vegan living')}, so we thought you'd like this one${st.show ? ` from ${esc(st.show_name || st.show)}` : ''}: <b>${esc(st.title)}</b>.`) + (st.summary ? P(esc(st.summary.replace(/\s+\S*$/, '')) + '...') : '') + btn(utm(`${SITE}/listen?show=${st.show_slug}&ep=${encodeURIComponent(st.guid)}`, kind), 'Play the episode') + P(`It plays right on the page, where you can save it and vote for the show.`)
      : P(`You told us you're here for ${esc(WHY[t.why] || 'Vegan living')}. Our shows have ten years of conversations about it.`) + btn(utm(`${SITE}/media`, kind), 'Listen');
    return { subject: st ? String(st.title).slice(0, 90) : 'A story for you', unsub, html: shell(P(`Hi ${first},`) + body + P(`More like it is in the <a href="${utm(`${SITE}/pulse`, kind)}" style="color:#1f5f22">Daily Pulse</a>.`) + sign, foot) };
  }
  if (kind === 'day-14') {
    const g = GUIDES[t.suggested_guide] ? t.suggested_guide : 'vegan-dairy-guide', name = GUIDES[g];
    const optin = `${SITE}/guides/taste?pulse=${encodeURIComponent(key)}`;
    const pulseAsk = t.pulse_opt_in_at ? '' : P(`<b>Want your city's Daily Pulse every Thursday?</b> It's the week's top conversations ${chapter === 'national' ? 'on Vegans Explore' : 'in ' + esc(city)}, once a week. <a href="${optin}" style="color:#1f5f22;font-weight:700">Yes, send it</a>. If you don't tap it, we won't send it.`);
    return { subject: `${name}: picked from your answers`, unsub, html: shell(
      P(`Hi ${first},`) + P(`When you signed up for A Taste of Vegans Explore, you told us you're here for ${esc(WHY[t.why] || 'Vegan living')}. That points to ${esc(name)}.`) +
      P(`${esc(GUIDE_LINE[g] || 'It takes one part of Vegan living and makes it easy, with a Guide walking you through it.')} You tried a piece of it in your Taste. The full Guide is $11, one time, or 1,100 points, and it's yours to keep.`) +
      btn(utm(`${SITE}/guides/${g}`, kind), 'See the Guide') + P(`Or <a href="${challenges}" style="color:#1f5f22">earn your Passport free through a challenge</a>, and its points cover the Guide.`) + pulseAsk + sign, foot) };
  }
  if (kind.startsWith('pulse-')) {
    const { data: p } = await db.rpc('ve_nurture_pulse', { p_chapter: chapter });
    const items = ((p as any) || []).map((x: any) => `<a href="${utm(`${SITE}/pulse?city=${x.community}&post=${x.id}`, 'pulse')}" style="color:#1f5f22">${esc(x.title)}</a>`);
    return { subject: `The Daily Pulse: ${chapter === 'national' ? 'this week' : city}`, unsub, html: shell(
      P(`Hi ${first},`) + (items.length ? P(`This week's top topics${chapter === 'national' ? '' : ' in ' + esc(city)}:`) + list(items) : P(`The conversations this week are on the Daily Pulse.`)) +
      btn(utm(`${SITE}/pulse${chapter === 'national' ? '' : '?city=' + chapter}`, 'pulse'), 'Read the Daily Pulse') + sign, foot) };
  }
  const n = kind === 'dec-1' ? 1 : kind === 'dec-2' ? 2 : 3;
  const passport = utm(`${SITE}/passport?from=nurture`, kind);
  if (n === 1) return { subject: 'Founding Membership closes January 1', unsub, html: shell(P(`Hi ${first},`) + P(`Founding Membership closes at midnight Eastern on January 1, 2027. Join before then and Founding Member stays on your profile for good. It's $11, one time. Or earn it free: finish one of our three challenges within 30 days (check in at Vegan places, bring three friends, or show up for the animals).`) + btn(passport, 'Get your Passport') + P(`<a href="${challenges}" style="color:#1f5f22">See the challenges</a>`) + sign, foot) };
  if (n === 2) return { subject: 'Two weeks left to be a Founding Member', unsub, html: shell(P(`Hi ${first},`) + P(`Founding Membership closes at midnight Eastern on January 1, 2027. Join before then and Founding Member stays on your profile for good. It's $11, one time. Or earn it free: finish one of our three challenges within 30 days (check in at Vegan places, bring three friends, or show up for the animals).`) + P(`A challenge takes up to 30 days, so the $11 is the sure way before the deadline.`) + btn(passport, 'Get your Passport') + P(`<a href="${challenges}" style="color:#1f5f22">See the challenges</a>`) + sign, foot) };
  return { subject: 'Tomorrow is the last day', unsub, html: shell(P(`Hi ${first},`) + P(`Tomorrow, December 31, is the last day. Founding Membership closes at midnight Eastern as January 1 begins. Join before then and Founding Member stays on your profile for good.`) + btn(passport, 'Get your Passport') + sign, foot) };
}

// ---------- The tick ----------
// ---------- Door Guide emails (canon-ve-door-guides) ----------
// The Vegan Events Guide's two notes to a MEMBER who finished the Guide's event survey (Sean, 2026-11-03: the survey replaced the email-only
// reader). They start as a draft: they send only while ve_site_settings nurture.door_on is true AND door_approved_hash equals the hash of the
// words below, so any change to the words puts them back to draft until Sean approves again (Depot > Challenges > Taster emails).
const DOOR_GUIDE = 'vegan-events-guide';
const DOOR_KINDS = ['door-events-3', 'door-events-7'];
const SAMPLE_MEMBER = { id: '00000000-0000-4000-8000-000000000002', name: 'Sam Rivera', email: 'sam@example.com' };
async function doorEmail(kind: string, m: any, _key?: string) {
  const first = esc(String(m?.name || '').trim().split(/\s+/)[0] || 'there');
  const foot = `You are getting this because you took the event survey in the Vegan Events Guide.`;
  const rain = utm(`${SITE}/guides/${DOOR_GUIDE}#/dayof/rain`, kind);
  const claim = utm(`${SITE}/guides/${DOOR_GUIDE}#/claim`, kind);
  const apply = utm(`${SITE}/guides/${DOOR_GUIDE}#/work`, kind);
  if (kind === 'door-events-3') return { subject: 'Decide the rain plan before the day', unsub: '', html: shell(P(`Hi ${first},`) +
    P('Thank you for taking the event survey. The Vegan Events Guide is open to you.') +
    P('Most event days that go wrong go wrong in one of five ways: rain, heat, guests who do not come, a vendor who does not show, or the power going out. Every one is easier when you decided what to do weeks before.') +
    P('The rain plan is a good place to start, with a checklist you can copy and print.') + btn(rain, 'Open what to do when it rains') +
    P(`Hosting soon? The Guide's Claim tab walks you through putting your event, your group and your own profile on Vegans Explore, so people can find you.`) + sign, foot) };
  return { subject: 'Claim your event, then tell us about it', unsub: '', html: shell(P(`Hi ${first},`) +
    P('Two things to do with us, both free.') +
    P(`<b>Claim what is yours.</b> Your event on our calendar, your group or venue in the Directory, and your own profile. It makes you the organizer on Vegans Explore, so you can message your guests and see who is coming.`) + btn(claim, 'Open the Claim tab') +
    P('<b>Apply for a sponsorship.</b> We feature qualifying events on our calendar, in your chapter\'s Daily Pulse and on our socials, in exchange for a booth, two comped meals or tickets, and our logo. Your event survey is already done, so you can apply now. We review every application against the others for the same chapter and month, and we take two a chapter a month, so a sponsorship is never automatic.') + btn(apply, 'See the sponsorship') +
    P('Your voice is welcome too. You can record your story for the Vegans Explore Podcast, up to 90 seconds an answer, and our team listens before anything airs.') + sign, foot) };
}
async function doorHash() {
  const parts: string[] = [];
  for (const k of DOOR_KINDS) { const m = await doorEmail(k, SAMPLE_MEMBER); parts.push(m.subject + '\n' + m.html); }
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\n---\n')));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function doorState(cfg: any) { const hash = await doorHash(); return { on: !!cfg.door_on, approved: !!cfg.door_approved_hash && cfg.door_approved_hash === hash, hash }; }

async function doorTick(cfg: any, e: any, inHours: boolean, out: Record<string, number>) {
  // Members who finished the event survey, Day 3 and Day 7 after they finished, only while switched on and approved.
  const ds = await doorState(cfg);
  if (!(ds.on && ds.approved && inHours && weekday(e))) return;
  const { data: cs } = await db.from('ve_survey_completions').select('member_id, completed_at').eq('survey_slug', DOOR_GUIDE).order('completed_at', { ascending: true }).limit(1000);
  const ids = (cs || []).map((c: any) => c.member_id);
  if (!ids.length) return;
  const { data: ms } = await db.from('members').select('id, email, name, membership_status, member_class, standing').in('id', ids);
  const byId = new Map((ms || []).map((m: any) => [m.id, m]));
  const { data: sent } = await db.from('ve_door_emails').select('member_id, kind').in('member_id', ids);
  const done = new Set((sent || []).map((x: any) => x.member_id + '|' + x.kind));
  for (const c of cs || []) {
    if (out.tasters >= cfg.per_tick) break;
    const m: any = byId.get(c.member_id);
    if (!m || !m.email || m.membership_status !== 'active' || (m.member_class || 'member') !== 'member' || (m.standing || 'good') !== 'good' || /\[TEST\]/i.test(m.name || '')) continue;
    if (await suppressed(m.email)) continue;
    const age = Date.now() - Date.parse(c.completed_at);
    const has3 = done.has(m.id + '|door-events-3'), has7 = done.has(m.id + '|door-events-7');
    const kind = !has3 && age >= 3 * 864e5 ? 'door-events-3' : has3 && !has7 && age >= 7 * 864e5 ? 'door-events-7' : null;
    if (!kind) continue;
    const { error: ce } = await db.from('ve_door_emails').insert({ member_id: m.id, kind });
    if (ce) continue;
    const mail = await doorEmail(kind, m);
    const r = await send(kind, m.email, m.name, mail.subject, mail.html);
    if (r.result === 'failed') { await db.from('ve_door_emails').delete().eq('member_id', m.id).eq('kind', kind); continue; }
    await db.from('ve_door_emails').update({ resend_id: r.id || null, error: r.result === 'sent' || r.result === 'already_sent' ? null : r.result }).eq('member_id', m.id).eq('kind', kind);
    out.tasters++;
  }
}

// ---------- The Vegan Restaurant Guide's two notes after membership (playbook ve-restaurant-guide, drafts 2026-11-05) ----------
// To a member who finished the restaurant survey (the Guide's one door): "You're in" the day they finish, then Day 7. Same rules as the
// Events Guide's notes, with their OWN switch and approval (nurture.rg_door_on, rg_door_approved_hash), so approving one never sends the
// other: draft until Sean approves the words, any change to the words puts them back to draft. From VEGANS EXPLORE, signed Vegans Explore
// team (Logan's default; Sean may ask for his name). Weekdays from 10 AM Eastern. No prices, no points to spend, Coming said as Coming.
// The business: the listing they own, else the outreach contact we emailed at their address (that gives their personal Guide link ?b=).
// The Founding line shows only to a Founding Member and only before midnight Eastern on January 1, 2027 (it drops on its own after).
const RG_GUIDE = 'vegan-restaurant-guide';
const RG_KINDS = ['door-rg-in', 'door-rg-7'];
const RG_SAMPLE = { first: 'Alex', founding: true, biz: { name: 'Green Leaf Kitchen', slug: 'green-leaf-kitchen', code: 'bo-sample0' } };
async function rgBusiness(m: any): Promise<{ name: string; slug: string | null; code: string | null } | null> {
  const { data: own } = await db.from('listings').select('name, slug').eq('owner_member_id', m.id).eq('status', 'approved').limit(1).maybeSingle();
  const email = String(m.email || '').trim();
  const { data: c } = email ? await db.from('ve_outreach_contacts').select('listing_id, link_code').ilike('email', likeEsc(email)).not('listing_id', 'is', null).limit(1).maybeSingle() : { data: null };
  if (own) return { name: own.name, slug: own.slug, code: (c as any)?.link_code || null };
  if (!c) return null;
  const { data: l } = await db.from('listings').select('name, slug').eq('id', (c as any).listing_id).eq('status', 'approved').maybeSingle();
  return l ? { name: l.name, slug: l.slug, code: (c as any).link_code || null } : null;
}
function rgEmail(kind: string, x: { first: string; founding: boolean; biz: { name: string; slug: string | null; code: string | null } | null }) {
  const first = esc(x.first || 'there'), biz = x.biz, bn = biz ? esc(biz.name) : 'your business';
  const guide = (hash: string) => utm(`${SITE}/guides/${RG_GUIDE}${biz?.code ? '?b=' + encodeURIComponent(biz.code) : ''}`, kind) + hash;
  const claim = biz?.slug ? utm(`${SITE}/claim?listing=${encodeURIComponent(biz.slug)}`, kind) : guide('#/featured');
  const dash = biz?.slug ? utm(`${SITE}/directory/${encodeURIComponent(biz.slug)}?tab=brand`, kind) : guide('#/dashboard');
  const a = (href: string, t: string) => `<a href="${href}" style="color:#1f5f22">${t}</a>`;
  const foot = `You are getting this because you took the restaurant survey in the Vegan Restaurant Guide.`;
  if (kind === 'door-rg-in') return { subject: `You're in, ${x.first || 'welcome'}`, unsub: '', html: shell(P(`Hi ${first},`) +
    P(`You finished the survey, so you are a member of Vegans Explore. Thank you for taking the time. It helps us serve ${bn} better.`) +
    (x.founding ? P('That also makes you a Founding Member, which stays on your profile for good.') : '') +
    P('Everything is open now, and nothing is required. A good place to start: claim your page, so your hours, photos and menu link are yours to change.') +
    btn(claim, 'Claim your page') + P(`Everything else is on ${a(guide('#/next'), "What's next")} in your Guide.`) +
    P('If we can help with any of it, just reply.') + sign, foot) };
  return { subject: `How is ${biz ? biz.name : 'your business'} looking?`, unsub: '', html: shell(P(`Hi ${first},`) +
    P('A week in. Two things worth a few minutes:') +
    P(`<b>Your dashboard</b> shows how many people looked at your page, where they came from and what they did next. It opens fully once you claim your page.`) + btn(dash, 'Open your dashboard') +
    P(`<b>The top challenges</b> in the Guide are the ten things Vegan businesses run into most. Tick the ones that sound like you and open any one for what to do this week. ${a(guide('#/fixes'), 'See the top challenges')}`) +
    P(`Share your story and Opportunities are coming soon. If you want to know when they open, tap Tell me when it opens on ${a(guide('#/next'), "What's next")}.`) +
    P('Reply with anything you want help with.') + sign, foot) };
}
async function rgHash() {
  const parts = RG_KINDS.map((k) => { const m = rgEmail(k, RG_SAMPLE); return m.subject + '\n' + m.html; });
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\n---\n')));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function rgState(cfg: any) { const hash = await rgHash(); return { on: !!cfg.rg_door_on, approved: !!cfg.rg_door_approved_hash && cfg.rg_door_approved_hash === hash, hash }; }
async function rgCtx(m: any) {
  return { first: String(m?.name || '').trim().split(/\s+/)[0] || '', founding: !!m?.founding_member && Date.now() < DEADLINE, biz: await rgBusiness(m) };
}
async function rgTick(cfg: any, e: any, inHours: boolean, out: Record<string, number>) {
  const rs = await rgState(cfg);
  if (!(rs.on && rs.approved && inHours && weekday(e))) return;
  const { data: cs } = await db.from('ve_survey_completions').select('member_id, completed_at').eq('survey_slug', RG_GUIDE).order('completed_at', { ascending: true }).limit(1000);
  const ids = (cs || []).map((c: any) => c.member_id);
  if (!ids.length) return;
  const { data: ms } = await db.from('members').select('id, email, name, membership_status, member_class, standing, founding_member').in('id', ids);
  const byId = new Map((ms || []).map((m: any) => [m.id, m]));
  const { data: sent } = await db.from('ve_door_emails').select('member_id, kind').in('member_id', ids);
  const done = new Set((sent || []).map((x: any) => x.member_id + '|' + x.kind));
  for (const c of cs || []) {
    if (out.tasters >= cfg.per_tick) break;
    const m: any = byId.get(c.member_id);
    if (!m || !m.email || m.membership_status !== 'active' || (m.member_class || 'member') !== 'member' || (m.standing || 'good') !== 'good' || /\[TEST\]/i.test(m.name || '')) continue;
    if (await suppressed(m.email)) continue;
    const age = Date.now() - Date.parse(c.completed_at);
    const hasIn = done.has(m.id + '|door-rg-in'), has7 = done.has(m.id + '|door-rg-7');
    // Never late: You're in only within 3 days of finishing, Day 7 only within 14 (someone who finished before the switch went on gets nothing old).
    const kind = !hasIn && age < 3 * 864e5 ? 'door-rg-in' : hasIn && !has7 && age >= 7 * 864e5 && age < 14 * 864e5 ? 'door-rg-7' : null;
    if (!kind) continue;
    const { error: ce } = await db.from('ve_door_emails').insert({ member_id: m.id, kind });
    if (ce) continue;
    const mail = rgEmail(kind, await rgCtx(m));
    const r = await send(kind, m.email, m.name, mail.subject, mail.html);
    if (r.result === 'failed') { await db.from('ve_door_emails').delete().eq('member_id', m.id).eq('kind', kind); continue; }
    await db.from('ve_door_emails').update({ resend_id: r.id || null, error: r.result === 'sent' || r.result === 'already_sent' ? null : r.result }).eq('member_id', m.id).eq('kind', kind);
    out.tasters++;
  }
}

async function tick() {
  const cfg = await settings(), e = eastern(), out: Record<string, number> = { offers: 0, routed: 0, tasters: 0 };
  const inHours = e.hour >= cfg.send_hour && e.hour < 17;
  // Offers: chosen when they applied after the offer; follow-up two days on; routed two days after the follow-up.
  const { data: offers } = await db.from('ve_pc_offers').select('*, ve_links(code)').eq('status', 'sent').limit(200);
  for (const o of offers || []) {
    const { count: applied } = await db.from('ve_pc_slots').select('id', { count: 'exact', head: true }).eq('listing_id', o.listing_id).gte('created_at', o.sent_at).in('status', ['applied', 'approved']);
    if (applied) { await db.from('ve_pc_offers').update({ status: 'chosen', chosen_at: new Date().toISOString() }).eq('id', o.id); continue; }
    const since = Date.now() - Date.parse(o.followup_at || o.sent_at);
    if (o.followup_at && since >= 2 * 864e5) { await db.from('ve_pc_offers').update({ status: 'routed', routed_at: new Date().toISOString() }).eq('id', o.id); out.routed++; continue; }
    if (!o.followup_at && since >= 2 * 864e5 && cfg.offers_on && inHours && weekday(e) && out.offers < cfg.per_tick) {
      if (await suppressed(o.email)) { await db.from('ve_pc_offers').update({ status: 'stopped', stopped_at: new Date().toISOString() }).eq('id', o.id); continue; }
      const kind = 'not_opened';
      const m = await businessEmail(kind, { ...o, link_code: o.ve_links?.code });
      const r = o.test ? { result: 'sent', id: 'test' } : await send(kind, o.email, o.name, m.subject, m.html);
      if (r.result === 'suppressed' || r.result === 'invalid') { await db.from('ve_pc_offers').update({ status: 'stopped', stopped_at: new Date().toISOString() }).eq('id', o.id); continue; }
      if (r.result === 'sent' || r.result === 'already_sent') { await db.from('ve_pc_offers').update({ followup_kind: kind, followup_at: new Date().toISOString(), send_ids: { ...(o.send_ids || {}), [kind]: r.id || r.result } }).eq('id', o.id); out.offers++; }
    }
  }
  if (!inHours) return out;
  if (!cfg.tasters_on) { await doorTick(cfg, e, inHours, out); await rgTick(cfg, e, inHours, out); return out; }
  const { data: ts } = await db.from('ve_tasters').select('id, email, name, chapter, why, suggested_guide, created_at, account_id, consent_basis, pulse_opt_in_at, ve_taster_emails(kind, sent_at)')
    .is('unsubscribed_at', null).is('member_id', null).not('why', 'is', null).not('name', 'ilike', '%[TEST]%').or('source.is.null,source.neq.pulse-subscribe').limit(1000);  // Pulse subscribers get only the Pulse (Sean, 2026-11-03)
  for (const t of ts || []) {
    if (out.tasters >= cfg.per_tick) break;
    if (t.account_id) { const { data: a } = await db.from('members').select('membership_status').eq('id', t.account_id).maybeSingle(); if (a?.membership_status === 'active') continue; }
    if (await suppressed(t.email)) continue;
    const sent = new Map<string, number>(((t as any).ve_taster_emails || []).map((x: any) => [x.kind, Date.parse(x.sent_at)]));
    const last = Math.max(0, ...sent.values()), age = Date.now() - Date.parse(t.created_at);
    let kind: string | null = null;
    const dec = DECEMBER.find(([k, d]) => d === e.date && !sent.has(k) && Date.now() < DEADLINE);
    if (dec) kind = dec[0];
    else if (!sent.has('day-3') && age >= 3 * 864e5) kind = 'day-3';
    else if (sent.has('day-3') && !sent.has('day-7') && age >= 7 * 864e5) kind = 'day-7';
    else if (sent.has('day-7') && !sent.has('day-14') && age >= 14 * 864e5) kind = 'day-14';
    else if (sent.has('day-14') && (t as any).pulse_opt_in_at && e.weekday === 'Thu' && Date.now() - last >= 6 * 864e5 && !sent.has('pulse-' + e.date)) kind = 'pulse-' + e.date;
    if (!kind) continue;
    // Claim the row first so a second tick never sends twice.
    const { error: ce } = await db.from('ve_taster_emails').insert({ taster_id: t.id, kind });
    if (ce) continue;
    const m = await tasterEmail(kind, t);
    const r = await send(kind, t.email, t.name, m.subject, m.html);
    if (r.result === 'failed') { await db.from('ve_taster_emails').delete().eq('taster_id', t.id).eq('kind', kind); continue; }
    await db.from('ve_taster_emails').update({ resend_id: r.id || null, error: r.result === 'sent' || r.result === 'already_sent' ? null : r.result }).eq('taster_id', t.id).eq('kind', kind);
    if (r.result === 'suppressed' || r.result === 'invalid') await db.from('ve_tasters').update({ unsubscribed_at: new Date().toISOString() }).eq('id', t.id);
    out.tasters++;
  }
  await doorTick(cfg, e, inHours, out);
  await rgTick(cfg, e, inHours, out);
  return out;
}

const SAMPLE_TASTER = { id: '00000000-0000-4000-8000-000000000001', name: 'Sam Rivera', email: 'sam@example.com', chapter: 'south-florida', why: 'food', suggested_guide: 'vegan-dairy-guide' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  const ops = !!admin && bearer === admin;

  if (action === 'tick') {
    const cs = req.headers.get('x-cron-secret');
    const okCron = !!cs && cs === (await secret('CRON_SECRET'));
    if (!okCron && !ops) return json({ error: 'forbidden' }, 403);
    return json({ ok: true, ...(await tick()) });
  }

  if (action === 'offer_stop') {
    const code = String(body.code || '');
    const { data: o } = await db.from('ve_pc_offers').select('id, email').eq('code', code).maybeSingle();
    if (!o) return json({ error: 'not_found' }, 404);
    await db.from('ve_pc_offers').update({ status: 'stopped', stopped_at: new Date().toISOString() }).eq('id', o.id).in('status', ['draft', 'sent', 'routed']);
    const email = String(o.email).toLowerCase().trim();
    const { count } = await db.from('email_suppressions').select('id', { count: 'exact', head: true }).eq('email', email).eq('active', true);
    if (!count) await db.from('email_suppressions').insert({ email, scope: 'vegans-explore', reason: 'unsubscribe', source: 've-nurture', note: 'Passport Challenge offer', active: true });
    return json({ ok: true });
  }

  if (action === 'pulse_optin') {
    const id = await tasterFrom(String(body.key || ''));
    if (!id) return json({ error: 'bad_key' }, 400);
    const { data: t } = await db.from('ve_tasters').select('id, chapter, pulse_opt_in_at, unsubscribed_at').eq('id', id).maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    if (!t.pulse_opt_in_at) await db.from('ve_tasters').update({ pulse_opt_in_at: new Date().toISOString(), unsubscribed_at: null }).eq('id', id);
    return json({ ok: true, city: CHAPTER_NAME[t.chapter] || null });
  }

  // Everything else is the team's.
  let me: any = null;
  if (!ops) {
    const id = bearer ? await memberFrom(bearer) : null;
    if (id) { const { data } = await db.from('members').select('id, email, is_superadmin').eq('id', id).maybeSingle(); me = data; }
    if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
  }

  if (action === 'settings') {
    const cur = await settings();
    if (body.door_approve === true) { const next = { ...cur, door_approved_hash: await doorHash() }; await db.from('ve_site_settings').upsert({ key: 'nurture', value: next }); return json({ ok: true, settings: next, door: await doorState(next) }); }
    if (body.rg_door_approve === true) { const next = { ...cur, rg_door_approved_hash: await rgHash() }; await db.from('ve_site_settings').upsert({ key: 'nurture', value: next }); return json({ ok: true, settings: next, rg_door: await rgState(next) }); }
    if (typeof body.rg_door_on === 'boolean') { const next = { ...cur, rg_door_on: body.rg_door_on }; await db.from('ve_site_settings').upsert({ key: 'nurture', value: next }); return json({ ok: true, settings: next, rg_door: await rgState(next) }); }
    if (typeof body.door_on === 'boolean') { const next = { ...cur, door_on: body.door_on }; await db.from('ve_site_settings').upsert({ key: 'nurture', value: next }); return json({ ok: true, settings: next, door: await doorState(next) }); }
    if (typeof body.offers_on === 'boolean' || typeof body.tasters_on === 'boolean') {
      const next = { ...cur, ...(typeof body.offers_on === 'boolean' ? { offers_on: body.offers_on } : {}), ...(typeof body.tasters_on === 'boolean' ? { tasters_on: body.tasters_on } : {}) };
      await db.from('ve_site_settings').upsert({ key: 'nurture', value: next });
      return json({ ok: true, settings: next });
    }
    return json({ ok: true, settings: cur, door: await doorState(cur), rg_door: await rgState(cur) });
  }

  if (action === 'offers') {
    const status = ['draft', 'sent', 'chosen', 'routed', 'stopped'].includes(body.status) ? body.status : null;
    let q = db.from('ve_pc_offers').select('*, listings(name, slug, address_city), ve_links(code, clicks)').order('created_at', { ascending: false }).limit(200);
    if (status) q = q.eq('status', status);
    const { data } = await q;
    const rows = await Promise.all((data || []).map(async (o: any) => {
      const { count } = o.link_id ? await db.from('ve_link_clicks').select('id', { count: 'exact', head: true }).eq('link_id', o.link_id).eq('is_bot', false) : { count: 0 };
      return { id: o.id, status: o.status, email: o.email, name: o.name, test: o.test, created_at: o.created_at, sent_at: o.sent_at, followup_kind: o.followup_kind, followup_at: o.followup_at,
        chosen_at: o.chosen_at, routed_at: o.routed_at, stopped_at: o.stopped_at, clicks: count || 0, link: o.ve_links?.code ? `${SITE}/go/${o.ve_links.code}` : null,
        listing: { name: o.listings?.name, slug: o.listings?.slug, city: o.listings?.address_city } };
    }));
    const cfgNow = await settings(); return json({ ok: true, rows, settings: cfgNow, door: await doorState(cfgNow) });
  }

  if (action === 'offer_create') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'email', message: 'That email does not look right.' }, 400);
    const { data: l } = await db.from('listings').select('id, name, slug').eq('slug', String(body.slug || '')).eq('status', 'approved').maybeSingle();
    if (!l) return json({ error: 'listing', message: 'Pick a business from the Directory.' }, 400);
    if (await suppressed(email)) return json({ error: 'suppressed', message: 'That address asked us to stop emailing.' }, 409);
    const { data: open } = await db.from('ve_pc_offers').select('id').eq('listing_id', l.id).in('status', ['draft', 'sent']).maybeSingle();
    if (open) return json({ error: 'open', message: 'This business already has an offer going.', id: open.id }, 409);
    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    const name = String(body.name || '').trim().slice(0, 120) || null;
    const test = /\[TEST\]/i.test(name || '');
    const { data: link, error: le } = await db.from('ve_links').insert({ code: 'pc-' + code.slice(0, 8), label: `Passport Challenge offer: ${l.name}`.slice(0, 120), destination: `/business/challenge?listing=${l.slug}`,
      initiative_slug: 'passport-challenge-offer', tags: ['passport-challenge', 'offer'], channel: 'email', recipient_email: email, recipient_name: name, active: true, created_by: me?.id || null }).select('id').single();
    if (le || !link) return json({ error: 'link_failed' }, 500);
    const { data: o, error } = await db.from('ve_pc_offers').insert({ listing_id: l.id, email, name, code, link_id: link.id, test, created_by: me?.id || null }).select('id').single();
    if (error || !o) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, id: o.id });
  }

  if (action === 'offer_send' || action === 'offer_cancel') {
    if (!isId(body.id)) return json({ error: 'id' }, 400);
    const { data: o } = await db.from('ve_pc_offers').select('*, ve_links(code)').eq('id', body.id).maybeSingle();
    if (!o) return json({ error: 'not_found' }, 404);
    if (action === 'offer_cancel') { await db.from('ve_pc_offers').update({ status: 'stopped', stopped_at: new Date().toISOString() }).eq('id', o.id); return json({ ok: true }); }
    if (o.status !== 'draft') return json({ error: 'already_sent' }, 409);
    if (await suppressed(o.email)) return json({ error: 'suppressed', message: 'That address asked us to stop emailing.' }, 409);
    const m = await businessEmail('offer', { ...o, link_code: o.ve_links?.code });
    const r = o.test ? { result: 'sent', id: 'test' } : await send('offer', o.email, o.name, m.subject, m.html);
    if (r.result === 'suppressed') return json({ error: 'suppressed', message: 'That address asked us to stop emailing.' }, 409);
    if (r.result !== 'sent' && r.result !== 'already_sent') return json({ error: 'send_failed', message: r.error || r.result }, 502);
    await db.from('ve_pc_offers').update({ status: 'sent', sent_at: new Date().toISOString(), send_ids: { offer: r.id || r.result } }).eq('id', o.id);
    return json({ ok: true });
  }

  if (action === 'preview' || action === 'test') {
    const kind = String(body.kind || '');
    let m: any;
    if (['offer', 'not_opened'].includes(kind)) {
      let o: any = null;
      if (isId(body.offer_id)) { const { data } = await db.from('ve_pc_offers').select('*, ve_links(code)').eq('id', body.offer_id).maybeSingle(); if (data) o = { ...data, link_code: data.ve_links?.code }; }
      if (!o) { const { data: l } = await db.from('listings').select('id').eq('slug', 'aishas-plant-based-eatery').eq('status', 'approved').maybeSingle(); o = { listing_id: l?.id, code: 'sample', link_code: null }; }
      m = await businessEmail(kind, o);
    } else if (RG_KINDS.includes(kind)) {
      // A real business when a slug is given (its name and links), else the sample.
      let x: any = RG_SAMPLE;
      if (body.listing_slug) { const { data: l } = await db.from('listings').select('id, name, slug').eq('slug', String(body.listing_slug)).eq('status', 'approved').maybeSingle();
        if (l) { const { data: c } = await db.from('ve_outreach_contacts').select('link_code').eq('listing_id', l.id).limit(1).maybeSingle(); x = { first: String(body.first || 'there'), founding: Date.now() < DEADLINE, biz: { name: l.name, slug: l.slug, code: (c as any)?.link_code || null } }; } }
      m = rgEmail(kind, x);
    } else if (DOOR_KINDS.includes(kind)) {
      m = await doorEmail(kind, SAMPLE_MEMBER);
    } else if (['day-3', 'day-7', 'day-14', 'pulse', 'dec-1', 'dec-2', 'dec-3'].includes(kind)) {
      let t: any = SAMPLE_TASTER;
      if (isId(body.taster_id)) { const { data } = await db.from('ve_tasters').select('*').eq('id', body.taster_id).maybeSingle(); if (data) t = data; }
      m = await tasterEmail(kind === 'pulse' ? 'pulse-' + eastern().date : kind, t);
    } else return json({ error: 'kind' }, 400);
    if (action === 'preview') return json({ ok: true, subject: m.subject, html: m.html.replace(/\{\{\s*unsubscribe_url\s*\}\}/g, '#').replace(/\{\{\s*postal_address\s*\}\}/g, 'LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301') });
    const to = me?.email || String(body.to || '');
    if (!to) return json({ error: 'no_address' }, 400);
    const pk = kind === 'pulse' ? 'pulse-' + eastern().date : kind;
    const r = await send(pk, to, 'Sean', '[Test] ' + m.subject, m.html, to);
    return r.result === 'sent' ? json({ ok: true, to, campaign_ref: refOf(pk).ref }) : json({ error: 'send_failed', message: r.error || r.result }, 502);
  }

  if (action === 'tasters') {
    const { data } = await db.from('ve_tasters').select('id, name, email, chapter, why, created_at, unsubscribed_at, member_id, ve_taster_emails(kind, sent_at, error)').order('created_at', { ascending: false }).limit(300);
    const rows = (data || []).map((t: any) => ({ id: t.id, name: t.name, email: t.email, chapter: t.chapter, joined: t.created_at,
      state: t.member_id ? 'Member' : t.unsubscribed_at ? 'Stopped our emails' : 'On the list',
      sent: (t.ve_taster_emails || []).sort((a: any, b: any) => Date.parse(a.sent_at) - Date.parse(b.sent_at)) }));
    { const cfgNow = await settings(); return json({ ok: true, rows, settings: cfgNow, door: await doorState(cfgNow), rg_door: await rgState(cfgNow) }); }
  }

  return json({ error: 'unknown_action' }, 400);
});
