// ve-outreach: business outreach, city by city, approved by Sean (2026-10-10). Depot > Business outreach calls it.
// "I would like to be able to see who is on the queue, approve who the emails are going to be going out to... on Monday,
// we're sending it to these 60... I could even go in and see what the draft is that's going to be sent to them."
//
// Superadmin (Bearer <ve_token>), POST { action, ... }
//   overview                          cities (counts, switch, 15-day commitment), batches, templates
//   batch       { batch_id }          the businesses in a batch, with who they are and their page
//   waiting     { city }              Not sent yet and in no batch
//   preview     { contact_id }        the three emails exactly as they go out
//   plan        { city, start, sizes } propose batches: sizes[i] businesses on the i-th weekday from start
//   approve     { batch_id }          approves the batch (the whole sequence for those businesses)
//   cancel      { batch_id }          cancels a proposed batch; its businesses go back to waiting
//   remove      { contact_id, hold? } takes a business out of its batch (hold: never email it)
//   contact     { contact_id, email?, contact_name? }  fix a row before approving
//   city        { city, enabled }     the city's switch (nothing sends while it is off)
//   find_emails { city, limit? }      reads listings' own websites for a published email (never guessed)
//
// Nothing here sends mail. The sender (not built yet) sends what ve_outreach_due() returns: approved batches in cities
// that are switched on. verify_jwt is false on deploy; tokens are verified here the way ve-links does it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
async function adminId(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return data?.is_superadmin ? id : null;
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

// ---- Email finder: only what a business publishes on its own website ----
const SKIP_HOST = /(^|\.)(vegansexplore\.com|facebook\.com|instagram\.com|linktr\.ee|yelp\.com|google\.com|tiktok\.com)$/i;
const BAD_EMAIL = /\.(png|jpe?g|gif|webp|svg|css|js)$|@(example|domain|email|sentry|wixpress|sentry-next|godaddy|squarespace|shopify)\.|^(no-?reply|donotreply|privacy|legal|abuse|webmaster|careers|jobs|hr)@/i;
const GOOD_LOCAL = ['owner', 'hello', 'info', 'contact', 'catering', 'events', 'hi', 'team', 'orders', 'eat', 'office'];

function cfDecode(hex: string): string {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}
function emailsIn(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/mailto:([^"'?\s>]+)/gi)) found.add(decodeURIComponent(m[1]).toLowerCase());
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) found.add(cfDecode(m[1]).toLowerCase());
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&#64;|&commat;|\s?\[at\]\s?|\s?\(at\)\s?/gi, '@');
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) found.add(m[0].toLowerCase());
  return [...found].map((e) => e.replace(/^[.]+|[.]+$/g, '')).filter((e) => isEmail(e) && !BAD_EMAIL.test(e));
}
function best(emails: string[], host: string): string | null {
  const root = host.replace(/^www\./, '').split('.').slice(-2).join('.');
  const score = (e: string) => {
    const [local, dom] = e.split('@');
    let s = 0;
    if (dom.endsWith(root)) s += 10;
    else if (/^(gmail|yahoo|outlook|hotmail|icloud|aol)\./.test(dom)) s += 4;
    const i = GOOD_LOCAL.indexOf(local);
    if (i >= 0) s += 6 - i * 0.3;
    if (/press|media|marketing|pr$/.test(local)) s -= 3;
    return s;
  };
  return emails.sort((a, b) => score(b) - score(a))[0] || null;
}
async function fetchText(url: string): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VegansExploreDirectory/1.0; +https://vegansexplore.com/directory)', Accept: 'text/html' } });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('html')) return '';
    return (await r.text()).slice(0, 600_000);
  } catch { return ''; } finally { clearTimeout(t); }
}
async function lookup(website: string): Promise<{ email: string | null; source: string | null; note: string }> {
  let base: URL;
  try { base = new URL(/^https?:\/\//i.test(website) ? website : 'https://' + website); } catch { return { email: null, source: null, note: 'bad website' }; }
  if (SKIP_HOST.test(base.hostname)) return { email: null, source: null, note: 'no own website' };
  const home = base.origin + (base.pathname.length > 1 ? base.pathname : '/');
  const pages = [home, base.origin + '/contact', base.origin + '/contact-us', base.origin + '/about'];
  let opened = 0;
  for (const p of [...new Set(pages)]) {
    const html = await fetchText(p);
    if (!html) continue;
    opened++;
    const e = best(emailsIn(html), base.hostname);
    if (e) return { email: e, source: p, note: '' };
  }
  return { email: null, source: null, note: opened ? 'no email on site' : 'site did not open' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const me = await adminId(req);
    if (!me) return json({ error: 'admins_only' }, 403);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'overview') {
      const [{ data: cities }, { data: batches }, { data: templates }, { data: contacts }] = await Promise.all([
        db.from('ve_outreach_cities').select('community_slug,name,enabled,daily_cap,committed_until').order('name'),
        db.from('ve_outreach_batches').select('id,community_slug,send_on,status,approved_at').neq('status', 'cancelled').order('send_on'),
        db.from('ve_outreach_templates').select('step,day_offset,subject,body,status').order('step'),
        db.from('ve_outreach_contacts').select('community_slug,status,batch_id'),
      ]);
      const counts: Record<string, Record<string, number>> = {};
      const inBatch: Record<string, number> = {};
      for (const c of contacts || []) {
        const k = counts[c.community_slug] ||= {};
        const s = c.status === 'not_sent' && !c.batch_id ? 'waiting' : c.status;
        k[s] = (k[s] || 0) + 1;
        if (c.batch_id) inBatch[c.batch_id] = (inBatch[c.batch_id] || 0) + 1;
      }
      return json({ ok: true, today: today(), cities: (cities || []).map((c) => ({ ...c, counts: counts[c.community_slug] || {} })),
        batches: (batches || []).map((b) => ({ ...b, size: inBatch[b.id] || 0 })), templates });
    }

    if (action === 'batch' || action === 'waiting') {
      let q = db.from('ve_outreach_contacts').select('id,listing_id,community_slug,email,email_source,contact_name,segment,status,step,batch_id,notes');
      if (action === 'batch') { if (!isId(body.batch_id)) return json({ error: 'batch_id' }, 400); q = q.eq('batch_id', body.batch_id); }
      else q = q.eq('community_slug', clean(body.city, 60)).eq('status', 'not_sent').is('batch_id', null);
      const { data: rows } = await q.order('segment').order('created_at').limit(500);
      const ids = (rows || []).map((r) => r.listing_id);
      const { data: ls } = ids.length ? await db.from('listings')
        .select('id,name,slug,category,address_city,logo_url,tagline,brief_summary,vote_count,vegan_status,website,instagram')
        .in('id', ids) : { data: [] };
      const byId = new Map((ls || []).map((l) => [l.id, l]));
      const guides = await Promise.all(ids.map((id) => db.rpc('ve_outreach_guides', { p_listing: id })));
      return json({ ok: true, rows: (rows || []).map((r, i) => ({ ...r, listing: byId.get(r.listing_id) || null, guides: (guides[i].data || []).map((g: { title: string }) => g.title) })) });
    }

    if (action === 'preview') {
      if (!isId(body.contact_id)) return json({ error: 'contact_id' }, 400);
      const steps = await Promise.all([1, 2, 3].map((s) => db.rpc('ve_outreach_render', { p_contact: body.contact_id, p_step: s })));
      const { data: t } = await db.from('ve_outreach_templates').select('step,day_offset').order('step');
      return json({ ok: true, emails: steps.map((r, i) => ({ step: i + 1, day: t?.[i]?.day_offset ?? null, ...(r.data?.[0] || {}) })) });
    }

    if (action === 'plan') {
      const city = clean(body.city, 60), start = clean(body.start, 10);
      const sizes = (Array.isArray(body.sizes) ? body.sizes : []).map((n: unknown) => Math.max(0, Math.min(200, Math.floor(Number(n) || 0)))).filter((n: number) => n > 0).slice(0, 15);
      if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !sizes.length) return json({ error: 'city, start and sizes' }, 400);
      if (start < today()) return json({ error: 'start_in_past' }, 400);
      const { data, error } = await db.rpc('ve_outreach_plan', { p_city: city, p_start: start, p_sizes: sizes });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, planned: data });
    }

    if (action === 'approve' || action === 'cancel') {
      if (!isId(body.batch_id)) return json({ error: 'batch_id' }, 400);
      const { data: b } = await db.from('ve_outreach_batches').select('*').eq('id', body.batch_id).maybeSingle();
      if (!b || b.status !== 'proposed') return json({ error: 'not_proposed' }, 400);
      if (action === 'cancel') {
        await db.from('ve_outreach_contacts').update({ batch_id: null }).eq('batch_id', b.id);
        await db.from('ve_outreach_batches').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', b.id);
        return json({ ok: true });
      }
      await db.from('ve_outreach_batches').update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: me, updated_at: new Date().toISOString() }).eq('id', b.id);
      // The first approval in a city starts its 15-day commitment.
      const { data: c } = await db.from('ve_outreach_cities').select('committed_until').eq('community_slug', b.community_slug).single();
      if (!c?.committed_until) {
        const until = new Date(b.send_on + 'T12:00:00Z'); until.setUTCDate(until.getUTCDate() + 15);
        await db.from('ve_outreach_cities').update({ committed_until: until.toISOString().slice(0, 10), updated_at: new Date().toISOString() }).eq('community_slug', b.community_slug);
      }
      return json({ ok: true });
    }

    if (action === 'remove' || action === 'contact') {
      if (!isId(body.contact_id)) return json({ error: 'contact_id' }, 400);
      const { data: c } = await db.from('ve_outreach_contacts').select('id,status,batch_id').eq('id', body.contact_id).maybeSingle();
      if (!c || c.status !== 'not_sent') return json({ error: 'already_started' }, 400);
      if (c.batch_id) {
        const { data: b } = await db.from('ve_outreach_batches').select('status').eq('id', c.batch_id).single();
        if (b?.status !== 'proposed') return json({ error: 'batch_approved' }, 400);
      }
      const patch: Record<string, unknown> = {};
      if (action === 'remove') { patch.batch_id = null; if (body.hold) { patch.status = 'held'; patch.stop_reason = 'taken out by Sean'; } }
      else {
        const email = clean(body.email, 200).toLowerCase();
        if (email) { if (!isEmail(email)) return json({ error: 'bad_email' }, 400); patch.email = email; patch.email_source = 'typed in the Depot'; }
        if (typeof body.contact_name === 'string') patch.contact_name = clean(body.contact_name, 120) || null;
      }
      await db.from('ve_outreach_contacts').update(patch).eq('id', c.id);
      if (body.hold) await db.from('ve_outreach_events').insert({ contact_id: c.id, kind: 'status', detail: { status: 'held', by: me } });
      return json({ ok: true });
    }

    if (action === 'city') {
      const city = clean(body.city, 60);
      const { error } = await db.from('ve_outreach_cities').update({ enabled: !!body.enabled, enabled_at: body.enabled ? new Date().toISOString() : null, enabled_by: me, updated_at: new Date().toISOString() }).eq('community_slug', city);
      return error ? json({ error: error.message }, 400) : json({ ok: true });
    }

    if (action === 'find_emails') {
      const city = clean(body.city, 60);
      const limit = Math.max(1, Math.min(30, Number(body.limit) || 20));
      const { data: oc } = await db.from('ve_outreach_cities').select('*').eq('community_slug', city).maybeSingle();
      if (!oc) return json({ error: 'city' }, 400);
      const { data: tried } = await db.from('ve_outreach_lookups').select('listing_id');
      const { data: have } = await db.from('ve_outreach_contacts').select('listing_id');
      const skip = new Set([...(tried || []), ...(have || [])].map((r) => r.listing_id));
      let q = db.from('listings').select('id,name,website,category,address_city,address_state').eq('status', 'approved')
        .is('owner_member_id', null).is('claimed_by_member_id', null).not('website', 'is', null).limit(1000);
      if (city === 'brands') q = q.in('category', ['Food Brands', 'Brands']);
      else { if (oc.cities) q = q.in('address_city', oc.cities); if (oc.states) q = q.in('address_state', oc.states); }
      const { data: ls } = await q;
      const todo = (ls || []).filter((l) => !skip.has(l.id) && l.website && (city === 'brands' || !['Food Brands', 'Brands'].includes(l.category))).slice(0, limit);
      const out: { name: string; email: string | null; note: string }[] = [];
      for (let i = 0; i < todo.length; i += 6) {
        await Promise.all(todo.slice(i, i + 6).map(async (l) => {
          const r = await lookup(l.website);
          await db.from('ve_outreach_lookups').upsert({ listing_id: l.id, tried_at: new Date().toISOString(), email: r.email, source_url: r.source, note: r.note });
          if (r.email) {
            await db.from('ve_outreach_contacts').insert({ listing_id: l.id, community_slug: city, email: r.email, segment: city === 'brands' ? 'brand' : 'business', email_source: r.source });
          }
          out.push({ name: l.name, email: r.email, note: r.note });
        }));
      }
      const left = (ls || []).filter((l) => !skip.has(l.id) && l.website).length - todo.length;
      return json({ ok: true, checked: out.length, found: out.filter((o) => o.email).length, left: Math.max(0, left), results: out });
    }

    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
