// ve-vegan-sourcing-guide (Logan, 2026-11-04): bios for the 134 PETA-list suppliers, from each company's own site, in our words.
// Deploy as ve-once-sourcing-bios (verify_jwt false) with a fresh KEY; run ?step=bios&n=6 until none are left, ?step=status for counts.
// Labels are never changed here. No Google calls. A site that will not open, or is not about the company, is left with no bio and noted.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';
const KEY = '<random 48 hex characters>';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const secrets: Record<string, string | null> = {};
async function secret(k: string) { if (k in secrets) return secrets[k]; const { data } = await db.from('lesaruss_secrets').select('value').eq('key', k).maybeSingle(); const v = (data?.value as string) ?? null; secrets[k] = v && v !== 'pending' ? v : null; return secrets[k]; }
const hostOf = (u: string) => { try { return new URL(u).host.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#8217;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
async function readPage(url: string) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return { url, error: `answered ${r.status}` };
    if (!/html/i.test(r.headers.get('content-type') || 'text/html')) return { url, error: 'not a page' };
    const html = (await r.text()).slice(0, 800000); const base = r.url || url;
    const about = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,80}?)<\/a>/gi)]
      .filter((m) => /about|our[\s-]?story|who[\s-]?we|company/i.test(m[1] + ' ' + m[2].replace(/<[^>]+>/g, '')))
      .map((m) => { try { return new URL(m[1], base).href; } catch { return ''; } }).find((u) => u && hostOf(u) === hostOf(base) && u !== base) || '';
    const meta = (re: RegExp) => decode((html.match(re) || [])[1] || '').trim();
    const text = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 6000);
    return { url: base, about, title: meta(/<title[^>]*>([^<]*)/i), description: meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i), text };
  } catch { return { url, error: 'did not open' }; }
}
const SCHEMA = { type: 'object', additionalProperties: false, required: ['usable', 'reason', 'bio'], properties: {
  usable: { type: 'boolean', description: 'False when the site is not about this company, is parked, or gives too little to describe it.' },
  reason: { type: 'string' }, bio: { type: 'string', description: 'Two sentences, 120 to 260 characters. Empty when not usable.' } } };
const SYSTEM = `You write the short bio for a company in a business-to-business sourcing directory for Vegan food and fashion businesses. The company makes materials (leather alternatives, fur alternatives, textiles and similar) sold to other businesses.
Use only what the company's own site text shows. Two plain sentences, 120 to 260 characters, in your own words (never copy a phrase of eight or more words from the site): what it makes and who it serves. Third person, present tense, no hype words, no prices, no promises. If the site shows it also makes animal-derived products, say plainly that it has non-animal lines too; never call a mixed company Vegan or fully Vegan. Do not say PETA. Spell Vegan with a capital V. No dashes of any kind; use commas or periods.`;
const norm = (s: string) => s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
function copiedRun(bio: string, text: string) { const w = norm(bio).replace(/[^a-z0-9' ]/g, '').split(' ').filter(Boolean); const t = ' ' + norm(text).replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ') + ' '; for (let i = 0; i + 8 <= w.length; i++) if (t.includes(' ' + w.slice(i, i + 8).join(' ') + ' ')) return true; return false; }
async function one(s: any) {
  const home: any = await readPage(s.website);
  if (home.error) return { ok: false, why: `site ${home.error}` };
  let aboutText = ''; if (home.about) { const a: any = await readPage(home.about); if (!a.error) aboutText = a.text.slice(0, 3500); }
  const siteText = `${home.title}\n${home.description}\n${home.text}\n${aboutText}`;
  const key = await secret('ANTHROPIC_API_KEY'); const client = new Anthropic(key ? { apiKey: key } : {});
  let out: any;
  try {
    const msg: any = await client.beta.messages.create({ model: 'claude-opus-5-5', max_tokens: 800, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } }, system: SYSTEM,
      messages: [{ role: 'user', content: 'Company, as JSON:\n' + JSON.stringify({ name: s.name, kinds: s.kinds, website: home.url, site_text: siteText }) }] } as any);
    if (msg.stop_reason === 'refusal') return { ok: false, why: 'model refused' };
    out = JSON.parse((msg.content || []).find((x: any) => x.type === 'text')?.text || '{}');
  } catch (e) { return { ok: false, why: String((e as Error).message || e).slice(0, 120) }; }
  if (!out.usable) return { ok: false, why: String(out.reason || 'not usable').slice(0, 160) };
  const bio = String(out.bio || '').replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/\bvegan\b/g, 'Vegan').replace(/\s+/g, ' ').trim();
  if (bio.length < 100 || bio.length > 280) return { ok: false, why: 'bio length off' };
  if (copiedRun(bio, siteText)) return { ok: false, why: 'bio copies the site' };
  if (s.label !== 'peta_approved' && /fully vegan|100% vegan|entirely vegan/i.test(bio)) return { ok: false, why: 'bio calls a non-star company fully Vegan' };
  await db.from('ve_suppliers').update({ bio, bio_source: home.url, checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', s.id);
  return { ok: true, bio };
}
Deno.serve(async (req) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 });
  const u = new URL(req.url); const step = u.searchParams.get('step');
  if (step === 'bios') {
    const n = Math.min(Math.max(+(u.searchParams.get('n') || 6), 1), 10);
    // Each company is tried once: checked_at null means not tried yet.
    const { data: rows } = await db.from('ve_suppliers').select('id,name,website,kinds,label').eq('source', 'peta-guide-2026-10').is('bio', null).is('checked_at', null).order('name').limit(n);
    const res = await Promise.all((rows || []).map(async (s: any) => {
      const r: any = await one(s);
      if (!r.ok) await db.from('ve_suppliers').update({ checked_at: new Date().toISOString(), bio_source: `no bio: ${r.why}`.slice(0, 200) }).eq('id', s.id);
      return { name: s.name, ok: r.ok, why: r.why };
    }));
    return Response.json({ read: res.length, results: res });
  }
  if (step === 'status') {
    const { data } = await db.from('ve_suppliers').select('bio,checked_at').eq('source', 'peta-guide-2026-10');
    const t = data || []; return Response.json({ total: t.length, with_bio: t.filter((r: any) => r.bio).length, untried: t.filter((r: any) => !r.bio && !r.checked_at).length });
  }
  return Response.json({ error: 'unknown_step' }, { status: 400 });
});
