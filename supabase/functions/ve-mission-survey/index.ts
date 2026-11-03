// ve-mission-survey — structured Mission Survey submit for the VE dashboard.
// 2026-09-22 (Sean): the old single free-text survey became ~20 structured
// questions. This persists the full set to members.mission_survey_answers
// (jsonb) for market research, writes the profile-mapped answers to their real
// columns so finishing the survey completes the profile, keeps the open-text
// answer in mission_survey_response, and awards the 250-point reward once.
//
// 2026-10-28, the survey is the member's profile (Sean: "treat it like a dating profile where it asks different questions about
// themselves that will be added to their profile... a combined 250 points for every question they answer with some questions being
// worth more than others"; migration 20261028_member_profile_points.sql). Every answer is saved at once and pays its own points once,
// all in the database (ve_profile_answer; the points are ve_profile_questions):
//   POST ?action=profile     { token }                          -> { ok, answers, at, points, paid, earned, total, completed }
//   POST ?action=answer      { token, id, value, at? }          -> { ok, points, paid_now, earned, total }
//   POST ?action=save        { token, answers, at? }            -> saves each one the same way (the step-by-step view's Next)
//   POST ?action=shown       { token, id, shown }               -> { ok }   the member's switch on one answer: Can be shown (true) or
//                                                                 Just for Vegans Explore (false); ve_profile_set_shown refuses the
//                                                                 team's questions and contact details (phase 1 of the playbook
//                                                                 ve-member-profiles-partner-windows, 2026-10-28)
//   POST ?action=admin_list  { token }                          -> { ok, members }   super admins: everyone who has answered
//   POST ?action=admin_get   { token, member_id }               -> { ok, profile }   super admins: every answer, their switches
//                                                                 and what anyone outside the team could see
//   draft and draft_save are the same as profile and save (pages cached from the morning); submit saves every answer.
//
// Scope: the dashboard prompt only shows for ACTIVE, non-guest members, so this
// handles that path only. The guest-application path stays in ve-auth's
// submit_mission_survey. The ve_token signature IS verified here (HMAC-SHA256
// with the same secret ve-auth signs with), so a forged token cannot claim the
// reward or write to a profile.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function verifyToken(token: string): Promise<{ sub: string; exp: number } | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const pad = (x: string) => x.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (x.length % 4)) % 4);
    const sigBytes = Uint8Array.from(atob(pad(sig)), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    const payload = JSON.parse(atob(pad(p)));
    if (typeof payload.sub !== 'string') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Answers are the survey's own question ids (q1_city ... q26_work) with short values; anything else is dropped.
function cleanAnswers(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^[pq]\d{0,2}_[a-z_]{1,24}$/.test(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, k.startsWith('p_') ? 300 : 4000);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === 'string').slice(0, 20).map((x) => (x as string).slice(0, 120));
  }
  return out;
}


const esc = (t: string) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function adminToken(): Promise<string | null> {
  const { data } = await supabase.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  return data?.value ?? null;
}
// Through HQ's email system, brand vegans-explore (the same path ve-nurture uses).
async function sendMemberEmail(ref: string, to: string, name: string | null, subject: string, body: string) {
  const admin = await adminToken();
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a"><p style="margin:0 0 18px"><img src="https://vegansexplore.com/public/logo-ve-landscape-v1.svg" alt="Vegans Explore" width="150" style="display:block;border:0"></p>${body}` +
    `<p style="margin-top:28px;font-size:12px;line-height:1.5;color:#777">You are getting this because you took the Vegans Explore survey. <a href="{{unsubscribe_url}}" style="color:#777">Stop these emails</a>. {{postal_address}}.</p></div>`;
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
      body: JSON.stringify({ brand: 'vegans-explore', campaign_ref: ref, list_ref: 've-survey', subject, html, recipients: [{ email: to, name: name || undefined }] }) });
    const j = await r.json().catch(() => ({}));
    return j?.results?.[0]?.result || j?.error || `email-send ${r.status}`;
  } catch (e) { return String(e); }
}
async function notifyTeam(subject: string, text: string) {
  const admin = await adminToken();
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` },
      body: JSON.stringify({ brand: 'vegans-explore', campaign_ref: `ve-survey-review-note-${Date.now()}`, list_ref: 've-team', subject, html: `<p>${esc(text)}</p>`, recipients: [{ email: 'contact@lesaruss.com' }] }) });
  } catch { /* the Depot queue is the record; the email is a nudge */ }
}

// Abuse watch (Logan 2026-11-03): a suspended or banned member may read but not write. A DB error means not blocked.
async function standingBlocked(db: any, memberId: string | null): Promise<boolean> {
  if (!memberId) return false;
  const { data } = await db.from('members').select('standing').eq('id', memberId).maybeSingle();
  return !!data?.standing && data.standing !== 'good';
}
const NOT_IN_GOOD_STANDING = { error: 'account_not_in_good_standing', message: 'Your account is on hold. Write to contact@lesaruss.com and we will help.' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action') || 'submit';
    if (action === 'draft') action = 'profile';
    if (action === 'draft_save') action = 'save';
    if (!['profile', 'answer', 'save', 'submit', 'shown', 'door_start', 'survey_get', 'survey_answer', 'admin_list', 'admin_get', 'finalize', 'review_list', 'review_decide', 'place_search', 'place_lead'].includes(action)) return json({ error: 'unknown_action' }, 400);

    const body = await req.json().catch(() => ({}));
    const token = body.token;
    if (!token) return json({ error: 'No token' }, 401);
    const decoded = await verifyToken(token);
    if (!decoded) return json({ error: 'Invalid or expired token' }, 401);
    const memberId = decoded.sub;
    const READ_ACTIONS = new Set(['profile', 'survey_get', 'admin_list', 'admin_get', 'review_list', 'place_search']);
    if (!READ_ACTIONS.has(action) && await standingBlocked(supabase, memberId)) return json(NOT_IN_GOOD_STANDING, 403);

    const state = async () => {
      const { data, error } = await supabase.rpc('ve_profile_state', { p_member: memberId });
      if (error || !data) throw new Error('state: ' + (error?.message ?? 'none'));
      return data as Record<string, unknown>;
    };
    // The survey door (Sean, 2026-11-03): an account waiting on its Passport may earn its membership with the whole survey.
    if (action === 'door_start') {
      const { data, error } = await supabase.rpc('ve_survey_door_start', { p_member: memberId });
      if (error) throw new Error('door_start: ' + error.message);
      if (data?.error) return json(data, 403);
      return json(data);
    }
    // A Guide's own survey (ve_surveys rows; 2026-11-03): the questions and a member's answers, and one answer at a time.
    // An account waiting on its Passport may answer a survey that admits; finishing it makes them a member.
    if (action === 'survey_get') {
      const { data, error } = await supabase.rpc('ve_survey_get', { p_survey: String(body.survey ?? ''), p_member: memberId });
      if (error) throw new Error('survey_get: ' + error.message);
      if (!data) return json({ error: 'unknown_survey' }, 404);
      return json({ ok: true, survey: data });
    }
    if (action === 'survey_answer') {
      const { data, error } = await supabase.rpc('ve_survey_answer', { p_member: memberId, p_survey: String(body.survey ?? ''), p_question: String(body.id ?? ''), p_value: body.value ?? null });
      if (error) throw new Error('survey_answer: ' + error.message);
      if (data?.error) return json(data, data.error === 'not_eligible' ? 403 : 400);
      return json(data);
    }
    if (action === 'shown') {
      const id = String(body.id ?? '');
      const { data, error } = await supabase.rpc('ve_profile_set_shown', { p_member: memberId, p_question: id, p_shown: body.shown === true });
      if (error) throw new Error('shown: ' + error.message);
      if (data?.error) return json(data, 400);
      return json(data);
    }
    if (action === 'admin_list' || action === 'admin_get') {
      const { data: me } = await supabase.from('members').select('is_superadmin').eq('id', memberId).maybeSingle();
      if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
      if (action === 'admin_list') {
        const { data, error } = await supabase.rpc('ve_profile_admin_list');
        if (error) throw new Error('admin_list: ' + error.message);
        return json({ ok: true, members: data ?? [] });
      }
      const mid = String(body.member_id ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(mid)) return json({ error: 'bad_request' }, 400);
      const { data, error } = await supabase.rpc('ve_profile_admin_get', { p_member: mid });
      if (error) throw new Error('admin_get: ' + error.message);
      if (!data) return json({ error: 'not_found' }, 404);
      return json({ ok: true, profile: data });
    }


    // The survey door waits for a person (Sean, 2026-11-03; migration 20261103_survey_review_gate.sql): Finalize sends the answers to the team,
    // who approve (points paid, member, Founding by the day they finalized) or send them back with a note.
    if (action === 'finalize') {
      const { data, error } = await supabase.rpc('ve_survey_finalize', { p_member: memberId });
      if (error) throw new Error('finalize: ' + error.message);
      if (data?.error) return json(data, data.error === 'not_eligible' ? 403 : 400);
      if (!data?.already) {
        const { data: m } = await supabase.from('members').select('name, email').eq('id', memberId).maybeSingle();
        await notifyTeam(`Survey waiting for review: ${m?.name || m?.email || 'a new member'}`, `${m?.name || ''} (${m?.email || ''}) finalized the survey. Review it in Depot > Profiles > Waiting for review: https://vegansexplore.com/admin/depot/profiles#review`);
      }
      return json(data);
    }
    if (action === 'review_list' || action === 'review_decide') {
      const { data: me } = await supabase.from('members').select('is_superadmin, name').eq('id', memberId).maybeSingle();
      if (!me?.is_superadmin) return json({ error: 'forbidden' }, 403);
      if (action === 'review_list') {
        const { data, error } = await supabase.from('members').select('id, name, email, home_community, survey_review, survey_submitted_at, survey_review_note, survey_reviewed_at')
          .in('survey_review', ['pending', 'sent_back']).order('survey_submitted_at', { ascending: true }).limit(200);
        if (error) throw new Error('review_list: ' + error.message);
        return json({ ok: true, members: data ?? [] });
      }
      const mid = String(body.member_id ?? '');
      const decision = body.decision === 'approve' ? 'approve' : body.decision === 'send_back' ? 'send_back' : '';
      if (!/^[0-9a-f-]{36}$/i.test(mid) || !decision) return json({ error: 'bad_request' }, 400);
      const note = String(body.note ?? '').replace(/\u0000/g, '').trim().slice(0, 1000);
      const { data, error } = await supabase.rpc('ve_survey_review_decide', { p_member: mid, p_judge: memberId, p_decision: decision, p_note: note || null });
      if (error) throw new Error('review_decide: ' + error.message);
      if (data?.error) return json(data, 400);
      const { data: m } = await supabase.from('members').select('name, email, founding_member').eq('id', mid).maybeSingle();
      let mail: unknown = null;
      if (m?.email && !/\[test\]/i.test(m.name || '')) {
        const first = String(m.name || '').split(/\s+/)[0] || 'there';
        if (decision === 'approve') {
          mail = await sendMemberEmail(`ve-survey-approved-${mid}`, m.email, m.name, 'You are in: welcome to Vegans Explore',
            `<p>Hi ${esc(first)},</p><p>Our team checked your survey and everything looks good. You have received your <b>${data.points} points</b>${m.founding_member ? ' and you are officially a <b>Founding Member</b> in our community' : ' and you are officially a member of our community'}.</p>` +
            `<p><a href="https://vegansexplore.com/dashboard?welcome=survey" style="display:inline-block;background:#1f5f22;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:13px 24px;border-radius:6px;text-decoration:none">Open your dashboard</a></p><p>Vegans Explore team</p>`);
        } else {
          mail = await sendMemberEmail(`ve-survey-sentback-${mid}-${Date.now()}`, m.email, m.name, 'A few of your answers need another look',
            `<p>Hi ${esc(first)},</p><p>Thank you for taking the survey. Before we can open your membership, our team asked for a change:</p><blockquote style="margin:14px 0;padding:10px 14px;border-left:3px solid #1f5f22;background:#f4f8f4">${esc(note)}</blockquote>` +
            `<p>Your answers are saved. Open the survey, fix what needs fixing and finalize again.</p><p><a href="https://vegansexplore.com/survey?door=1" style="display:inline-block;background:#1f5f22;color:#fff;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:13px;padding:13px 24px;border-radius:6px;text-decoration:none">Open my survey</a></p><p>Vegans Explore team</p>`);
        }
      }
      return json({ ...data, mail });
    }

    // The local-spots question (q15): typing searches the Directory, and a name that is not there is kept as a lead (a hidden listing and a
    // backlog check, the way Paste a list does it), so it waits in Depot > Business outreach > New places.
    if (action === 'place_search') {
      const q = String(body.q ?? '').replace(/[%_,()\\*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (q.length < 2) return json({ ok: true, places: [] });
      const { data } = await supabase.from('listings').select('name, slug, address_city, category').eq('status', 'approved').ilike('name', `%${q}%`).limit(6);
      return json({ ok: true, places: (data ?? []).map((x: any) => ({ name: x.name, slug: x.slug, city: x.address_city || '', category: x.category || '' })) });
    }
    if (action === 'place_lead') {
      const name = String(body.name ?? '').replace(/\u0000/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
      if (name.length < 2) return json({ error: 'bad_name' }, 400);
      const { count } = await supabase.from('listings').select('id', { count: 'exact', head: true }).eq('crawl_source', 'survey-suggestion').contains('details', { suggested_by: memberId }).gte('created_at', new Date(Date.now() - 864e5).toISOString());
      if ((count ?? 0) >= 15) return json({ error: 'rate_limited' }, 429);
      const { data: dup } = await supabase.from('listings').select('id').in('status', ['approved', 'quarantined']).ilike('name', name.replace(/[%_]/g, ' ')).limit(1);
      if (dup && dup.length) return json({ ok: true, known: true });
      const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
      const { data: l, error } = await supabase.from('listings').insert({ name, category: 'Uncategorized', specialty: '', description: '', status: 'quarantined', website: '', location: '',
        initials, crawl_source: 'survey-suggestion', details: { suggested_by: memberId, suggested_at: new Date().toISOString(), via: 'survey q15' } }).select('id').single();
      if (error || !l) return json({ error: 'save_failed' }, 500);
      await supabase.from('ve_backlog_checks').insert({ listing_id: l.id, track: 'google', stage: 'pending', city_guess: null });
      return json({ ok: true, added: true });
    }

    if (action === 'profile') {
      const st = await state();
      // Old clients read completed and draft.
      return json({ ok: true, ...st, draft: { answers: st.answers, at: st.at } });
    }

    const at = Math.max(0, Math.min(99, Math.floor(Number(body.at) || 0)));
    const saveOne = async (id: string, value: unknown) => {
      const v = cleanAnswers({ [id]: value }) ?? {};
      const { data, error } = await supabase.rpc('ve_profile_answer', { p_member: memberId, p_question: id, p_value: id in v ? v[id] : null });
      if (error) throw new Error('answer: ' + error.message);
      return data as Record<string, unknown>;
    };
    const keepPlace = async () => {
      if (body.at === undefined) return;
      await supabase.from('members').update({ mission_survey_draft: { at, saved_at: new Date().toISOString() } }).eq('id', memberId).is('mission_survey_completed_at', null);
    };

    if (action === 'answer') {
      const id = String(body.id ?? '');
      if (!/^[pq]\d{0,2}_[a-z_]{1,24}$/.test(id)) return json({ error: 'unknown_question' }, 400);
      const r = await saveOne(id, body.value);
      if (r?.error) return json(r, r.error === 'not_eligible' ? 403 : 400);
      await keepPlace();
      return json(r);
    }

    // save / submit: every answer given, each paid once.
    const answers = cleanAnswers(body.answers) ?? {};
    let last: Record<string, unknown> | null = null;
    for (const [id, value] of Object.entries(answers)) {
      const r = await saveOne(id, value);
      if (r?.error === 'not_eligible') return json(r, 403);
      if (!r?.error) last = r;
    }
    await keepPlace();
    const st = await state();
    return json({ ok: true, earned: st.earned, total: st.total, completed: st.completed, saved: !!last });
  } catch (e) {
    console.error('ve-mission-survey:', e);
    return json({ error: 'server_error' }, 500);
  }
});
