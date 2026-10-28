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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    let action = url.searchParams.get('action') || 'submit';
    if (action === 'draft') action = 'profile';
    if (action === 'draft_save') action = 'save';
    if (!['profile', 'answer', 'save', 'submit', 'shown', 'admin_list', 'admin_get'].includes(action)) return json({ error: 'unknown_action' }, 400);

    const body = await req.json().catch(() => ({}));
    const token = body.token;
    if (!token) return json({ error: 'No token' }, 401);
    const decoded = await verifyToken(token);
    if (!decoded) return json({ error: 'Invalid or expired token' }, 401);
    const memberId = decoded.sub;

    const state = async () => {
      const { data, error } = await supabase.rpc('ve_profile_state', { p_member: memberId });
      if (error || !data) throw new Error('state: ' + (error?.message ?? 'none'));
      return data as Record<string, unknown>;
    };
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
