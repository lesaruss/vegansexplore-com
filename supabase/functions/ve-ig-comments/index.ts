// ve-ig-comments: comment-to-DM for @vegansexplore, built in-house instead of ManyChat (Sean, 2026-11-21: "Is there a way to automate that,
// like ManyChat, without using ManyChat?" ... "you can go ahead and build it"). Uses Meta's Instagram API with Instagram Login.
//
// Routes (one URL, verify_jwt off: Meta and Instagram's login call it directly):
//   GET  ?hub.mode=subscribe&hub.verify_token=..&hub.challenge=..   Meta's webhook check (IG_WEBHOOK_VERIFY_TOKEN in lesaruss_secrets)
//   GET  ?action=connect                                             sends Sean to Instagram's login to approve the app (state saved)
//   GET  ?action=callback&code=..&state=..                           stores a long-lived token, ONLY if the account is @vegansexplore,
//                                                                    then subscribes the account to comment webhooks
//   POST (webhook, signed X-Hub-Signature-256)                       a comment with a keyword gets one private reply (Meta allows one per
//                                                                    comment) with a personal tracked /go/ link, plus a short public reply
//   POST ?action=status | refresh | dry   (Bearer LESARUSS_ADMIN_TOKEN)  connection check, token refresh (weekly cron), keyword test
// App id and secret: INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET as Edge Function secrets (Sean adds them in the Supabase dashboard),
// or the same keys in lesaruss_secrets. Nothing is sent while the token is missing.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH = 'https://graph.instagram.com/v21.0';
const ACCOUNT = 'vegansexplore';
const SCOPES = 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages';
const FN_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ig-comments';
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

type Kw = { id: number; keyword: string; media_id: string | null; dm_text: string; destination: string; initiative_slug: string; public_replies: string[] };
async function matchKeyword(text: string, mediaId: string | null): Promise<Kw | null> {
  const { data } = await db.from('ve_ig_keywords').select('id,keyword,media_id,dm_text,destination,initiative_slug,public_replies').eq('active', true);
  const t = ' ' + text.toUpperCase().replace(/[^A-Z0-9]+/g, ' ') + ' ';
  const hits = (data || []).filter((k: Kw) => t.includes(' ' + k.keyword.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim() + ' ')
    && (!k.media_id || k.media_id === mediaId));
  hits.sort((a: Kw, b: Kw) => (b.media_id ? 1 : 0) - (a.media_id ? 1 : 0));   // a post-specific keyword beats a general one
  return hits[0] || null;
}

async function handleComment(v: Record<string, any>, token: string, igId: string) {
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
  const r = await fetch(`${GRAPH}/${igId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text: msg } }) });
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
  const S = await secrets(['IG_WEBHOOK_VERIFY_TOKEN', 'INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'META_APP_SECRET',
    'INSTAGRAM_TOKEN_VEGANSEXPLORE', 'IG_USER_ID_VEGANSEXPLORE', 'LESARUSS_ADMIN_TOKEN']);

  if (req.method === 'GET' && url.searchParams.get('hub.mode') === 'subscribe') {
    const ok = real(S.IG_WEBHOOK_VERIFY_TOKEN) && url.searchParams.get('hub.verify_token') === S.IG_WEBHOOK_VERIFY_TOKEN;
    return ok ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 }) : new Response('forbidden', { status: 403 });
  }

  if (req.method === 'GET' && action === 'connect') {
    if (!real(S.INSTAGRAM_APP_ID)) return page('Not ready yet', 'Add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET as Edge Function secrets first.', 503);
    const state = rand(24);
    await db.from('ve_ig_oauth_state').insert({ state });
    const u = new URL('https://www.instagram.com/oauth/authorize');
    u.searchParams.set('client_id', S.INSTAGRAM_APP_ID); u.searchParams.set('redirect_uri', `${FN_URL}?action=callback`);
    u.searchParams.set('response_type', 'code'); u.searchParams.set('scope', SCOPES); u.searchParams.set('state', state);
    return Response.redirect(u.toString(), 302);
  }

  if (req.method === 'GET' && action === 'callback') {
    const code = (url.searchParams.get('code') || '').replace(/#_$/, ''), state = url.searchParams.get('state') || '';
    const { data: st } = await db.from('ve_ig_oauth_state').delete().eq('state', state).gte('created_at', new Date(Date.now() - 30 * 60000).toISOString()).select('state');
    if (!st || !st.length) return page('Link expired', 'Open the Connect Instagram link again.', 400);
    const form = new URLSearchParams({ client_id: S.INSTAGRAM_APP_ID, client_secret: S.INSTAGRAM_APP_SECRET, grant_type: 'authorization_code',
      redirect_uri: `${FN_URL}?action=callback`, code });
    const t1 = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
    const j1 = await t1.json().catch(() => ({}));
    if (!t1.ok || !j1.access_token) return page('Instagram said no', 'The code could not be exchanged. Try the Connect link again.', 400);
    const t2 = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(S.INSTAGRAM_APP_SECRET)}&access_token=${encodeURIComponent(j1.access_token)}`);
    const j2 = await t2.json().catch(() => ({}));
    const token = j2.access_token || j1.access_token;
    const me = await (await fetch(`${GRAPH}/me?fields=user_id,username`, { headers: { Authorization: `Bearer ${token}` } })).json().catch(() => ({}));
    if (String(me.username || '').toLowerCase() !== ACCOUNT) return page('Wrong account', `This only connects @${ACCOUNT}. Log out of Instagram and try again as @${ACCOUNT}.`, 403);
    await saveSecret('INSTAGRAM_TOKEN_VEGANSEXPLORE', token);
    await saveSecret('IG_USER_ID_VEGANSEXPLORE', String(me.user_id));
    await saveSecret('IG_TOKEN_EXPIRES_VEGANSEXPLORE', new Date(Date.now() + (Number(j2.expires_in) || 5184000) * 1000).toISOString());
    const sub = await fetch(`${GRAPH}/me/subscribed_apps?subscribed_fields=comments`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    return page('Connected', `@${ACCOUNT} is connected. Comment webhooks: ${sub.ok ? 'on' : 'not on yet (' + sub.status + ')'}. You can close this tab.`);
  }

  if (req.method === 'POST' && action) {
    const supplied = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!real(S.LESARUSS_ADMIN_TOKEN) || supplied !== S.LESARUSS_ADMIN_TOKEN) return json({ error: 'unauthorized' }, 401);
    if (action === 'dry') {
      const b = await req.json().catch(() => ({}));
      const kw = await matchKeyword(String(b.text || ''), b.media_id || null);
      return json({ matched: kw ? kw.keyword : null, dm: kw ? kw.dm_text.replace('{link}', `${SITE}/go/ig-xxxxxxx`) : null });
    }
    if (action === 'status') {
      const connected = real(S.INSTAGRAM_TOKEN_VEGANSEXPLORE);
      let me: Record<string, unknown> = {};
      if (connected) me = await (await fetch(`${GRAPH}/me?fields=user_id,username`, { headers: { Authorization: `Bearer ${S.INSTAGRAM_TOKEN_VEGANSEXPLORE}` } })).json().catch(() => ({}));
      return json({ app_id_set: real(S.INSTAGRAM_APP_ID), app_secret_set: real(S.INSTAGRAM_APP_SECRET), verify_token_set: real(S.IG_WEBHOOK_VERIFY_TOKEN),
        connected, username: me.username || null, token_error: (me as any).error?.message || null });
    }
    if (action === 'refresh') {
      if (!real(S.INSTAGRAM_TOKEN_VEGANSEXPLORE)) return json({ skipped: 'not connected' });
      const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(S.INSTAGRAM_TOKEN_VEGANSEXPLORE)}`);
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.access_token) return json({ error: 'refresh failed', status: r.status }, 502);
      await saveSecret('INSTAGRAM_TOKEN_VEGANSEXPLORE', j.access_token);
      await saveSecret('IG_TOKEN_EXPIRES_VEGANSEXPLORE', new Date(Date.now() + (Number(j.expires_in) || 5184000) * 1000).toISOString());
      return json({ refreshed: true });
    }
    return json({ error: 'unknown action' }, 400);
  }

  if (req.method === 'POST') {
    const raw = await req.text();
    const sig = (req.headers.get('x-hub-signature-256') || '').replace(/^sha256=/, '');
    const keys = [S.INSTAGRAM_APP_SECRET, S.META_APP_SECRET].filter(real);
    let ok = false;
    for (const k of keys) if (sig && safeEq(await hmacHex(k, raw), sig)) ok = true;
    if (!ok) return new Response('bad signature', { status: 401 });
    if (!real(S.INSTAGRAM_TOKEN_VEGANSEXPLORE) || !real(S.IG_USER_ID_VEGANSEXPLORE)) return json({ skipped: 'not connected' });
    const body = JSON.parse(raw || '{}');
    const results: string[] = [];
    for (const entry of body.entry || []) for (const ch of entry.changes || []) {
      if (ch.field === 'comments' && ch.value) results.push(await handleComment(ch.value, S.INSTAGRAM_TOKEN_VEGANSEXPLORE, S.IG_USER_ID_VEGANSEXPLORE));
    }
    return json({ ok: true, results });
  }

  return new Response('ve-ig-comments', { status: 200 });
});
