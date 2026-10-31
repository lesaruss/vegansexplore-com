// ve-brand-kit: the Suggest button in a Front of House brand kit (canon canon-ve-front-of-house v5; Sean, 2026-10-31: "if they don't
// know what to type for the description, they can click suggested button, and then our AI will come up with something").
//
// POST { action: 'suggest', kind: 'menu_item' | 'story' | 'voice', business: {name, short, city, cuisines, vegan}, voice?, item?, answers?, visitor? }
//   menu_item -> { copy }                     one menu description in their voice, from their own words and ingredients only
//   story     -> { tagline, short, long[] }   their story from their answers (and old About text), nothing invented
//   voice     -> { personality[3], sounds_like, never[], use[], avoid[], samples {hero, instagram, google_reply, closed} }
// Anyone may ask (the sample at /business/sample/brand is public): 20 a day per visitor and address, 200 a day for a signed-in
// member (the VE app token, HMAC-checked like ve-auth). Every suggestion is logged in ve_brand_kit_suggestions. Nothing else is saved:
// the owner edits what comes back and saves it in the kit.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
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
