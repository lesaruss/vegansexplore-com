// ve-vegan-sourcing-guide (Logan, 2026-11-04): one-time crawl of food, drink, ingredient, packaging and co-packer suppliers into ve_suppliers.
// Deploy as ve-once-sourcing-crawl (verify_jwt false) with a fresh KEY kept in the session scratchpad; run:
//   ?step=search            Google text searches under the approval once:vegan-sourcing-crawl-2 (100 searches ceiling, no details), saves candidates
//   ?step=read&n=6          reads each new candidate's own site, Claude decides and writes the bio, the code checks the evidence
//   ?step=status            counts
// Labels: peta_approved is never set here (it is PETA's star, from its list). fully_vegan only when the company's own words say the whole
// company or line is Vegan (checked by pattern against a quote that must really be on the page); offers_options when its site shows
// Vegan lines; otherwise the company is rejected with why. Bios are our words: no dashes, Vegan with a capital V, no long run copied from the site.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const KEY = '<random 48 hex characters>';
const JOB = 'once:vegan-sourcing-crawl-2';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const MODEL = 'claude-opus-5-5';
const DOMAINS = ['food_drink', 'ingredients', 'packaging', 'co_packing'];

const QUERIES: [string, string][] = [
  ['vegan cheese wholesale', 'food_drink'], ['vegan butter producer', 'food_drink'], ['plant-based yogurt manufacturer', 'food_drink'], ['fresh vegan pasta wholesale', 'food_drink'],
  ['dairy-free frozen dessert manufacturer', 'food_drink'], ['oat milk producer', 'food_drink'], ['plant-based burger patty manufacturer', 'food_drink'], ['tempeh producer', 'food_drink'],
  ['tofu manufacturer wholesale', 'food_drink'], ['seitan producer', 'food_drink'], ['vegan baked goods distributor', 'food_drink'], ['plant-based sauces and dressings manufacturer', 'food_drink'],
  ['vegan chocolate wholesale', 'food_drink'], ['plant-based jerky manufacturer', 'food_drink'], ['plant-based seafood alternative manufacturer', 'food_drink'], ['plant-based creamer manufacturer', 'food_drink'],
  ['vegan sausage manufacturer', 'food_drink'], ['vegan frozen meals manufacturer', 'food_drink'],
  ['pea protein supplier', 'ingredients'], ['fava bean protein ingredient supplier', 'ingredients'], ['oat ingredient supplier', 'ingredients'], ['cashew wholesale supplier', 'ingredients'],
  ['plant-based emulsifier lecithin supplier', 'ingredients'], ['jackfruit bulk supplier', 'ingredients'], ['coconut milk wholesale supplier', 'ingredients'], ['vegan sweetener syrup bulk supplier', 'ingredients'],
  ['nut butter bulk supplier', 'ingredients'], ['mycoprotein mushroom protein ingredient', 'ingredients'], ['plant-based egg replacer ingredient', 'ingredients'], ['vegan seasoning spice blend wholesale', 'ingredients'],
  ['seaweed ingredient supplier', 'ingredients'],
  ['sugarcane bagasse packaging manufacturer', 'packaging'], ['compostable bags and liners wholesale', 'packaging'], ['molded fiber packaging manufacturer', 'packaging'],
  ['bamboo disposable tableware wholesale', 'packaging'], ['glass jars and bottles wholesale for food', 'packaging'], ['reusable foodservice packaging supplier', 'packaging'],
  ['bakery co-manufacturer plant-based', 'co_packing'], ['sauce co-packer vegan', 'co_packing'], ['frozen food co-packer plant-based', 'co_packing'], ['plant-based meat co-manufacturer', 'co_packing'],
  ['cold-pressed juice contract bottling', 'co_packing'], ['dairy-free ice cream co-packer', 'co_packing'], ['vegan snack bar contract manufacturer', 'co_packing'], ['hot fill beverage co-packer', 'co_packing'],
  ['vegan private label food manufacturer', 'co_packing'],
];
const SKIP_HOSTS = /(^|\.)(amazon|ebay|etsy|walmart|target|alibaba|facebook|instagram|yelp|linkedin|youtube|tiktok|google|wikipedia|doordash|ubereats|grubhub)\./i;
const SKIP_TYPES = new Set(['restaurant', 'cafe', 'bar', 'coffee_shop', 'meal_takeaway', 'meal_delivery', 'fast_food_restaurant', 'vegan_restaurant', 'vegetarian_restaurant', 'supermarket', 'grocery_store', 'convenience_store', 'food_court']);

const secrets: Record<string, string | null> = {};
async function secret(k: string) { if (k in secrets) return secrets[k]; const { data } = await db.from('lesaruss_secrets').select('value').eq('key', k).maybeSingle(); const v = (data?.value as string) ?? null; secrets[k] = v && v !== 'pending' ? v : null; return secrets[k]; }
const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };

async function search() {
  const gkey = await secret('GOOGLE_PLACES_API_KEY'); if (!gkey) return { error: 'no_google_key' };
  const { data: have } = await db.from('ve_suppliers').select('website');
  const known = new Set((have || []).map((r: any) => hostOf(r.website || '')).filter(Boolean));
  const { data: seen } = await db.from('ve_supplier_candidates').select('host'); for (const r of seen || []) if (r.host) known.add(r.host);
  let searches = 0, added = 0, dup = 0, skipped = 0, stopped = '';
  outer: for (const [q, domain] of QUERIES) {
    let token = '';
    for (let page = 0; page < 2; page++) {
      const { data: room } = await db.rpc('ve_google_once_room', { p_job: JOB, p_kind: 'search' });
      if (Number(room ?? 0) < 1) { stopped = 'once_room_empty'; break outer; }
      const body: any = { textQuery: q, pageSize: 20 }; if (token) body.pageToken = token;
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': gkey, 'X-Goog-FieldMask': 'places.id,places.displayName,places.websiteUri,places.formattedAddress,places.types,places.primaryType,nextPageToken' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
      });
      await db.rpc('ve_google_count', { p_kind: 'search', p_job: JOB, p_n: 1 }); searches++;
      if (!r.ok) { stopped = `google_${r.status}`; break outer; }
      const j = await r.json();
      for (const p of j.places || []) {
        const web = p.websiteUri || ''; const host = hostOf(web);
        if (!web || !host || SKIP_HOSTS.test(host + '.') || known.has(host) || SKIP_TYPES.has(p.primaryType)) { skipped++; continue; }
        const { error } = await db.from('ve_supplier_candidates').insert({ place_id: p.id, query: q, domain_guess: domain, name: p.displayName?.text || '', website: web, host, address: p.formattedAddress || '', types: p.types || [] });
        if (error) dup++; else { added++; known.add(host); }
      }
      token = j.nextPageToken || ''; if (!token) break;
    }
  }
  if (!stopped) await db.rpc('ve_google_close', { p_job: JOB, p_status: 'done' });
  return { searches, added, dup, skipped, stopped };
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
async function readPage(url: string) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { url, error: `answered ${r.status}` };
    if (!/html/i.test(r.headers.get('content-type') || 'text/html')) return { url, error: 'not a page' };
    const html = (await r.text()).slice(0, 800000); const base = r.url || url;
    const about = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi)]
      .filter((m) => /about|our[\s-]?story|who[\s-]?we|products|our[\s-]?range/i.test(m[1] + ' ' + m[2].replace(/<[^>]+>/g, '')))
      .map((m) => { try { return new URL(m[1], base).href; } catch { return ''; } }).find((u) => u && hostOf(u) === hostOf(base) && u !== base) || '';
    const meta = (re: RegExp) => decode((html.match(re) || [])[1] || '').trim();
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 6000);
    return { url: base, about, title: meta(/<title[^>]*>([^<]*)/i), description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i), text };
  } catch { return { url, error: 'did not open' }; }
}

const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['decision', 'reason', 'domain', 'kinds', 'label', 'evidence_quote', 'bio', 'country'],
  properties: {
    decision: { type: 'string', enum: ['add', 'reject'] },
    reason: { type: 'string', description: 'One short sentence: why added, or why rejected.' },
    domain: { type: 'string', enum: DOMAINS },
    kinds: { type: 'array', items: { type: 'string' }, description: 'Up to five short lower-case product kinds, e.g. cheese, oat milk, compostable cups.' },
    label: { type: 'string', enum: ['fully_vegan', 'offers_options'] },
    evidence_quote: { type: 'string', description: 'A short quote, copied exactly from the site text given, that shows the Vegan claim. Empty when rejecting.' },
    bio: { type: 'string', description: 'Two sentences, 120 to 260 characters, in our own words. Empty when rejecting.' },
    country: { type: 'string', description: 'Two letter country code of the company, or empty.' },
  },
};
const SYSTEM = `You help build a business-to-business sourcing directory for Vegan food businesses. For one company, decide whether it belongs and write its listing.
BELONGS: a company that makes or sells food, drink, ingredients, packaging or contract manufacturing (co-packing) to other businesses, and whose own site shows Vegan or plant-based products. Domains: food_drink (finished food and drinks sold wholesale), ingredients, packaging, co_packing.
REJECT: restaurants, cafes, shops selling to shoppers only, brokers with no products, a site that is not about this company, a company with no Vegan or plant-based product on its own site, a site that gives too little to judge.
LABELS, honest: fully_vegan only when the site itself says the company or its whole line is Vegan or 100% plant-based. If it also sells animal products or the site only has some Vegan lines, the label is offers_options. When unsure, offers_options. Never fully_vegan for a mixed-line company.
evidence_quote must be copied exactly, character for character, from the site text provided, and must show the Vegan or plant-based claim. If you cannot quote one, reject.
BIO: two plain sentences, 120 to 260 characters, in your own words (never copy a phrase of eight or more words from the site), saying what the company makes and who it serves. Third person, present tense, no hype words, no prices, no promises about sales. Spell Vegan with a capital V. No dashes of any kind; use commas or periods.`;

const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const WHOLE = /\ball[- ]vegan\b|(100\s?%|entirely|completely|exclusively|all (of )?(our|its|their)|only)[^.]{0,60}(vegan|plant[- ]based)|(we are|is|are) (a |an )?(fully |100\s?%\s?)?vegan|vegan[- ](owned|company|brand|manufacturer|bakery|creamery|kitchen)|certified vegan (company|facility)/i;
const ANYVEG = /vegan|plant[- ]based|dairy[- ]free/i;
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
function copiedRun(bio: string, text: string) { const w = norm(bio).replace(/[^a-z0-9' ]/g, '').split(' ').filter(Boolean); const t = ' ' + norm(text).replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ') + ' '; for (let i = 0; i + 8 <= w.length; i++) if (t.includes(' ' + w.slice(i, i + 8).join(' ') + ' ')) return true; return false; }

async function readAny(url: string) {
  let u: URL; try { u = new URL(url); } catch { return { url, error: 'bad address' }; }
  const hosts = [u.host, u.host.startsWith('www.') ? u.host.slice(4) : 'www.' + u.host]; let last: any = null;
  for (const proto of ['https:', 'http:']) for (const h of hosts) { const r: any = await readPage(`${proto}//${h}${u.pathname}${u.search}`); if (!r.error && r.text && r.text.length > 80) return r; last = last && !last.error ? last : r; }
  return last;
}
async function judge(c: any) {
  const home: any = await readAny(c.website);
  if (home.error) return { status: 'failed', reason: `site ${home.error}` };
  let aboutText = '';
  if (home.about) { const a: any = await readPage(home.about); if (!a.error) aboutText = a.text.slice(0, 3500); }
  const siteText = `${home.title}\n${home.description}\n${home.text}\n${aboutText}`;
  const key = await secret('ANTHROPIC_API_KEY');
  const client = new Anthropic(key ? { apiKey: key } : {});
  let out: any;
  try {
    const msg: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 1500, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } }, system: SYSTEM,
      messages: [{ role: 'user', content: 'Company, as JSON:\n' + JSON.stringify({ name: c.name, found_by_search: c.query, domain_guess: c.domain_guess, address: c.address, google_types: c.types, website: home.url, site_text: siteText }) }],
    } as any);
    if (msg.stop_reason === 'refusal') return { status: 'failed', reason: 'model refused' };
    out = JSON.parse((msg.content || []).find((x: any) => x.type === 'text')?.text || '{}');
  } catch (e) { return { status: 'failed', reason: String((e as Error).message || e).slice(0, 160) }; }
  if (out.decision !== 'add') return { status: 'rejected', reason: String(out.reason || 'not a fit').slice(0, 200) };
  const quote = String(out.evidence_quote || '').trim();
  if (!quote || !norm(siteText).includes(norm(quote))) return { status: 'rejected', reason: 'no verifiable quote on the site' };
  if (!ANYVEG.test(quote)) return { status: 'rejected', reason: 'quote does not show a Vegan or plant-based claim' };
  let label = out.label === 'fully_vegan' && WHOLE.test(quote) ? 'fully_vegan' : 'offers_options';
  let bio = String(out.bio || '').replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/\bvegan\b/g, 'Vegan').replace(/\s+/g, ' ').trim();
  if (bio.length < 100 || bio.length > 280) return { status: 'rejected', reason: 'bio length off' };
  if (copiedRun(bio, siteText)) return { status: 'rejected', reason: 'bio copies the site' };
  const kinds = (out.kinds || []).map((k: string) => String(k).toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 5);
  let slug = slugify(c.name) || slugify(c.host); const { data: ex } = await db.from('ve_suppliers').select('id').eq('slug', slug).maybeSingle(); if (ex) slug = `${slug}-${slugify(c.host).slice(0, 12)}`;
  const { data: row, error } = await db.from('ve_suppliers').insert({
    slug, name: c.name, website: home.url, domain: out.domain, kinds, label, bio, bio_source: home.url, evidence: quote.slice(0, 400),
    country: String(out.country || '').toUpperCase().slice(0, 2) || null, google_place_id: c.place_id, status: 'active', source: 'google-crawl-2-2026-11', checked_at: new Date().toISOString(),
  }).select('id').single();
  if (error) return { status: 'failed', reason: error.message.slice(0, 160) };
  return { status: 'added', reason: `${out.domain} ${label}: ${String(out.reason || '').slice(0, 120)}`, supplier_id: row.id };
}

Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 });
  const u = new URL(req.url); const step = u.searchParams.get('step');
  if (step === 'search') return Response.json(await search());
  if (step === 'read') {
    const n = Math.min(Math.max(+(u.searchParams.get('n') || 6), 1), 10);
    const { data: cs } = await db.from('ve_supplier_candidates').select('*').eq('status', 'new').order('created_at').limit(n);
    const res = await Promise.all((cs || []).map(async (c: any) => {
      const r: any = await judge(c);
      await db.from('ve_supplier_candidates').update({ status: r.status, reason: r.reason, supplier_id: r.supplier_id || null, read_at: new Date().toISOString() }).eq('id', c.id);
      return { name: c.name, ...r };
    }));
    return Response.json({ read: res.length, results: res });
  }
  if (step === 'status') {
    const { data } = await db.from('ve_supplier_candidates').select('status'); const c: Record<string, number> = {};
    for (const r of data || []) c[r.status] = (c[r.status] || 0) + 1; return Response.json(c);
  }
  return Response.json({ error: 'unknown_step' }, { status: 400 });
});
