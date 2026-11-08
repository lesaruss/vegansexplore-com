// ve-listing-requests: the Directory's standing listing-request queue (ve-community-directory T3; Sean, 2026-11-06, Blueprint idea f8adc4c3:
// "the Directory Playbook is always processing new listing requests... Just me [straight in]. Everyone else goes into a queue that shows on
// my dashboard... Work first so I can decide if it goes on the directory or in the vetting section or removed").
//
// POST { action: 'submit', name?, where?, link?, note?, email?, contact_name?, visitor?, page_url? }
//   Anyone. A super admin's token makes it Sean's (source sean: straight to work, finished by Logan, never on For you); a member's token
//   source member; else visitor (an email or a visitor id needed). 5 a sender a day, 100 a day in all (ve_site_settings listing_requests).
// POST { action: 'research', n? }   the cron (x-cron-secret) or a super admin: drafts up to 3 'new' requests. Each is read by
//   ve-listing-intake (the link, an Instagram profile, the website; Claude writes down only what the sources show), checked against the
//   Directory for a listing it already has, and saved as a quarantined draft listing (crawl_source listing-request). No Google calls.
//   At most daily_reads a day.
// POST { action: 'queue' }   a super admin: drafted requests from everyone but Sean (For you), and counts.
// POST { action: 'decide', id, decision: 'publish'|'vetting'|'remove', note? }   a super admin:
//   publish -> the draft goes live and vetted by us; vetting -> a food place with Vegan options or Vegan friendly goes to Being vetted
//   (live, members only until 10 member votes), anything else On hold for review in Directory review; remove -> the draft is set aside
//   (status rejected, never deleted).
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const VE_TENANT = '00000000-0000-4000-a000-000000000002';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clean = (v: unknown, n: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const FOOD = ['Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep'];
const VEGAN = ['fully_vegan', 'vegan_options', 'vegan_friendly'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  return v && v !== 'pending' ? v : null;
}
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'listing_requests').maybeSingle();
  const v = (data?.value || {}) as any;
  return { daily_reads: +v.daily_reads || 20, per_sender_day: +v.per_sender_day || 5, per_day: +v.per_day || 100 };
}
const dayAgo = () => new Date(Date.now() - 864e5).toISOString();
const norm = (s: string) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');
const handleOf = (v: string) => { const m = String(v || '').match(/@?([A-Za-z0-9._]{2,30})\/?$/); return m ? m[1].toLowerCase() : ''; };
function slugBase(name: string) { return name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'listing'; }
async function freeSlug(name: string) {
  const base = slugBase(name);
  const { data } = await db.from('listings').select('slug').like('slug', base + '%');
  const taken = new Set((data || []).map((x: any) => x.slug));
  let s = base, n = 2;
  while (taken.has(s)) s = `${base}-${n++}`;
  return s;
}

// One request read and drafted.
async function researchOne(r: any, cronSecret: string) {
  await db.from('ve_listing_requests').update({ attempts: (r.attempts || 0) + 1 }).eq('id', r.id);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ve-listing-intake`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cron-secret': cronSecret },
    body: JSON.stringify({ action: 'read', name: r.name || '', where: r.where_text || '', url: r.link || '' }), signal: AbortSignal.timeout(130000),
  });
  const out: any = await res.json().catch(() => ({}));
  if (!res.ok || !out.ok) {
    const err = String(out.error || `reader ${res.status}`).slice(0, 200);
    await db.from('ve_listing_requests').update({ error: err, ...((r.attempts || 0) + 1 >= 3 ? { status: 'failed' } : {}) }).eq('id', r.id);
    return { id: r.id, error: err };
  }
  const f = out.found || {};
  const name = clean(f.name || r.name, 140);
  if (!name) {
    await db.from('ve_listing_requests').update({ status: 'failed', error: 'No business name could be read.', found: f, read: out.read, researched_at: new Date().toISOString() }).eq('id', r.id);
    return { id: r.id, error: 'no_name' };
  }
  // Already on the Directory? Same Instagram handle, or the same name in the same city.
  const ig = handleOf(f.instagram || ''), city = clean(f.city, 80);
  let dup: any = null;
  if (ig) { const { data } = await db.from('listings').select('id, slug, name').eq('status', 'approved').or(`ig_handle.ilike.${ig},instagram.ilike.@${ig}`).limit(1); dup = (data || [])[0] || null; }
  if (!dup) {
    const q = db.from('listings').select('id, slug, name, address_city').eq('status', 'approved').ilike('name', `%${name.replace(/[%_,()]/g, ' ').slice(0, 60)}%`).limit(10);
    const { data } = await q;
    dup = (data || []).find((x: any) => norm(x.name) === norm(name) && (!city || !x.address_city || norm(x.address_city) === norm(city))) || null;
  }
  if (!dup && f.website) {
    const host = String(f.website).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/.*$/, '').toLowerCase();
    if (host.length > 4) { const { data } = await db.from('listings').select('id, slug, name').eq('status', 'approved').ilike('website', `%${host}%`).limit(1); dup = (data || [])[0] || null; }
  }
  // Already listed: no second draft; For you shows the listing we have, and Sean closes the request (or fixes the listing).
  if (dup) {
    await db.from('ve_listing_requests').update({ status: 'drafted', found: f, read: out.read, researched_at: new Date().toISOString(), duplicate_of: dup.id, listing_id: null, error: null }).eq('id', r.id);
    return { id: r.id, duplicate: dup.slug };
  }
  const hours: Record<string, string> = {};
  for (const d of DAYS) { const t = clean(f.hours?.[d], 60); if (t) hours[d] = t; }
  const online = f.online_only === true;
  const at = new Date().toISOString();
  const row: Record<string, unknown> = {
    name, slug: await freeSlug(name), category: f.kind || 'Uncategorized', specialty: '', description: clean(f.about, 400), status: 'quarantined',
    location: online ? 'Online' : [city, clean(f.state, 40)].filter(Boolean).join(', '), website: clean(f.website, 400),
    phone: clean(f.phone, 40) || null, instagram: ig ? '@' + ig : null, ig_handle: ig || null,
    facebook: clean(f.facebook, 300) || null, tiktok: clean(f.tiktok, 60) || null,
    address_street: online ? null : clean(f.street, 160) || null, address_city: online ? null : city || null, address_state: online ? null : clean(f.state, 40) || null,
    address_zip: online ? null : clean(f.zip, 20) || null, address_country: online ? null : clean(f.country, 4) || null,
    google_hours_json: Object.keys(hours).length && !online ? hours : null,
    vegan_status: VEGAN.includes(f.vegan) && !f.organization ? f.vegan : null, initials: name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join(''),
    crawl_source: 'listing-request', tenant_id: VE_TENANT, business_status: 'OPERATIONAL', cuisines: [],
    communities: online ? ['all'] : null,
    details: { listing_request: { id: r.id, source: r.source, at }, admin_notes: [{ at, by: 'Logan', kind: 'note', text: 'Drafted from a listing request. ' + clean(f.note, 400) }] },
  };
  if (row.communities === null) delete row.communities;
  const ins = await db.from('listings').insert(row).select('id, slug').single();
  if (ins.error) {
    // The same name in the same city and state is already live or waiting (listings_name_city_state_unique_live).
    if (/name_city_state/.test(ins.error.message)) {
      const { data } = await db.from('listings').select('id').in('status', ['approved', 'pending']).ilike('name', name.replace(/[%_]/g, ' ')).limit(1);
      await db.from('ve_listing_requests').update({ status: 'drafted', found: f, read: out.read, researched_at: new Date().toISOString(), duplicate_of: (data || [])[0]?.id || null, error: 'Already on the Directory or waiting in New places under this name and city.' }).eq('id', r.id);
      return { id: r.id, duplicate: 'name_city' };
    }
    await db.from('ve_listing_requests').update({ error: ins.error.message.slice(0, 200), found: f, read: out.read, ...((r.attempts || 0) + 1 >= 3 ? { status: 'failed' } : {}) }).eq('id', r.id);
    return { id: r.id, error: ins.error.message };
  }
  await db.from('ve_listing_requests').update({ status: 'drafted', found: f, read: out.read, researched_at: at, listing_id: ins.data.id, duplicate_of: dup?.id || null, error: null }).eq('id', r.id);
  return { id: r.id, listing: ins.data.slug, duplicate: dup?.slug || null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const cronSecret = await secret('CRON_SECRET');
  const isCron = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const uid = token ? await verifyToken(token) : null;
  const { data: me } = uid ? await db.from('members').select('id, name, email, is_superadmin, membership_status').eq('id', uid).maybeSingle() : { data: null };
  const admin = !!me?.is_superadmin;

  if (b.action === 'submit') {
    const name = clean(b.name, 140), where = clean(b.where, 140), link = clean(b.link, 600), note = clean(b.note, 1500);
    if (name.length < 2 && !link) return json({ error: 'name_or_link', message: 'Give us its name or a link.' }, 400);
    if (link && !/^(https?:\/\/|@)/i.test(link)) return json({ error: 'bad_link', message: 'A link starts with https:// (or an Instagram @handle).' }, 400);
    const email = clean(b.email || me?.email, 200).toLowerCase(), visitor = clean(b.visitor, 40);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'bad_email' }, 400);
    const source = admin ? 'sean' : me ? 'member' : 'visitor';
    if (source === 'visitor' && !email && !visitor) return json({ error: 'email_needed', message: 'Leave an email so we can tell you when it is listed.' }, 400);
    if (!admin) {
      const s = await settings();
      const mine = db.from('ve_listing_requests').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo());
      const who = me ? mine.eq('member_id', me.id) : email ? mine.eq('contact_email', email) : mine.eq('visitor', visitor);
      const [a, all] = await Promise.all([who, db.from('ve_listing_requests').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo())]);
      if ((a.count ?? 0) >= s.per_sender_day || (all.count ?? 0) >= s.per_day) return json({ error: 'daily_limit', message: 'Thank you. That is all we can take from you today; try again tomorrow.' }, 429);
    }
    const ins = await db.from('ve_listing_requests').insert({
      source, member_id: me?.id || null, contact_email: email || null, contact_name: clean(b.contact_name || me?.name, 120) || null, visitor: visitor || null,
      name: name || null, where_text: where || null, link: link || null, note: note || null, page_url: clean(b.page_url, 500) || null,
    }).select('id').single();
    if (ins.error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, id: ins.data.id, straight_to_work: source === 'sean' });
  }

  if (b.action === 'research') {
    if (!isCron && !admin) return json({ error: 'admins_only' }, 403);
    if (!cronSecret) return json({ error: 'no_cron_secret' }, 500);
    const s = await settings();
    const { count } = await db.from('ve_listing_requests').select('id', { count: 'exact', head: true }).gte('researched_at', dayAgo());
    const room = Math.max(0, s.daily_reads - (count ?? 0));
    const n = Math.min(Math.max(1, +b.n || 3), 3, room);
    if (n < 1) return json({ ok: true, done: [], note: 'daily_reads reached' });
    const { data: rows } = await db.from('ve_listing_requests').select('*').eq('status', 'new').lt('attempts', 3).order('created_at').limit(n);
    const done = [];
    for (const r of rows || []) { try { done.push(await researchOne(r, cronSecret)); } catch (e) { done.push({ id: r.id, error: String((e as Error).message).slice(0, 200) }); } }
    return json({ ok: true, done });
  }

  if (!admin) return json({ error: 'admins_only' }, 403);

  if (b.action === 'queue') {
    const { data } = await db.from('ve_listing_requests').select('id, created_at, source, contact_name, contact_email, name, where_text, link, note, status, found, read, listing_id, duplicate_of, error')
      .neq('source', 'sean').eq('status', 'drafted').order('created_at').limit(50);
    const ids = [...new Set((data || []).flatMap((r: any) => [r.listing_id, r.duplicate_of]).filter(Boolean))];
    const { data: ls } = ids.length ? await db.from('listings').select('id, slug, name, category, vegan_status, location').in('id', ids) : { data: [] };
    const byId = new Map((ls || []).map((l: any) => [l.id, l]));
    const items = (data || []).map((r: any) => ({ ...r, draft: byId.get(r.listing_id) || null, duplicate: byId.get(r.duplicate_of) || null }));
    const { data: counts } = await db.from('ve_listing_requests').select('status, source');
    const c: Record<string, number> = {};
    for (const x of counts || []) { const k = (x as any).source === 'sean' && !['published', 'removed'].includes((x as any).status) ? 'sean_open' : (x as any).status; c[k] = (c[k] || 0) + 1; }
    return json({ ok: true, items, counts: c });
  }

  if (b.action === 'decide') {
    const decision = String(b.decision || '');
    if (!['publish', 'vetting', 'remove'].includes(decision)) return json({ error: 'bad_decision' }, 400);
    const { data: r } = await db.from('ve_listing_requests').select('*').eq('id', b.id).maybeSingle();
    if (!r) return json({ error: 'not_found' }, 404);
    if (r.status !== 'drafted') return json({ error: 'not_drafted', status: r.status }, 409);
    if (!r.listing_id) {
      // Already on the Directory: only closing the request makes sense.
      if (decision !== 'remove') return json({ error: 'already_listed', message: 'This place is already on the Directory; close the request, or fix the listing we have.' }, 409);
      await db.from('ve_listing_requests').update({ status: 'removed', decided_at: new Date().toISOString(), decided_by: me!.id, decision_note: clean(b.note, 500) || 'Already listed' }).eq('id', r.id);
      return json({ ok: true, status: 'removed', where: 'Closed (already listed)' });
    }
    const { data: l } = await db.from('listings').select('id, slug, status, category, vegan_status, details').eq('id', r.listing_id).maybeSingle();
    if (!l || l.status !== 'quarantined') return json({ error: 'draft_moved', listing_status: l?.status || null }, 409);
    const note = clean(b.note, 500), at = new Date().toISOString(), by = String(me?.name || 'Sean').split(/\s+/)[0];
    const notes = [...(Array.isArray(l.details?.admin_notes) ? l.details.admin_notes : []), { at, by, kind: 'note', text: `Listing request: ${decision === 'publish' ? 'published' : decision === 'vetting' ? 'sent to vetting' : 'removed'} from For you.${note ? ' ' + note : ''}` }];
    const details = { ...(l.details || {}), admin_notes: notes };
    let status = '', where = '';
    if (decision === 'publish') {
      const { error } = await db.from('listings').update({ status: 'approved', vetted_at: at, vetted_by: me!.id, details, updated_at: at }).eq('id', l.id);
      if (error) return json({ error: error.message }, 400);
      status = 'published'; where = 'On the Directory';
    } else if (decision === 'vetting') {
      if (FOOD.includes(l.category) && ['vegan_options', 'vegan_friendly'].includes(l.vegan_status)) {
        const { error } = await db.from('listings').update({ status: 'approved', vetted_at: null, details, updated_at: at }).eq('id', l.id);
        if (error) return json({ error: error.message }, 400);
        where = 'Being vetted (members see it until 10 member votes)';
      } else {
        const { error } = await db.from('listings').update({ status: 'approved', details, updated_at: at }).eq('id', l.id);
        if (error) return json({ error: error.message }, 400);
        const { data: st } = await db.rpc('ve_listing_set_state', { p_listing: l.id, p_state: 'hold', p_by: me!.id, p_note: 'Sent to vetting from a listing request.' + (note ? ' ' + note : ''), p_reasons: ['Listing request: sent to vetting'] });
        if (!(st as any)?.ok) return json({ error: 'hold_failed', detail: st }, 500);
        where = 'On hold for review (Directory review)';
      }
      status = 'vetting';
    } else {
      const { error } = await db.from('listings').update({ status: 'rejected', details: { ...details, status_before_hidden: 'quarantined' }, updated_at: at }).eq('id', l.id);
      if (error) return json({ error: error.message }, 400);
      status = 'removed'; where = 'Set aside';
    }
    await db.from('ve_listing_requests').update({ status, decided_at: at, decided_by: me!.id, decision_note: note || null }).eq('id', r.id);
    return json({ ok: true, status, where, slug: l.slug });
  }

  return json({ error: 'unknown_action' }, 400);
});
