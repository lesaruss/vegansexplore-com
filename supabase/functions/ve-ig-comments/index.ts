// ve-ig-comments: comment-to-DM for @vegansexplore, built in-house instead of ManyChat (Sean, 2026-11-21: "Is there a way to automate that,
// like ManyChat, without using ManyChat?" ... "you can go ahead and build it"). Uses Meta's Instagram API with Unified login (Facebook
// Login for Business): new apps no longer get "Instagram login" (Meta, 2026-11-21), so the token is the configuration's system-user token,
// which never expires, pasted by Sean in Key Room (hq.lesaruss.ai/keys), with META_APP_SECRET.
//
// Routes (one URL, verify_jwt off: Meta and Instagram's login call it directly):
//   GET  ?hub.mode=subscribe&hub.verify_token=..&hub.challenge=..   Meta's webhook check (IG_WEBHOOK_VERIFY_TOKEN in lesaruss_secrets)
//   POST (webhook, signed X-Hub-Signature-256)                       a comment with a keyword gets one private reply (Meta allows one per
//                                                                    comment) with a personal tracked /go/ link, plus a short public reply
//   POST ?action=status | discover | dry  (Bearer LESARUSS_ADMIN_TOKEN)  connection check; discover stores the account ids; keyword test
// Keys come from lesaruss_secrets (Key Room). Nothing is sent while the token is missing or belongs to another account.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH = 'https://graph.facebook.com/v21.0';
const ACCOUNT = 'vegansexplore';
const SITE = 'https://vegansexplore.com';

const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
const page = (title: string, body: string, s = 200) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
  `<body style="font:18px/1.5 system-ui,sans-serif;max-width:560px;margin:60px auto;padding:0 16px"><h1 style="font-size:24px">${title}</h1><p>${body}</p></body>`,
  { status: s, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

async function secrets(keys: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const { data } = await db.from('lesaruss_secrets').select('key,value').in('key', keys);
  (data || []).forEach((r: { key: string; value: string }) => { out[r.key] = r.value; });
  for (const k of keys) { const e = Deno.env.get(k); if (e) out[k] = e; }   // a dashboard secret wins
  return out;
}
const real = (v?: string) => !!v && v.length > 12 && !/^pending/i.test(v);
async function saveSecret(key: string, value: string) {
  await db.from('lesaruss_secrets').upsert({ key, value }, { onConflict: 'key' });
}

async function hmacHex(secret: string, body: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(body)));
  return Array.from(sig).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n))).map((b) => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');

// The @vegansexplore Instagram account (and its Facebook Page, if the token has one) from the token's own scopes.
async function discover(token: string) {
  const r = await fetch(`${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`);
  const j = await r.json().catch(() => ({}));
  const gs: { scope: string; target_ids?: string[] }[] = j?.data?.granular_scopes || [];
  const ig = gs.find((g) => /^instagram_/.test(g.scope) && g.target_ids?.length)?.target_ids?.[0] || null;
  const page = gs.find((g) => /^pages_/.test(g.scope) && g.target_ids?.length)?.target_ids?.[0] || null;
  let username: string | null = null;
  if (ig) { const u = await (await fetch(`${GRAPH}/${ig}?fields=username`, { headers: { Authorization: `Bearer ${token}` } })).json().catch(() => ({})); username = u.username || null; }
  return { valid: !!j?.data?.is_valid, scopes: j?.data?.scopes || [], ig, page, username, error: j?.error?.message || j?.data?.error?.message || null };
}

type Kw = { id: number; keyword: string; media_id: string | null; dm_text: string; destination: string; initiative_slug: string; public_replies: string[] };
async function matchKeyword(text: string, mediaId: string | null): Promise<Kw | null> {
  const { data } = await db.from('ve_ig_keywords').select('id,keyword,media_id,dm_text,destination,initiative_slug,public_replies').eq('active', true);
  const t = ' ' + text.toUpperCase().replace(/[^A-Z0-9]+/g, ' ') + ' ';
  const hits = (data || []).filter((k: Kw) => t.includes(' ' + k.keyword.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim() + ' ')
    && (!k.media_id || k.media_id === mediaId));
  hits.sort((a: Kw, b: Kw) => (b.media_id ? 1 : 0) - (a.media_id ? 1 : 0));   // a post-specific keyword beats a general one
  return hits[0] || null;
}

async function handleComment(v: Record<string, any>, token: string, igId: string, pageId: string | null) {
  const commentId = String(v.id || ''), text = String(v.text || ''), from = v.from || {}, mediaId = v.media?.id ? String(v.media.id) : null;
  if (!commentId) return 'no id';
  const { error: dup } = await db.from('ve_ig_comment_events').insert({ comment_id: commentId, media_id: mediaId, from_id: from.id || null, from_username: from.username || null, text });
  if (dup) return 'duplicate';                                         // Meta can deliver the same event twice
  const set = (o: Record<string, unknown>) => db.from('ve_ig_comment_events').update(o).eq('comment_id', commentId);
  if (from.id && String(from.id) === igId) { await set({ status: 'own' }); return 'own'; }
  const kw = await matchKeyword(text, mediaId);
  if (!kw) { await set({ status: 'no_match' }); return 'no_match'; }
  const { data: before } = await db.from('ve_ig_comment_events').select('id').eq('from_id', from.id).eq('keyword_id', kw.id).eq('status', 'dm_sent').limit(1);
  if (before && before.length) { await set({ status: 'repeat', keyword_id: kw.id }); return 'repeat'; }   // one DM per person per keyword
  // A personal tracked link, so the click names the person (Tracked links rule).
  const code = 'ig-' + rand(7);
  await db.from('ve_links').insert({ code, label: `Instagram DM: ${kw.keyword} for @${from.username || from.id}`, destination: kw.destination,
    initiative_slug: kw.initiative_slug, tags: [kw.initiative_slug, 'instagram-dm', kw.keyword.toLowerCase()], channel: 'instagram-dm',
    recipient_name: from.username ? '@' + from.username : null, active: true });
  const msg = kw.dm_text.replace('{link}', `${SITE}/go/${code}`);
  const send = (who: string) => fetch(`${GRAPH}/${who}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text: msg } }) });
  let r = await send(igId);
  if (!r.ok && pageId) { const first = (await r.text()).slice(0, 200); r = await send(pageId); if (!r.ok) { await set({ status: 'dm_failed', keyword_id: kw.id, link_code: code, dm_error: (first + ' | ' + (await r.text())).slice(0, 500) }); return 'dm_failed'; } }
  if (!r.ok) { await set({ status: 'dm_failed', keyword_id: kw.id, link_code: code, dm_error: (await r.text()).slice(0, 500) }); return 'dm_failed'; }
  await set({ status: 'dm_sent', keyword_id: kw.id, link_code: code, dm_sent_at: new Date().toISOString() });
  const replies = kw.public_replies?.length ? kw.public_replies : ['Sent! Check your DMs 🌱'];
  const pr = await fetch(`${GRAPH}/${commentId}/replies`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: replies[Math.floor(Math.random() * replies.length)] }) });
  if (pr.ok) { const j = await pr.json().catch(() => ({})); if (j.id) await set({ public_reply_id: String(j.id) }); }
  return 'dm_sent';
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const S = await secrets(['IG_WEBHOOK_VERIFY_TOKEN', 'META_APP_SECRET', 'INSTAGRAM_TOKEN_VEGANSEXPLORE', 'IG_USER_ID_VEGANSEXPLORE',
    'IG_PAGE_ID_VEGANSEXPLORE', 'LESARUSS_ADMIN_TOKEN']);

  if (req.method === 'GET' && url.searchParams.get('hub.mode') === 'subscribe') {
    const ok = real(S.IG_WEBHOOK_VERIFY_TOKEN) && url.searchParams.get('hub.verify_token') === S.IG_WEBHOOK_VERIFY_TOKEN;
    return ok ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 }) : new Response('forbidden', { status: 403 });
  }

  if (req.method === 'POST' && action) {
    const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!real(S.LESARUSS_ADMIN_TOKEN) || supplied !== S.LESARUSS_ADMIN_TOKEN) return json({ error: 'unauthorized' }, 401);
    if (action === 'dry') {
      const b = await req.json().catch(() => ({}));
      const kw = await matchKeyword(String(b.text || ''), b.media_id || null);
      return json({ matched: kw ? kw.keyword : null, dm: kw ? kw.dm_text.replace('{link}', `${SITE}/go/ig-xxxxxxx`) : null });
    }
    if (action === 'status' || action === 'discover') {
      if (!real(S.INSTAGRAM_TOKEN_VEGANSEXPLORE)) return json({ connected: false, app_secret_set: real(S.META_APP_SECRET), verify_token_set: real(S.IG_WEBHOOK_VERIFY_TOKEN) });
      const d = await discover(S.INSTAGRAM_TOKEN_VEGANSEXPLORE);
      const right = String(d.username || '').toLowerCase() === ACCOUNT;
      let subscribed: unknown = null;
      if (action === 'discover' && right && d.ig) {
        await saveSecret('IG_USER_ID_VEGANSEXPLORE', d.ig);
        if (d.page) await saveSecret('IG_PAGE_ID_VEGANSEXPLORE', d.page);
        if (d.page) subscribed = await (await fetch(`${GRAPH}/${d.page}/subscribed_apps?subscribed_fields=feed`, { method: 'POST', headers: { Authorization: `Bearer ${S.INSTAGRAM_TOKEN_VEGANSEXPLORE}` } })).json().catch(() => null);
      }
      return json({ connected: d.valid, right_account: right, username: d.username, ig_id: d.ig, page_id: d.page, scopes: d.scopes,
        app_secret_set: real(S.META_APP_SECRET), verify_token_set: real(S.IG_WEBHOOK_VERIFY_TOKEN), token_error: d.error, subscribed });
    }
    if (action === 'refresh') return json({ skipped: 'system-user token does not expire' });
    return json({ error: 'unknown action' }, 400);
  }

  if (req.method === 'POST') {
    const raw = await req.text();
    const sig = (req.headers.get('x-hub-signature-256') || '').replace(/^sha256=/, '');
    const keys = [S.META_APP_SECRET].filter(real);
    let ok = false;
    for (const k of keys) if (sig && safeEq(await hmacHex(k, raw), sig)) ok = true;
    if (!ok) return new Response('bad signature', { status: 401 });
    if (!real(S.INSTAGRAM_TOKEN_VEGANSEXPLORE) || !real(S.IG_USER_ID_VEGANSEXPLORE)) return json({ skipped: 'not connected' });
    const body = JSON.parse(raw || '{}');
    const results: string[] = [];
    for (const entry of body.entry || []) for (const ch of entry.changes || []) {
      if (ch.field === 'comments' && ch.value) results.push(await handleComment(ch.value, S.INSTAGRAM_TOKEN_VEGANSEXPLORE, S.IG_USER_ID_VEGANSEXPLORE, real(S.IG_PAGE_ID_VEGANSEXPLORE) ? S.IG_PAGE_ID_VEGANSEXPLORE : null));
    }
    return json({ ok: true, results });
  }

  return new Response('ve-ig-comments', { status: 200 });
});
