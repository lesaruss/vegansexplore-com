// ve-checkin: members check in at the places they visit (Sean, 2026-10-25: "If they go to a restaurant and can verify it's
// there, they can check in... every time they check in, they can get like 10 points... We can see a record of how many people
// are actually visiting, which members are visiting"). Migration 20261025_ve_checkins.sql; the rules live in ve_checkin_save
// (at the place within 150 m, once per place a day, 10 points for up to 5 places a day).
//
// POST { action: 'listing', listing_id }                 anyone: { total, last_30_days, people_30_days, last_at, mine_today }
//                                                         counts only for the public; an active member also gets people: the
//                                                         members who checked in in the last 90 days and leave show_checkins on
//                                                         (Sean, 2026-10-25), newest first, first name and initial
// POST { action: 'privacy', show_checkins? }             a signed-in member: reads, or sets, whether other members see their
//                                                         check-ins (members.show_checkins, on by default; the owner of a claimed
//                                                         place always sees them, through ve-claims owner_dashboard)
// POST { action: 'checkin', listing_id, lat, lng, accuracy }  an active member: { ok, points, distance_m } or { ok: false, why }
// POST { action: 'mine' }                                a signed-in member: their check-ins, newest first, and the points
//
// The check-in menu (Sean, 2026-11-01, canon canon-ve-earn-your-passport): after I'm here, What are you doing here today?
// POST { action: 'today', listing_id }                   the member's check-in here today (open for window_hours), what they
//                                                         already sent for it, the points each pays, and the bounties open here
// POST { action: 'photo_start', checkin_id, kind }       meal | receipt: a one-object signed upload into the private bucket
//                                                         checkin-photos, only while the check-in is open
// POST { action: 'act', checkin_id, kind, photo_path?, post_url?, body? }  saves one of meal | receipt | post | shoutout (one each
//                                                         per check-in); it waits for the team, nothing is paid yet
// POST { action: 'review_list', status? }                super admins: the queue, with signed photo links
// POST { action: 'review', id, decision, note? }         super admins: approve (pays its points, ve_points_grant reason checkin,
//                                                         ref checkin-action:<id>) or decline
// 'listing' also returns the listing's approved shout-outs (first name and initial). Owners earn nothing at their own place.
//
// Earn your Passport, part 4 (2026-11-01): someone who is not a member yet but has Support Local running (ve-challenge) may
// check in and use the check-in menu too. They earn no points for it (ve_checkin_save p_pay false; an approval pays only an
// active member); the challenge's 1,100 points are the reward.
//
// verify_jwt is false: the VE app token is HMAC-checked here the same way ve-auth checks it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && isFinite(+v) ? +v : null);

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;

  if (body.action === 'listing') {
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const { data } = await db.rpc('ve_listing_checkins', { p_listing: body.listing_id });
    let mine_today = false, people: string[] | undefined, more = 0;
    if (memberId) {
      const { data: me } = await db.from('members').select('membership_status').eq('id', memberId).maybeSingle();
      if (me?.membership_status === 'active') {
        const { data: rows } = await db.from('ve_checkins').select('member_id, created_at, members!inner(name, show_checkins)')
          .eq('listing_id', body.listing_id).eq('members.show_checkins', true).neq('member_id', memberId)
          .gte('created_at', new Date(Date.now() - 90 * 864e5).toISOString()).order('created_at', { ascending: false }).limit(200);
        const seen = new Set<string>(), names: string[] = [];
        for (const r of (rows || []) as any[]) {
          if (seen.has(r.member_id)) continue; seen.add(r.member_id);
          const p = String(r.members?.name || '').trim().split(/\s+/);
          if (p[0]) names.push(p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''));
        }
        people = names.slice(0, 6); more = Math.max(0, names.length - 6);
      }
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const { count } = await db.from('ve_checkins').select('id', { count: 'exact', head: true })
        .eq('listing_id', body.listing_id).eq('member_id', memberId).eq('local_day', today);
      mine_today = (count || 0) > 0;
    }
    const { data: sh } = await db.from('ve_checkin_actions').select('body, created_at, members(name)').eq('listing_id', body.listing_id)
      .eq('kind', 'shoutout').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
    const shoutouts = (sh || []).map((r: any) => { const p = String(r.members?.name || '').trim().split(/\s+/); return { text: r.body, at: r.created_at, name: p[0] ? p[0] + (p[1] ? ' ' + p[1][0] + '.' : '') : 'A member' }; });
    return json({ ok: true, ...(data || {}), mine_today, shoutouts, ...(people ? { people, more } : {}) });
  }

  // Ops (Bearer LESARUSS_ADMIN_TOKEN) may review the check-in menu like a super admin (2026-11-01).
  const ops = !memberId && !!token && await (async () => {
    const env = Deno.env.get('LESARUSS_ADMIN_TOKEN') || (await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle()).data?.value;
    return !!env && env.length === token.length && env === token;
  })();
  if (ops && (body.action === 'review_list' || body.action === 'review')) {} else if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: m0 } = memberId ? await db.from('members').select('id, membership_status, is_superadmin').eq('id', memberId).maybeSingle() : { data: null };
  const m: any = m0 || (ops ? { id: null, membership_status: 'active', is_superadmin: true } : null);
  if (!m) return json({ error: 'not_found' }, 404);

  if (body.action === 'privacy') {
    if (typeof body.show_checkins === 'boolean') {
      const { error } = await db.from('members').update({ show_checkins: body.show_checkins }).eq('id', memberId);
      if (error) return json({ error: 'save_failed' }, 500);
    }
    const { data: p } = await db.from('members').select('show_checkins').eq('id', memberId).maybeSingle();
    return json({ ok: true, show_checkins: p?.show_checkins !== false });
  }

  // A challenger: not a member, with Support Local running.
  const challenger = async () => {
    if (m.membership_status === 'active') return false;
    const { count } = await db.from('ve_challenges').select('id', { count: 'exact', head: true }).eq('member_id', memberId).eq('kind', 'support_local').eq('status', 'active');
    return (count || 0) > 0;
  };
  const allowed = async () => m.membership_status === 'active' || await challenger();

  if (body.action === 'checkin') {
    // Check-ins are a member benefit, like votes, and open to a Support Local challenger (at no points).
    if (!(await allowed())) return json({ ok: false, why: 'members_only' }, 403);
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const { data, error } = await db.rpc('ve_checkin_save', { p_member: memberId, p_listing: body.listing_id,
      p_lat: num(body.lat), p_lng: num(body.lng), p_accuracy: num(body.accuracy), p_pay: m.membership_status === 'active' });
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  if (body.action === 'mine') {
    const { data } = await db.from('ve_checkins').select('created_at, points, listings(name, slug, address_city)')
      .eq('member_id', memberId).order('created_at', { ascending: false }).limit(100);
    const rows = (data || []).map((c: any) => ({ at: c.created_at, points: c.points, name: c.listings?.name, slug: c.listings?.slug, city: c.listings?.address_city }));
    return json({ ok: true, checkins: rows, points: rows.reduce((a: number, r: any) => a + (r.points || 0), 0) });
  }


  // ---------- The check-in menu ----------
  const settings = async () => {
    const { data } = await db.from('ve_site_settings').select('value').eq('key', 'checkin_actions').maybeSingle();
    return { meal: 15, receipt: 25, post: 25, shoutout: 10, window_hours: 3, ...((data as any)?.value || {}) };
  };
  const KINDS = ['meal', 'receipt', 'post', 'shoutout'];
  // The member's own check-in, open for window_hours after I'm here.
  const openCheckin = async (id: unknown) => {
    if (!isId(id)) return null;
    const { data: c } = await db.from('ve_checkins').select('id, member_id, listing_id, created_at').eq('id', id).maybeSingle();
    if (!c || c.member_id !== memberId) return null;
    const st = await settings();
    const until = Date.parse(c.created_at) + st.window_hours * 3600e3;
    return { ...c, until, open: Date.now() < until, st };
  };

  if (body.action === 'today') {
    if (!isId(body.listing_id)) return json({ error: 'listing_id' }, 400);
    const st = await settings();
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const [{ data: c }, { data: l }, { data: bs }] = await Promise.all([
      db.from('ve_checkins').select('id, created_at, points').eq('listing_id', body.listing_id).eq('member_id', memberId).eq('local_day', day).maybeSingle(),
      db.from('listings').select('owner_member_id, claimed_by_member_id').eq('id', body.listing_id).maybeSingle(),
      db.from('ve_bounties').select('id, title, points, community_slug, campaign_id, kind, gig_kind').eq('status', 'open')
        .or(`check_listing_id.eq.${body.listing_id},visit_listing_id.eq.${body.listing_id},partner_listing_id.eq.${body.listing_id}`).limit(6),
    ]);
    const own = !!l && (l.owner_member_id === memberId || l.claimed_by_member_id === memberId);
    let sent: any[] = [];
    if (c) { const { data } = await db.from('ve_checkin_actions').select('kind, status, points').eq('checkin_id', c.id); sent = data || []; }
    const until = c ? Date.parse(c.created_at) + st.window_hours * 3600e3 : null;
    return json({ ok: true, own_place: own, checkin: c ? { id: c.id, at: c.created_at, open_until: new Date(until!).toISOString(), open: Date.now() < until! } : null,
      sent, points: { meal: st.meal, receipt: st.receipt, post: st.post, shoutout: st.shoutout }, window_hours: st.window_hours,
      bounties: (bs || []).map((b: any) => ({ id: b.id, title: b.title, points: b.points, url: '/bounties?community=' + encodeURIComponent(b.community_slug || '') + (b.campaign_id ? '&campaign=' + encodeURIComponent(b.campaign_id) : '') })) });
  }

  if (body.action === 'photo_start') {
    if (!(await allowed())) return json({ ok: false, why: 'members_only' }, 403);
    if (body.kind !== 'meal' && body.kind !== 'receipt') return json({ error: 'kind' }, 400);
    const c = await openCheckin(body.checkin_id);
    if (!c) return json({ ok: false, why: 'no_checkin' }, 404);
    if (!c.open) return json({ ok: false, why: 'closed' }, 409);
    const path = `${c.listing_id}/${c.id}/${body.kind}-${crypto.randomUUID()}.jpg`;
    const { data: up, error } = await db.storage.from('checkin-photos').createSignedUploadUrl(path);
    if (error || !up) return json({ error: 'upload_failed' }, 500);
    return json({ ok: true, path, upload_url: up.signedUrl });
  }

  if (body.action === 'act') {
    if (!(await allowed())) return json({ ok: false, why: 'members_only' }, 403);
    const kind = String(body.kind || '');
    if (!KINDS.includes(kind)) return json({ error: 'kind' }, 400);
    const c = await openCheckin(body.checkin_id);
    if (!c) return json({ ok: false, why: 'no_checkin' }, 404);
    if (!c.open) return json({ ok: false, why: 'closed' }, 409);
    const { data: l } = await db.from('listings').select('owner_member_id, claimed_by_member_id').eq('id', c.listing_id).maybeSingle();
    if (l && (l.owner_member_id === memberId || l.claimed_by_member_id === memberId)) return json({ ok: false, why: 'own_place' }, 403);
    const row: Record<string, unknown> = { checkin_id: c.id, member_id: memberId, listing_id: c.listing_id, kind, status: 'pending' };
    if (kind === 'meal' || kind === 'receipt') {
      const p = String(body.photo_path || '');
      if (!p.startsWith(`${c.listing_id}/${c.id}/${kind}-`) || !/\.jpg$/.test(p)) return json({ ok: false, why: 'photo_needed' }, 400);
      const dir = p.slice(0, p.lastIndexOf('/')), name = p.slice(p.lastIndexOf('/') + 1);
      const { data: listed } = await db.storage.from('checkin-photos').list(dir, { search: name });
      if (!(listed || []).some((f: any) => f.name === name)) return json({ ok: false, why: 'photo_missing' }, 400);
      row.photo_path = p;
    } else if (kind === 'post') {
      const u = String(body.post_url || '').trim();
      if (!/^https:\/\/(www\.)?(instagram\.com|tiktok\.com|vm\.tiktok\.com)\//i.test(u) || u.length > 500) return json({ ok: false, why: 'post_link' }, 400);
      row.post_url = u;
    } else {
      const t = String(body.body || '').replace(/\s+/g, ' ').trim();
      if (t.length < 10 || t.length > 280) return json({ ok: false, why: 'shoutout_length' }, 400);
      row.body = t;
    }
    const { data: ex } = await db.from('ve_checkin_actions').select('id, status').eq('checkin_id', c.id).eq('kind', kind).maybeSingle();
    if (ex && ex.status !== 'pending') return json({ ok: false, why: 'already_sent' }, 409);
    const { error } = ex ? await db.from('ve_checkin_actions').update(row).eq('id', ex.id) : await db.from('ve_checkin_actions').insert(row);
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, status: 'pending', points: m.membership_status === 'active' ? (c.st as any)[kind] : 0 });
  }

  if (body.action === 'review_list' || body.action === 'review') {
    if (!m.is_superadmin) return json({ error: 'forbidden' }, 403);
    if (body.action === 'review_list') {
      const status = ['pending', 'approved', 'declined'].includes(body.status) ? body.status : 'pending';
      const { data: rows } = await db.from('ve_checkin_actions').select('id, kind, photo_path, post_url, body, status, points, review_note, created_at, members(name, email, membership_status), listings(name, slug, address_city)')
        .eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(100);
      const out = await Promise.all((rows || []).map(async (r: any) => {
        let photo = null;
        if (r.photo_path) { const { data } = await db.storage.from('checkin-photos').createSignedUrl(r.photo_path, 3600); photo = data?.signedUrl || null; }
        return { id: r.id, kind: r.kind, status: r.status, points: r.points, note: r.review_note, at: r.created_at, photo, post_url: r.post_url, body: r.body,
          member: { name: r.members?.name || r.members?.email || 'Member' }, challenger: r.members?.membership_status !== 'active', listing: { name: r.listings?.name, slug: r.listings?.slug, city: r.listings?.address_city } };
      }));
      const { count } = await db.from('ve_checkin_actions').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      return json({ ok: true, rows: out, pending: count || 0 });
    }
    if (!isId(body.id) || !['approve', 'decline'].includes(body.decision)) return json({ error: 'bad_request' }, 400);
    const { data: a } = await db.from('ve_checkin_actions').select('id, kind, member_id, status, members(membership_status)').eq('id', body.id).maybeSingle();
    if (!a) return json({ error: 'not_found' }, 404);
    if (a.status !== 'pending') return json({ ok: false, why: 'already_reviewed' }, 409);
    const note = String(body.note || '').trim().slice(0, 300) || null;
    let pts = 0;
    if (body.decision === 'approve') {
      // A challenger's approval counts toward Support Local but pays nothing; members are paid.
      pts = (a as any).members?.membership_status === 'active' ? (Number((await settings() as any)[a.kind]) || 0) : 0;
      if (pts > 0) {
        const { data: g, error } = await db.rpc('ve_points_grant', { p_member: a.member_id, p_amount: pts, p_reason: 'checkin', p_ref: 'checkin-action:' + a.id });
        if (error || g?.error) return json({ error: 'grant_failed' }, 500);
      }
    }
    await db.from('ve_checkin_actions').update({ status: body.decision === 'approve' ? 'approved' : 'declined', points: pts, review_note: note,
      reviewed_by: memberId, reviewed_at: new Date().toISOString() }).eq('id', a.id);
    // Support Local may be finished by this approval.
    if (body.decision === 'approve') {
      const { data: ch } = await db.from('ve_challenges').select('id').eq('member_id', a.member_id).eq('kind', 'support_local').eq('status', 'active').maybeSingle();
      if (ch) await db.rpc('ve_challenge_settle', { p_id: ch.id });
    }
    return json({ ok: true, points: pts });
  }

  return json({ error: 'unknown_action' }, 400);
});
