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
//   the votes they gave and the votes their pages got (listings they own, or a People profile naming them in
//   details.person.member_id), the places they checked in, saves and their pages, and who voted for them (voted_by: the latest 25
//   votes on their pages with each voter; Sean, 2026-10-30) and who saved them (saved_by: the latest 25 saves of their pages or
//   their episodes, saves_received the count), so Sean never leaves the page.
// POST { action: 'leaderboard' }            every member: the top 100 by points (ve_leaderboard), each with their id and picture, so a
//   super admin's thumbnail opens who they are (Sean, 2026-10-30).
// POST { action: 'recent_leads' }           super admins: the latest 100 ve_initiative_interest rows with the member's picture.
// POST { action: 'inbox' }                  super admins (every request) or a Community Manager (the ones assigned to them): every
//   request a person sent us (ve_inbox_items), with who it is assigned to (the chapter's Community Manager, else the team), whether
//   they opened it, the 24-hour reply clock and the requester's picture (Sean, 2026-10-30: "no more than... 24 hours... that's how we
//   track the effectiveness of our community managers"; migration 20261030_ve_inbox.sql).
// POST { action: 'inbox_open', source, source_id }   marks it seen by the team, and opened when the person it is assigned to opens it.
// POST { action: 'inbox_set', source, source_id, set: 'replied'|'closed'|'open', note? }
//
// A member's picture everywhere here is their People profile photo when one names them (details.person.member_id), else their account
// picture (Sean, 2026-10-30: "if the user has a thumbnail, let's use the thumbnail... my face should show up"). LESARUSS.ai's own
// listings (its tags) stay out of Vegans Explore's lists (Sean, 2026-10-30: "it should only be focused on Vegans Explore items").
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const LR_TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
const isLr = (l: any) => (l?.tags || []).some((t: string) => LR_TAGS.includes(t));
const INBOX_DUE_HOURS = 24;
const CHAPTER_SLUG: Record<string, string> = { 'South Florida': 'south-florida', 'Central Florida': 'central-florida', 'North Florida': 'north-florida',
  'Atlanta': 'atlanta', 'Washington, D.C.': 'washington-dc', 'Maryland': 'maryland', 'Virginia': 'virginia', 'Delaware': 'delaware', 'West Virginia': 'west-virginia',
  'New York': 'new-york', 'Philadelphia': 'philadelphia', 'Los Angeles': 'los-angeles', 'London': 'london' };
// People profile photo first, then the account picture.
async function pictures(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return out;
  const [{ data: ms }, { data: ps }] = await Promise.all([
    db.from('members').select('id, avatar_url').in('id', uniq),
    db.from('listings').select('logo_url, member_id:details->person->>member_id').eq('status', 'approved').in('details->person->>member_id', uniq),
  ]);
  for (const m of ms || []) if ((m as any).avatar_url) out.set((m as any).id, (m as any).avatar_url);
  for (const p of ps || []) if ((p as any).logo_url && (p as any).member_id) out.set((p as any).member_id, (p as any).logo_url);
  return out;
}
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
  const { data: member } = await db.from('members').select('id, dashboard_version, membership_status, mission_survey_completed_at, is_superadmin, ve_role, home_community').eq('id', memberId).maybeSingle();
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
    // Read more than asked, since LESARUSS.ai's listings are dropped after.
    const { data: votes, error } = await db.from('listing_daily_votes').select('id, member_id, listing_id, created_at').order('created_at', { ascending: false }).limit(limit * 3);
    if (error) return json({ error: 'load_failed' }, 500);
    const mids = [...new Set((votes || []).map((v: any) => v.member_id).filter(Boolean))];
    const lids = [...new Set((votes || []).map((v: any) => v.listing_id).filter(Boolean))];
    const [{ data: ms }, { data: ls }, pics] = await Promise.all([
      mids.length ? db.from('members').select('id, name, email, avatar_url, color, member_class').in('id', mids) : Promise.resolve({ data: [] }),
      lids.length ? db.from('listings').select('id, name, slug, logo_url, category, tags').in('id', lids) : Promise.resolve({ data: [] }),
      pictures(mids as string[]),
    ]);
    const M = new Map((ms || []).map((m: any) => [m.id, { ...m, avatar_url: pics.get(m.id) || null }])), L = new Map((ls || []).map((l: any) => [l.id, l]));
    const ours = (votes || []).filter((v: any) => !isLr(L.get(v.listing_id))).slice(0, limit);
    return json({ ok: true, votes: ours.map((v: any) => { const l: any = L.get(v.listing_id); return { id: v.id, at: v.created_at, member: M.get(v.member_id) || { id: v.member_id },
      listing: l ? { id: l.id, name: l.name, slug: l.slug, logo_url: l.logo_url, category: l.category } : { id: v.listing_id } }; }) });
  }

  if (body.action === 'member_card') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const id = String(body.member_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'bad_member' }, 400);
    const { data: m } = await db.from('members').select('id, name, email, username, avatar_url, color, member_class, membership_status, ve_role, ve_tier, founding_member, ambassador_profile, home_community, created_at, entry_paid_at, lesars_balance, referral_code, referral_count, instagram_handle, is_superadmin').eq('id', id).maybeSingle();
    if (!m) return json({ error: 'not_found' }, 404);
    const pic = (await pictures([id])).get(id);
    if (pic) (m as any).avatar_url = pic;
    const count = (t: string) => db.from(t).select('id', { count: 'exact', head: true }).eq('member_id', id);
    const [{ data: level }, { data: pts }, votesN, checkinsN, savesN, epN, { data: recent }, { data: owned }] = await Promise.all([
      db.rpc('ve_member_level', { p_member: id }),
      db.from('member_points').select('total_points, available_points').eq('member_id', id).limit(1).maybeSingle(),
      count('listing_daily_votes'), count('ve_checkins'), count('ve_listing_saves'), count('ve_episode_saves'),
      db.from('listing_daily_votes').select('created_at, listings(name, slug, tags)').eq('member_id', id).order('created_at', { ascending: false }).limit(24),
      // Their pages: listings they own, and a People profile that names them (details.person.member_id).
      db.from('listings').select('id, name, slug, owner_member_id').eq('status', 'approved').or(`owner_member_id.eq.${id},details->person->>member_id.eq.${id}`).order('name').limit(20),
    ]);
    const pageIds = (owned || []).map((l: any) => l.id);
    // Who voted for them: the latest 25 votes on their pages, each with the voter.
    const [recv, { data: inVotes }] = pageIds.length ? await Promise.all([
      db.from('listing_daily_votes').select('id', { count: 'exact', head: true }).in('listing_id', pageIds),
      db.from('listing_daily_votes').select('created_at, listing_id, member_id').in('listing_id', pageIds).order('created_at', { ascending: false }).limit(25),
    ]) : [{ count: 0 }, { data: [] }];
    // Who saved their pages: the latest 25 saves of their pages or of an episode on them (the team's view only; an owner's
    // dashboard never names who saved).
    const [lsN, epsN, { data: lSaves }, { data: eSaves }] = pageIds.length ? await Promise.all([
      db.from('ve_listing_saves').select('id', { count: 'exact', head: true }).in('listing_id', pageIds),
      db.from('ve_episode_saves').select('id', { count: 'exact', head: true }).in('listing_id', pageIds),
      db.from('ve_listing_saves').select('saved_at, listing_id, member_id').in('listing_id', pageIds).order('saved_at', { ascending: false }).limit(25),
      db.from('ve_episode_saves').select('created_at, listing_id, member_id, title').in('listing_id', pageIds).order('created_at', { ascending: false }).limit(25),
    ]) : [{ count: 0 }, { count: 0 }, { data: [] }, { data: [] }];
    const saves = [...(lSaves || []).map((x: any) => ({ at: x.saved_at, listing_id: x.listing_id, member_id: x.member_id, episode: null })),
      ...(eSaves || []).map((x: any) => ({ at: x.created_at, listing_id: x.listing_id, member_id: x.member_id, episode: x.title || 'An episode' }))]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 25);
    const voterIds = [...new Set([...(inVotes || []), ...saves].map((v: any) => v.member_id).filter(Boolean))];
    const { data: voters } = voterIds.length ? await db.from('members').select('id, name, email, avatar_url, color').in('id', voterIds) : { data: [] };
    const vpics = await pictures(voterIds as string[]);
    const V = new Map((voters || []).map((x: any) => [x.id, { ...x, avatar_url: vpics.get(x.id) || null }])), P = new Map((owned || []).map((l: any) => [l.id, l]));
    const votedBy = (inVotes || []).map((v: any) => {
      const x: any = V.get(v.member_id) || {}, l: any = P.get(v.listing_id) || {};
      return { at: v.created_at, voter: { id: v.member_id, name: x.name || x.email || 'Member', avatar_url: x.avatar_url || null, color: x.color || null }, page: l.name || null, slug: l.slug || null };
    });
    const savedBy = saves.map((v: any) => {
      const x: any = V.get(v.member_id) || {}, l: any = P.get(v.listing_id) || {};
      return { at: v.at, member: { id: v.member_id, name: x.name || x.email || 'Member', avatar_url: x.avatar_url || null, color: x.color || null }, page: l.name || null, episode: v.episode };
    });
    return json({ ok: true, member: m, level: level || null, points: pts || null,
      counts: { votes: votesN.count || 0, votes_received: recv.count || 0, saves_received: (lsN.count || 0) + (epsN.count || 0), checkins: checkinsN.count || 0, saves: savesN.count || 0, episodes: epN.count || 0 },
      recent_votes: (recent || []).filter((r: any) => !isLr(r.listings)).slice(0, 8).map((r: any) => ({ at: r.created_at, name: r.listings?.name || null, slug: r.listings?.slug || null })),
      listings: (owned || []).map((l: any) => ({ name: l.name, slug: l.slug, owner: l.owner_member_id === id })), voted_by: votedBy, saved_by: savedBy });
  }

  if (body.action === 'leaderboard') {
    const { data, error } = await db.rpc('ve_leaderboard', { p_cities: ['*'] });
    if (error) return json({ error: 'load_failed' }, 500);
    const rows = (data || []).slice(0, 100);
    const pics = await pictures(rows.map((r: any) => r.id));
    return json({ ok: true, rows: rows.map((r: any, i: number) => ({ rank: i + 1, id: member.is_superadmin ? r.id : null, name: r.name, initials: r.initials,
      color: r.color, avatar_url: pics.get(r.id) || r.avatar_url || null, points: r.points || 0, is_you: r.id === memberId })) });
  }

  if (body.action === 'recent_leads') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const { data, error } = await db.from('ve_initiative_interest').select('id, member_id, name, email, action_type, initiative_slug, created_at').order('created_at', { ascending: false }).limit(100);
    if (error) return json({ error: 'load_failed' }, 500);
    const ids = (data || []).map((r: any) => r.member_id).filter(Boolean);
    const [{ data: ms }, pics] = await Promise.all([ids.length ? db.from('members').select('id, name, email, color').in('id', ids) : Promise.resolve({ data: [] }), pictures(ids)]);
    const M = new Map((ms || []).map((m: any) => [m.id, m]));
    return json({ ok: true, rows: (data || []).map((r: any) => { const m: any = M.get(r.member_id) || {};
      return { id: r.id, at: r.created_at, action: r.action_type, initiative: r.initiative_slug, member_id: r.member_id || null,
        name: m.name || r.name || r.email || m.email || null, color: m.color || null, avatar_url: pics.get(r.member_id) || null }; }) });
  }

  if (body.action === 'inbox' || body.action === 'inbox_open' || body.action === 'inbox_set') {
    const isCm = member.ve_role === 'community_manager' && member.membership_status === 'active';
    if (!member.is_superadmin && !isCm) return json({ error: 'forbidden' }, 403);
    const { data: items, error } = await db.rpc('ve_inbox_items', {});
    if (error) return json({ error: 'load_failed', message: error.message }, 500);
    const list: any[] = items || [];
    // The chapter: the request's own, else the member's home chapter. Assigned to that chapter's Community Manager, else the team.
    const mids = [...new Set(list.map((r) => r.member_id).filter(Boolean))];
    const emails = [...new Set(list.filter((r) => !r.member_id && r.email).map((r) => String(r.email).toLowerCase()))];
    const [{ data: ms }, { data: byEmail }, { data: cms }, { data: states }] = await Promise.all([
      mids.length ? db.from('members').select('id, name, email, color, home_community').in('id', mids) : Promise.resolve({ data: [] }),
      emails.length ? db.from('members').select('id, name, email, color, home_community').in('email', emails) : Promise.resolve({ data: [] }),
      db.from('members').select('id, name, email, home_community').eq('ve_role', 'community_manager').eq('membership_status', 'active'),
      db.from('ve_inbox_state').select('*'),
    ]);
    const M = new Map<string, any>((ms || []).map((m: any) => [m.id, m]));
    const E = new Map<string, any>((byEmail || []).map((m: any) => [String(m.email).toLowerCase(), m]));
    const CM = new Map<string, any>(); for (const c of cms || []) if ((c as any).home_community && !CM.has((c as any).home_community)) CM.set((c as any).home_community, c);
    const S = new Map<string, any>((states || []).map((s: any) => [s.source + ':' + s.source_id, s]));
    const people = list.map((r) => r.member_id || E.get(String(r.email || '').toLowerCase())?.id).filter(Boolean);
    const pics = await pictures(people as string[]);
    const now = Date.now();
    const rows = list.map((r) => {
      const who = r.member_id ? M.get(r.member_id) : E.get(String(r.email || '').toLowerCase());
      const chapter = (r.chapter && (CHAPTER_SLUG[r.chapter] || (Object.values(CHAPTER_SLUG).includes(r.chapter) ? r.chapter : null))) || who?.home_community || null;
      const st = S.get(r.source + ':' + r.source_id) || {};
      const cm = st.assigned_member_id ? (cms || []).find((c: any) => c.id === st.assigned_member_id) : (chapter ? CM.get(chapter) : null);
      const due = new Date(r.created_at).getTime() + INBOX_DUE_HOURS * 3600000;
      const done = st.replied_at || st.closed_at;
      return { source: r.source, id: r.source_id, at: r.created_at, kind: r.kind, title: r.title, summary: r.summary, link: r.link,
        chapter, requester: { id: who?.id || null, name: r.name || who?.name || who?.email || r.email || null, email: r.email || who?.email || null,
          color: who?.color || null, avatar_url: who?.id ? pics.get(who.id) || null : null },
        assigned: cm ? { id: cm.id, name: cm.name || cm.email } : null,
        seen_at: st.first_seen_at || null, viewed_at: st.viewed_at || null, replied_at: st.replied_at || null, closed_at: st.closed_at || null, note: st.note || null,
        due_at: new Date(due).toISOString(), late: !done && now > due,
        status: st.replied_at ? 'replied' : st.closed_at ? 'closed' : st.viewed_at ? 'opened' : 'new',
        reply_hours: st.replied_at ? Math.round((new Date(st.replied_at).getTime() - new Date(r.created_at).getTime()) / 360000) / 10 : null };
    });
    const mine = member.is_superadmin ? rows : rows.filter((r) => r.assigned?.id === memberId);

    if (body.action === 'inbox') {
      const open = mine.filter((r) => r.status === 'new' || r.status === 'opened');
      const replied = mine.filter((r) => r.reply_hours != null);
      return json({ ok: true, due_hours: INBOX_DUE_HOURS, rows: mine,
        counts: { open: open.length, late: open.filter((r) => r.late).length, unopened: mine.filter((r) => r.status === 'new').length,
          replied: replied.length, avg_reply_hours: replied.length ? Math.round(replied.reduce((a, r) => a + r.reply_hours, 0) / replied.length * 10) / 10 : null } });
    }
    const src = String(body.source || ''), sid = String(body.source_id || '');
    const row = mine.find((r) => r.source === src && r.id === sid);
    if (!row) return json({ error: 'not_found' }, 404);
    const at = new Date().toISOString();
    const prev = S.get(src + ':' + sid) || {};
    const patch: any = { source: src, source_id: sid, updated_at: at, assigned_member_id: prev.assigned_member_id || row.assigned?.id || null,
      first_seen_at: prev.first_seen_at || at };
    if (body.action === 'inbox_open') {
      // Opened counts when the person it is assigned to opens it; with no Community Manager, the team (a super admin).
      const assignee = patch.assigned_member_id;
      if (!prev.viewed_at && ((assignee && assignee === memberId) || (!assignee && member.is_superadmin))) { patch.viewed_at = at; patch.viewed_by = memberId; }
    } else {
      const set = String(body.set || '');
      if (set === 'replied') { patch.replied_at = at; patch.replied_by = memberId; patch.closed_at = null; patch.closed_by = null; }
      else if (set === 'closed') { patch.closed_at = at; patch.closed_by = memberId; }
      else if (set === 'open') { patch.replied_at = null; patch.replied_by = null; patch.closed_at = null; patch.closed_by = null; }
      else return json({ error: 'bad_set' }, 400);
      if (!prev.viewed_at && (!patch.assigned_member_id || patch.assigned_member_id === memberId)) { patch.viewed_at = at; patch.viewed_by = memberId; }
      if (typeof body.note === 'string') patch.note = body.note.slice(0, 1000) || null;
    }
    const { error: e2 } = await db.from('ve_inbox_state').upsert(patch, { onConflict: 'source,source_id' });
    if (e2) return json({ error: 'save_failed', message: e2.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});
