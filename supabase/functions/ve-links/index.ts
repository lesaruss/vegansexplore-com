// ve-links: tracked links and the interest they record (Sean, 2026-10-04: "anytime somebody clicks a
// link, you should be noting that to show people who are interested in a particular campaign ...
// attach it to a tag that can be read in this initiative interest").
//
// Public
//   POST { action: 'click', code, ua, referrer, method }   from /api/go (vegansexplore.com/go/<code>)
//        -> { destination }  logs the click; a real click by a known person records interest
//   POST { action: 'claim', click_id }  Bearer <ve_token>   from nav.js: a signed-in member who
//        arrived through a link (now, or up to 30 days ago before signing in) is named on it
// Superadmin (Bearer <ve_token>)
//   POST { action: 'list' }        links, campaigns and tags in use
//   POST { action: 'create', label, destination, initiative_slug, tags, channel, code?, people? }
//        people: [{ name, email }] makes one personal link each (one-on-one messages)
//   POST { action: 'update', id, active?, tags?, label? }
//   POST { action: 'audience', initiative_slug?, tag? }   initiative interest with tags, for sends
// Cron (x-cron-secret, every 15 minutes)
//   POST { action: 'sync_email' }  email-system clicks on our links become interest by recipient
//
// verify_jwt is false on deploy; tokens are verified here the way ve-board and ve-bounties do it.
// ve_links, ve_link_clicks and ve_initiative_interest are RLS-on with no policies.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const SITE = 'https://vegansexplore.com';
const VE_TENANT_ID = '00000000-0000-4000-a000-000000000002';
const CLAIM_DAYS = 30;
// Link previews (iMessage, Slack, WhatsApp...), mail scanners and scripts. Logged, never counted.
const BOT_UA = /bot|crawl|spider|preview|facebookexternalhit|facebot|slack|whatsapp|telegram|discord|skype|linkedin|embedly|quora|pinterest|vkshare|google-|bingpreview|outlook|ms-office|microsoft office|proofpoint|mimecast|barracuda|symantec|headless|python|curl|wget|go-http|axios|node-fetch|okhttp|java\//i;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
async function viewerId(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return token ? await verifyToken(token) : null;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const slug = (s: string, max = 40) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/, '');
function cleanTags(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  return [...new Set(arr.map((t) => slug(String(t), 40)).filter(Boolean))].slice(0, 12);
}
function randomCode(n = 5) {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}
function absolute(dest: string) { return dest.startsWith('/') ? SITE + dest : dest; }
// Our own pages get ?vl=<click id> so a signed-in member can be named on the click (nav.js).
function withClick(dest: string, clickId: string) {
  try {
    const u = new URL(absolute(dest));
    if (u.hostname === 'vegansexplore.com' || u.hostname.endsWith('.vegansexplore.com')) u.searchParams.set('vl', clickId);
    return u.toString();
  } catch { return absolute(dest); }
}

type Who = { member_id: string | null; email: string | null; name: string | null };
async function memberByEmail(email: string) {
  const { data } = await db.from('members').select('id, name, email').eq('tenant_id', VE_TENANT_ID).ilike('email', email).is('merged_into_member_id', null).limit(1).maybeSingle();
  return data;
}
// One link_click interest row per person per campaign; repeat clicks add up and merge tags.
async function recordInterest(initiative: string, who: Who, tags: string[], source: 'link' | 'email', linkId: string | null, label: string | null, at: string) {
  if (!who.member_id && !who.email) return;
  if (who.member_id && (!who.email || !who.name)) {
    const { data: m } = await db.from('members').select('name, email').eq('id', who.member_id).maybeSingle();
    if (m) { who.email = who.email || m.email; who.name = who.name || m.name; }
  } else if (!who.member_id && who.email) {
    const m = await memberByEmail(who.email);
    if (m) { who.member_id = m.id; who.name = who.name || m.name; }
  }
  let q = db.from('ve_initiative_interest').select('id, tags, clicks, member_id, email, name').eq('initiative_slug', initiative).eq('action_type', 'link_click');
  q = who.member_id && who.email ? q.or(`member_id.eq.${who.member_id},email.ilike."${who.email.replace(/[",()\\]/g, '')}"`)
    : who.member_id ? q.eq('member_id', who.member_id) : q.ilike('email', who.email!);
  const { data: rows } = await q.limit(1);
  const row = rows && rows[0];
  if (row) {
    await db.from('ve_initiative_interest').update({
      clicks: (row.clicks || 0) + 1, last_click_at: at,
      tags: [...new Set([...(row.tags || []), ...tags])],
      member_id: row.member_id || who.member_id, email: row.email || who.email, name: row.name || who.name,
    }).eq('id', row.id);
  } else {
    await db.from('ve_initiative_interest').insert({
      initiative_slug: initiative, action_type: 'link_click', status: 'new', source, link_id: linkId,
      member_id: who.member_id, email: who.email, name: who.name, tags, clicks: 1, last_click_at: at,
      note: label ? `Clicked: ${label}`.slice(0, 500) : null,
    });
  }
}

async function isAdmin(id: string | null) {
  if (!id) return false;
  const { data } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return !!data?.is_superadmin;
}

// Campaign pages a plain (untracked) link in an email can point at, mapped to their campaign. Pages
// shared by several campaigns (the 2026 initiatives list) are left out: they don't say which one.
async function campaignPaths(): Promise<Record<string, string>> {
  const { data } = await db.from('campaigns').select('initiative_slug, capsule_content').not('initiative_slug', 'is', null);
  const count: Record<string, number> = {}, map: Record<string, string> = {};
  (data || []).forEach((c: any) => { const p = c.capsule_content?.path; if (p) { count[p] = (count[p] || 0) + 1; map[p] = c.initiative_slug; } });
  Object.keys(count).forEach((p) => { if (count[p] > 1) delete map[p]; });
  return map;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'click') {
      const code = slug(clean(body.code, 60), 48);
      const fallback = { destination: SITE + '/' };
      if (!code) return json(fallback);
      const { data: link } = await db.from('ve_links').select('*').eq('code', code).maybeSingle();
      if (!link) return json(fallback);
      if (!link.active) return json({ destination: absolute(link.destination) });
      const ua = clean(body.ua, 400);
      const bot = !ua || BOT_UA.test(ua) || String(body.method || 'GET').toUpperCase() === 'HEAD';
      const at = new Date().toISOString();
      const { data: click } = await db.from('ve_link_clicks').insert({
        link_id: link.id, initiative_slug: link.initiative_slug, member_id: link.recipient_member_id, email: link.recipient_email,
        source: 'click', is_bot: bot, user_agent: ua || null, referrer: clean(body.referrer, 400) || null,
      }).select('id').single();
      if (bot) return json({ destination: absolute(link.destination) });
      await db.from('ve_links').update({ clicks: (link.clicks || 0) + 1, last_click_at: at }).eq('id', link.id);
      if (link.recipient_member_id || link.recipient_email) {
        await recordInterest(link.initiative_slug, { member_id: link.recipient_member_id, email: link.recipient_email, name: link.recipient_name }, link.tags || [], 'link', link.id, link.label, at);
      }
      return json({ destination: click ? withClick(link.destination, click.id) : absolute(link.destination) });
    }

    if (action === 'claim') {
      const me = await viewerId(req);
      if (!me) return json({ error: 'Sign in again.' }, 401);
      if (!isId(body.click_id)) return json({ error: 'bad click' }, 400);
      const { data: c } = await db.from('ve_link_clicks').select('id, link_id, member_id, claimed_at, clicked_at, is_bot').eq('id', body.click_id).maybeSingle();
      if (!c || c.is_bot || c.claimed_at) return json({ ok: true, claimed: false });
      if (Date.now() - new Date(c.clicked_at).getTime() > CLAIM_DAYS * 86400000) return json({ ok: true, claimed: false });
      if (c.member_id && c.member_id !== me) return json({ ok: true, claimed: false }); // a personal link, someone else's
      const { data: link } = await db.from('ve_links').select('id, initiative_slug, tags, label').eq('id', c.link_id).maybeSingle();
      await db.from('ve_link_clicks').update({ member_id: me, claimed_at: new Date().toISOString() }).eq('id', c.id);
      if (link) await recordInterest(link.initiative_slug, { member_id: me, email: null, name: null }, link.tags || [], 'link', link.id, link.label, c.clicked_at);
      return json({ ok: true, claimed: true });
    }

    if (action === 'sync_email') {
      const { data: sec } = await db.from('lesaruss_secrets').select('value').eq('key', 'CRON_SECRET').maybeSingle();
      const cronOk = !!sec?.value && req.headers.get('x-cron-secret') === sec.value;
      if (!cronOk && !(await isAdmin(await viewerId(req)))) return json({ error: 'forbidden' }, 403);
      const since = new Date(Date.now() - (Number(body.days) > 0 ? Math.min(Number(body.days), 60) : 2) * 86400000).toISOString();
      const { data: events, error } = await db.from('email_event_facts')
        .select('event_id, to_email, link, at').eq('event_type', 'email.clicked').is('machine_reason', null)
        .eq('link_kind', 'content').ilike('link', '%vegansexplore.com%').gte('at', since).limit(2000);
      if (error) throw new Error(error.message);
      const paths = await campaignPaths();
      let recorded = 0;
      for (const e of events || []) {
        let u: URL; try { u = new URL(e.link); } catch { continue; }
        if (!/(^|\.)vegansexplore\.com$/.test(u.hostname) || !e.to_email || !isEmail(e.to_email)) continue;
        const path = u.pathname.replace(/\/+$/, '') || '/';
        let link: any = null, initiative: string | null = null;
        const go = path.match(/^\/go\/([a-z0-9-]+)$/i);
        if (go) {
          const { data } = await db.from('ve_links').select('id, initiative_slug, tags, label').eq('code', go[1].toLowerCase()).maybeSingle();
          link = data; initiative = data?.initiative_slug || null;
        } else {
          initiative = paths[path] || null;
        }
        if (!initiative) continue;
        // One row per email click event: re-running the sync never double counts.
        const { data: ins } = await db.from('ve_link_clicks').upsert({
          email_event_id: e.event_id, link_id: link?.id || null, initiative_slug: initiative, email: e.to_email.toLowerCase(), source: 'email', clicked_at: e.at,
        }, { onConflict: 'email_event_id', ignoreDuplicates: true }).select('id');
        if (!ins || !ins.length) continue;
        await recordInterest(initiative, { member_id: null, email: e.to_email.toLowerCase(), name: null }, link?.tags || [], 'email', link?.id || null, link?.label || null, e.at);
        recorded++;
      }
      return json({ ok: true, scanned: (events || []).length, recorded });
    }

    // Everything below is for superadmins.
    const me = await viewerId(req);
    if (!me) return json({ error: 'Sign in again.' }, 401);
    if (!(await isAdmin(me))) return json({ error: 'Superadmin only.' }, 403);

    if (action === 'list') {
      const [{ data: links }, { data: camps }, { data: tagRows }] = await Promise.all([
        db.from('ve_links').select('id, code, label, destination, initiative_slug, tags, channel, recipient_name, recipient_email, batch_id, active, clicks, last_click_at, created_at').order('created_at', { ascending: false }).limit(500),
        db.from('campaigns').select('initiative_slug, capsule_content, status').not('initiative_slug', 'is', null),
        db.from('ve_initiative_interest').select('tags').neq('tags', '{}').limit(2000),
      ]);
      const tags = new Set<string>();
      (links || []).forEach((l: any) => (l.tags || []).forEach((t: string) => tags.add(t)));
      (tagRows || []).forEach((r: any) => (r.tags || []).forEach((t: string) => tags.add(t)));
      return json({
        ok: true, site: SITE, links: links || [], tags: [...tags].sort(),
        campaigns: (camps || []).map((c: any) => ({ slug: c.initiative_slug, title: c.capsule_content?.title || c.initiative_slug, path: c.capsule_content?.path || null, status: c.status })),
      });
    }

    if (action === 'create') {
      const label = clean(body.label, 120);
      let destination = clean(body.destination, 1000);
      const initiative = slug(clean(body.initiative_slug, 120), 120) || 'general';
      const tags = cleanTags(body.tags);
      const channel = ['dm', 'text', 'email', 'social', 'print', 'other'].includes(body.channel) ? body.channel : 'dm';
      if (!label) return json({ error: 'Give the link a name.' }, 400);
      if (!destination) return json({ error: 'Where should the link go?' }, 400);
      if (!/^https?:\/\//i.test(destination) && !destination.startsWith('/')) destination = '/' + destination.replace(/^\/+/, '');
      const people: Who[] = (Array.isArray(body.people) ? body.people : []).slice(0, 200).map((p: any) => {
        const email = clean(p?.email, 200).toLowerCase();
        return { member_id: null, email: isEmail(email) ? email : null, name: clean(p?.name, 120) || null };
      }).filter((p: Who) => p.email || p.name);
      const base = slug(clean(body.code, 48), 40) || slug(label, 24) || 'link';
      const batch = people.length ? crypto.randomUUID() : null;
      const rows: any[] = [];
      const targets: (Who | null)[] = people.length ? people : [null];
      for (const p of targets) {
        if (p?.email) { const m = await memberByEmail(p.email); if (m) { p.member_id = m.id; p.name = p.name || m.name; } }
        rows.push({
          code: '', label: p ? `${label} · ${p.name || p.email}`.slice(0, 120) : label, destination, initiative_slug: initiative, tags, channel,
          recipient_member_id: p?.member_id || null, recipient_email: p?.email || null, recipient_name: p?.name || null,
          batch_id: batch, created_by: me,
        });
      }
      // A custom code is used as is for a single shared link; personal links get a short suffix.
      const out: any[] = [];
      for (const r of rows) {
        let tries = 0, inserted = null, lastErr = '';
        while (!inserted && tries < 6) {
          r.code = (rows.length === 1 && body.code && tries === 0) ? base : `${base}-${randomCode(tries < 3 ? 4 : 6)}`;
          const { data, error } = await db.from('ve_links').insert(r).select('id, code, label, destination, initiative_slug, tags, channel, recipient_name, recipient_email, batch_id, active, clicks, last_click_at, created_at').single();
          if (data) inserted = data; else { lastErr = error?.message || ''; if (!/duplicate|unique/i.test(lastErr)) break; }
          tries++;
        }
        if (!inserted) return json({ error: /duplicate|unique/i.test(lastErr) ? 'That code is taken. Try another.' : 'Could not create the link.' }, 400);
        out.push(inserted);
      }
      return json({ ok: true, links: out });
    }

    if (action === 'update') {
      if (!isId(body.id)) return json({ error: 'bad id' }, 400);
      const patch: Record<string, unknown> = {};
      if (typeof body.active === 'boolean') patch.active = body.active;
      if (body.tags !== undefined) patch.tags = cleanTags(body.tags);
      if (typeof body.label === 'string' && clean(body.label, 120)) patch.label = clean(body.label, 120);
      if (!Object.keys(patch).length) return json({ error: 'nothing to change' }, 400);
      const { data, error } = await db.from('ve_links').update(patch).eq('id', body.id).select('id, active, tags, label').single();
      if (error) throw new Error(error.message);
      return json({ ok: true, link: data });
    }

    if (action === 'audience') {
      let q = db.from('ve_initiative_interest')
        .select('id, initiative_slug, action_type, tier_label, amount, note, status, created_at, email, name, tags, source, clicks, last_click_at, member_id, members(name, email)')
        .order('created_at', { ascending: false }).limit(5000);
      if (body.initiative_slug) q = q.eq('initiative_slug', clean(body.initiative_slug, 120));
      if (body.tag) q = q.contains('tags', [slug(clean(body.tag, 40))]);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return json({ ok: true, items: (data || []).map((r: any) => ({ ...r, who: r.members?.name || r.name || null, email: r.members?.email || r.email || null, members: undefined })) });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('ve-links', e);
    return json({ error: 'Something went wrong.' }, 500);
  }
});
