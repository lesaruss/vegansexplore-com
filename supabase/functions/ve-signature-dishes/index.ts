// ve-signature-dishes: a claimed food listing's signature dishes (playbook ve-signature-dishes, canon canon-ve-signature-dishes,
// locked by Sean 2026-11-06; migration 20261106_signature_dishes.sql). Parent: ve-listing-posts (owner actions) and ve-claims (photos).
//   top         public (item K, 2026-11-06): each claimed food place's most voted shown dish over the last 90 days, 3 votes or more; the
//               chapter hub filters by its own rule and shows the list only with 3 or more
//   list        public: the featured dishes in the owner's order, cut to the listing's cap, with vote counts (and the viewer's own votes)
//   vote        an active member (not a Guide account, not the listing's owner): one vote per dish, `on` false takes it back
//   owner_get / save / remove / order / photo_url / photo_done / slot_buy   the listing's owner (owner_member_id) or a super admin
// Rules: up to 20 dishes saved, up to 3 featured free, slots 4 and 5 at 50 points a slot for 30 days (ve_dish_slot_buy), a featured dish
// needs a photo at least 800 px on its shorter side and one line. Votes never change the owner's order. The menu is never touched.
// verify_jwt is off: the VE token (an HMAC session, as ve-listing-posts) is checked inside.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const FOOD = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep'];
const MAX_SAVED = 20, FREE_SLOTS = 3, MIN_PX = 800;
const READ_ACTIONS = new Set(['list', 'top', 'owner_get']);
const COLS = 'id, name, line, photo_url, photo_w, photo_h, price_display, tags, menu_item_id, featured, position, updated_at';


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
  } catch {
    return null;
  }
}

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

async function standingBlocked(memberId: string | null): Promise<boolean> {
  if (!memberId) return false;
  const { data } = await db.from('members').select('standing').eq('id', memberId).maybeSingle();
  return !!data?.standing && data.standing !== 'good';
}
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
function tagsOf(v: unknown): string[] {
  const a = Array.isArray(v) ? v : String(v || '').split(',');
  const out: string[] = [];
  for (const t of a) { const x = clean(t, 24); if (x && !out.some((o) => o.toLowerCase() === x.toLowerCase())) out.push(x); if (out.length >= 5) break; }
  return out;
}
async function capOf(listingId: string): Promise<number> {
  const { data } = await db.rpc('ve_dish_cap', { p_listing: listingId });
  return typeof data === 'number' ? data : FREE_SLOTS;
}
async function counts(ids: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!ids.length) return out;
  const { data } = await db.from('ve_dish_votes').select('dish_id').in('dish_id', ids);
  for (const r of data || []) out[r.dish_id] = (out[r.dish_id] || 0) + 1;
  return out;
}
// The featured dishes a visitor sees: featured, in the owner's order, the first `cap` of them.
async function shown(listingId: string) {
  const cap = await capOf(listingId);
  const { data } = await db.from('ve_signature_dishes').select(COLS).eq('listing_id', listingId).eq('featured', true)
    .order('position', { ascending: true }).order('created_at', { ascending: true });
  return { cap, dishes: (data || []).slice(0, cap) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;

  // ----- public: the Overview section -----
  if (action === 'list') {
    let q = db.from('listings').select('id, slug, category, status, owner_member_id');
    q = body.listing_id ? q.eq('id', String(body.listing_id)) : q.eq('slug', String(body.slug || '')).eq('status', 'approved');
    const { data: l } = await q.limit(1).maybeSingle();
    if (!l || l.status !== 'approved' || !l.owner_member_id || !FOOD.includes(l.category)) return json({ ok: true, dishes: [] });
    const { cap, dishes } = await shown(l.id);
    const c = await counts(dishes.map((d: any) => d.id));
    let mine: string[] = [];
    if (memberId && dishes.length) {
      const { data } = await db.from('ve_dish_votes').select('dish_id').eq('member_id', memberId).in('dish_id', dishes.map((d: any) => d.id));
      mine = (data || []).map((r: any) => r.dish_id);
    }
    return json({ ok: true, cap, own: !!memberId && memberId === l.owner_member_id,
      dishes: dishes.map((d: any) => ({ ...d, votes: c[d.id] || 0, voted: mine.includes(d.id) })) });
  }

  // ----- public: top dishes for the chapter hubs (item K; Sean approved Logan's defaults 2026-11-06) -----
  // Only dishes on a page right now (featured, within the cap, approved, claimed, open, not LESARUSS.ai). One per place (its top dish).
  // Votes from the last 90 days; ties: the dish that reached its count first (earliest latest vote), then A to Z. Never an owner or team boost.
  if (action === 'top') {
    const { data: rows } = await db.from('ve_signature_dishes').select('id, name, line, photo_url, price_display, position, created_at, listing_id, ' +
      'listings!inner(id, slug, name, category, status, owner_member_id, business_status, tags, address_city, address_state, communities, vegan_status)')
      .eq('featured', true).limit(2000);
    const LR = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
    const live = (rows || []).filter((r: any) => { const l = r.listings; return l && l.status === 'approved' && l.owner_member_id && FOOD.includes(l.category) &&
      l.business_status !== 'CLOSED_PERMANENTLY' && !(l.tags || []).some((t: string) => LR.includes(t)); });
    if (!live.length) return json({ ok: true, days: 90, min_votes: 3, dishes: [] });
    const lids = [...new Set(live.map((r: any) => String(r.listing_id)))] as string[], nowIso = new Date().toISOString();
    const { data: run } = await db.from('ve_dish_slots').select('listing_id, slot').in('listing_id', lids).lte('starts_at', nowIso).gt('ends_at', nowIso);
    const extra: Record<string, Set<number>> = {};
    for (const r of run || []) (extra[r.listing_id] ||= new Set()).add(r.slot);
    const byL: Record<string, any[]> = {};
    for (const r of live) (byL[r.listing_id] ||= []).push(r);
    const shownIds: any[] = [];
    for (const lid of lids) {
      const cap = FREE_SLOTS + (extra[lid]?.size || 0);
      byL[lid].sort((a, b) => (a.position - b.position) || (a.created_at < b.created_at ? -1 : 1)).slice(0, cap).forEach((r) => shownIds.push(r));
    }
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const { data: vs } = await db.from('ve_dish_votes').select('dish_id, created_at').in('dish_id', shownIds.map((r) => r.id)).gte('created_at', since);
    const tally: Record<string, { n: number; last: string }> = {};
    for (const v of vs || []) { const t = (tally[v.dish_id] ||= { n: 0, last: '' }); t.n++; if (v.created_at > t.last) t.last = v.created_at; }
    const rank = (a: any, b: any) => (tally[b.id].n - tally[a.id].n) || (tally[a.id].last < tally[b.id].last ? -1 : tally[a.id].last > tally[b.id].last ? 1 : 0) || a.name.localeCompare(b.name);
    const best: Record<string, any> = {};
    for (const r of shownIds) { if ((tally[r.id]?.n || 0) < 3) continue; if (!best[r.listing_id] || rank(r, best[r.listing_id]) < 0) best[r.listing_id] = r; }
    const out = Object.values(best).sort(rank).slice(0, 300).map((r: any) => ({ id: r.id, name: r.name, line: r.line, photo_url: r.photo_url, price_display: r.price_display,
      votes: tally[r.id].n, listing: { slug: r.listings.slug, name: r.listings.name, city: r.listings.address_city, state: r.listings.address_state,
        communities: r.listings.communities || [], vegan_status: r.listings.vegan_status } }));
    return json({ ok: true, days: 90, min_votes: 3, dishes: out });
  }

  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: me } = await db.from('members').select('id, is_superadmin, membership_status, member_class, lesars_balance').eq('id', memberId).maybeSingle();
  if (!me) return json({ error: 'not_authenticated' }, 401);
  if (!READ_ACTIONS.has(action) && !me.is_superadmin && await standingBlocked(memberId)) {
    return json({ error: 'account_not_in_good_standing', message: 'Your account is on hold. Write to contact@lesaruss.com and we will help.' }, 403);
  }

  // ----- members vote -----
  if (action === 'vote') {
    if (me.membership_status !== 'active' || me.member_class === 'agent') return json({ error: 'members_only' }, 403);
    const id = String(body.dish_id || '');
    if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: 'bad_dish' }, 400);
    const { data: d } = await db.from('ve_signature_dishes').select('id, listing_id, featured').eq('id', id).maybeSingle();
    if (!d) return json({ error: 'not_found' }, 404);
    const { data: l } = await db.from('listings').select('owner_member_id').eq('id', d.listing_id).maybeSingle();
    if (l?.owner_member_id === memberId) return json({ error: 'own_dish', message: 'You cannot vote on your own dishes.' }, 403);
    if (body.on === false) await db.from('ve_dish_votes').delete().eq('dish_id', id).eq('member_id', memberId);
    else {
      const { dishes } = await shown(d.listing_id);
      if (!dishes.some((x: any) => x.id === id)) return json({ error: 'not_featured' }, 409);
      await db.from('ve_dish_votes').upsert({ dish_id: id, member_id: memberId }, { onConflict: 'dish_id,member_id', ignoreDuplicates: true });
    }
    const c = await counts([id]);
    return json({ ok: true, votes: c[id] || 0, voted: body.on !== false });
  }

  // ----- the owner's editor -----
  const lid = String(body.listing_id || '');
  if (!/^[0-9a-f-]{36}$/.test(lid)) return json({ error: 'bad_listing' }, 400);
  const { data: l } = await db.from('listings').select('id, slug, name, category, status, owner_member_id').eq('id', lid).maybeSingle();
  if (!l || l.status !== 'approved') return json({ error: 'not_found' }, 404);
  if (l.owner_member_id !== memberId && !me.is_superadmin) return json({ error: 'not_owner' }, 403);
  if (!FOOD.includes(l.category)) return json({ error: 'not_food', message: 'Signature dishes are for food places.' }, 400);
  if (!l.owner_member_id && !me.is_superadmin) return json({ error: 'not_claimed' }, 403);

  const all = async () => {
    const { data } = await db.from('ve_signature_dishes').select(COLS).eq('listing_id', lid).order('featured', { ascending: false })
      .order('position', { ascending: true }).order('created_at', { ascending: true });
    return data || [];
  };

  if (action === 'owner_get') {
    const dishes = await all(), cap = await capOf(lid);
    const c = await counts(dishes.map((d: any) => d.id));
    let n = 0;
    const out = dishes.map((d: any) => ({ ...d, votes: c[d.id] || 0, shown: d.featured && ++n <= cap }));
    const { data: slots } = await db.from('ve_dish_slots').select('id, slot, starts_at, ends_at').eq('listing_id', lid).gt('ends_at', new Date().toISOString()).order('ends_at');
    const { data: menu } = await db.from('ve_menu_items').select('id, name, category').eq('listing_id', lid).eq('is_available', true).order('sort_order').limit(300);
    return json({ ok: true, listing: { id: l.id, slug: l.slug, name: l.name }, cap, free: FREE_SLOTS, max_saved: MAX_SAVED, min_px: MIN_PX, slot_points: 50,
      balance: me.lesars_balance || 0, slots: slots || [], dishes: out, menu: menu || [] });
  }

  if (action === 'save') {
    const d = body.dish || {};
    const id = d.id && /^[0-9a-f-]{36}$/.test(String(d.id)) ? String(d.id) : null;
    const name = clean(d.name, 80), line = clean(d.line, 160);
    if (!name) return json({ error: 'name_needed' }, 400);
    const dishes = await all();
    const before = id ? dishes.find((x: any) => x.id === id) : null;
    if (id && !before) return json({ error: 'not_found' }, 404);
    if (!id && dishes.length >= MAX_SAVED) return json({ error: 'too_many', max: MAX_SAVED }, 400);
    let photo = d.photo_url ? String(d.photo_url) : null, pw = Number(d.photo_w) || null, ph = Number(d.photo_h) || null;
    if (photo && photo !== before?.photo_url) {
      // Only a photo uploaded through photo_done, in this listing's folder.
      const prefix = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/media/dishes/${l.slug}/`;
      if (!photo.startsWith(prefix) || photo.includes('..')) return json({ error: 'upload_first' }, 400);
      // Measure it here, never from what the browser says.
      const { data: file } = await db.storage.from('vegan-media').download(photo.slice(`${SUPABASE_URL}/storage/v1/object/public/vegan-media/`.length));
      const size = file ? imageSize(new Uint8Array(await file.arrayBuffer())) : null;
      if (!size) return json({ error: 'upload_first' }, 400);
      pw = size.w; ph = size.h;
    } else if (photo) { pw = before.photo_w; ph = before.photo_h; }
    const featured = !!d.featured;
    if (featured) {
      if (!photo) return json({ error: 'photo_needed', message: 'A featured dish needs a photo.' }, 400);
      if (!line) return json({ error: 'line_needed', message: 'A featured dish needs one line about it.' }, 400);
      if (!pw || !ph || Math.min(pw, ph) < MIN_PX) return json({ error: 'low_quality', min: MIN_PX }, 422);
      if (!before?.featured) {
        const cap = await capOf(lid), on = dishes.filter((x: any) => x.featured).length;
        if (on >= cap) return json({ error: 'no_slot', cap, message: cap < 5 ? 'All your slots are in use. Add a slot for 50 points, or take another dish off.' : 'Five dishes is the most you can feature.' }, 409);
      }
    }
    let menuItem = d.menu_item_id && /^[0-9a-f-]{36}$/.test(String(d.menu_item_id)) ? String(d.menu_item_id) : null;
    if (menuItem) { const { data: mi } = await db.from('ve_menu_items').select('id').eq('id', menuItem).eq('listing_id', lid).maybeSingle(); if (!mi) menuItem = null; }
    const row: Record<string, unknown> = { listing_id: lid, name, line, photo_url: photo, photo_w: photo ? pw : null, photo_h: photo ? ph : null,
      price_display: clean(d.price_display, 30), tags: tagsOf(d.tags), menu_item_id: menuItem, featured, updated_by: memberId, updated_at: new Date().toISOString() };
    if (!id) { row.created_by = memberId; row.position = dishes.length ? Math.max(...dishes.map((x: any) => x.position || 0)) + 1 : 0; }
    const q = id ? db.from('ve_signature_dishes').update(row).eq('id', id).eq('listing_id', lid) : db.from('ve_signature_dishes').insert(row);
    const { data: saved, error } = await q.select(COLS).maybeSingle();
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, dish: saved });
  }

  if (action === 'remove') {
    const { data: gone } = await db.from('ve_signature_dishes').delete().eq('id', String(body.id || '')).eq('listing_id', lid).select('id').maybeSingle();
    return gone ? json({ ok: true }) : json({ error: 'not_found' }, 404);
  }

  if (action === 'order') {
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String).slice(0, MAX_SAVED) : [];
    const have = new Set((await all()).map((x: any) => x.id));
    if (!ids.length || ids.some((x) => !have.has(x))) return json({ error: 'bad_order' }, 400);
    for (let i = 0; i < ids.length; i++) await db.from('ve_signature_dishes').update({ position: i }).eq('id', ids[i]).eq('listing_id', lid);
    return json({ ok: true });
  }

  if (action === 'photo_url') {
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[String(body.content_type || '')];
    if (!ext) return json({ error: 'file_type' }, 400);
    const bytes = Number(body.bytes) || 0;
    if (bytes <= 0 || bytes > 15728640) return json({ error: 'file_size' }, 400);
    const path = `media/dishes/${l.slug}/dish-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
    if (error || !up) return json({ error: 'upload_url_failed', message: error?.message }, 500);
    return json({ path, signed_url: up.signedUrl });
  }

  if (action === 'photo_done') {
    const path = String(body.path || '');
    if (!path.startsWith(`media/dishes/${l.slug}/dish-`) || path.includes('..')) return json({ error: 'bad_path' }, 400);
    const { data: file, error } = await db.storage.from('vegan-media').download(path);
    if (error || !file) return json({ error: 'not_uploaded' }, 409);
    const size = imageSize(new Uint8Array(await file.arrayBuffer()));
    if (!size || Math.min(size.w, size.h) < MIN_PX) {
      await db.storage.from('vegan-media').remove([path]);
      return json({ error: 'low_quality', width: size?.w ?? null, height: size?.h ?? null, min: MIN_PX }, 422);
    }
    return json({ ok: true, url: `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`, w: size.w, h: size.h });
  }

  if (action === 'slot_buy') {
    const slot = Number(body.slot);
    const { data, error } = await db.rpc('ve_dish_slot_buy', { p_member: memberId, p_listing: lid, p_slot: slot });
    if (error) return json({ error: 'buy_failed', message: error.message }, 500);
    if (data?.error) return json(data, data.error === 'not_enough_points' ? 402 : 409);
    return json(data);
  }

  return json({ error: 'unknown_action' }, 400);
});
