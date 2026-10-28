// ve-people: the People directory (Sean, 2026-10-28: "a people directory... people that we've actually interacted with... an IMDb of
// all the stuff that they've done with Vegans Explore... If we did an interview with them, you can take their transcripts of their
// interview to write their bio"). A person is a listing in the People section; this function holds what the listing editor cannot:
// their profession, a physician's specialty, links to their work (listings.details.person), their credits (ve_person_credits), and
// the bio written from their interviews.
//
// Super admin (the VE app token) or ops (Bearer LESARUSS_ADMIN_TOKEN):
// POST { action: 'save', listing_id, title?, specialty?, links?: [{label, url}], bio?, website?, instagram?, facebook?, tiktok?, youtube? } -> { ok, person }
//      { action: 'credits', listing_id }                                                 -> { ok, credits }
//      { action: 'credit_add', listing_id, kind: episode|event|article|video, content_id? | event_id? | title, url?, happened_on?, role?, note? }
//      { action: 'credit_remove', id }
//      { action: 'episodes', q }                                                         -> { ok, rows }   our episodes, to pick a credit
//      { action: 'bio_draft', listing_id, save?: true, recategorize?: true }             -> { ok, bio, title, category, specialty, sources }
//      { action: 'photo_instagram', listing_id, handle?, sure? } | { action: 'photo_url', listing_id, url }  -> { ok, logo_url }
//      (Instagram: refused as not_them unless a word of their name is in the account's name, handle or bio, or sure is true)
// Each change to a listing is a ve_listing_edits row with the value it replaced.
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';

// Keep in step with PEOPLE_CATS in /public/ve-region-directory.js and SPECIALTIES there and in /public/ve-listing-admin.js.
const PEOPLE_CATS = ['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders'];
const SPECIALTIES = ['cardiology', 'gastroenterology', 'internal', 'family', 'lifestyle', 'psychiatry', 'urology', 'surgery', 'other'];
const KINDS = ['episode', 'event', 'article', 'video'];

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

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
function httpsUrl(v: unknown): string {
  const u = String(v ?? '').trim();
  try { const x = new URL(u); return x.protocol === 'https:' ? x.toString() : ''; } catch { return ''; }
}

async function person(id: string) {
  const { data } = await db.from('listings').select('id, name, category, description, details, status').eq('id', id).maybeSingle();
  return data && PEOPLE_CATS.includes(data.category) ? data : null;
}
async function logEdits(listingId: string, by: string | null, edits: { field: string; old_value: unknown; new_value: unknown }[]) {
  if (edits.length) await db.from('ve_listing_edits').insert(edits.map((e) => ({ listing_id: listingId, member_id: by, ...e, meta: { by: by ? 'admin' : 'ops', where: 've-people' } })));
}

// What we have said with them: the transcripts of their credited episodes (timed first, else untimed), and each episode's summary.
async function sourcesFor(listingId: string) {
  const { data: cr } = await db.from('ve_person_credits').select('kind, role, title, happened_on, note, content_id, event:events(title, starts_at, city)').eq('listing_id', listingId);
  const ids = (cr || []).map((c: any) => c.content_id).filter(Boolean);
  const { data: eps } = ids.length ? await db.from('ve_pulse_content').select('id, title, podcast_show, episode_number, published_at, summary, transcript').in('id', ids) : { data: [] };
  const { data: tr } = ids.length ? await db.from('ve_content_transcripts').select('content_id, text').in('content_id', ids) : { data: [] };
  const timed = new Map((tr || []).map((t: any) => [t.content_id, t.text]));
  const per = Math.floor(150000 / Math.max(1, ids.length));
  const parts: string[] = [], used: string[] = [];
  for (const e of (eps || []) as any[]) {
    const text = String(timed.get(e.id) || e.transcript || '');
    used.push(`${e.podcast_show || 'Episode'}${e.episode_number ? ' ' + e.episode_number : ''}: ${e.title}${text ? '' : ' (summary only)'}`);
    parts.push(`EPISODE: ${e.title} (${e.podcast_show || ''}${e.episode_number ? ', episode ' + e.episode_number : ''}, ${String(e.published_at || '').slice(0, 10)})\nSUMMARY: ${e.summary || ''}\n` +
      (text ? `TRANSCRIPT:\n${text.slice(0, per)}` : ''));
  }
  for (const c of (cr || []) as any[]) if (!c.content_id) parts.push(`${String(c.kind).toUpperCase()}: ${c.title || c.event?.title || ''} ${c.role ? '(' + c.role + ')' : ''} ${c.happened_on || c.event?.starts_at || ''} ${c.note || ''}`);
  return { text: parts.join('\n\n---\n\n'), used };
}

const BIO_SYSTEM = `You write short profiles for the People section of Vegans Explore's Directory: people who have been on our shows, at our
events or in our stories. You are given what they said with us (episode transcripts and summaries) and our other credits for them.
Write only what these sources say about them. Never add a fact from memory, a number, an award, a book or a job that is not in the
sources. If the sources say little, write less.
- bio: two or three short paragraphs, 90 to 200 words in all, third person, warm and plain. Who they are and what they do, what drives
  their work, and what they shared with Vegans Explore (name the show). No hype words (amazing, incredible, renowned), no em dashes,
  no lists. Write "Vegan" with a capital V.
- title: their profession or role in one line of 70 characters or fewer, as the sources state it ("Cardiologist and author",
  "Olympic cyclist and Vegan advocate"). Empty if the sources do not say.
- speaker_names: the names the transcripts use for them (to find their quotes), at most three.
- category: the one People section that fits best, by what the sources say they do: Activists (advocacy, rescue, education,
  campaigns), Content Creators (online shows, social media, music, books as a creator), Athletes (bodybuilders, lifters, competitors),
  Physicians (medical doctors), Health Experts (dietitians, coaches, psychologists, yoga and wellness), Chefs, Founders (they built a
  business or organization).
- specialty: for a physician, their field if the sources state it, else empty.`;
const BIO_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['bio', 'title', 'speaker_names', 'category', 'specialty'],
  properties: { bio: { type: 'string' }, title: { type: 'string' }, speaker_names: { type: 'array', items: { type: 'string' } },
    category: { type: 'string', enum: PEOPLE_CATS }, specialty: { type: 'string', enum: [...SPECIALTIES, ''] } },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  let by: string | null = null;
  const ops = !!token && token === (await secret('LESARUSS_ADMIN_TOKEN'));
  if (!ops) {
    const sub = token ? await verifyToken(token) : null;
    if (!sub) return json({ error: 'sign_in' }, 401);
    const { data: m } = await db.from('members').select('id, is_superadmin').eq('id', sub).maybeSingle();
    if (!m?.is_superadmin) return json({ error: 'forbidden' }, 403);
    by = m.id;
  }
  const action = body.action;

  if (action === 'save') {
    if (!isId(body.listing_id)) return json({ error: 'bad_request' }, 400);
    const l: any = await person(body.listing_id);
    if (!l) return json({ error: 'not_a_person' }, 400);
    const details = { ...(l.details || {}) }, p = { ...(details.person || {}) }, edits: any[] = [];
    if (body.title !== undefined) { const t = clean(body.title, 90); if ((p.title || '') !== t) { edits.push({ field: 'person.title', old_value: p.title ?? null, new_value: t || null }); if (t) p.title = t; else delete p.title; } }
    if (body.specialty !== undefined) {
      const s = String(body.specialty || '');
      if (s && !SPECIALTIES.includes(s)) return json({ error: 'bad_specialty' }, 400);
      if ((p.specialty || '') !== s) { edits.push({ field: 'person.specialty', old_value: p.specialty ?? null, new_value: s || null }); if (s) p.specialty = s; else delete p.specialty; }
    }
    if (body.links !== undefined) {
      if (!Array.isArray(body.links)) return json({ error: 'bad_links' }, 400);
      const links = body.links.slice(0, 8).map((x: any) => ({ label: clean(x?.label, 40) || 'Visit', url: httpsUrl(x?.url) })).filter((x: any) => x.url);
      if (JSON.stringify(p.links || []) !== JSON.stringify(links)) { edits.push({ field: 'person.links', old_value: p.links ?? null, new_value: links }); if (links.length) p.links = links; else delete p.links; }
    }
    // Their bio and where to find them (Sean, 2026-10-28: "Instagram, their Facebook, TikTok if they have it, YouTube if they have it.
    // Make sure we have their website. We don't need a phone number or an address").
    const cols: Record<string, unknown> = {};
    const { data: cur } = await db.from('listings').select('description, website, instagram, facebook, tiktok, youtube').eq('id', l.id).maybeSingle();
    if (body.bio !== undefined) cols.description = String(body.bio ?? '').replace(/\r/g, '').trim().slice(0, 3000);
    if (body.website !== undefined) { const w = String(body.website || '').trim(); cols.website = !w ? '' : httpsUrl(/^https?:\/\//i.test(w) ? w.replace(/^http:/i, 'https:') : 'https://' + w); }
    const handleOf = (v: unknown, host: string) => String(v ?? '').trim().replace(new RegExp('^https?://(www\\.)?' + host + '/', 'i'), '').replace(/^@/, '').replace(/[\/?#].*$/, '');
    if (body.instagram !== undefined) { const h = handleOf(body.instagram, 'instagram\\.com'); cols.instagram = h ? '@' + h.toLowerCase() : null; }
    if (body.tiktok !== undefined) { const h = handleOf(body.tiktok, 'tiktok\\.com'); cols.tiktok = h ? '@' + h.replace(/^@/, '').toLowerCase() : null; }
    if (body.facebook !== undefined) { const u = String(body.facebook || '').trim(); cols.facebook = !u ? null : httpsUrl(u) || 'https://www.facebook.com/' + handleOf(u, 'facebook\\.com'); }
    if (body.youtube !== undefined) { const u = String(body.youtube || '').trim(); cols.youtube = !u ? null : httpsUrl(u) || 'https://www.youtube.com/' + (u.startsWith('@') ? u : '@' + u); }
    for (const k of Object.keys(cols)) {
      if (String((cur as any)?.[k] ?? '') === String(cols[k] ?? '')) delete cols[k];
      else edits.push({ field: k, old_value: (cur as any)?.[k] ?? null, new_value: cols[k] ?? null });
    }
    if (edits.length) {
      details.person = p;
      const { error } = await db.from('listings').update({ ...cols, details, updated_at: new Date().toISOString() }).eq('id', l.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      await logEdits(l.id, by, edits);
    }
    return json({ ok: true, person: p });
  }

  if (action === 'credits') {
    if (!isId(body.listing_id)) return json({ error: 'bad_request' }, 400);
    const { data, error } = await db.from('ve_person_credits')
      .select('id, kind, role, title, url, happened_on, note, content:ve_pulse_content(id, title, podcast_show, episode_number, published_at), event:events(id, title, starts_at)')
      .eq('listing_id', body.listing_id).order('created_at');
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, credits: data || [] });
  }

  if (action === 'credit_add') {
    if (!isId(body.listing_id) || !KINDS.includes(body.kind)) return json({ error: 'bad_request' }, 400);
    if (!(await person(body.listing_id))) return json({ error: 'not_a_person' }, 400);
    const row: any = { listing_id: body.listing_id, kind: body.kind, role: clean(body.role, 40) || null, note: clean(body.note, 300) || null };
    if (isId(body.content_id)) row.content_id = body.content_id;
    else if (isId(body.event_id)) row.event_id = body.event_id;
    else { row.title = clean(body.title, 200); row.url = httpsUrl(body.url) || null; if (!row.title) return json({ error: 'title' }, 400); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(body.happened_on || ''))) row.happened_on = body.happened_on;
    const { data, error } = await db.from('ve_person_credits').insert(row).select('id').single();
    if (error) return json({ error: /duplicate/.test(error.message) ? 'already_credited' : error.message }, 400);
    return json({ ok: true, id: data.id });
  }

  if (action === 'credit_remove') {
    if (!isId(body.id)) return json({ error: 'bad_request' }, 400);
    const { error } = await db.from('ve_person_credits').delete().eq('id', body.id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === 'episodes') {
    const q = clean(body.q, 80).replace(/[%_,()]/g, ' ');
    let qb = db.from('ve_pulse_content').select('id, title, podcast_show, episode_number, published_at, guest_name').not('podcast_show', 'is', null).eq('status', 'published');
    if (q) qb = qb.or(`title.ilike.%${q}%,guest_name.ilike.%${q}%`);
    const { data, error } = await qb.order('published_at', { ascending: false }).limit(20);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, rows: data || [] });
  }

  if (action === 'bio_draft') {
    if (!isId(body.listing_id)) return json({ error: 'bad_request' }, 400);
    const l: any = await person(body.listing_id);
    if (!l) return json({ error: 'not_a_person' }, 400);
    const src = await sourcesFor(l.id);
    if (!src.text) return json({ error: 'no_sources', message: 'Credit an episode first: the bio is written from their interviews.' }, 400);
    const apiKey = await secret('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'no_model_key' }, 500);
    let out: any;
    try {
      const client = new Anthropic({ apiKey });
      const res: any = await client.beta.messages.create({
        model: MODEL, max_tokens: 2000, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: BIO_SCHEMA } },
        system: BIO_SYSTEM,
        messages: [{ role: 'user', content: `The person: ${l.name}.\n\nSOURCES:\n\n${src.text}\n\nWrite their profile.` }],
      } as any);
      if (res.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
      out = JSON.parse((res.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join(''));
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
      return json({ error: String((e as Error).message || e).slice(0, 200) }, 502);
    }
    const bio = String(out.bio || '').replace(/—/g, ', ').replace(/\bvegan/g, 'Vegan').trim();
    const title = clean(out.title, 70);
    const names = (out.speaker_names || []).map((x: unknown) => clean(x, 60)).filter(Boolean).slice(0, 3);
    if (body.save && bio) {
      const details = { ...(l.details || {}) }, p = { ...(details.person || {}) };
      p.bio_source = 'transcript'; p.bio_sources = src.used;
      if (!p.title && title) p.title = title;
      if (names.length) p.speaker_names = names;
      if (!p.specialty && SPECIALTIES.includes(out.specialty)) p.specialty = out.specialty;
      details.person = p;
      // recategorize: the section follows what the sources say they do (used when the seed could only guess).
      const recat = body.recategorize && PEOPLE_CATS.includes(out.category) && out.category !== l.category ? out.category : '';
      const { error } = await db.from('listings').update({ description: bio, details, ...(recat ? { category: recat } : {}), updated_at: new Date().toISOString() }).eq('id', l.id);
      if (recat) await logEdits(l.id, by, [{ field: 'category', old_value: l.category, new_value: recat }]);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      await logEdits(l.id, by, [{ field: 'description', old_value: l.description ?? null, new_value: bio }]);
    }
    return json({ ok: true, bio, title, speaker_names: names, category: out.category, specialty: out.specialty, sources: src.used, saved: !!body.save });
  }

  // Their photo (Sean, 2026-10-28: "use their real thumbnail... square... with the rounded corners"): their own Instagram profile picture
  // or a picture link, copied into our storage (never hot-linked), as the listing's logo_url. Instagram also gives their name, bio
  // link and handle, which fill only what is empty.
  if (action === 'photo_instagram' || action === 'photo_url') {
    if (!isId(body.listing_id)) return json({ error: 'bad_request' }, 400);
    const { data: l } = await db.from('listings').select('id, slug, name, category, logo_url, instagram, website, details').eq('id', body.listing_id).maybeSingle();
    if (!l || !PEOPLE_CATS.includes(l.category)) return json({ error: 'not_a_person' }, 400);
    let pic = '', handle = '', site = '', source = '', alt = '', fullName = '';
    if (action === 'photo_instagram') {
      handle = String(body.handle || l.instagram || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[\/?#].*$/, '').toLowerCase();
      if (!/^[a-z0-9._]{1,30}$/.test(handle)) return json({ error: 'handle' }, 400);
      const token = await secret('APIFY_API_TOKEN');
      if (!token) return json({ error: 'no_apify' }, 500);
      const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [handle] }),
      }).catch(() => null);
      const p: any = r && r.ok ? ((await r.json()) as any[])[0] : null;
      if (!p || p.error) return json({ error: 'not_found', message: `@${handle} did not come back from Instagram.` }, 404);
      // The account has to be theirs: a word of their name (3 letters or more) in its name, handle or bio, unless the caller is sure.
      const words = String(l.name).toLowerCase().replace(/^(dr|chef)\.?\s+/, '').match(/[a-zÀ-ɏ]{3,}/g) || [];
      const hay = `${p.fullName || ''} ${p.username || ''} ${p.biography || ''}`.toLowerCase();
      if (!body.sure && !words.some((w) => hay.includes(w)))
        return json({ error: 'not_them', message: `@${handle} is ${p.fullName || 'someone else'}.`, full_name: p.fullName || '', bio: String(p.biography || '').slice(0, 200) }, 409);
      pic = p.profilePicUrlHD || p.profilePicUrl || ''; alt = p.profilePicUrl && p.profilePicUrl !== pic ? p.profilePicUrl : ''; fullName = String(p.fullName || ''); site = httpsUrl(p.externalUrl); source = 'instagram:@' + handle;
    } else {
      pic = httpsUrl(body.url); source = pic;
    }
    if (!pic) return json({ error: 'no_picture' }, 400);
    // Instagram's large picture sometimes comes back empty; its standard one is the fallback.
    let type = '', bytes = new Uint8Array(0);
    for (const u of [pic, alt].filter(Boolean)) {
      const img = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } }).catch(() => null);
      const t = (img?.headers.get('content-type') || '').split(';')[0];
      if (!img || !img.ok || !/^image\/(jpeg|png|webp)$/.test(t)) continue;
      const b = new Uint8Array(await img.arrayBuffer());
      if (b.length >= 1500 && b.length <= 8_000_000) { type = t; bytes = b; break; }
    }
    if (!type) return json({ error: 'picture', message: 'The picture did not load.' }, 400);
    const path = `media/people/${l.slug}/photo-${Date.now()}.${type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}`;
    const { error: upErr } = await db.storage.from('vegan-media').upload(path, bytes, { contentType: type, upsert: false });
    if (upErr) return json({ error: 'upload', message: upErr.message }, 500);
    const url = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/${path}`;
    const details = { ...(l.details || {}) }, p2 = { ...(details.person || {}) };
    p2.photo_source = source; details.person = p2; details.logo_source = 'admin';
    const patch: Record<string, unknown> = { logo_url: url, details, updated_at: new Date().toISOString() };
    if (handle && !l.instagram) patch.instagram = '@' + handle;
    if (site && !l.website) patch.website = site;
    const { error } = await db.from('listings').update(patch).eq('id', l.id);
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    await logEdits(l.id, by, [{ field: 'logo', old_value: l.logo_url || null, new_value: url }]);
    return json({ ok: true, logo_url: url, full_name: fullName, instagram: patch.instagram || l.instagram, website: patch.website || l.website });
  }

  return json({ error: 'unknown_action' }, 400);
});
