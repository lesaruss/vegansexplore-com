// ve-bounties: Bounties (Sean, 2026-10-04). Content jobs paid in points, first for the two Oct 24
// South Florida events. A signed-in member opens a bounty, uploads files (to the private
// ve-bounty-uploads bucket through signed upload links) or pastes links, and submits. Sean or
// that city's Community Manager reviews; approving pays the points through ve_bounty_pay
// (points_ledger + apply_member_points_delta), once per submission.
//
// POST { action: 'list', community }                 public; with the viewer's own status per bounty
// POST { action: 'get', id }                         public; the viewer's submission when signed in
// POST { action: 'upload_url', bounty_id, name, size, type }   member -> { url, path }
// POST { action: 'file_added', bounty_id, path, name, size, type }  member, after the upload finishes
// POST { action: 'file_remove', bounty_id, path }    member, before review
// POST { action: 'submit', bounty_id, note?, links? } member
// POST { action: 'review_list', status?, community? } reviewer -> submissions with download links
// POST { action: 'review', id, decision: 'approve'|'changes'|'reject', note? }  reviewer
//
// Authorization: Bearer <ve_token>, verified the way ve-board and ve-auth verify it (verify_jwt is
// false on deploy). Every table is RLS-on with no policies; only this function reads or writes.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const SITE = 'https://vegansexplore.com';
const BUCKET = 've-bounty-uploads';
const COMMUNITIES = ['south-florida', 'central-florida', 'atlanta', 'dmv', 'new-york', 'philadelphia', 'los-angeles', 'london'];
const HUB_FOR_CITY: Record<string, string> = { 'orlando-north-central-florida': 'central-florida' };
const MAX_FILES = 120;
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
const GRACE_MS = 3 * 24 * 60 * 60 * 1000; // uploads stay open three days past the due date

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

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isUrl = (u: string) => /^https?:\/\/[^\s]+$/i.test(u);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

type Viewer = { id: string; name: string | null; email: string | null; admin: boolean; cm: boolean; home: string | null } | null;
async function loadViewer(req: Request): Promise<Viewer> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data: m } = await db.from('members').select('id, name, email, is_superadmin, staff_role, ve_role, home_community').eq('id', id).maybeSingle();
  if (!m) return null;
  return { id: m.id, name: m.name, email: m.email, admin: !!m.is_superadmin, cm: m.staff_role === 'community_manager' || m.ve_role === 'community_manager', home: m.home_community || null };
}
// Cities this person reviews: Sean all of them, a Community Manager their own.
async function reviewCities(v: Viewer): Promise<string[]> {
  if (!v) return [];
  if (v.admin) return COMMUNITIES;
  if (!v.cm) return [];
  const { data: inv } = v.email ? await db.from('ve_staff_invites').select('city_slug').ilike('email', v.email).maybeSingle() : { data: null };
  const raw = inv?.city_slug || v.home || '';
  const hub = HUB_FOR_CITY[raw] || raw;
  return COMMUNITIES.includes(hub) ? [hub] : [];
}

const BOUNTY_COLS = 'id, community_slug, event_id, event_title, kind, title, brief, deliverable, example_url, points, max_awards, due_at, status, sort';
async function withEvents(rows: any[]) {
  const ids = [...new Set(rows.map((b) => b.event_id).filter(Boolean))];
  const { data: evs } = ids.length ? await db.from('events').select('id, title, starts_at, ends_at, location_name, city, ticket_url').in('id', ids) : { data: [] };
  const byId: Record<string, any> = {}; for (const e of evs || []) byId[e.id] = e;
  return rows.map((b) => ({ ...b, event: b.event_id ? byId[b.event_id] || null : null }));
}
const open = (b: any) => b.status === 'open' && (!b.due_at || Date.now() < new Date(b.due_at).getTime() + GRACE_MS);
const shapeMine = (s: any) => s ? { id: s.id, status: s.status, note: s.note, links: s.links, files: (s.files || []).map((f: any) => ({ path: f.path, name: f.name, size: f.size, type: f.type })), review_note: s.review_note, points_awarded: s.points_awarded, submitted_at: s.submitted_at } : null;

async function getOrStart(bountyId: string, memberId: string) {
  const { data: s } = await db.from('ve_bounty_submissions').select('*').eq('bounty_id', bountyId).eq('member_id', memberId).maybeSingle();
  if (s) return s;
  const { data: made } = await db.from('ve_bounty_submissions').insert({ bounty_id: bountyId, member_id: memberId, status: 'in_progress' }).select('*').single();
  return made;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY || !to) return;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [to], subject, html }),
    });
    if (!r.ok) console.error('Resend', await r.text());
  } catch (e) { console.error('Resend failed', e); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const viewer = await loadViewer(req);
  const signedIn = { signed_in: !!viewer };

  switch (body.action) {
    case 'list': {
      const community = clean(body.community, 40);
      if (!COMMUNITIES.includes(community)) return json({ error: 'bad_community' }, 400);
      const { data } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('community_slug', community).eq('status', 'open').order('sort');
      const bounties = await withEvents(data || []);
      let mine: Record<string, any> = {};
      if (viewer && bounties.length) {
        const { data: subs } = await db.from('ve_bounty_submissions').select('bounty_id, status, points_awarded').eq('member_id', viewer.id).in('bounty_id', bounties.map((b) => b.id));
        for (const s of subs || []) mine[s.bounty_id] = s;
      }
      return json({ bounties: bounties.map((b) => ({ ...b, accepting: open(b), mine: mine[b.id] || null })), viewer: signedIn });
    }

    case 'get': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: b } = await db.from('ve_bounties').select(BOUNTY_COLS).eq('id', body.id).maybeSingle();
      if (!b || b.status === 'draft') return json({ error: 'not_found' }, 404);
      const [bounty] = await withEvents([b]);
      let mine = null;
      if (viewer) {
        const { data: s } = await db.from('ve_bounty_submissions').select('*').eq('bounty_id', b.id).eq('member_id', viewer.id).maybeSingle();
        mine = shapeMine(s);
      }
      return json({ bounty: { ...bounty, accepting: open(b) }, mine, viewer: signedIn });
    }

    case 'upload_url':
    case 'file_added':
    case 'file_remove':
    case 'submit': {
      if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in to take on a bounty.' }, 401);
      if (!isId(body.bounty_id)) return json({ error: 'bad_id' }, 400);
      const { data: b } = await db.from('ve_bounties').select('id, status, due_at, title').eq('id', body.bounty_id).maybeSingle();
      if (!b || b.status === 'draft') return json({ error: 'not_found' }, 404);
      const s = await getOrStart(b.id, viewer.id);
      if (!s) return json({ error: 'start_failed' }, 500);
      if (s.status === 'approved') return json({ error: 'already_approved', message: 'This one is approved and paid. Nice work.' }, 409);
      if (!open(b)) return json({ error: 'closed', message: 'This bounty is closed.' }, 409);
      const prefix = `${b.id}/${viewer.id}/`;
      const files: any[] = Array.isArray(s.files) ? s.files : [];

      if (body.action === 'upload_url') {
        const size = Number(body.size) || 0;
        if (files.length >= MAX_FILES) return json({ error: 'too_many', message: `Up to ${MAX_FILES} files per bounty.` }, 400);
        if (size <= 0 || size > MAX_BYTES) return json({ error: 'too_big', message: 'Each file can be up to 2 GB. Share bigger files as a link.' }, 400);
        const name = clean(body.name, 160).replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-') || 'file';
        const path = prefix + crypto.randomUUID().slice(0, 8) + '-' + name;
        const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) return json({ error: 'upload_failed', message: error?.message }, 500);
        return json({ url: data.signedUrl, path });
      }
      if (body.action === 'file_added') {
        const path = clean(body.path, 400);
        if (!path.startsWith(prefix)) return json({ error: 'bad_path' }, 400);
        if (!files.some((f) => f.path === path)) {
          files.push({ path, name: clean(body.name, 160), size: Number(body.size) || 0, type: clean(body.type, 100), at: new Date().toISOString() });
          await db.from('ve_bounty_submissions').update({ files, updated_at: new Date().toISOString() }).eq('id', s.id);
        }
        return json({ ok: true, files: files.length });
      }
      if (body.action === 'file_remove') {
        const path = clean(body.path, 400);
        if (!path.startsWith(prefix)) return json({ error: 'bad_path' }, 400);
        await db.storage.from(BUCKET).remove([path]);
        const left = files.filter((f) => f.path !== path);
        await db.from('ve_bounty_submissions').update({ files: left, updated_at: new Date().toISOString() }).eq('id', s.id);
        return json({ ok: true, files: left.length });
      }
      // submit
      const note = clean(body.note, 10000);
      const links = (Array.isArray(body.links) ? body.links : []).map((l: unknown) => clean(l, 1000)).filter(isUrl).slice(0, 50);
      if (!files.length && !links.length && note.length < 200) return json({ error: 'empty', message: 'Add your files, a link, or your write-up before you submit.' }, 400);
      await db.from('ve_bounty_submissions').update({ note: note || null, links, status: 'submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', s.id);
      return json({ ok: true, status: 'submitted' });
    }

    case 'review_list': {
      const cities = await reviewCities(viewer);
      if (!cities.length) return json({ error: 'forbidden' }, 403);
      const { data: bounties } = await db.from('ve_bounties').select('id, community_slug, title, points, event_title, due_at, status, max_awards').in('community_slug', cities).order('sort');
      const ids = (bounties || []).map((b) => b.id);
      const status = clean(body.status, 20);
      let q = db.from('ve_bounty_submissions').select('*').in('bounty_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']).order('submitted_at', { ascending: false, nullsFirst: false }).limit(200);
      if (['submitted', 'changes', 'approved', 'rejected', 'in_progress'].includes(status)) q = q.eq('status', status);
      else q = q.neq('status', 'in_progress');
      const { data: subs } = await q;
      const memberIds = [...new Set((subs || []).map((s) => s.member_id))];
      const { data: people } = memberIds.length ? await db.from('members').select('id, name, email').in('id', memberIds) : { data: [] };
      const who: Record<string, any> = {}; for (const p of people || []) who[p.id] = p;
      const byBounty: Record<string, any> = {}; for (const b of bounties || []) byBounty[b.id] = b;
      const out = [];
      for (const s of subs || []) {
        const files = [];
        for (const f of (s.files || [])) {
          const { data } = await db.storage.from(BUCKET).createSignedUrl(f.path, 3600);
          files.push({ name: f.name, size: f.size, type: f.type, url: data?.signedUrl || null });
        }
        out.push({ ...shapeMine(s), files, bounty: byBounty[s.bounty_id] || null, member: who[s.member_id] ? { name: who[s.member_id].name, email: who[s.member_id].email } : null });
      }
      const counts: Record<string, number> = {};
      const { data: all } = await db.from('ve_bounty_submissions').select('status').in('bounty_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      for (const r of all || []) counts[r.status] = (counts[r.status] || 0) + 1;
      return json({ submissions: out, bounties: bounties || [], counts });
    }

    case 'review': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: s } = await db.from('ve_bounty_submissions').select('id, bounty_id, member_id, status').eq('id', body.id).maybeSingle();
      if (!s) return json({ error: 'not_found' }, 404);
      const { data: b } = await db.from('ve_bounties').select('id, community_slug, title, points').eq('id', s.bounty_id).maybeSingle();
      if (!b || !(await reviewCities(viewer)).includes(b.community_slug)) return json({ error: 'forbidden' }, 403);
      const note = clean(body.note, 2000) || null;
      const decision = body.decision;
      const { data: m } = await db.from('members').select('email, name').eq('id', s.member_id).maybeSingle();
      const first = String(m?.name || '').split(' ')[0] || 'there';
      const link = `${SITE}/bounties?id=${b.id}`;
      if (decision === 'approve') {
        const { data: paid, error } = await db.rpc('ve_bounty_pay', { p_submission: s.id, p_reviewer: viewer!.id });
        if (error) return json({ error: 'pay_failed', message: error.message }, 500);
        if (paid?.error) return json({ error: paid.error, message: paid.error === 'cap_reached' ? 'This bounty has paid out all its spots.' : 'Could not pay it.' }, 409);
        if (note) await db.from('ve_bounty_submissions').update({ review_note: note }).eq('id', s.id);
        if (paid?.awarded) await sendEmail(m?.email || '', `You earned ${b.points} points: ${b.title}`,
          `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">Hi ${esc(first)},</p><p style="font-family:sans-serif;font-size:15px;line-height:1.6">Your work for <b>${esc(b.title)}</b> is approved, and <b>${b.points} points</b> are in your account. Thank you for showing up for your city.</p>${note ? `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">${esc(note)}</p>` : ''}<p style="font-family:sans-serif;font-size:15px"><a href="${link}">See your bounties</a></p>`);
        return json({ ok: true, ...paid });
      }
      if (decision === 'changes' || decision === 'reject') {
        if (s.status === 'approved') return json({ error: 'already_approved', message: 'This one is already approved and paid.' }, 409);
        await db.from('ve_bounty_submissions').update({ status: decision === 'changes' ? 'changes' : 'rejected', review_note: note, reviewed_by: viewer!.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', s.id);
        await sendEmail(m?.email || '', decision === 'changes' ? `A note on your bounty: ${b.title}` : `About your bounty: ${b.title}`,
          `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">Hi ${esc(first)},</p><p style="font-family:sans-serif;font-size:15px;line-height:1.6">${decision === 'changes' ? `Thanks for your work on <b>${esc(b.title)}</b>. Before we can approve it, we need a few changes:` : `Thank you for your work on <b>${esc(b.title)}</b>. We are not able to approve this one.`}</p>${note ? `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">${esc(note)}</p>` : ''}<p style="font-family:sans-serif;font-size:15px"><a href="${link}">Open the bounty</a></p>`);
        return json({ ok: true });
      }
      return json({ error: 'bad_decision' }, 400);
    }
  }
  return json({ error: 'unknown_action' }, 400);
});
