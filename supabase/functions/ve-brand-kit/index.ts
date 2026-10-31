// ve-brand-kit: the Suggest button in a BrandDesk brand kit (canon canon-ve-front-of-house v5; Sean, 2026-10-31: "if they don't
// know what to type for the description, they can click suggested button, and then our AI will come up with something").
//
// POST { action: 'suggest', kind: 'menu_item' | 'story' | 'voice', business: {name, short, city, cuisines, vegan}, voice?, item?, answers?, visitor? }
//   menu_item -> { copy }                     one menu description in their voice, from their own words and ingredients only
//   story     -> { tagline, short, long[] }   their story from their answers (and old About text), nothing invented
//   voice     -> { personality[3], sounds_like, never[], use[], avoid[], samples {hero, instagram, google_reply, closed} }
// Anyone may ask (the sample at /business/sample/brand is public): 20 a day per visitor and address, 200 a day for a signed-in
// member (the VE app token, HMAC-checked like ve-auth). Every suggestion is logged in ve_brand_kit_suggestions. Nothing else is saved:
// the owner edits what comes back and saves it in the kit.
//
// The kit itself (/business/brand?listing=<slug>), a signed-in member with the VE app token:
//   kit_get {slug}                      -> { role, listing, cartridge|null, people? }   role: admin | owner | editor | photographer | none
//   kit_create {slug}                   a super admin starts a client's kit, filled from the listing (name, city, hours, phone,
//                                       address, menu, logo); every section starts Not started
//   kit_save {slug, section, part, state}  one section (logo, colors, type, voice, story, menu, photos, info) in a state
//                                       (in_progress or locked); a photographer saves photos and menu only; every save is a
//                                       ve_cartridge_edits row with what it replaced
//   kit_photo_url {slug, kind, content_type, bytes} -> { path, signed_url }   (kind: logo, menu, space; jpg, png, webp; 15 MB)
//   kit_photo_done {slug, path}         -> { url, width, height }   checked it is there and is a picture
//   kit_people_add {slug, email, role} / kit_people_remove {slug, member_id}   the owner or a super admin
// Ops: LESARUSS_ADMIN_TOKEN as the bearer with as_member acts as that member (testing, HQ).
// verify_jwt is false: the member token is checked here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const list = (v: unknown, n: number, each: number) => (Array.isArray(v) ? v : []).slice(0, n).map((x) => clean(x, each)).filter(Boolean);

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
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  return v && v !== 'pending' ? v : null;
}
async function sha(s: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

const RULES = `House rules for every word you write:
- Write only what the owner gave you. Never invent an ingredient, a fact, a person, a year, an award, a place or a claim.
- "Vegan" always has a capital V. Never say "plant-based alternative", "guilt-free", "clean", "healthy version", "fake" or "mock".
- No em dashes or en dashes. Short sentences. No exclamation marks in a row. No hashtags.
- Talk about the food and the people, not about being Vegan, unless the owner does.`;

const SCHEMAS: Record<string, any> = {
  menu_item: { type: 'object', additionalProperties: false, required: ['copy'], properties: { copy: { type: 'string' } } },
  story: { type: 'object', additionalProperties: false, required: ['tagline', 'short', 'long'], properties: {
    tagline: { type: 'string' }, short: { type: 'string' }, long: { type: 'array', items: { type: 'string' } } } },
  voice: { type: 'object', additionalProperties: false, required: ['personality', 'sounds_like', 'never', 'use', 'avoid', 'samples'], properties: {
    personality: { type: 'array', items: { type: 'string' } }, sounds_like: { type: 'string' },
    never: { type: 'array', items: { type: 'string' } }, use: { type: 'array', items: { type: 'string' } }, avoid: { type: 'array', items: { type: 'string' } },
    samples: { type: 'object', additionalProperties: false, required: ['hero', 'instagram', 'google_reply', 'closed'], properties: {
      hero: { type: 'string' }, instagram: { type: 'string' }, google_reply: { type: 'string' }, closed: { type: 'string' } } } } },
};

function prompt(kind: string, b: any) {
  const biz = b.business || {};
  const head = `The business: ${clean(biz.name, 80)}${biz.city ? ', ' + clean(biz.city, 60) : ''}. ${clean(biz.vegan, 30)}. ${list(biz.cuisines, 6, 40).join(', ')}.`;
  const v = b.voice || {};
  const voice = v.sounds_like ? `Their voice: ${list(v.personality, 3, 20).join(', ')}. ${clean(v.sounds_like, 300)} Never: ${list(v.never, 8, 120).join('; ')}. Words they use: ${list(v.use, 12, 30).join(', ')}. Words they leave out: ${list(v.avoid, 12, 40).join(', ')}.` : 'Their voice is not set yet: write warm, plain and friendly.';
  if (kind === 'menu_item') {
    const it = b.item || {};
    return `${head}\n${voice}\n\nWrite the menu description for "${clean(it.name, 80)}" (${clean(it.section, 40)}, ${clean(it.price, 12)}${list(it.tags, 6, 20).length ? ', ' + list(it.tags, 6, 20).join(', ') : ''}).
What the owner wrote: "${clean(it.was, 400)}"
${clean(it.notes, 300) ? 'More from the owner: "' + clean(it.notes, 300) + '"' : ''}
One or two sentences, 90 to 220 characters, that make someone hungry and sound like them. Use only the ingredients and facts above. Do not repeat the dish's name at the start.`;
  }
  if (kind === 'story') {
    const a = b.answers || {};
    return `${head}\n${voice}\n\nWrite their story from their own answers:
How it started: "${clean(a.start, 600)}"
What they cook: "${clean(a.food, 400)}"
Who comes in: "${clean(a.who, 400)}"
What they are proud of: "${clean(a.proud, 400)}"
Their old About text, if any: "${clean(a.old, 1200)}"
Return a tagline (under 90 characters), a short version (two sentences, under 260 characters), and the About as two to four short paragraphs. Nothing they did not say.`;
  }
  const a = b.answers || {};
  return `${head}\n\nFind this business's voice from the owner's answers:
How they greet a regular: "${clean(a.greet, 300)}"
Three words that describe the place: "${clean(a.words, 120)}"
If the place were a person: "${clean(a.person, 300)}"
What they never want to sound like: "${clean(a.never, 300)}"
The vibe they picked: "${clean(a.vibe, 80)}"
Return: personality (exactly three words), sounds_like (two sentences, how they talk), never (three or four things they never do in words), use (five or six words they use), avoid (three or four words to leave out), and four sample lines in that voice: hero (the website's first line, under 70 characters), instagram (a post about a favorite dish, under 220 characters, use only foods the owner named or none), google_reply (a thank-you to a happy reviewer named Dana), closed (closed today for a family day, back tomorrow).`;
}


// ---- The kit: stored Cartridges, who may work on them, photo uploads.
const SECTIONS = ['logo', 'colors', 'type', 'voice', 'story', 'menu', 'photos', 'info'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function getPart(d: any, k: string) { return k === 'logo' ? d.brand?.logo : k === 'colors' ? d.brand?.colors : k === 'type' ? d.brand?.type : k === 'photos' ? d.photos?.space : d[k]; }
function setPart(d: any, k: string, v: any) {
  if (k === 'logo' || k === 'colors' || k === 'type') { d.brand = d.brand || {}; d.brand[k] = v; }
  else if (k === 'photos') { d.photos = d.photos || {}; d.photos.space = v; }
  else d[k] = v;
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
const PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/`;
// Everything a Cartridge points at must be ours: our storage, or a path on this site. Never a data: URL or a hot link.
function srcsOk(v: any): boolean {
  let ok = true;
  const walk = (o: any) => { if (!ok || !o) return; if (typeof o === 'string') return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (typeof o === 'object') for (const [k, x] of Object.entries(o)) { if (k === 'src' && typeof x === 'string' && x && !(x.startsWith(PUBLIC) || /^\/[\w\-/.]+$/.test(x))) ok = false; else walk(x); } };
  walk(v); return ok;
}
function hoursOf(h: any): Record<string, string> {
  let v = h; if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = null; } }
  const out: Record<string, string> = {};
  if (Array.isArray(v)) v.forEach((x: any) => { const d = x?.day || x?.name; if (d) out[d] = String(x.hours || x.openingHours || x.time || ''); });
  else if (v && typeof v === 'object') Object.keys(v).forEach((d) => { out[d] = String(v[d] ?? ''); });
  return Object.fromEntries(DAYS.map((d) => [d, out[d] || 'Closed']));
}
const VEGAN: Record<string, string> = { fully_vegan: '100% Vegan', vegan_options: 'Vegan options', vegan_friendly: 'Vegan friendly' };
async function startCartridge(l: any) {
  const { data: items } = await db.from('ve_menu_items').select('category, name, description, price_display, is_gluten_free, is_featured, sort_order').eq('listing_id', l.id).eq('is_available', true).order('sort_order').limit(400);
  const sections: any[] = [];
  (items || []).forEach((it: any) => {
    const name = clean(it.category, 60) || 'Menu';
    let s = sections.find((x) => x.name === name); if (!s) { s = { name, items: [] }; sections.push(s); }
    s.items.push({ name: clean(it.name, 80), price: clean(it.price_display, 20), tags: [it.is_gluten_free ? 'Gluten-free' : '', it.is_featured ? 'Favorite' : ''].filter(Boolean),
      was: clean(it.description, 400), copy: '', photo: { state: 'to_shoot' } });
  });
  const city = [l.address_city, l.address_state].filter(Boolean).join(', ');
  return {
    meta: { version: 1, status: 'building', frame: 'restaurant', updated: new Date().toISOString().slice(0, 10), approvals: Object.fromEntries(SECTIONS.map((k) => [k, { state: 'not_started' }])),
      sources: ['Their Directory listing'].concat(l.website ? ['Their website (to archive at intake)'] : []).concat((items || []).length ? ['Their menu as we hold it'] : []) },
    business: { name: l.name, short: l.name.split(/\s+/).slice(0, 2).join(' '), kind: l.category || 'Restaurant', vegan: VEGAN[l.vegan_status] || '', cuisines: l.cuisines || [], city, chapter: '', since: null },
    brand: {
      logo: { primary: { src: l.logo_url && l.logo_url.startsWith(PUBLIC) ? l.logo_url : '', state: l.logo_url ? 'have' : 'to_make', note: '' },
        files: [['Primary', l.logo_url ? 'have' : 'to_make'], ['Primary, vector (SVG and PDF)', 'to_make'], ['Reversed', 'to_make'], ['The mark alone', 'to_make'], ['Wordmark on one line', 'to_make'], ['Social sizes (profile, cover, story)', 'to_make'], ['Delivery app sizes (logo, banner)', 'to_make']].map(([name, state]) => ({ name, state })),
        rules: ['Clear space all round equal to the height of the mark.', 'Never smaller than 120 px wide.', 'Only on its own colors. Never on a photo without a panel behind it.', 'Never stretched, recolored, outlined or shadowed.'] },
      colors: [], pairs: [['text', 'page', 'Headings and text'], ['page', 'accent', 'Button words'], ['page', 'text', 'Words on the dark panels'], ['ink', 'highlight', 'Words on a highlight'], ['text', 'soft', 'Words on a soft panel']],
      type: { heading: { family: 'Nunito', weight: 900, why: '' }, body: { family: 'DM Sans', weight: 400, why: '' } },
      photo: { look: 'Bright and natural. Window light from the side. Food fills most of the frame.', never: 'Flash, dark moody tables, filters, plastic wrap, a dirty rim, anything off the menu in frame.' } },
    voice: { personality: [], sounds_like: '', never: [], words: { use: [], avoid: [] }, samples: { hero: '', instagram: '', google_reply: '', closed: '' } },
    story: { tagline: l.tagline || '', short: '', long: l.description ? [l.description] : [], answers: { old: l.description || '' } },
    menu: { sections },
    photos: { spec: { angles: 'Every item twice: three-quarter (about 45 degrees) and straight overhead.', set: 'The same table, the same plates, a napkin and one fork. Nothing else.',
        light: 'Window light from one side, a white bounce on the other, no flash.', drinks: 'Shot against the light so they glow; cold drinks with real condensation and the garnish on top.',
        crops: '4:5 for the menu and Instagram, 1:1 for the delivery apps, 16:9 for the website. Full size, at least 3000 px on the long side.', plate: 'Plated the way it leaves the kitchen, wiped rims. Never styled bigger than it is served.' },
      space: ['Outside by day, the whole front and the sign', 'Outside at dusk, lights on', 'The room wide, from the front corner', 'The room wide, from the back corner', 'The counter', 'Details', 'The owner', 'The team, all together'].map((shot) => ({ shot, state: 'to_shoot' })) },
    info: { address: { street: l.address_street || '', city: l.address_city || '', state: l.address_state || '', zip: l.address_zip || '' }, phone: l.phone || '', email: '', hours: hoursOf(l.google_hours_json), details: [],
      links: { website: l.website || '', instagram: l.instagram ? '@' + l.instagram : '', directory: '/directory/' + l.slug }, ordering: { pos: 'None yet', state: 'not_started', order_url: null, note: '' } },
  };
}
async function kit(b: any, memberId: string) {
  const slug = clean(b.slug, 120);
  const { data: m } = await db.from('members').select('id, name, email, is_superadmin').eq('id', memberId).maybeSingle();
  if (!m) return json({ error: 'signed_out' }, 401);
  const { data: l } = await db.from('listings').select('id, name, slug, status, category, vegan_status, cuisines, tagline, description, phone, website, instagram, address_street, address_city, address_state, address_zip, google_hours_json, logo_url, owner_member_id, claimed_by_member_id')
    .eq('slug', slug).eq('status', 'approved').maybeSingle();
  if (!l) return json({ error: 'not_found' }, 404);
  const { data: person } = await db.from('ve_cartridge_people').select('role').eq('listing_id', l.id).eq('member_id', memberId).maybeSingle();
  const role = m.is_superadmin ? 'admin' : (l.owner_member_id === memberId || l.claimed_by_member_id === memberId) ? 'owner' : person?.role || 'none';
  if (role === 'none') return json({ error: 'not_yours', listing: { name: l.name, slug: l.slug } }, 403);
  const { data: cart } = await db.from('ve_cartridges').select('data, status, updated_at').eq('listing_id', l.id).maybeSingle();
  const canPeople = role === 'admin' || role === 'owner';
  const people = async () => {
    if (!canPeople) return undefined;
    const { data } = await db.from('ve_cartridge_people').select('member_id, role, added_at, members(name, email)').eq('listing_id', l.id);
    return (data || []).map((p: any) => ({ member_id: p.member_id, role: p.role, name: p.members?.name || '', email: p.members?.email || '', added_at: p.added_at }));
  };
  const listing = { id: l.id, name: l.name, slug: l.slug };

  if (b.action === 'kit_get') return json({ ok: true, role, listing, cartridge: cart?.data || null, status: cart?.status || null, people: await people() });

  if (b.action === 'kit_create') {
    if (role !== 'admin') return json({ error: 'admins_only' }, 403);
    if (cart) return json({ ok: true, role, listing, cartridge: cart.data, status: cart.status, people: await people() });
    const data = await startCartridge(l);
    const { error } = await db.from('ve_cartridges').insert({ listing_id: l.id, data, created_by: memberId, updated_by: memberId });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    await db.from('ve_cartridge_edits').insert({ listing_id: l.id, member_id: memberId, section: 'kit', state: 'created', after: null });
    return json({ ok: true, role, listing, cartridge: data, status: 'building', people: await people() });
  }

  if (b.action === 'kit_save') {
    if (!cart) return json({ error: 'no_kit' }, 404);
    const section = String(b.section || ''), state = b.state === 'locked' ? 'locked' : 'in_progress';
    if (!SECTIONS.includes(section)) return json({ error: 'bad_section' }, 400);
    if (role === 'photographer' && section !== 'photos' && section !== 'menu') return json({ error: 'photos_only' }, 403);
    const part = b.part;
    if (part == null || JSON.stringify(part).length > 300000) return json({ error: 'too_big' }, 413);
    if (!srcsOk(part)) return json({ error: 'upload_first' }, 400);
    const data = cart.data as any, before = getPart(data, section) ?? null;
    if (role === 'photographer' && section === 'menu') {
      // A photographer may only change photos on the menu: the words, prices and items stay as they are.
      const photos = new Map<string, any>();
      (part.sections || []).forEach((s: any) => (s.items || []).forEach((it: any) => photos.set(s.name + '|' + it.name, it.photo)));
      (data.menu?.sections || []).forEach((s: any) => (s.items || []).forEach((it: any) => { const p = photos.get(s.name + '|' + it.name); if (p) it.photo = p; }));
    } else setPart(data, section, part);
    data.meta = data.meta || {}; data.meta.approvals = data.meta.approvals || {};
    data.meta.approvals[section] = { state, by: clean(m.name, 60) || 'Team', at: new Date().toISOString().slice(0, 10) };
    data.meta.updated = new Date().toISOString().slice(0, 10);
    const allLocked = SECTIONS.every((k) => data.meta.approvals[k]?.state === 'locked');
    const status = cart.status === 'building' && allLocked ? 'locked' : cart.status === 'locked' && !allLocked ? 'building' : cart.status;
    data.meta.status = status;
    const { error } = await db.from('ve_cartridges').update({ data, status, updated_at: new Date().toISOString(), updated_by: memberId }).eq('listing_id', l.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    await db.from('ve_cartridge_edits').insert({ listing_id: l.id, member_id: memberId, section, state, before, after: getPart(data, section) ?? null });
    return json({ ok: true, cartridge: data, status });
  }

  if (b.action === 'kit_photo_url') {
    if (!cart) return json({ error: 'no_kit' }, 404);
    const kind = ['logo', 'menu', 'space'].includes(b.kind) ? b.kind : '';
    if (!kind || (role === 'photographer' && kind === 'logo')) return json({ error: 'bad_kind' }, 400);
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[String(b.content_type || '')];
    if (!ext) return json({ error: 'file_type' }, 400);
    const bytes = Number(b.bytes) || 0;
    if (bytes <= 0 || bytes > 15728640) return json({ error: 'file_size' }, 400);
    const path = `media/brandkit/${l.slug}/${kind}-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
    if (error || !up) return json({ error: 'upload_url_failed', message: error?.message }, 500);
    return json({ ok: true, path, signed_url: up.signedUrl });
  }

  if (b.action === 'kit_photo_done') {
    const path = String(b.path || '');
    if (!path.startsWith(`media/brandkit/${l.slug}/`) || path.includes('..')) return json({ error: 'bad_path' }, 400);
    const { data: file, error } = await db.storage.from('vegan-media').download(path);
    if (error || !file) return json({ error: 'not_uploaded' }, 409);
    const size = imageSize(new Uint8Array(await file.arrayBuffer()));
    if (!size) { await db.storage.from('vegan-media').remove([path]); return json({ error: 'not_a_picture' }, 422); }
    return json({ ok: true, url: PUBLIC + path, width: size.w, height: size.h });
  }

  if (b.action === 'kit_people_add' || b.action === 'kit_people_remove') {
    if (!canPeople) return json({ error: 'owner_only' }, 403);
    if (b.action === 'kit_people_remove') {
      await db.from('ve_cartridge_people').delete().eq('listing_id', l.id).eq('member_id', String(b.member_id || ''));
      return json({ ok: true, people: await people() });
    }
    const email = clean(b.email, 160).toLowerCase(), r = b.role === 'photographer' ? 'photographer' : 'editor';
    const { data: who } = await db.from('members').select('id').ilike('email', email).maybeSingle();
    if (!who) return json({ error: 'no_account', message: 'They need a Vegans Explore account with that email first.' }, 404);
    await db.from('ve_cartridge_people').upsert({ listing_id: l.id, member_id: who.id, role: r, added_by: memberId });
    return json({ ok: true, people: await people() });
  }
  return json({ error: 'unknown_action' }, 400);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (String(b.action || '').startsWith('kit_')) {
    const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || String(b.token || '');
    // Ops (testing, HQ): the LESARUSS admin token acting as a named member.
    const admin = await secret('LESARUSS_ADMIN_TOKEN');
    const id = admin && t === admin && /^[0-9a-f-]{36}$/.test(String(b.as_member || '')) ? String(b.as_member) : t ? await verifyToken(t) : null;
    if (!id) return json({ error: 'signed_out' }, 401);
    return kit(b, id);
  }
  if (b.action !== 'suggest') return json({ error: 'unknown_action' }, 400);
  const kind = String(b.kind || '');
  if (!SCHEMAS[kind]) return json({ error: 'unknown_kind' }, 400);
  if (!clean(b.business?.name, 80)) return json({ error: 'name_needed' }, 400);
  if (kind === 'menu_item' && !clean(b.item?.name, 80)) return json({ error: 'item_needed' }, 400);

  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const member = tok ? await verifyToken(tok) : null;
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const visitor = await sha(ip + '|' + clean(b.visitor, 64));
  const since = new Date(Date.now() - 864e5).toISOString();
  const q = db.from('ve_brand_kit_suggestions').select('id', { count: 'exact', head: true }).gte('created_at', since);
  const { count } = member ? await q.eq('member_id', member) : await q.eq('visitor', visitor);
  if ((count || 0) >= (member ? 200 : 20)) return json({ error: 'daily_limit' }, 429);

  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'no_model_key' }, 500);
  try {
    const client = new Anthropic({ apiKey });
    const res: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 1500, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMAS[kind] } },
      system: 'You write brand copy for small Vegan businesses on Vegans Explore. ' + RULES,
      messages: [{ role: 'user', content: prompt(kind, b) }],
    } as any);
    if (res.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
    const out = JSON.parse((res.content || []).filter((x: any) => x.type === 'text').map((x: any) => x.text).join(''));
    const strip = (s: string) => String(s).replace(/\s*[—–]\s*/g, ', ').replace(/\bvegan\b/g, 'Vegan');
    const tidy = (o: any): any => typeof o === 'string' ? strip(o) : Array.isArray(o) ? o.map(tidy) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, tidy(v)])) : o;
    const result = tidy(out);
    await db.from('ve_brand_kit_suggestions').insert({ member_id: member, visitor: member ? null : visitor, kind, business: clean(b.business?.name, 80),
      input: { item: b.item || null, answers: b.answers || null }, output: result });
    return json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
    return json({ error: String((e as Error).message || e).slice(0, 200) }, 502);
  }
});
