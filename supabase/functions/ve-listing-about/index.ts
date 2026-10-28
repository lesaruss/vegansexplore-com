// ve-listing-about: the About line and the kind of food on every open food place (Sean, 2026-10-28: "I clicked a few randomly
// and saw that there was no information inside of it outside of their website... we need to make sure... that when people click
// in it, that they're actually getting something"). The Background writer's listing_essentials pass fell behind (850 waiting),
// so this does the same job on the server, many an hour.
//
// For each listing it reads the business's own home page and its about page, asks Google for the place's own summary and what it
// serves, and Claude (structured output) writes one or two plain sentences (120 to 250 characters) and one to four cuisines from
// our list. Only what the sources show; when the site cannot be read, the line is built from what Google and our listing know
// (the kind of place, how Vegan it is, where it is), never invented. Saved through ve_listing_essentials_save, which fills only
// empty fields, never over an owner's own words, each change a ve_listing_edits row.
//
// POST { action: 'one', listing_id | slug, save?: false }   -> { ok, about, cuisines, saved }
// POST { action: 'sweep', limit?: 1..12 }                   -> { ok, started }  (queued listings, restaurant-search ones first)
// Callers: a super admin (VE token), the LESARUSS_ADMIN_TOKEN, or the cron's x-cron-secret. verify_jwt is false.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// The cuisine list (CUISINES in ve-listing-admin.js, ve-region-directory.js, ve-claims and the table check; keep in step).
const CUISINES = ['american', 'soul', 'caribbean', 'latin', 'mexican', 'cuban', 'italian', 'mediterranean', 'middle_eastern', 'ethiopian', 'african',
  'indian', 'thai', 'chinese', 'japanese', 'korean', 'vietnamese', 'asian', 'burgers', 'bowls', 'raw', 'brunch', 'desserts', 'global'];
const VEGAN_WORDS: Record<string, string> = { fully_vegan: '100% Vegan', vegan_options: 'has Vegan options', vegan_friendly: 'Vegan friendly' };

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
const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  secrets[key] = v && v !== 'pending' ? v : null;
  return secrets[key];
}
async function allowed(req: Request): Promise<boolean> {
  const cron = req.headers.get('x-cron-secret');
  if (cron) { const cs = await secret('CRON_SECRET'); return !!cs && cron === cs; }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (ops && token === ops) return true;
  const id = await verifyToken(token);
  if (!id) return false;
  const { data: m } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return !!m?.is_superadmin;
}

// ---- Reading their site ----
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
async function readPage(url: string) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { url, error: `answered ${r.status}` };
    if (!/html/i.test(r.headers.get('content-type') || 'text/html')) return { url, error: 'not a page' };
    const html = (await r.text()).slice(0, 800000);
    const meta = (re: RegExp) => decode((html.match(re) || [])[1] || '').trim();
    const base = r.url || url;
    const about = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi)]
      .filter((m) => /about|our[\s-]?story|who[\s-]?we|history/i.test(m[1] + ' ' + m[2].replace(/<[^>]+>/g, '')))
      .map((m) => { try { return new URL(m[1], base).href; } catch { return ''; } })
      .find((u) => u && new URL(u).host === new URL(base).host && u !== base) || '';
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 6000);
    return {
      url: base, about,
      title: meta(/<title[^>]*>([^<]*)/i),
      description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i),
      text,
    };
  } catch { return { url, error: 'did not open' }; }
}
// The place as Google describes it: its own summary and what it serves.
async function googlePlace(placeId: string) {
  const key = await secret('GOOGLE_PLACES_API_KEY');
  if (!key || !placeId) return null;
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'displayName,editorialSummary,primaryTypeDisplayName,types,servesVegetarianFood,servesBreakfast,servesBrunch,servesLunch,servesDinner,servesDessert,servesCoffee,servesBeer,servesWine,takeout,delivery,dineIn,outdoorSeating',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return null;
    const p = await r.json();
    return {
      name: p.displayName?.text || '', summary: p.editorialSummary?.text || '', kind: p.primaryTypeDisplayName?.text || '', types: p.types || [],
      serves: Object.entries(p).filter(([k, v]) => /^(serves|takeout|delivery|dineIn|outdoorSeating)/.test(k) && v === true).map(([k]) => k),
    };
  } catch { return null; }
}

// ---- Claude writes the line ----
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['about', 'cuisines', 'from_site', 'note'],
  properties: {
    about: { type: 'string', description: 'One or two plain sentences, 130 to 240 characters, about this place for someone deciding whether to go.' },
    cuisines: { type: 'array', items: { type: 'string', enum: CUISINES }, description: 'One to four kinds of food it serves. global only for a place that is not one thing.' },
    from_site: { type: 'boolean', description: 'True when the about draws on their own website; false when it was built from Google and the listing alone.' },
    note: { type: 'string', description: 'One short sentence for the team: where the facts came from.' },
  },
};
const SYSTEM = `You write the short About line on a Vegans Explore Directory listing for a restaurant, cafe, bakery, food truck or caterer.
- Use only what the sources show: the business's own website first, then Google's summary and what it serves, then our listing (its kind, how Vegan it is, its city). Never invent a dish, a founder, a year, an award or a claim.
- One or two plain sentences, 130 to 240 characters, warm and specific: what kind of food, what it is known for, where it is. Third person, present tense, no hype words (best, amazing, delicious), no prices, no hours, no phone.
- How Vegan it is comes from our listing, never upgrade it: "100% Vegan" places are all Vegan; "has Vegan options" places are not all Vegan, so say it has Vegan options or a Vegan menu, never call it a Vegan restaurant.
- Spell Vegan with a capital V. No dashes of any kind (no em or en dash, no hyphen used as a dash); use commas or periods.
- Cuisines: one to four from the list that the sources support. bowls for poke and grain bowls, burgers for burger places, brunch for a breakfast or brunch place, desserts for a bakery, ice cream or sweets shop, american for comfort food and diners, raw for raw food.
- If the website is about something else (a parked domain, a different business, a group's home page with many places), ignore it and say so in the note.`;

async function runOne(id: string, save = true) {
  const { data: l } = await db.from('listings')
    .select('id, slug, name, category, vegan_status, website, address_city, address_state, address_country, description, cuisines, google_place_id, details')
    .eq('id', id).eq('status', 'approved').maybeSingle();
  if (!l) return { ok: false, why: 'not_found' };
  const read: any[] = [];
  let site: any = null;
  if (l.website && /^https?:\/\//i.test(l.website)) {
    site = await readPage(l.website);
    read.push({ url: site.url, error: site.error });
    if (!site.error && site.about) { const a: any = await readPage(site.about); read.push({ url: a.url, error: a.error }); if (!a.error) site.about_page = { url: a.url, text: a.text.slice(0, 3500) }; }
  }
  const g = await googlePlace(l.google_place_id || l.details?.restaurant_search?.place_id || '');
  const where = [l.address_city, l.address_state].filter(Boolean).join(', ');
  const sources = {
    listing: { name: l.name, kind: l.category, how_vegan: VEGAN_WORDS[l.vegan_status] || 'not set', where, country: l.address_country || '' },
    google: g,
    website: site && !site.error ? { url: site.url, title: site.title, description: site.description, text: site.text, about_page: site.about_page || null } : (site ? { error: site.error } : null),
  };
  const key = await secret('ANTHROPIC_API_KEY');
  const client = new Anthropic(key ? { apiKey: key } : {});
  let out: any;
  try {
    const msg: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 1500, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: 'The sources, as JSON:\n' + JSON.stringify(sources) }],
    } as any);
    if (msg.stop_reason === 'refusal') return { ok: false, why: 'refused' };
    const t = (msg.content || []).find((c: any) => c.type === 'text')?.text || '{}';
    out = JSON.parse(t);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return { ok: false, why: 'rate_limited' };
    return { ok: false, why: String((e as Error).message || e).slice(0, 160) };
  }
  // The save's own rules: no dashes, Vegan with a capital V, 120 to 250 characters.
  let about = String(out.about || '').replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/\bvegan\b/g, 'Vegan').replace(/\s+/g, ' ').trim();
  if (about.length > 250) about = about.slice(0, 250).replace(/[^.]*$/, '').trim() || about.slice(0, 247) + '...';
  const cuisines = [...new Set((out.cuisines || []).filter((c: string) => CUISINES.includes(c)))].slice(0, 4);
  const source = site && !site.error && out.from_site ? site.url : `https://vegansexplore.com/directory/${l.slug}`;
  const note = `Reader: ${String(out.note || '').slice(0, 200)}`;
  if (!save) return { ok: true, about, cuisines, source, note, read, google: !!g };
  const { data: r, error } = await db.rpc('ve_listing_essentials_save', { p_listing: id, p_about: about, p_cuisines: cuisines.length ? cuisines : null, p_source_url: source, p_note: note });
  if (error) {
    await db.from('ve_listing_essentials').update({ write_status: 'failed', note: ('Reader: ' + error.message).slice(0, 300) }).eq('listing_id', id);
    return { ok: false, why: error.message };
  }
  return { ok: true, about, cuisines, saved: r };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  if (!(await allowed(req))) return json({ error: 'not_allowed' }, 403);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  if (body.action === 'one') {
    let id = String(body.listing_id || '');
    if (!id && body.slug) { const { data } = await db.from('listings').select('id').eq('slug', String(body.slug)).eq('status', 'approved').maybeSingle(); id = data?.id || ''; }
    if (!id) return json({ error: 'not_found' }, 404);
    return json(await runOne(id, body.save !== false));
  }
  if (body.action === 'sweep') {
    const limit = Math.min(Math.max(+body.limit || 6, 1), 12);
    const { data: due } = await db.rpc('ve_listing_about_due', { p_limit: limit });
    const ids = ((due || []) as any[]).map((r) => r.listing_id);
    // Mark them first so the Background writer and a second run leave them alone.
    if (ids.length) await db.from('ve_listing_essentials').update({ write_status: 'writing', write_marked_at: new Date().toISOString() }).in('listing_id', ids);
    const work = (async () => {
      const out = [];
      for (const id of ids) {
        try { out.push(await runOne(id, true)); }
        catch (e) { await db.from('ve_listing_essentials').update({ write_status: 'failed', note: ('Reader: ' + String((e as Error).message || e)).slice(0, 300) }).eq('listing_id', id); }
      }
      return out;
    })();
    if (body.wait) return json({ ok: true, results: await work });
    (EdgeRuntime as any).waitUntil(work);
    return json({ ok: true, started: ids.length });
  }
  return json({ error: 'unknown_action' }, 400);
});
