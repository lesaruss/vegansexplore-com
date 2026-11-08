// ve-giveback: why support them, and where to give, on every nonprofit, rescue and sanctuary listing (Sean, 2026-11-08, playbook
// ve-holiday-guide: "instead of sending people to their page, let's send them to the directory listing, and then on the directory listings,
// have the donation link that's easy to see... at the very minimum, give a good 500 words of why somebody should support this nonprofit").
//
// For one listing it reads the organization's own website (the home page, its about page and its donate page), collects every link that
// looks like a way to give, and Claude writes "Why support <name>": about 400 to 550 words, only from what their own site says, shorter
// when the site says less, never padded or invented. Claude picks the donation link only from the links found on their site.
// Saved on the listing: details.support {text, words, sources, written_at, model}, details.donation_url (never over one the team or the
// owner set), and details.donation_link_code, a tracked /go/ link (ve_links, initiative give-back) so each organization's clicks are counted.
// Every change is a ve_listing_edits row. We never handle money and never call a gift tax-deductible.
//
// POST { action: 'one', slug | listing_id, save?: false }   -> { ok, words, donation_url, ... }
// POST { action: 'batch', slugs: [...] (max 25), wait?: true } -> { ok, started } (or results with wait)
// Callers: a super admin (VE token), the LESARUSS_ADMIN_TOKEN, or the cron's x-cron-secret. verify_jwt is false.
// R (2026-11-08): on the 5.x models thinking counts against max_tokens, so the call gets 16000 and anything but end_turn is an error.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const ORG_CATS = ['Nonprofits', 'Rescues', 'Sanctuaries'];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
async function caller(req: Request): Promise<{ ok: boolean; member: string | null }> {
  const cron = req.headers.get('x-cron-secret');
  if (cron) { const cs = await secret('CRON_SECRET'); return { ok: !!cs && cron === cs, member: null }; }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, member: null };
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (ops && token === ops) return { ok: true, member: null };
  const id = await verifyToken(token);
  if (!id) return { ok: false, member: null };
  const { data: m } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return { ok: !!m?.is_superadmin, member: id };
}

// ---- Reading their site ----
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
// Ways to give: their own donate pages, or the platforms organizations take gifts through.
const GIVE_WORDS = /donat|give|giving|support[\s-]?us|sponsor|contribut|become[\s-]?a[\s-]?(member|supporter|patron)|wish[\s-]?list|amazon\.com\/hz\/wishlist/i;
const GIVE_HOSTS = /(givebutter|donorbox|paypal\.com|paypal\.me|networkforgood|classy\.org|givelively|every\.org|zeffy|kindful|bloomerang|donately|qgiv|flipcause|square\.link|squareup|venmo\.com|patreon|gofundme|charity\.gofundme|stripe\.com|buy\.stripe|givecloud|funraise|neonpay|mightycause|benevity|pledge\.to|charitynavigator)/i;
const SKIP = /\.(jpg|jpeg|png|gif|webp|pdf|svg|mp4)(\?|$)|^mailto:|^tel:|facebook\.com\/sharer|twitter\.com\/intent|wp-login|\/cart\b/i;

type Page = { url: string; error?: string; title?: string; description?: string; text?: string; links?: { url: string; label: string }[] };
async function readPage(url: string, limit = 7000): Promise<Page> {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { url, error: `answered ${r.status}` };
    if (!/html/i.test(r.headers.get('content-type') || 'text/html')) return { url, error: 'not a page' };
    const html = (await r.text()).slice(0, 900000);
    const meta = (re: RegExp) => decode((html.match(re) || [])[1] || '').trim();
    const base = r.url || url;
    const links = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,160}?)<\/a>/gi)].map((m) => {
      let u = ''; try { u = new URL(decode(m[1]), base).href; } catch { /* bad link */ }
      return { url: u, label: decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 80) };
    }).filter((l) => /^https?:\/\//.test(l.url) && !SKIP.test(l.url));
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, limit);
    return {
      url: base, links, text,
      title: meta(/<title[^>]*>([^<]*)/i),
      description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i),
    };
  } catch { return { url, error: 'did not open' }; }
}
const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };
function giveLinks(pages: Page[], siteHost: string) {
  const out = new Map<string, string>();
  for (const p of pages) for (const l of p.links || []) {
    const h = hostOf(l.url);
    const own = h === siteHost;
    if ((own && GIVE_WORDS.test(l.url + ' ' + l.label)) || GIVE_HOSTS.test(l.url)) if (!out.has(l.url)) out.set(l.url, l.label);
  }
  return [...out.entries()].slice(0, 25).map(([url, label]) => ({ url, label }));
}
function aboutLink(p: Page, siteHost: string) {
  return (p.links || []).find((l) => hostOf(l.url) === siteHost && l.url !== p.url && /about|our[\s-]?story|who[\s-]?we|mission|history/i.test(l.url + ' ' + l.label))?.url || '';
}

// ---- Claude writes it ----
const SYSTEM = `You write the "Why support" section on a Vegans Explore Directory page for an animal rescue, a sanctuary or a nonprofit. Readers are deciding whether to give, volunteer or help.
- Use only what the organization's own website says (the pages given). Never invent a number, a name, an animal, a year, a program, a result or a claim. If a fact is not in the sources, leave it out.
- Aim for 400 to 550 words when the sources have that much to say. When they say less, write less (as little as 120 words). Never pad, repeat yourself or fill space with general statements about animals.
- Plain, warm, specific prose in four to six short paragraphs separated by a blank line. No headings, no lists, no quotes you cannot find word for word, no hype words (amazing, incredible, best). Third person, present tense.
- Cover, as far as the sources allow: who they are and where, what they do day to day, the animals or people they help, what a gift or a volunteer's time makes possible (only as they describe it), and the other ways to help they name (adopting, fostering, volunteering, sponsoring, a wish list).
- Never say a gift is tax-deductible or name a tax status, even if the site does. Never call the organization Vegan unless the site says it is. Spell Vegan with a capital V. No dashes of any kind (no em or en dash, no hyphen used as a dash); use commas or periods.
- donation_url: pick the one link from the list given that is their main way to give money (their donate page, or the giving platform they use). If none of the links is clearly a way to give money, return an empty string. Never make up a link.
- If the website is not this organization's (a parked domain, a different group, a page that does not open) set usable to false.`;
function schemaFor(links: string[]) {
  return {
    type: 'object', additionalProperties: false, required: ['usable', 'story', 'donation_url', 'note'],
    properties: {
      usable: { type: 'boolean', description: 'False when the sources are not this organization or say nothing usable.' },
      story: { type: 'string', description: 'The section, paragraphs separated by a blank line.' },
      donation_url: { type: 'string', enum: ['', ...links], description: 'Their main way to give money, from the list, or empty.' },
      note: { type: 'string', description: 'One short sentence for the team: which pages the facts came from and anything doubtful.' },
    },
  };
}

function codeFor(slug: string) {
  return ('give-' + slug).slice(0, 48).replace(/-+$/, '');
}
async function trackedLink(l: any, url: string, member: string | null) {
  const code = codeFor(l.slug);
  const { data: had } = await db.from('ve_links').select('id, destination').eq('code', code).maybeSingle();
  if (had) {
    if (had.destination !== url) await db.from('ve_links').update({ destination: url, active: true }).eq('id', had.id);
  } else {
    const { error } = await db.from('ve_links').insert({ code, label: ('Donate: ' + l.name).slice(0, 120), destination: url, initiative_slug: 'give-back',
      tags: ['give-back', l.slug.slice(0, 60)], channel: 'other', created_by: member });
    if (error) return '';
  }
  return code;
}

async function runOne(id: string, save: boolean, member: string | null) {
  const { data: l } = await db.from('listings').select('id, slug, name, category, website, address_city, address_state, description, details, status')
    .eq('id', id).maybeSingle();
  if (!l || l.status !== 'approved') return { ok: false, why: 'not_found' };
  if (!ORG_CATS.includes(l.category)) return { ok: false, why: 'not_an_organization' };
  if (!l.website || !/^https?:\/\//i.test(l.website)) return { ok: false, slug: l.slug, why: 'no_website' };
  const siteHost = hostOf(l.website);
  if (/facebook\.com|instagram\.com|linkin\.bio|linktr\.ee|tiktok\.com/i.test(siteHost)) return { ok: false, slug: l.slug, why: 'social_only' };

  const home = await readPage(l.website);
  if (home.error) return { ok: false, slug: l.slug, why: 'site_' + home.error.replace(/\s+/g, '_') };
  const realHost = hostOf(home.url) || siteHost;
  const pages: Page[] = [home];
  const ab = aboutLink(home, realHost);
  if (ab) { const a = await readPage(ab, 6000); if (!a.error) pages.push(a); }
  let give = giveLinks(pages, realHost);
  const ownGive = give.find((g) => hostOf(g.url) === realHost && /donat|give|support/i.test(g.url));
  if (ownGive) { const d = await readPage(ownGive.url, 4000); if (!d.error) { pages.push(d); give = giveLinks(pages, realHost); } }

  const sources = {
    organization: { name: l.name, kind: l.category, where: [l.address_city, l.address_state].filter(Boolean).join(', ') },
    pages: pages.map((p) => ({ url: p.url, title: p.title, description: p.description, text: p.text })),
    giving_links: give,
  };
  const key = await secret('ANTHROPIC_API_KEY');
  const client = new Anthropic(key ? { apiKey: key } : {});
  let out: any;
  try {
    const msg: any = await client.beta.messages.create({
      model: MODEL, max_tokens: 16000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: schemaFor(give.map((g) => g.url)) } },
      system: SYSTEM,
      messages: [{ role: 'user', content: 'The sources, as JSON:\n' + JSON.stringify(sources) }],
    } as any);
    if (msg.stop_reason !== 'end_turn') return { ok: false, slug: l.slug, why: msg.stop_reason === 'max_tokens' ? 'cut_off' : msg.stop_reason === 'refusal' ? 'refused' : 'stopped_' + msg.stop_reason };
    out = JSON.parse((msg.content || []).find((c: any) => c.type === 'text')?.text || '{}');
  } catch (e) {
    return { ok: false, slug: l.slug, why: String((e as Error).message || e).slice(0, 160) };
  }
  if (!out.usable) return { ok: false, slug: l.slug, why: 'not_usable', note: out.note };
  const story = String(out.story || '').replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/\bvegan\b/g, 'Vegan')
    .split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
  const words = story.split(/\s+/).filter(Boolean).length;
  if (words < 80) return { ok: false, slug: l.slug, why: 'too_short', words, note: out.note };
  const donation = give.some((g) => g.url === out.donation_url) ? out.donation_url : '';
  const result: any = { ok: true, slug: l.slug, words, donation_url: donation, note: out.note, sources: pages.map((p) => p.url) };
  if (!save) return { ...result, story };

  const det = { ...(l.details || {}) };
  const oldSupport = det.support || null, oldDonate = det.donation_url || null;
  det.support = { text: story, words, sources: pages.map((p) => p.url), written_at: new Date().toISOString(), model: MODEL, note: String(out.note || '').slice(0, 300) };
  // A donation link the team or the owner set is never replaced; one we found before is updated.
  const mayReplace = !oldDonate || det.donation_url_source === 've-giveback';
  if (donation && mayReplace) { det.donation_url = donation; det.donation_url_source = 've-giveback'; }
  const finalDonate = det.donation_url || '';
  if (finalDonate) { const code = await trackedLink(l, finalDonate, member); if (code) det.donation_link_code = code; }
  const { error } = await db.from('listings').update({ details: det }).eq('id', l.id);
  if (error) return { ok: false, slug: l.slug, why: error.message };
  const meta = { playbook: 've-holiday-guide', where: 've-giveback' };
  const edits: any[] = [{ listing_id: l.id, member_id: member, field: 'support', old_value: oldSupport, new_value: det.support, meta }];
  if (det.donation_url !== oldDonate) edits.push({ listing_id: l.id, member_id: member, field: 'donation_url', old_value: oldDonate, new_value: det.donation_url, meta });
  await db.from('ve_listing_edits').insert(edits);
  return { ...result, donation_url: finalDonate, link_code: det.donation_link_code || null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const who = await caller(req);
  if (!who.ok) return json({ error: 'not_allowed' }, 403);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const idOf = async (slug: string) => (await db.from('listings').select('id').eq('slug', slug).eq('status', 'approved').maybeSingle()).data?.id || '';
  if (body.action === 'one') {
    const id = String(body.listing_id || '') || (body.slug ? await idOf(String(body.slug)) : '');
    if (!id) return json({ error: 'not_found' }, 404);
    return json(await runOne(id, body.save !== false, who.member));
  }
  if (body.action === 'batch') {
    const slugs = (Array.isArray(body.slugs) ? body.slugs : []).map(String).slice(0, 25);
    if (!slugs.length) return json({ error: 'slugs_needed' }, 400);
    const work = (async () => {
      const out: any[] = [];
      for (const s of slugs) {
        const id = await idOf(s);
        let r: any;
        try { r = id ? await runOne(id, body.save !== false, who.member) : { ok: false, slug: s, why: 'not_found' }; }
        catch (e) { r = { ok: false, slug: s, why: String((e as Error).message || e).slice(0, 160) }; }
        out.push(r);
        if (!r.ok && id) {
          const { data: cur } = await db.from('listings').select('details').eq('id', id).maybeSingle();
          await db.from('listings').update({ details: { ...(cur?.details || {}), support_try: { at: new Date().toISOString(), why: r.why } } }).eq('id', id);
        }
      }
      return out;
    })();
    if (body.wait) return json({ ok: true, results: await work });
    (EdgeRuntime as any).waitUntil(work);
    return json({ ok: true, started: slugs.length });
  }
  return json({ error: 'unknown_action' }, 400);
});
