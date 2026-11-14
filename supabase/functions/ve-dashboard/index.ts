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
// POST { action: 'revenue', refresh? }     super admins: money coming in on the Vegans Explore Stripe account, read live from Stripe
//   (Sean, 2026-11-02: "see that revenue coming in through Vegans Explore in real time... just some little module"). Every succeeded
//   charge, gross less refunds, and net after Stripe's fee: today, this month, last month, this year, all time (Eastern days), each day
//   of the last 90 and each month, and the latest 15 payments named by their Checkout line item. Cached 5 minutes in
//   ve_analytics_cache (refresh skips it). Not a P&L: no costs, no other Stripe accounts. Charges whose Stripe customer carries
//   metadata revenue_class client_services are client services billed through Vegans Explore Inc.: left out of totals, daily gross and
//   monthly gross, and returned as client {month, year, all} and each day's and month's client amount (Sean, 2026-11-02).
// POST { action: 'inbox' }                  super admins (every request) or a Community Manager (the ones assigned to them): every
//   request a person sent us (ve_inbox_items), with who it is assigned to (the chapter's Community Manager, else the team), whether
//   they opened it, the 24-hour reply clock and the requester's picture (Sean, 2026-10-30: "no more than... 24 hours... that's how we
//   track the effectiveness of our community managers"; migration 20261030_ve_inbox.sql).
// POST { action: 'inbox_open', source, source_id }   marks it seen by the team, and opened when the person it is assigned to opens it.
// POST { action: 'inbox_set', source, source_id, set: 'replied'|'closed'|'open', note? }
// POST { action: 'inbox_reply', source, source_id, message, subject?, test? }   replies from the Inbox (Sean, 2026-10-30, "go with
//   your recommendation"): an email from Vegans Explore to the person who sent the request, signed with the sender's first name and
//   "Vegans Explore team", replies to contact@lesaruss.com (and the Community Manager who sent it). It is kept in ve_inbox_replies and
//   stops the 24-hour clock (replied_at). test: true sends it to the sender alone with [Test] in the subject and stops nothing.
// POST { action: 'inbox_replies', source, source_id }   the replies sent on one request, newest first.
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
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const REPLY_FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const TEAM_EMAIL = 'contact@lesaruss.com';
const REPLIES_A_DAY = 50;
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const firstName = (n: unknown) => String(n || '').trim().split(/\s+/)[0] || '';
// A reply as a plain personal email: their first name, the message (a blank line a new paragraph), the sign-off and why they got it.
function replyHtml(to: string, message: string, signed: string, about: string) {
  const paras = message.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px">` +
    (to ? `<p style="margin:0 0 14px">Hi ${esc(to)},</p>` : '') + paras +
    `<p style="margin:18px 0 0">${esc(signed)}<br>Vegans Explore team</p>` +
    `<p style="margin:28px 0 0;font-size:12px;color:#777">You are getting this because you reached out to Vegans Explore${about ? ` (${esc(about)})` : ''}. ` +
    `Reply to this email to keep talking. LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p></div>`;
}
const CHAPTER_SLUG: Record<string, string> = { 'South Florida': 'south-florida', 'Central Florida': 'central-florida', 'North Florida': 'north-florida',
  'Atlanta': 'atlanta', 'Washington, D.C.': 'washington-dc', 'Maryland': 'maryland', 'Virginia': 'virginia', 'Delaware': 'delaware', 'West Virginia': 'west-virginia',
  'New York': 'new-york', 'Philadelphia': 'philadelphia', 'Los Angeles': 'los-angeles', 'Seattle': 'seattle', 'Portland': 'portland', 'London': 'london' };
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
  const { data: member } = await db.from('members').select('id, name, email, dashboard_version, membership_status, mission_survey_completed_at, is_superadmin, ve_role, home_community, founding_member, entry_paid_at').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'not_found' }, 404);

  if (body.action === 'set_version') {
    const v = body.version == null ? null : String(body.version);
    if (v !== null && !VERSIONS.some((x) => x[0] === v)) return json({ error: 'bad_version' }, 400);
    const { error } = await db.from('members').update({ dashboard_version: v }).eq('id', memberId);
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, version: v });
  }

  // The member's main badge, shown on the corner of their picture (ve-explorer-path step 6, canon-ve-door-guides v10). Any badge they hold,
  // Explorer included (Sean, 2026-11-09; ve_member_badge_set_main refuses one they do not hold); null goes back to the most recent.
  if (body.action === 'set_main_badge') {
    const key = body.key == null || body.key === '' ? null : String(body.key);
    if (key !== null && !/^badge-[a-z0-9-]{2,30}$/.test(key)) return json({ error: 'bad_badge' }, 400);
    const { data, error } = await db.rpc('ve_member_badge_set_main', { p_member: memberId, p_key: key });
    if (error) return json({ error: 'save_failed' }, 500);
    if (!data || !data.ok) return json({ error: (data && data.error) || 'save_failed' }, 400);
    return json({ ok: true, badges: data.badges || [] });
  }

  if (body.action === 'home') {
    const [{ data: auto }, { data: listings }, { data: level }, { data: prof }] = await Promise.all([
      db.rpc('ve_dashboard_version', { p_member: memberId }),
      db.from('listings').select('id, name, slug, claim_status, logo_url, category').eq('status', 'approved').or(`owner_member_id.eq.${memberId},claimed_by_member_id.eq.${memberId}`).order('name').limit(20),
      db.rpc('ve_member_level', { p_member: memberId }),
      db.rpc('ve_profile_state', { p_member: memberId }),
    ]);
    // Registered badges, one per finished business intake (canon-ve-door-guides v6, Sean 2026-11-06).
    const { data: badges } = await db.rpc('ve_member_badges', { p_member: memberId });
    // After the $11, a prompt (not required) to take a survey for 250 more points (membership_rule_v6): shown until any survey is finished.
    const { count: surveysDone } = await db.from('ve_survey_completions').select('survey_slug', { count: 'exact', head: true }).eq('member_id', memberId);
    const surveyPrompt = member.membership_status === 'active' && !!(member as any).entry_paid_at && !surveysDone;
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
    // founding_member (Sean, 2026-11-01): the dashboard says Founding Member only for those marked so (paid before January 1, 2027,
    // or a comp given before 2026-11-01), never for every active member.
    return json({ ok: true, member_id: memberId, founding_member: !!(member as any).founding_member, version, auto: auto || 'member', chosen: member.dashboard_version, versions: VERSIONS.map(([k, label]) => ({ k, label })),
      listings: listings || [], cards, level: level || null, badges: badges || [], survey_prompt: surveyPrompt,
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
    const { data: gifts } = await db.from('points_ledger').select('created_at, delta, ref_id').eq('member_id', id).eq('reason', 'admin_adjust').like('ref_id', 'founder:%').order('created_at', { ascending: false }).limit(10);
    const { data: badges } = await db.rpc('ve_member_badges', { p_member: id });
    return json({ ok: true, member: m, level: level || null, points: pts || null, badges: badges || [],
      gifts: (gifts || []).map((g: any) => ({ at: g.created_at, amount: g.delta, note: String(g.ref_id || '').split(':').slice(2).join(':') })),
      counts: { votes: votesN.count || 0, votes_received: recv.count || 0, saves_received: (lsN.count || 0) + (epsN.count || 0), checkins: checkinsN.count || 0, saves: savesN.count || 0, episodes: epN.count || 0 },
      recent_votes: (recent || []).filter((r: any) => !isLr(r.listings)).slice(0, 8).map((r: any) => ({ at: r.created_at, name: r.listings?.name || null, slug: r.listings?.slug || null })),
      listings: (owned || []).map((l: any) => ({ name: l.name, slug: l.slug, owner: l.owner_member_id === id })), voted_by: votedBy, saved_by: savedBy });
  }

  // Give points to any member, from the member card (Sean, 2026-11-01: "If I wanted to give somebody points as the founder...").
  // Spendable points through ve_points_grant (both balances, lifetime too), reason admin_adjust, ref founder:<uuid>:<note>.
  if (body.action === 'give_points') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const id = String(body.member_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'bad_member' }, 400);
    const amount = Math.floor(Number(body.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return json({ error: 'bad_amount' }, 400);
    const note = String(body.note || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const { data: t } = await db.from('members').select('id, is_superadmin, member_class').eq('id', id).maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    if (t.is_superadmin || t.member_class === 'agent') return json({ error: 'not_for_this_account' }, 400);
    const { data, error } = await db.rpc('ve_points_grant', { p_member: id, p_amount: amount, p_reason: 'admin_adjust', p_ref: `founder:${crypto.randomUUID()}:${note}` });
    if (error || data?.error) return json({ error: data?.error || 'grant_failed' }, 500);
    const { data: pts } = await db.from('member_points').select('total_points, available_points').eq('member_id', id).limit(1).maybeSingle();
    return json({ ok: true, granted: amount, points: pts || null });
  }

  // Take points back (Sean, 2026-11-03). Spendable points only, never lifetime, never below zero; a reason is required for the record.
  if (body.action === 'take_points') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const id = String(body.member_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'bad_member' }, 400);
    const amount = Math.floor(Number(body.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return json({ error: 'bad_amount' }, 400);
    const note = String(body.note || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (note.length < 3) return json({ error: 'reason_needed' }, 400);
    const { data: t } = await db.from('members').select('id, is_superadmin, member_class').eq('id', id).maybeSingle();
    if (!t) return json({ error: 'not_found' }, 404);
    if (t.is_superadmin || t.member_class === 'agent') return json({ error: 'not_for_this_account' }, 400);
    const { data, error } = await db.rpc('ve_points_take', { p_member: id, p_amount: amount, p_ref: `founder-take:${crypto.randomUUID()}:${note}` });
    if (error || data?.error) return json({ error: data?.error || 'take_failed', balance: data?.balance ?? null }, data?.error === 'insufficient_points' ? 400 : 500);
    const { data: pts } = await db.from('member_points').select('total_points, available_points').eq('member_id', id).limit(1).maybeSingle();
    return json({ ok: true, taken: amount, points: pts || null });
  }

  // Find any member by name, username or email, to open their card (Sean, 2026-11-01). Super admins; up to 20, people with the
  // closest match first (an exact email, then a name that starts with it). Guide accounts, quarantined and merged rows are left out.
  if (body.action === 'member_search') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const q = String(body.q || '').replace(/[%_,()\\*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (q.length < 2) return json({ ok: true, members: [] });
    const like = `%${q}%`;
    const { data, error } = await db.from('members').select('id, name, email, username, avatar_url, color, member_class, membership_status, founding_member, ve_role, created_at')
      .or(`name.ilike.${like},email.ilike.${like},username.ilike.${like}`)
      .not('member_class', 'in', '(agent,quarantined)').order('created_at', { ascending: false }).limit(60);
    if (error) return json({ error: 'load_failed' }, 500);
    const ql = q.toLowerCase();
    const rank = (m: any) => (String(m.email || '').toLowerCase() === ql ? 0 : String(m.name || '').toLowerCase().startsWith(ql) ? 1
      : String(m.email || '').toLowerCase().startsWith(ql) ? 2 : 3) + (m.membership_status === 'active' ? 0 : 0.5);
    const rows = (data || []).sort((a: any, b: any) => rank(a) - rank(b)).slice(0, 20);
    const pics = await pictures(rows.map((m: any) => m.id));
    return json({ ok: true, members: rows.map((m: any) => ({ id: m.id, name: m.name || m.username || m.email, email: m.email, avatar_url: pics.get(m.id) || m.avatar_url || null,
      color: m.color || null, status: m.membership_status, founding_member: !!m.founding_member, role: m.ve_role || null, joined: m.created_at })) });
  }

  if (body.action === 'leaderboard') {
    const { data, error } = await db.rpc('ve_leaderboard', { p_cities: ['*'] });
    if (error) return json({ error: 'load_failed' }, 500);
    const rows = (data || []).slice(0, 100);
    const pics = await pictures(rows.map((r: any) => r.id));
    return json({ ok: true, rows: rows.map((r: any, i: number) => ({ rank: i + 1, id: member.is_superadmin ? r.id : null, name: r.name, initials: r.initials,
      color: r.color, avatar_url: pics.get(r.id) || r.avatar_url || null, points: r.points || 0, is_you: r.id === memberId })) });
  }

  if (body.action === 'revenue') {
    if (!member.is_superadmin) return json({ error: 'forbidden' }, 403);
    const KEY = 've-revenue-v2';
    if (!body.refresh) {
      const { data: hit } = await db.from('ve_analytics_cache').select('data, fetched_at').eq('key', KEY).maybeSingle();
      if (hit && Date.now() - new Date((hit as any).fetched_at).getTime() < 5 * 60e3) return json({ ...(hit as any).data, cached: true });
    }
    const sk = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    if (!sk) return json({ error: 'no_stripe' }, 500);
    const stripe = async (path: string) => {
      const r = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + sk } });
      const d = await r.json(); if (!r.ok) throw new Error(d?.error?.message || 'stripe ' + r.status); return d;
    };
    try {
      const charges: any[] = [];
      let after = '';
      for (let page = 0; page < 30; page++) {
        const d = await stripe('charges?limit=100&expand[]=data.balance_transaction&expand[]=data.invoice&expand[]=data.customer' + (after ? '&starting_after=' + after : ''));
        charges.push(...(d.data || []));
        if (!d.has_more || !d.data?.length) break;
        after = d.data[d.data.length - 1].id;
      }
      const day = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t * 1000));
      const now = Math.floor(Date.now() / 1000), today = day(now), month = today.slice(0, 7), year = today.slice(0, 4);
      const lm = new Date(Date.UTC(+year, +month.slice(5) - 2, 15)).toISOString().slice(0, 7);
      const paid = charges.filter((c) => c.status === 'succeeded' && c.livemode);
      const rows = paid.map((c) => {
        const gross = (c.amount || 0) - (c.amount_refunded || 0);
        const bt = c.balance_transaction && typeof c.balance_transaction === 'object' ? c.balance_transaction : null;
        const fee = bt ? bt.fee || 0 : 0;
        // Client services billed through Vegans Explore Inc. (Sean, 2026-11-02): a customer tagged revenue_class client_services in
        // Stripe (Miss Meatless Muscle's hosting, the Vegans Who Lift hosting). Shown on their own line, never as Vegans Explore revenue.
        const client = !!(c.customer && typeof c.customer === 'object' && c.customer.metadata?.revenue_class === 'client_services');
        return { c, d: day(c.created), gross, net: gross - (c.refunded ? 0 : fee), client };
      });
      const sumAll = (f: (r: any) => boolean) => rows.filter(f).reduce((a, r) => ({ gross: a.gross + r.gross, net: a.net + r.net, n: a.n + 1 }), { gross: 0, net: 0, n: 0 });
      const sum = (f: (r: any) => boolean) => sumAll((r) => !r.client && f(r));
      const csum = (f: (r: any) => boolean) => sumAll((r) => r.client && f(r));
      const client = { month: csum((r) => r.d.startsWith(month)), year: csum((r) => r.d.startsWith(year)), all: csum(() => true) };
      const totals = { today: sum((r) => r.d === today), month: sum((r) => r.d.startsWith(month)), last_month: sum((r) => r.d.startsWith(lm)), last_month_same_days: sum((r) => r.d.startsWith(lm) && r.d.slice(8) <= today.slice(8)),
        year: sum((r) => r.d.startsWith(year)), all: sum(() => true) };
      const byDay = new Map<string, any>(), byMonth = new Map<string, any>();
      for (const r of rows) {
        for (const [m, k] of [[byDay, r.d], [byMonth, r.d.slice(0, 7)]] as [Map<string, any>, string][]) {
          const v = m.get(k) || { gross: 0, net: 0, n: 0, client: 0 };
          if (r.client) v.client += r.gross; else { v.gross += r.gross; v.net += r.net; v.n++; }
          m.set(k, v);
        }
      }
      const daily: any[] = [];
      for (let i = 89; i >= 0; i--) { const k = day(now - i * 86400); daily.push({ d: k, ...(byDay.get(k) || { gross: 0, net: 0, n: 0, client: 0 }) }); }
      const monthly = [...byMonth.entries()].sort().map(([m, v]) => ({ m, ...v }));
      // The latest payments, named by their Checkout line item when there is one.
      const names = new Map<string, string>();
      try {
        const s = await stripe('checkout/sessions?limit=40&status=complete&expand[]=data.line_items');
        for (const x of s.data || []) if (x.payment_intent) names.set(String(x.payment_intent), x.line_items?.data?.[0]?.description || '');
      } catch (_) { /* names are a nice to have */ }
      // A subscription's charge is named by its invoice's first line ("1 × Brand Partner (at $200.00 / month)" reads as its product).
      const invLine = (inv: any) => {
        const t = inv && typeof inv === 'object' ? String(inv.lines?.data?.[0]?.description || '') : '';
        return t.replace(/^\d+\s*[×x]\s*/, '').replace(/\s*\(at [^)]*\)\s*$/, '').trim();
      };
      const isEmail = (v: string) => /^[^\s@]+@[^\s@]+$/.test(v);
      const latest = rows.slice(0, 15).map((r) => {
        const c = r.c, email = c.billing_details?.email || c.receipt_email || (isEmail(c.description || '') ? c.description : '') || '';
        const desc = c.description && !isEmail(c.description) && !/^(Description|Subscription (creation|update))$/.test(c.description) ? c.description : '';
        return { at: new Date(c.created * 1000).toISOString(), gross: r.gross, net: r.net, refunded: c.amount_refunded || 0, client: r.client,
          what: names.get(String(c.payment_intent || '')) || desc || invLine(c.invoice) || (c.invoice ? 'Subscription payment' : 'Payment'),
          who: c.billing_details?.name || email || '', email,
          url: 'https://dashboard.stripe.com/payments/' + (c.payment_intent || c.id) };
      });
      const out = { ok: true, as_of: new Date().toISOString(), currency: 'usd', account: 'Vegans Explore', totals, client, daily, monthly, latest, today, charges: rows.length };
      await db.from('ve_analytics_cache').upsert({ key: KEY, data: out, fetched_at: out.as_of });
      return json({ ...out, cached: false });
    } catch (e) {
      return json({ error: 'stripe_failed', detail: String((e as Error).message || e).slice(0, 200) }, 502);
    }
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

  if (['inbox', 'inbox_open', 'inbox_set', 'inbox_reply', 'inbox_replies'].includes(body.action)) {
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
    const { data: sent } = await db.from('ve_inbox_replies').select('source, source_id').eq('test', false);
    const R = new Map<string, number>(); for (const x of sent || []) { const k = (x as any).source + ':' + (x as any).source_id; R.set(k, (R.get(k) || 0) + 1); }
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
        status: st.replied_at ? 'replied' : st.closed_at ? 'closed' : st.viewed_at ? 'opened' : 'new', replies: R.get(r.source + ':' + r.source_id) || 0,
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
    if (body.action === 'inbox_replies') {
      const { data } = await db.from('ve_inbox_replies').select('id, member_id, to_email, subject, body, signed_as, test, sent_at').eq('source', src).eq('source_id', sid).order('sent_at', { ascending: false }).limit(50);
      return json({ ok: true, replies: data || [] });
    }
    const at = new Date().toISOString();
    const prev = S.get(src + ':' + sid) || {};
    const patch: any = { source: src, source_id: sid, updated_at: at, assigned_member_id: prev.assigned_member_id || row.assigned?.id || null,
      first_seen_at: prev.first_seen_at || at };
    if (body.action === 'inbox_reply') {
      const message = String(body.message || '').replace(/\r/g, '').trim();
      if (message.length < 2) return json({ error: 'empty' }, 400);
      if (message.length > 5000) return json({ error: 'too_long' }, 400);
      const test = body.test === true;
      const to = test ? String(member.email || '') : String(row.requester?.email || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ error: test ? 'no_email' : 'no_requester_email' }, 400);
      if (!RESEND_KEY) return json({ error: 'email_off' }, 500);
      const since = new Date(Date.now() - 86400000).toISOString();
      const { count } = await db.from('ve_inbox_replies').select('id', { count: 'exact', head: true }).eq('member_id', memberId).gte('sent_at', since);
      if ((count || 0) >= REPLIES_A_DAY) return json({ error: 'daily_limit' }, 429);
      const signed = firstName(member.name) || 'The team';
      const subject = (test ? '[Test] ' : '') + (String(body.subject || '').replace(/\s+/g, ' ').trim().slice(0, 150) || ('Re: ' + (row.title || row.kind || 'your message')).slice(0, 150));
      const replyTo = [TEAM_EMAIL];
      if (!member.is_superadmin && member.email && member.email.toLowerCase() !== TEAM_EMAIL) replyTo.push(member.email);
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: REPLY_FROM, reply_to: replyTo, to: [to], subject, html: replyHtml(firstName(row.requester?.name && !/@/.test(row.requester.name) ? row.requester.name : ''), message, signed, row.title || row.kind || ''),
          text: message + `\n\n${signed}\nVegans Explore team` }) }).catch(() => null);
      const sentOk = !!res && res.ok;
      const out = res ? await res.json().catch(() => null) : null;
      if (!sentOk) return json({ error: 'send_failed', message: String(out?.message || out?.error || '').slice(0, 200) }, 502);
      await db.from('ve_inbox_replies').insert({ source: src, source_id: sid, member_id: memberId, to_email: to, subject, body: message, signed_as: signed, provider_id: out?.id || null, test });
      if (test) return json({ ok: true, test: true, to });
      patch.replied_at = prev.replied_at || at; patch.replied_by = prev.replied_by || memberId; patch.closed_at = null; patch.closed_by = null;
      if (typeof body.note === 'string') patch.note = body.note.slice(0, 1000) || null;
      if (!prev.viewed_at && (!patch.assigned_member_id || patch.assigned_member_id === memberId)) { patch.viewed_at = at; patch.viewed_by = memberId; }
    } else if (body.action === 'inbox_open') {
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
    return json({ ok: true, ...(body.action === 'inbox_reply' ? { sent: true, to: row.requester?.email } : {}) });
  }

  return json({ error: 'unknown_action' }, 400);
});
