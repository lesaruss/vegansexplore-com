// ve-dashboard: which version of /dashboard a member sees (Sean, 2026-10-24: "the dashboard could actually be the main
// dashboard, and then we have different versions of it. So if they're a coach... if they're a pre-vegan, the dashboard set up a
// certain way"; docs/proposals/member-dashboards.md, migration 20261025_dashboard_versions.sql).
//
// POST { action: 'home' }                   Authorization: Bearer <ve_token>
//   -> { version, auto, chosen, versions, listings: [{name, slug, claim_status}], cards: [{kind, title, body, cta_label, cta_url}] }
//   version is the member's choice (members.dashboard_version) or ve_dashboard_version(); cards are ve_dashboard_cards for that
//   version and 'all', live now, in order. A business card's link that starts with ? opens on their first listing's dashboard.
//   level: { lifetime, level, next_at } from ve_member_level (Levels 1 to 3 on lifetime points, Sean 2026-10-25).
//   survey: { completed, earned, total, active }, the profile's points (ve_profile_state), so the dashboard puts Your profile first
//   until every point is earned (Sean, 2026-10-28).
//   The version follows the survey and their listings only: the dropdown is gone (Sean, 2026-10-28: "we should know who they are...
//   using a survey to figure out how to tailor this experience"), so members.dashboard_version is no longer read.
// POST { action: 'set_version', version }   kept for old pages; it no longer changes what home returns
// POST { action: 'recent_votes', limit? }   super admins: the latest Directory votes (listing_daily_votes), newest first, up to 100,
//   each with the listing and the member who voted (Sean, 2026-10-30: "a log of user votes... who they vote for... an icon of the
//   person that voted").
// POST { action: 'member_card', member_id } super admins: who a member is, for the dashboard's lightbox: account, level, points,
//   their votes, check-ins, saves and listings, so Sean never leaves the page.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const VERSIONS = [['business', 'Business'], ['pre_vegan', 'Just starting'], ['coach', 'Coach or pro'], ['member', 'Member']];

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, dashboard_version, membership_status, mission_survey_completed_at, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'not_found' }, 404);

  if (body.action === 'set_version') {
    const v = body.version == null ? null : String(body.version);
    if (v !== null && !VERSIONS.some((x) => x[0] === v)) return json({ error: 'bad_version' }, 400);
    const { error } = await db.from('members').update({ dashboard_version: v }).eq('id', memberId);
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, version: v });
  }

  if (body.action === 'home') {
    const [{ data: auto }, { data: listings }, { data: level }, { data: prof }] = await Promise.all([
      db.rpc('ve_dashboard_version', { p_member: memberId }),
      db.from('listings').select('name, slug, claim_status').eq('status', 'approved').or(`owner_member_id.eq.${memberId},claimed_by_member_id.eq.${memberId}`).order('name').limit(20),
      db.rpc('ve_member_level', { p_member: memberId }),
      db.rpc('ve_profile_state', { p_member: memberId }),
    ]);
    const version = auto || 'member';
    const now = Date.now();
    const { data: rows } = await db.from('ve_dashboard_cards').select('kind, title, body, cta_label, cta_url, starts_at, ends_at').in('audience', [version, 'all']).order('sort');
    const first = (listings || [])[0];
    const cards = (rows || []).filter((c: any) => Date.parse(c.starts_at) <= now && (!c.ends_at || Date.parse(c.ends_at) > now))
      .map((c: any) => {
        let url = c.cta_url;
        if (url && url.charAt(0) === '?') url = first ? `/directory/${encodeURIComponent(first.slug)}?tab=brand&${url.slice(1)}` : null;
        return { kind: c.kind, title: c.title, body: c.body, cta_label: c.cta_label, cta_url: url };
      });
    return json({ ok: true, version, auto: auto || 'member', chosen: member.dashboard_version, versions: VERSIONS.map(([k, label]) => ({ k, label })),
      listings: listings || [], cards, level: level || null,
      survey: { completed: !!member.mission_survey_completed_at, earned: prof?.earned ?? 0, total: prof?.total ?? 250, active: member.membership_status === 'active' } });
  }

  if (body.action === 'recent_votes') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const limit = Math.min(100, Math.max(1, Number(body.limit) || 100));
    const { data: votes, error } = await db.from('listing_daily_votes').select('id, member_id, listing_id, created_at').order('created_at', { ascending: false }).limit(limit);
    if (error) return json({ error: 'load_failed' }, 500);
    const mids = [...new Set((votes || []).map((v: any) => v.member_id).filter(Boolean))];
    const lids = [...new Set((votes || []).map((v: any) => v.listing_id).filter(Boolean))];
    const [{ data: ms }, { data: ls }] = await Promise.all([
      mids.length ? db.from('members').select('id, name, email, avatar_url, color, member_class').in('id', mids) : Promise.resolve({ data: [] }),
      lids.length ? db.from('listings').select('id, name, slug, logo_url, category').in('id', lids) : Promise.resolve({ data: [] }),
    ]);
    const M = new Map((ms || []).map((m: any) => [m.id, m])), L = new Map((ls || []).map((l: any) => [l.id, l]));
    return json({ ok: true, votes: (votes || []).map((v: any) => ({ id: v.id, at: v.created_at, member: M.get(v.member_id) || { id: v.member_id }, listing: L.get(v.listing_id) || { id: v.listing_id } })) });
  }

  if (body.action === 'member_card') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const id = String(body.member_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'bad_member' }, 400);
    const { data: m } = await db.from('members').select('id, name, email, username, avatar_url, color, member_class, membership_status, ve_role, ve_tier, founding_member, ambassador_profile, home_community, created_at, entry_paid_at, lesars_balance, referral_code, referral_count, instagram_handle, is_superadmin').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    const count = (t: string) => db.from(t).select('id', { count: 'exact', head: true }).eq('member_id', id);
    const [{ data: level }, { data: pts }, votesN, checkinsN, savesN, epN, { data: recent }, { data: owned }] = await Promise.all([
      db.rpc('ve_member_level', { p_member: id }),
      db.from('member_points').select('total_points, available_points').eq('member_id', id).limit(1).maybeSingle(),
      count('listing_daily_votes'), count('ve_checkins'), count('ve_listing_saves'), count('ve_episode_saves'),
      db.from('listing_daily_votes').select('created_at, listings(name, slug)').eq('member_id', id).order('created_at', { ascending: false }).limit(8),
      db.from('listings').select('name, slug').eq('status', 'approved').eq('owner_member_id', id).order('name').limit(10),
    ]);
    return json({ ok: true, member: m, level: level || null, points: pts || null,
      counts: { votes: votesN.count || 0, checkins: checkinsN.count || 0, saves: savesN.count || 0, episodes: epN.count || 0 },
      recent_votes: (recent || []).map((r: any) => ({ at: r.created_at, name: r.listings?.name || null, slug: r.listings?.slug || null })),
      listings: owned || [] });
  }

  return json({ error: 'unknown_action' }, 400);
});
