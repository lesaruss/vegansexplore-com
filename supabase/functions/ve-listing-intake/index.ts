// ve-listing-intake: Add a listing from what Sean has in hand (Sean, 2026-10-27: "I typically find a lot on Instagram... typing
// the name, where it's located, maybe add a field for the URL... and then also, I would like to upload an image, like a
// screenshot... you can then look up the information based off of that"). Depot > Directory review > Add a listing, step 1.
//
// POST { action: 'read', name?, where?, url?, images?: [{ type, data (base64) }] }   a super admin ->
//   { ok, found: { name, kind, vegan, organization, online_only, street, city, state, zip, country, phone, website, instagram,
//     facebook, tiktok, hours {Day: text}, about, search, note }, read: [what was read], pictures: [{ url, from }] }
// The link is read server side: an Instagram profile through Apify's profile scraper (APIFY_API_TOKEN; its bio, link, category,
// post locations and profile picture), any other page as text (title, description, the business's structured data, the words
// on the page, its social links), and the website an Instagram bio links to. Up to three screenshots (shrunk in the browser) and
// all of that go to Claude (structured output), which writes down only what they show. Nothing is saved: the page then searches
// Google with found.search (ve-discover add_search) and Sean checks every field before Add it.
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// The Directory's kinds (CATEGORIES in ve-discover; keep in step).
const KINDS = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Food Brands', 'Nutrition & Supplements', 'Markets', 'Catering', 'Meal Prep',
  'Fitness and Athletics', 'Clothing and Fashion', 'Beauty and Personal Care', 'E-Commerce & Marketplaces',
  'Health and Wellness', 'Coaches and Consultants', 'Marketing & Growth', 'Branding & Creative Assets', 'Content Creation & Media', 'Web & Development',
  'AI & Automation', 'Business Operations', 'Podcasts', 'YouTube', 'News Outlets', 'Documentaries & Films', 'Books',
  'Nonprofits', 'Rescues', 'Sanctuaries', 'Events'];

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

// ---- Reading the link ----
function igHandle(u: string): string {
  const s = u.trim();
  if (/^@[\w.]{2,30}$/.test(s)) return s.slice(1).toLowerCase();
  const m = s.match(/instagram\.com\/([\w.]{2,30})\/?(?:[?#]|$)/i);
  return m && !/^(p|reel|reels|stories|explore|tv)$/i.test(m[1]) ? m[1].toLowerCase() : '';
}
async function readInstagram(handle: string) {
  const token = await secret('APIFY_API_TOKEN');
  if (!token) return { error: 'no Apify key' };
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [handle] }), signal: AbortSignal.timeout(100000),
    });
    if (!r.ok) return { error: `Instagram reader answered ${r.status}` };
    const p = ((await r.json()) as any[])[0];
    if (!p || p.error) return { error: p?.error === 'not_found' ? 'That Instagram account was not found' : 'Instagram did not answer' };
    const posts = (p.latestPosts || []) as any[];
    return {
      handle, name: p.fullName || '', bio: String(p.biography || '').slice(0, 600), category: p.businessCategoryName && p.businessCategoryName !== 'None' ? p.businessCategoryName : '',
      link: p.externalUrl || '', followers: p.followersCount ?? null, picture: p.profilePicUrlHD || p.profilePicUrl || '',
      places: [...new Set(posts.map((x) => x.locationName).filter(Boolean))].slice(0, 6),
      captions: posts.slice(0, 4).map((x) => String(x.caption || '').slice(0, 300)).filter(Boolean),
      latest: posts.map((x) => x.timestamp).filter(Boolean).sort().pop() || '',
    };
  } catch (e) { return { error: String((e as Error).message || e).slice(0, 160) }; }
}
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
async function readPage(url: string) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { url, error: `The page answered ${r.status}` };
    const html = (await r.text()).slice(0, 800000);
    const meta = (re: RegExp) => decode((html.match(re) || [])[1] || '').trim();
    const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).join('\n').slice(0, 4000);
    const socials = [...new Set([...html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:instagram|facebook|tiktok)\.com\/[^"'#?]+)/gi)].map((m) => m[1]))].slice(0, 6);
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 7000);
    return {
      url: r.url || url, title: meta(/<title[^>]*>([^<]*)/i), description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i),
      site_name: meta(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)/i), structured: ld, socials, text,
    };
  } catch (e) { return { url, error: 'The page did not open' }; }
}

// ---- Claude writes down what it sees ----
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['name', 'kind', 'vegan', 'organization', 'online_only', 'street', 'city', 'state', 'zip', 'country', 'phone', 'website', 'instagram', 'facebook', 'tiktok', 'hours', 'about', 'search', 'note'],
  properties: {
    name: { type: 'string', description: 'The business\'s own name, as it writes it. Empty if unknown.' },
    kind: { type: 'string', enum: [...KINDS, ''], description: 'The Directory section that fits best, or empty when it is not clear.' },
    vegan: { type: 'string', enum: ['fully_vegan', 'vegan_options', 'vegan_friendly', 'not_vegan', 'unknown'], description: 'fully_vegan only when it says it is all Vegan or plant-based; vegan_options for a clear Vegan menu or section; vegan_friendly for a few Vegan choices; not_vegan for a store, service or organization that is not Vegan itself; unknown when the sources do not say.' },
    organization: { type: 'boolean', description: 'A rescue, sanctuary, nonprofit or charity.' },
    online_only: { type: 'boolean', description: 'Sells or works online only, with no storefront or venue to visit.' },
    street: { type: 'string' }, city: { type: 'string' }, state: { type: 'string', description: 'Two-letter state for the US, else the region.' },
    zip: { type: 'string' }, country: { type: 'string', description: 'Two-letter country code.' }, phone: { type: 'string' },
    website: { type: 'string', description: 'Their own website (not Instagram, Linktree or a delivery app), full https link.' },
    instagram: { type: 'string', description: '@handle' }, facebook: { type: 'string', description: 'facebook.com/... link' }, tiktok: { type: 'string', description: '@handle' },
    hours: {
      type: 'object', additionalProperties: false, required: DAYS,
      properties: Object.fromEntries(DAYS.map((d) => [d, { type: 'string' }])),
      description: 'Each day\'s opening hours as the sources show them ("11 AM to 8 PM", "Closed"); empty for a day they do not show.',
    },
    about: { type: 'string', description: 'One or two plain sentences, under 250 characters, in our words, from what they say about themselves. Vegan with a capital V.' },
    search: { type: 'string', description: 'What to type into Google Maps to find this exact place: the name and the city and state. Empty for an online-only business with no city.' },
    note: { type: 'string', description: 'One or two sentences for the team: where each fact came from and anything that is unsure or conflicting.' },
  },
};
const SYSTEM = `You help the Vegans Explore team add a business to its Directory of Vegan places, brands and organizations.
You get what the team has: a name and place they typed, screenshots (often of an Instagram profile or post), and what we read from a link.
- Write down only what the sources show. Never guess an address, phone, website or handle; leave a field empty instead.
- An Instagram screenshot shows the handle under or above the name, the bio, a link and sometimes an address or city. Read them exactly.
- The team's typed name and place win over a screenshot when they disagree; say so in the note.
- How Vegan: be strict. A place that says "plant-based" or "100% Vegan" is fully_vegan. A menu with some Vegan dishes is vegan_options. When the sources do not say, unknown.
- Spell Vegan with a capital V.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return json({ error: 'sign_in' }, 401);
  const { data: m } = await db.from('members').select('id, is_superadmin').eq('id', id).maybeSingle();
  if (!m?.is_superadmin) return json({ error: 'admins_only' }, 403);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (body.action !== 'read') return json({ error: 'unknown_action' }, 400);

  const name = clean(body.name, 120), where = clean(body.where, 120);
  let url = clean(body.url, 600);
  const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3)
    .filter((x: any) => /^image\/(jpeg|png|webp)$/.test(x?.type) && typeof x?.data === 'string' && x.data.length < 2_800_000);
  if (!name && !url && !images.length) return json({ error: 'nothing' }, 400);

  const read: string[] = [], pictures: { url: string; from: string }[] = [], parts: string[] = [];
  if (name || where) parts.push(`The team typed: name "${name}", where "${where}".`);
  if (url && !/^https?:\/\//i.test(url) && !/^@/.test(url)) url = 'https://' + url;
  const handle = url ? igHandle(url) : '';
  let site = '';
  if (handle) {
    const ig: any = await readInstagram(handle);
    if (ig.error) read.push('Instagram @' + handle + ': ' + ig.error);
    else {
      read.push('Instagram @' + handle);
      parts.push('Their Instagram profile (@' + handle + '): ' + JSON.stringify({ name: ig.name, bio: ig.bio, category: ig.category, link: ig.link, followers: ig.followers, post_locations: ig.places, latest_post: ig.latest, recent_captions: ig.captions }));
      if (ig.picture) pictures.push({ url: ig.picture, from: 'Their Instagram picture' });
      if (ig.link && !/linktr\.ee|instagram\.com|beacons\.ai/i.test(ig.link)) site = ig.link;
    }
  } else if (url && /^https?:\/\//i.test(url)) site = url;
  if (site) {
    const p: any = await readPage(site);
    if (p.error) read.push(p.url + ': ' + p.error);
    else { read.push(p.url); parts.push('A page we read (' + p.url + '): ' + JSON.stringify(p)); }
  }
  if (images.length) read.push(images.length === 1 ? 'Your screenshot' : `Your ${images.length} screenshots`);

  const apiKey = await secret('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'no_model_key' }, 500);
  const content: any[] = [];
  images.forEach((img: any, i: number) => {
    content.push({ type: 'text', text: `Screenshot ${i + 1}:` });
    content.push({ type: 'image', source: { type: 'base64', media_type: img.type, data: img.data } });
  });
  content.push({ type: 'text', text: (parts.join('\n\n') || 'Only the screenshots.') + '\n\nWrite down this business for the Directory.' });
  try {
    const client = new Anthropic({ apiKey });
    const res: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 4000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM, messages: [{ role: 'user', content }],
    } as any);
    if (res.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
    const found = JSON.parse((res.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join(''));
    if (handle && !found.instagram) found.instagram = '@' + handle;
    return json({ ok: true, found, read, pictures });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
    return json({ error: String((e as Error).message || e).slice(0, 200) }, 502);
  }
});
