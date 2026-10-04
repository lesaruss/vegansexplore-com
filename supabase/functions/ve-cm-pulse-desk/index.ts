// ve-cm-pulse-desk: the Community Manager's Pulse assistant (Sean, 2026-09-26:
// "the community managers interface with one of our agents... anytime they have
// a pulse, any idea, they can speak directly to this agent, and the agent now
// has content to process... the community manager would just be the one to look
// things over and make adjustments. They don't have to touch a line of code,
// it's all conversations.")
//
// The CM talks (typed, or voice through ve-auth transcribe_audio). Claude asks
// follow-ups until it has the facts, then drafts a local news story. Drafts land
// in ve_community_news as 'pending' for the CM's city; the CM edits and publishes
// ('approved'), which puts it on their city's community page (hub-news.js).
//
// POST { action: 'chat', messages: [{role, content}], draft_id?, city? }   Authorization: Bearer <ve_token>
// POST { action: 'drafts', city? }
// POST { action: 'save', id, headline, summary, body, url? }
// POST { action: 'publish', id, headline?, summary?, body?, url? }
// POST { action: 'discard', id }
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5';

const CITY_NAMES: Record<string, string> = {
  'south-florida': 'South Florida', 'orlando-north-central-florida': 'Orlando and North Central Florida',
  'central-florida': 'Central Florida', 'philadelphia': 'Philadelphia', 'new-york': 'New York', 'los-angeles': 'Los Angeles',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

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
  } catch { return null; }
}

const SYSTEM = (city: string, cmName: string) => `You are the Pulse desk for Vegans Explore, working with ${cmName}, the Community Manager for ${city}. Community Managers are the organization's eyes and ears: they tell you what is happening in their city's Vegan community (openings, closings, a Vegan spot starting to serve animal products, events, wins, the conversations and controversies people are talking about), and you turn it into short local news stories for the ${city} community page. They review and publish every story themselves.

How to work:
- Talk like a friendly, efficient newsroom editor. Keep replies short: a sentence or two, plus at most two questions.
- Before drafting, make sure you have the basics: what happened, who or which place, where in ${city}, when, and how they know (saw it, the business announced it, a member told them, a link). Ask only for what is missing and matters.
- When you have enough, draft the story. Set ready to true and fill headline, summary and body. Otherwise set ready to false and leave those three as empty strings.
- If they ask for changes to a draft, return the revised full draft with ready true.

Writing rules:
- Use only facts the Community Manager gave you. Never invent names, dates, quotes, prices, numbers or sources. If something is unconfirmed, say so plainly ("members are reporting", "according to the owner").
- Controversies: stay neutral and factual, attribute every claim, and do not accuse anyone of anything the Community Manager has not confirmed. If a claim could harm a person or business and has no source, ask for one before drafting.
- Always write "Vegan" and "Veganism" with a capital V. Never use em dashes; use commas or periods. Say "contribution", never "donation". Do not make health or tax claims.
- Headline: under 90 characters, plain and specific. Summary: one or two sentences, under 220 characters (it shows on a card that only has room for two lines). Body: two to five short paragraphs separated by blank lines, warm and community-minded, ending with what readers can do (visit, show support, share what they know) when that fits.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'ready', 'headline', 'summary', 'body'],
  properties: {
    reply: { type: 'string', description: 'What you say back to the Community Manager.' },
    ready: { type: 'boolean', description: 'True when headline, summary and body hold a full draft.' },
    headline: { type: 'string' },
    summary: { type: 'string' },
    body: { type: 'string' },
  },
};

const clean = (s: unknown, max: number) => String(s ?? '').replace(/\s*\u2014\s*/g, ', ').replace(/\u2013/g, '-').replace(/\bvegan(ism|s)?\b/g, (_m: string, x?: string) => 'Vegan' + (x || '')).trim().slice(0, max);

async function anthropicKey(): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'ANTHROPIC_API_KEY').maybeSingle();
  return (data?.value as string) || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, email, name, ve_role, is_superadmin, home_community').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'member_not_found' }, 404);
  const isAdmin = !!member.is_superadmin;
  if (member.ve_role !== 'community_manager' && !isAdmin) return json({ error: 'no_access' }, 403);

  // The CM's city: their invite first, then their home community. Superadmins may pick any city.
  const { data: invite } = await db.from('ve_staff_invites').select('city_slug').ilike('email', member.email).maybeSingle();
  let citySlug = invite?.city_slug || member.home_community || '';
  if (isAdmin && body.city && CITY_NAMES[String(body.city)]) citySlug = String(body.city);
  if (!citySlug) return json({ error: 'no_city', message: 'Your account is not linked to a city yet. Ask Sean to set it up.' }, 400);
  const cityName = CITY_NAMES[citySlug] || citySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const firstName = String(member.name || '').split(' ')[0] || 'there';

  // A draft this member may touch: one they submitted, in their city (superadmins: any).
  async function ownDraft(id: string) {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    const { data } = await db.from('ve_community_news').select('id, city_slug, status, submitted_by_member_id').eq('id', id).maybeSingle();
    if (!data) return null;
    if (!isAdmin && (data.submitted_by_member_id !== memberId || data.city_slug !== citySlug)) return null;
    return data;
  }

  if (action === 'drafts') {
    const { data } = await db.from('ve_community_news')
      .select('id, headline, summary, body, url, status, created_at, published_at')
      .eq('city_slug', citySlug).eq('source_type', 'member_submission')
      .in('status', ['pending', 'approved']).order('created_at', { ascending: false }).limit(30);
    return json({ city: citySlug, city_name: cityName, name: firstName, drafts: data || [] });
  }

  if (action === 'chat') {
    const raw = Array.isArray(body.messages) ? body.messages : [];
    const messages = raw.slice(-24)
      .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 6000) }));
    while (messages.length && messages[0].role !== 'user') messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'say_something' }, 400);
    const apiKey = await anthropicKey();
    if (!apiKey) return json({ error: 'assistant_unavailable' }, 503);
    const client = new Anthropic({ apiKey });

    let out: any;
    try {
      const response: any = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        system: SYSTEM(cityName, firstName),
        messages,
      } as any);
      if (response.stop_reason === 'refusal') return json({ reply: "I can't help write that one. Try telling me about it a different way, or bring it to the huddle.", draft: null });
      const text = (response.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
      out = JSON.parse(text);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'busy', message: 'The assistant is busy. Try again in a minute.' }, 429);
      if (e instanceof Anthropic.APIError) { console.error('anthropic', e.status, e.message); return json({ error: 'assistant_unavailable' }, 502); }
      if (e instanceof SyntaxError) { console.error('bad json from model'); return json({ error: 'assistant_unavailable' }, 502); }
      throw e;
    }

    const reply = clean(out.reply, 2000);
    if (!out.ready || !String(out.headline || '').trim()) return json({ reply, draft: null });
    const row = { headline: clean(out.headline, 140), summary: clean(out.summary, 300), body: clean(out.body, 8000) };
    const existing = body.draft_id ? await ownDraft(String(body.draft_id)) : null;
    let draftId: string;
    if (existing && existing.status === 'pending') {
      await db.from('ve_community_news').update(row).eq('id', existing.id);
      draftId = existing.id;
    } else {
      const { data: ins, error } = await db.from('ve_community_news').insert({
        ...row, city_slug: citySlug, status: 'pending', source_type: 'member_submission',
        source_name: 'Vegans Explore ' + cityName, submitted_by_member_id: memberId, submitted_by_name: member.name || null,
      }).select('id').single();
      if (error || !ins) { console.error('insert', error); return json({ reply, draft: null, error: 'save_failed' }); }
      draftId = ins.id;
    }
    return json({ reply, draft: { id: draftId, status: 'pending', ...row } });
  }

  if (action === 'save' || action === 'publish' || action === 'discard') {
    const d = await ownDraft(String(body.id || ''));
    if (!d) return json({ error: 'not_found' }, 404);
    if (action === 'discard') {
      await db.from('ve_community_news').update({ status: 'rejected', reviewed_by: member.email, reviewed_at: new Date().toISOString(), rejection_reason: 'Discarded by Community Manager' }).eq('id', d.id);
      return json({ ok: true });
    }
    const patch: Record<string, unknown> = {};
    if (body.headline !== undefined) patch.headline = clean(body.headline, 140);
    if (body.summary !== undefined) patch.summary = clean(body.summary, 300);
    if (body.body !== undefined) patch.body = clean(body.body, 8000);
    if (body.url !== undefined) {
      const u = String(body.url || '').trim();
      if (u && !/^https?:\/\/[^\s]+$/i.test(u)) return json({ error: 'bad_url' }, 400);
      patch.url = u || null;
    }
    if (patch.headline === '') return json({ error: 'headline_required' }, 400);
    if (action === 'publish') Object.assign(patch, { status: 'approved', published_at: new Date().toISOString(), reviewed_by: member.email, reviewed_at: new Date().toISOString() });
    await db.from('ve_community_news').update(patch).eq('id', d.id);
    return json({ ok: true, status: action === 'publish' ? 'approved' : d.status });
  }

  return json({ error: 'unknown_action' }, 400);
});
