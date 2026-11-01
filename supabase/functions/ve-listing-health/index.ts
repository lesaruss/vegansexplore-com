// ve-listing-health: the listing check in Sean's order (2026-11-01; migration 20261101_listing_health.sql).
// Google first (closed places are already off: the nightly hold and the Monday re-check), then the website (up, and a working
// https), then Instagram (a post in the last 6 months) for a place whose website failed. A place that fails both is held for review
// ("Listing check") and gets a still-open bounty in its chapter; held places are read again weekly and put back when they pass.
//
// POST { action: 'sweep', limit? }      cron (x-cron-secret) or ops -> { checked, held, back, flagged, results }
// POST { action: 'one', slug, save? }   ops or a super admin -> the check for one listing (save: false only reads)
// POST { action: 'support' }            super admin -> places flagged for support, newest first
// POST { action: 'support_done', listing_id }   super admin
// Ops is Bearer <LESARUSS_ADMIN_TOKEN>. verify_jwt is false; the member token is HMAC-checked here like ve-restaurant-audit.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const DAY = 86400000;
const IG_GRACE_DAYS = 180;      // Sean: "a grace of 6 months"
const RECHECK_HELD_DAYS = 7;
const RECHECK_DAYS = 30;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

const secrets: Record<string, string | null> = {};
async function secret(k: string) {
  if (k in secrets) return secrets[k];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', k).maybeSingle();
  const v = (data?.value as string) ?? null;
  return (secrets[k] = v && v !== 'pending' ? v : null);
}
function b64u(s: string) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
// The VE app token, checked the same way ve-restaurant-audit checks it.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64u(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64u(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function who(req: Request): Promise<{ ops: boolean; admin: boolean }> {
  const cron = req.headers.get('x-cron-secret');
  if (cron && cron === await secret('CRON_SECRET')) return { ops: true, admin: false };
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return { ops: false, admin: false };
  if (t === await secret('LESARUSS_ADMIN_TOKEN')) return { ops: true, admin: false };
  const id = await verifyToken(t);
  if (!id) return { ops: false, admin: false };
  const { data } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return { ops: false, admin: !!data?.is_superadmin };
}

// ---- The website ----
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const PARKED = /(domain (is )?for sale|buy this domain|this domain (may be|is) for sale|hugedomains|dan\.com|sedo(parking)?|parked (free|domain)|domain parking|godaddy\.com\/domain|website (has )?expired|account (has been )?suspended|this site can.t be reached|future home of|coming soon.{0,40}(godaddy|wordpress)|site not found|no site (is )?configured)/i;
const BLOCKS = [401, 403, 406, 429, 503];
type Fetched = { ok: boolean; status: number; url: string; text: string; err: string };
async function fetchOnce(url: string, ms = 15000): Promise<Fetched> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' } });
    const type = r.headers.get('content-type') || '';
    const text = /text|html/i.test(type) || !type ? (await r.text()).slice(0, 400000) : (await r.body?.cancel(), '');
    return { ok: r.ok, status: r.status, url: r.url || url, text, err: '' };
  } catch (e) {
    const m = String((e as Error)?.message || e);
    return { ok: false, status: 0, url, text: '', err: (e as Error)?.name === 'AbortError' ? 'timed out' : m.slice(0, 200) };
  } finally { clearTimeout(t); }
}
function norm(u: string) {
  let s = String(u || '').trim(); if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  try { return new URL(s).toString(); } catch { return ''; }
}
const isCertError = (m: string) => /certificate|cert|tls|ssl|handshake|UnknownIssuer|NotValidForName|Expired/i.test(m);
async function checkWebsite(raw: string): Promise<{ status: string; detail: string; https: boolean | null }> {
  const url = norm(raw);
  if (!url) return { status: 'none', detail: 'No website on the listing', https: null };
  const u = new URL(url);
  const httpsUrl = 'https://' + u.host + u.pathname + u.search;
  const a = await fetchOnce(httpsUrl);
  if (a.ok) {
    const final = new URL(a.url);
    if (final.protocol !== 'https:') return { status: 'insecure', detail: `It sends visitors to an unsecured page (${final.host})`, https: false };
    const title = (a.text.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] || '').trim();
    if (PARKED.test(title) || PARKED.test(a.text.slice(0, 20000))) return { status: 'down', detail: `The domain is parked or for sale (${final.host})`, https: true };
    return { status: 'ok', detail: `Opens securely${final.host !== u.host ? ' at ' + final.host : ''}`, https: true };
  }
  if (BLOCKS.includes(a.status)) return { status: 'blocked', detail: `It turns away automated checks (status ${a.status}); a visitor sees it`, https: true };
  if (a.status === 0 && isCertError(a.err)) {
    const b = await fetchOnce('http://' + u.host + u.pathname + u.search);
    return { status: 'insecure', detail: b.ok ? 'Its security certificate does not work; it opens only without https' : 'Its security certificate does not work', https: false };
  }
  if (a.status === 0) {
    const b = await fetchOnce('http://' + u.host + u.pathname + u.search);
    if (b.ok && new URL(b.url).protocol === 'http:') return { status: 'insecure', detail: 'It opens only without https (no security certificate)', https: false };
    if (b.ok) return { status: 'ok', detail: 'Opens securely', https: true };
    if (/dns|lookup|resolve|not known|getaddrinfo|name or service/i.test(a.err)) return { status: 'down', detail: 'The web address no longer exists', https: null };
    if (/refused|reset|unreachable|no route/i.test(a.err)) return { status: 'down', detail: 'Nothing answers at that web address', https: null };
    // A slow answer or a protocol error (big sites behind Akamai answer scanners with http2 stream errors) is not a dead site:
    // it is read again tomorrow, never held on one try.
    return { status: 'unknown', detail: a.err === 'timed out' ? 'It was too slow to answer this time' : 'It refused our check this time', https: null };
  }
  if ([404, 410].includes(a.status) || a.status >= 500) return { status: 'down', detail: `It did not open (status ${a.status})`, https: true };
  return { status: 'unknown', detail: `It answered with status ${a.status}`, https: true };
}

// ---- Instagram (Apify's public profile scraper, many at once) ----
const TEMPLATE = new Set(['wix', 'wixcom', 'squarespace', 'godaddy', 'shopify', 'wordpress', 'weebly', 'webflow', 'toasttab', 'instagram', 'meta', 'username']);
function igHandle(v: string) {
  const s = String(v || '').trim(); if (!s) return '';
  const m = s.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const h = (m ? m[1] : s.replace(/^@/, '')).replace(/[/?#].*$/, '').toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(h) && !['p', 'reel', 'explore', 'stories'].includes(h) && !TEMPLATE.has(h.replace(/[._-]/g, '')) ? h : '';
}
async function instagramMany(handles: string[]): Promise<Record<string, { status: string; last: string | null }>> {
  const out: Record<string, { status: string; last: string | null }> = {};
  if (!handles.length) return out;
  const token = await secret('APIFY_API_TOKEN');
  if (!token) { for (const h of handles) out[h] = { status: 'error', last: null }; return out; }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 110000);
  try {
    const r = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${token}&timeout=100`, {
      method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: handles }),
    });
    const rows = r.ok ? (await r.json()) as any[] : [];
    for (const h of handles) {
      const p = rows.find((x) => String(x.username || x.inputUrl || '').toLowerCase().includes(h));
      if (!r.ok) { out[h] = { status: 'error', last: null }; continue; }
      if (!p || p.error === 'not_found') { out[h] = { status: 'none', last: null }; continue; }
      if (p.error) { out[h] = { status: 'error', last: null }; continue; }
      if (p.private) { out[h] = { status: 'private', last: null }; continue; }
      const last = (p.latestPosts || []).map((x: any) => Date.parse(x.timestamp)).filter((n: number) => n > 0).sort((a: number, b: number) => b - a)[0];
      out[h] = { status: last && last > Date.now() - IG_GRACE_DAYS * DAY ? 'active' : 'quiet', last: last ? new Date(last).toISOString() : null };
    }
  } catch { for (const h of handles) out[h] = out[h] || { status: 'error', last: null }; }
  finally { clearTimeout(t); }
  return out;
}

// ---- Run a batch ----
type Row = { listing_id: string; slug: string; name: string; website: string; instagram: string | null; status: string; protected: boolean };
const day = () => new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
async function run(rows: Row[], save: boolean) {
  const webs = await pool(rows, 8, (r) => checkWebsite(r.website));
  const need = rows.map((r, i) => ({ r, w: webs[i], h: igHandle(r.instagram || '') })).filter((x) => (x.w.status === 'down' || x.w.status === 'insecure') && x.h);
  const ig = await instagramMany([...new Set(need.map((x) => x.h))]);
  const { data: prev } = await db.from('ve_listing_health').select('*').in('listing_id', rows.map((r) => r.listing_id));
  const before = new Map((prev || []).map((p: any) => [p.listing_id, p]));
  const results: any[] = []; let held = 0, back = 0, flagged = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], w = webs[i], h = igHandle(r.instagram || ''), g = h ? ig[h] : null;
    const webFail = w.status === 'down' || w.status === 'insecure';
    const igStatus = !webFail ? 'skipped' : (h ? (g?.status || 'error') : 'none');
    const reasons: string[] = [];
    if (webFail) reasons.push(w.status === 'insecure' ? 'The website has no working security' : 'The website did not open');
    if (webFail && igStatus === 'quiet') reasons.push('No Instagram post in 6 months');
    if (webFail && (igStatus === 'none' || igStatus === 'private')) reasons.push('No active Instagram to check');
    // An Instagram that could not be read this time is not held on: it is read again next run.
    const verdict = w.status === 'unknown' ? 'unknown' : !webFail ? 'pass' : igStatus === 'active' ? 'pass' : igStatus === 'error' ? 'unknown' : 'review';
    const p: any = before.get(r.listing_id) || {};
    const rec: any = {
      listing_id: r.listing_id, checked_at: new Date().toISOString(), website: r.website, web_status: w.status, web_detail: w.detail, https_ok: w.https,
      ig_handle: h || null, ig_status: igStatus, ig_last_post: g?.last || null, ig_checked_at: webFail && h ? new Date().toISOString() : p.ig_checked_at || null,
      verdict, reasons, held_at: p.held_at || null,
      history: [...(p.history || []).slice(-11), { at: new Date().toISOString(), web: w.status, ig: igStatus, verdict }],
    };
    let action = '';
    if (save) {
      if (r.status === 'pending' && verdict === 'pass') {
        const why = w.status === 'ok' || w.status === 'blocked' ? 'its website works again' : 'it posted on Instagram in the last 6 months';
        await db.rpc('ve_listing_set_state', { p_listing: r.listing_id, p_state: 'live', p_by: null, p_note: `Listing check, ${day()}: ${why}.`, p_reasons: null });
        rec.held_at = null; back++; action = 'back';
        await db.rpc('ve_listing_support_flag', { p_listing: r.listing_id, p_why: `Back on the Directory after the listing check: ${why}.` });
      } else if (r.status === 'approved' && verdict === 'review') {
        if (r.protected) {
          await db.rpc('ve_listing_support_flag', { p_listing: r.listing_id, p_why: reasons.join('; ') + ' (claimed or put back by hand, so not held).' });
          flagged++; action = 'flagged';
        } else {
          const { data: st } = await db.rpc('ve_listing_set_state', { p_listing: r.listing_id, p_state: 'hold', p_by: null, p_note: null, p_reasons: reasons });
          if (st?.ok) {
            const { data: l } = await db.from('listings').select('details').eq('id', r.listing_id).maybeSingle();
            const d = l?.details || {}; if (d.review) { d.review.by = 'Listing check'; await db.from('listings').update({ details: d }).eq('id', r.listing_id); }
            rec.held_at = new Date().toISOString(); held++; action = 'held';
            await db.rpc('ve_listing_still_open_bounty', { p_listing: r.listing_id });
          }
        }
      } else if (r.status === 'approved' && webFail && verdict === 'pass') {
        await db.rpc('ve_listing_support_flag', { p_listing: r.listing_id, p_why: `${reasons[0]}, but it posts on Instagram: help them fix the website.` });
        flagged++; action = 'flagged';
      }
      const heldNow = rec.held_at && action !== 'back';
      rec.next_check_at = new Date(Date.now() + (heldNow || verdict === 'unknown' ? (verdict === 'unknown' ? 1 : RECHECK_HELD_DAYS) : RECHECK_DAYS) * DAY).toISOString();
      await db.from('ve_listing_health').upsert(rec, { onConflict: 'listing_id' });
    }
    results.push({ slug: r.slug, name: r.name, website: w, instagram: h ? { handle: h, status: igStatus, last: g?.last || null } : null, verdict, reasons, action });
  }
  return { checked: rows.length, held, back, flagged, results };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  let body: any = {}; try { body = await req.json(); } catch { /* empty */ }
  const me = await who(req);
  const action = String(body.action || '');
  try {
    if (action === 'sweep') {
      if (!me.ops) return json({ error: 'not_allowed' }, 403);
      const { data, error } = await db.rpc('ve_listing_health_due', { p_limit: Math.min(Number(body.limit) || 25, 60) });
      if (error) return json({ error: error.message }, 500);
      return json(await run((data || []) as Row[], true));
    }
    if (action === 'one') {
      if (!me.ops && !me.admin) return json({ error: 'not_allowed' }, 403);
      const { data: l } = await db.from('listings').select('id, slug, name, website, instagram, status, claim_status, owner_member_id, claimed_by_member_id, details').eq('slug', String(body.slug || '')).in('status', ['approved', 'pending']).limit(1).maybeSingle();
      if (!l) return json({ error: 'not_found' }, 404);
      const prot = l.claim_status === 'verified' || !!l.owner_member_id || !!l.claimed_by_member_id || ((l.details?.review_ok_until || '') >= new Date().toISOString().slice(0, 10));
      return json(await run([{ listing_id: l.id, slug: l.slug, name: l.name, website: l.website || '', instagram: l.instagram, status: l.status, protected: prot }], body.save !== false));
    }
    if (action === 'support' || action === 'support_done') {
      if (!me.ops && !me.admin) return json({ error: 'not_allowed' }, 403);
      if (action === 'support_done') {
        await db.from('ve_listing_health').update({ support_done_at: new Date().toISOString() }).eq('listing_id', String(body.listing_id || ''));
        return json({ ok: true });
      }
      const { data } = await db.from('ve_listing_health').select('listing_id, support_at, support_why, web_status, web_detail, ig_status, ig_last_post, listings(slug, name, address_city, address_state, website, instagram, status)')
        .not('support_at', 'is', null).is('support_done_at', null).order('support_at', { ascending: false }).limit(300);
      return json({ support: data || [] });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) { return json({ error: String((e as Error)?.message || e) }, 500); }
});
