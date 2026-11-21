// ve-giving: 11 Days of Giving (timeline LOCKED by Sean 2026-11-19: "lock the timeline"; rules doc https://claude.ai/artifact/Ds4whHbL6JXca7oY5SoWM4):
// entry window to 11:59 PM Eastern Fri Dec 11, every member who joined by then is entered once; winners drawn live one day at a time Dec 14 to 24;
// brands up to $150 in all, yes by Fri Dec 4; intake stops at $4,500 under the $5,000 cap; providers done by Jan 15, 2027. First built as 11 Days of Giving (Sean, 2026-11-15: "build the entry page"; plan locked 2026-11-13, playbook ve-holiday-guide; migration
// 20261115_eleven_days_of_giving_entries.sql). December 1 to 11, members enter free for prizes Vegan businesses give; winners are drawn at
// random in the open. POST { action, ... }. verify_jwt off; the Vegans Explore token is checked here (the same check as ve-holiday).
// Public:  status  -> { open, rules_reviewed (the rules link shows only once the attorney has read them), starts_on, ends_on, prizes (live ones, with the business), entries (count), me? { member, entered } }
// Member:  enter   -> one free entry per member per giveaway, only while entries_open (a super admin may enter while closed, to test)
// Public:  brand_interest {brand, name, email, quantity, pack, page} -> a brand's I'm in from /partners/giving, into Leads (one a day per email)
// Public:  event_sponsor_interest {brand, name, email, events: philadelphia | south-florida | central-florida | los-angeles | all | spotlight | takeover | club, note, page} -> a brand's interest in
//          sponsoring a community event from /expo/events, into Leads on the World Vegan Expo initiative (one a day per email; Sean, 2026-11-19)
// Public:  expo_interest {role, name, email, org, city, note} -> Count me in for the World Vegan Expo, into Leads (one per email and role a day)
// Owner:   my_prizes {listing_id}, prize_photo_url {listing_id, content_type, bytes}, prize_save {listing_id, title, value_cents, quantity,
//          image_url?, note?}, prize_withdraw {listing_id, id}: the prize form in the business dashboard (Sean, 2026-11-15). Up to $100 per
//          business; a brand (Food Brands, or a listing that sells products) up to $150 retail in all (Sean, 2026-11-17); intake stops
//          at $4,500 under the $5,000 cap, until the end of Friday, December 4 Eastern; a prize waits as pledged for our check.
// Admin:   entries -> who entered, newest first (super admins only); prize_queue, prize_review {id, decision: live | withdrawn | pledged}
//          (live grants the giver 250 points per prize, once)
// Nothing here takes money, a share, a tag or a follow: entering is free and open to every member in good standing.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_BASE = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/vegan-media/`;
const PER_BUSINESS = 10000;                                   // $100 in prizes per business
const BRAND_MAX = 15000;                                      // a brand: up to $150 retail in all, one item or several (Sean, 2026-11-17)
const TOTAL_CAP = 500000;                                     // $5,000 across the giveaway (Florida and New York register above it)
const INTAKE_CAP = 450000;                                    // we stop taking prizes at $4,500 (locked rules)
const PRIZES_CLOSE = Date.parse('2026-12-05T05:00:00Z');      // the end of Friday, December 4, Eastern (prizes for the Dec 14 to 24 draws)
const ENTRY_CLOSE = Date.parse('2026-12-12T05:00:00Z');       // the entry window ends 11:59 PM Eastern, Friday, December 11
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
// Same key derivation as ve-auth's signJWT / decodeToken (copied from ve-holiday).
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

type Settings = { campaign: string; entries_open: boolean; rules_reviewed: boolean; starts_on: string; ends_on: string; fulfill_by: string };
async function settings(): Promise<Settings> {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'giving_2026').maybeSingle();
  const v = (data?.value || {}) as Partial<Settings>;
  return { campaign: v.campaign || '11-days-of-giving-2026', entries_open: v.entries_open === true, rules_reviewed: v.rules_reviewed === true, starts_on: v.starts_on || '2026-12-01', ends_on: v.ends_on || '2026-12-11', fulfill_by: v.fulfill_by || '2027-01-10' };
}
// Entries close at the end of the last day, Eastern (midnight Eastern is 05:00 UTC in December).
const closedByDate = (s: Settings) => Date.now() >= Date.parse(s.ends_on + 'T05:00:00Z') + 864e5;

async function whoAmI(req: Request, b: Record<string, unknown>) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(b.token || '');
  const me = tok && tok.split('.').length === 3 ? await verifyToken(tok) : null;
  if (!me) return null;
  const { data: mm } = await db.from('members').select('id, is_superadmin, standing, membership_status').eq('id', me).maybeSingle();
  return mm || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(b.action || '');
  const s = await settings();
  const open = s.entries_open && !closedByDate(s);

  if (action === 'status') {
    // Every active member is entered automatically (locked rules), so the count is the members.
    const [{ data: prizes }, { count }] = await Promise.all([
      db.from('ve_giving_prizes').select('id, title, value_cents, quantity, image_url, draw_on, listing:listings(slug, name, logo_url, category)')
        .eq('campaign', s.campaign).eq('status', 'live').order('draw_on', { ascending: true, nullsFirst: false }).order('created_at'),
      db.from('members').select('id', { count: 'exact', head: true }).eq('membership_status', 'active'),
    ]);
    const mm = await whoAmI(req, b);
    let me = null;
    if (mm) {
      const { data: e } = await db.from('ve_giving_entries').select('entered_at').eq('campaign', s.campaign).eq('member_id', mm.id).maybeSingle();
      const member = !!mm.is_superadmin || mm.membership_status === 'active';
      me = { member, entered: member && (!mm.standing || mm.standing === 'good'), entered_at: e?.entered_at || null, admin: !!mm.is_superadmin };
    }
    return json({ ok: true, open: Date.now() < ENTRY_CLOSE, entry_closes: '2026-12-11', draws_from: '2026-12-14', draws_to: '2026-12-24', rules_reviewed: s.rules_reviewed, starts_on: s.starts_on, ends_on: s.ends_on, fulfill_by: s.fulfill_by, prizes: prizes || [], entries: count || 0, me });
  }

  // A brand says I'm in from /partners/giving (Sean, 2026-11-15: brands give holiday packs; "a good entry point for them to start working
  // with us"). No account needed: it lands in Leads (ve_initiative_interest, tier Brand pack) for our team to confirm. One note per email a day.
  if (action === 'brand_interest') {
    const brand = clean(b.brand, 120), name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase(), pack = clean(b.pack, 600);
    const qty = Math.min(4, Math.max(1, Math.round(Number(b.quantity) || 1)));
    if (!brand || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'missing' }, 400);
    const { count } = await db.from('ve_initiative_interest').select('id', { count: 'exact', head: true }).eq('initiative_slug', s.campaign)
      .eq('email', email).gte('created_at', new Date(Date.now() - 864e5).toISOString());
    if ((count || 0) > 0) return json({ error: 'too_many' }, 429);
    const { error } = await db.from('ve_initiative_interest').insert({ initiative_slug: s.campaign, action_type: 'sponsor_tier', tier_label: 'Brand pack', status: 'new',
      source: 'form', name: `${name}, ${brand}`.slice(0, 120), email, note: `${qty} pack${qty > 1 ? 's' : ''}: ${pack || '(no details yet)'}`.slice(0, 1000),
      tags: ['11-days-of-giving', 'brand-pack', clean(b.page, 120) || '/partners/giving'] });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true });
  }

  if (action === 'event_sponsor_interest') {
    const brand = clean(b.brand, 120), name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase(), note = clean(b.note, 600);
    const EV: Record<string, string> = { philadelphia: 'Community night: Philadelphia', 'south-florida': 'Community night: South Florida', 'central-florida': 'Community night: Central Florida',
      'los-angeles': 'Community night: Los Angeles', all: 'Every community night', spotlight: 'Spotlight day', takeover: 'Takeover day', club: 'Club partner' };
    const tier = EV[clean(b.events, 20)];
    if (!brand || !name || !tier || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'missing' }, 400);
    const SLUG = 'vegans-explore-initiative-world-vegan-expo';
    const { count } = await db.from('ve_initiative_interest').select('id', { count: 'exact', head: true }).eq('initiative_slug', SLUG)
      .eq('email', email).gte('created_at', new Date(Date.now() - 864e5).toISOString());
    if ((count || 0) > 0) return json({ error: 'too_many' }, 429);
    const { error } = await db.from('ve_initiative_interest').insert({ initiative_slug: SLUG, action_type: 'sponsor_tier', tier_label: tier, status: 'new',
      source: 'form', name: `${name}, ${brand}`.slice(0, 120), email, note: (note || '(no details yet)').slice(0, 1000),
      tags: ['community-events', 'event-sponsor', clean(b.page, 120) || '/expo/events'] });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true });
  }

  // The World Vegan Expo Guide's Count me in (Sean, 2026-11-21: "the call to action right now, for them to lock in their interest"). One
  // row per email a day, in Leads on the World Vegan Expo initiative. Interest only: nothing is sold or reserved.
  if (action === 'expo_interest') {
    const ROLES: Record<string, [string, string]> = { attend: ['ticket', 'I will be there'], vendor: ['vendor_tier', 'Vendor'], exhibitor: ['vendor_tier', 'Exhibitor (brand)'],
      sponsor: ['sponsor_tier', 'Sponsor'], club: ['pledge', 'Club or group'], creator: ['pledge', 'Creator or speaker'], cause: ['pledge', 'Cause (nonprofit or sanctuary)'],
      city: ['pledge', 'Host city'], volunteer: ['pledge', 'Volunteer'] };
    const role = ROLES[clean(b.role, 20)];
    const name = clean(b.name, 120), email = clean(b.email, 200).toLowerCase(), org = clean(b.org, 120), city = clean(b.city, 80), note = clean(b.note, 600);
    if (!role || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'missing' }, 400);
    const SLUG = 'vegans-explore-initiative-world-vegan-expo';
    const { count } = await db.from('ve_initiative_interest').select('id', { count: 'exact', head: true }).eq('initiative_slug', SLUG)
      .eq('email', email).eq('tier_label', role[1]).gte('created_at', new Date(Date.now() - 864e5).toISOString());
    if ((count || 0) > 0) return json({ ok: true, already: true });
    const mm0 = await whoAmI(req, b);
    const { error } = await db.from('ve_initiative_interest').insert({ initiative_slug: SLUG, action_type: role[0], tier_label: role[1], status: 'new', source: 'form',
      member_id: mm0?.id || null, name: (org ? `${name}, ${org}` : name).slice(0, 120), email,
      note: [city && `City: ${city}`, note].filter(Boolean).join(' | ').slice(0, 1000) || null, tags: ['world-vegan-expo', 'expo-2028', clean(b.role, 20)] });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true });
  }

  const mm = await whoAmI(req, b);
  if (!mm) return json({ error: 'not_authenticated' }, 401);

  if (action === 'enter') {
    if (mm.standing && mm.standing !== 'good') return json({ error: 'account_not_in_good_standing' }, 403);
    const admin = !!mm.is_superadmin;
    if (!admin && mm.membership_status !== 'active') return json({ error: 'member_needed' }, 403);
    if (!open && !admin) return json({ error: 'entries_closed' }, 409);
    const { error } = await db.from('ve_giving_entries').upsert({ campaign: s.campaign, member_id: mm.id, source: String(b.source || 'holiday-guide').slice(0, 40) },
      { onConflict: 'campaign,member_id', ignoreDuplicates: true });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, entered: true });
  }

  // ---- The prize form (Sean, 2026-11-15: "build the prize form"): a business's owner gives prizes from its dashboard ----
  if (['my_prizes', 'prize_photo_url', 'prize_save', 'prize_withdraw'].includes(action)) {
    const lid = String(b.listing_id || '');
    if (!UUID.test(lid)) return json({ error: 'bad_listing' }, 400);
    const { data: l } = await db.from('listings').select('id, slug, name, owner_member_id, category, product_kinds').eq('id', lid).maybeSingle();
    if (!l) return json({ error: 'not_found' }, 404);
    if (l.owner_member_id !== mm.id && !mm.is_superadmin) return json({ error: 'not_owner' }, 403);
    const mine = async () => (await db.from('ve_giving_prizes').select('id, title, value_cents, quantity, image_url, note, status, created_at')
      .eq('campaign', s.campaign).eq('listing_id', lid).order('created_at')).data || [];
    const given = (ps: any[]) => ps.filter((p) => p.status !== 'withdrawn').reduce((a, p) => a + p.value_cents * p.quantity, 0);
    const closed = Date.now() >= PRIZES_CLOSE;
    // A brand gives up to $150 in all (one item, several, a bundle or a digital code); every other business up to $100.
    const brand = l.category === 'Food Brands' || (Array.isArray(l.product_kinds) && l.product_kinds.length > 0);
    const perPrize = brand ? BRAND_MAX : PER_BUSINESS, perBiz = perPrize;

    if (action === 'my_prizes') {
      const ps = await mine();
      return json({ ok: true, prizes: ps, given_cents: given(ps), per_business_cents: perBiz, per_prize_cents: perPrize, brand, closes_at: new Date(PRIZES_CLOSE).toISOString(), closed });
    }
    if (closed && !mm.is_superadmin) return json({ error: 'prizes_closed' }, 409);

    if (action === 'prize_photo_url') {
      const type = String(b.content_type || '');
      const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[type];
      if (!ext) return json({ error: 'bad_type' }, 400);
      if (!(Number(b.bytes) > 0 && Number(b.bytes) <= 8 * 1024 * 1024)) return json({ error: 'too_big' }, 400);
      const path = `media/giving/${l.slug}/${crypto.randomUUID()}.${ext}`;
      const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_unavailable' }, 500);
      return json({ ok: true, signed_url: up.signedUrl, public_url: `${PUBLIC_BASE}${path}` });
    }
    if (action === 'prize_save') {
      const title = clean(b.title, 120);
      const value = Math.round(Number(b.value_cents));
      const qty = Math.round(Number(b.quantity) || 1);
      const img = clean(b.image_url, 500);
      if (title.length < 2) return json({ error: 'title_needed' }, 400);
      if (!(value >= 100 && value <= perPrize)) return json({ error: 'bad_value', per_prize_cents: perPrize }, 400);
      if (!(qty >= 1 && qty <= 10)) return json({ error: 'bad_quantity' }, 400);
      if (img && !img.startsWith(`${PUBLIC_BASE}media/giving/${l.slug}/`)) return json({ error: 'bad_photo' }, 400);
      const ps = await mine();
      if (given(ps) + value * qty > perBiz) return json({ error: 'over_business_limit', left_cents: Math.max(0, perBiz - given(ps)) }, 409);
      const { data: all } = await db.from('ve_giving_prizes').select('value_cents, quantity').eq('campaign', s.campaign).neq('status', 'withdrawn');
      const total = (all || []).reduce((a: number, p: any) => a + p.value_cents * p.quantity, 0);
      if (total + value * qty > INTAKE_CAP) return json({ error: 'giveaway_full' }, 409);
      const { error } = await db.from('ve_giving_prizes').insert({ campaign: s.campaign, listing_id: lid, title, value_cents: value, quantity: qty,
        image_url: img || null, note: clean(b.note, 500) || null, status: 'pledged', created_by: mm.id });
      if (error) return json({ error: 'save_failed' }, 500);
      // Our team sees who gave a prize where it sees every other interest (Leads), as well as in Depot > 11 Days of Giving.
      await db.from('ve_initiative_interest').insert({ initiative_slug: s.campaign, member_id: mm.id, action_type: 'sponsor_tier', tier_label: 'Prize',
        status: 'new', source: 'form', name: l.name.slice(0, 120), note: `${title}, $${Math.round(value / 100)} x ${qty}`.slice(0, 500), tags: ['11-days-of-giving', l.slug] });
      const fresh = await mine();
      return json({ ok: true, prizes: fresh, given_cents: given(fresh) });
    }
    if (action === 'prize_withdraw') {
      const id = String(b.id || '');
      if (!UUID.test(id)) return json({ error: 'bad_id' }, 400);
      const { error } = await db.from('ve_giving_prizes').update({ status: 'withdrawn' }).eq('id', id).eq('listing_id', lid).eq('status', 'pledged');
      if (error) return json({ error: 'save_failed' }, 500);
      const fresh = await mine();
      return json({ ok: true, prizes: fresh, given_cents: given(fresh) });
    }
  }

  // ---- Our check (super admins, Depot > 11 Days of Giving) ----
  if (action === 'prize_queue') {
    if (!mm.is_superadmin) return json({ error: 'forbidden' }, 403);
    const { data } = await db.from('ve_giving_prizes').select('id, title, value_cents, quantity, image_url, note, status, created_at, reviewed_at, listing:listings(slug, name, logo_url)')
      .eq('campaign', s.campaign).order('created_at', { ascending: false }).limit(500);
    const rows = data || [];
    const total = rows.filter((p: any) => p.status !== 'withdrawn').reduce((a: number, p: any) => a + p.value_cents * p.quantity, 0);
    return json({ ok: true, prizes: rows, total_cents: total, cap_cents: TOTAL_CAP });
  }
  if (action === 'prize_review') {
    if (!mm.is_superadmin) return json({ error: 'forbidden' }, 403);
    const id = String(b.id || ''), decision = String(b.decision || '');
    if (!UUID.test(id) || !['live', 'withdrawn', 'pledged'].includes(decision)) return json({ error: 'bad_request' }, 400);
    const { data: p } = await db.from('ve_giving_prizes').select('id, quantity, created_by, status').eq('id', id).maybeSingle();
    if (!p) return json({ error: 'not_found' }, 404);
    const { error } = await db.from('ve_giving_prizes').update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: mm.id }).eq('id', id);
    if (error) return json({ error: 'save_failed' }, 500);
    // 250 points per prize to the owner who gave it, once (the ref keeps a second approval from paying twice).
    if (decision === 'live' && p.created_by) await db.rpc('ve_points_grant', { p_member: p.created_by, p_amount: 250 * p.quantity, p_reason: 'admin_adjust', p_ref: `giving-prize:${id}` });
    return json({ ok: true });
  }

  if (action === 'entries') {
    if (!mm.is_superadmin) return json({ error: 'forbidden' }, 403);
    const { data } = await db.from('ve_giving_entries').select('entered_at, source, member:members(id, name)').eq('campaign', s.campaign).order('entered_at', { ascending: false }).limit(5000);
    return json({ ok: true, entries: data || [] });
  }

  return json({ error: 'unknown_action' }, 400);
});
