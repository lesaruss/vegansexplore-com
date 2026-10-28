// ve-mission-survey — structured Mission Survey submit for the VE dashboard.
// 2026-09-22 (Sean): the old single free-text survey became ~20 structured
// questions. This persists the full set to members.mission_survey_answers
// (jsonb) for market research, writes the profile-mapped answers to their real
// columns so finishing the survey completes the profile, keeps the open-text
// answer in mission_survey_response, and awards the 250-point reward once.
//
// 2026-10-28 (Sean: "They could save it and come back to it. It's not meant to be a quick one and done thing"): drafts.
//   POST ?action=draft       { token }                 -> { ok, completed, draft: { answers, at, saved_at } | null }
//   POST ?action=draft_save  { token, answers, at }    -> { ok }   members.mission_survey_draft, overwritten each time
//   POST ?action=submit      { token, response_text, answers }   as before; clears the draft
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
    if (!/^q\d{1,2}_[a-z_]{1,24}$/.test(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 4000);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === 'string').slice(0, 20).map((x) => (x as string).slice(0, 120));
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'submit';
    if (!['submit', 'draft', 'draft_save'].includes(action)) return json({ error: 'unknown_action' }, 400);

    const body = await req.json().catch(() => ({}));
    const token = body.token;
    if (!token) return json({ error: 'No token' }, 401);
    const decoded = await verifyToken(token);
    if (!decoded) return json({ error: 'Invalid or expired token' }, 401);

    const { data: member } = await supabase.from('members')
      .select('id, membership_status, membership_tier, mission_survey_completed_at, mission_survey_draft')
      .eq('id', decoded.sub).maybeSingle();
    if (!member) return json({ error: 'Member not found' }, 404);
    const eligible = member.membership_status === 'active' && member.membership_tier !== 'guest';

    if (action === 'draft') {
      return json({ ok: true, eligible, completed: !!member.mission_survey_completed_at, draft: member.mission_survey_completed_at ? null : (member.mission_survey_draft ?? null) });
    }

    if (action === 'draft_save') {
      if (member.mission_survey_completed_at) return json({ error: 'already_completed' }, 409);
      if (!eligible) return json({ error: 'not_eligible' }, 403);
      const answers = cleanAnswers(body.answers) ?? {};
      const at = Math.max(0, Math.min(99, Math.floor(Number(body.at) || 0)));
      const draft = { answers, at, saved_at: new Date().toISOString() };
      const { error } = await supabase.from('members').update({ mission_survey_draft: draft }).eq('id', member.id);
      if (error) return json({ error: 'save_failed' }, 500);
      return json({ ok: true, saved_at: draft.saved_at });
    }

    const responseText = typeof body.response_text === 'string' ? body.response_text.trim() : '';
    if (!responseText) return json({ error: 'A response is required.' }, 400);

    const answers = cleanAnswers(body.answers);
    const profileUpdates: Record<string, unknown> = {};
    if (answers) {
      const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      if (s(answers.q1_city)) profileUpdates.home_community = s(answers.q1_city);
      if (s(answers.q2_zip)) profileUpdates.profile_location = s(answers.q2_zip);
      const roles = Array.isArray(answers.q3_roles) ? (answers.q3_roles as unknown[]).filter((x) => typeof x === 'string') : [];
      if (roles.length) profileUpdates.member_type = roles[0];
      if (s(answers.q4_website)) profileUpdates.profile_website = s(answers.q4_website);
      if (s(answers.q5_instagram)) profileUpdates.instagram_handle = s(answers.q5_instagram);
      const vs = s(answers.q7_vegan_since);
      if (/^\d{4}-\d{2}(-\d{2})?$/.test(vs)) profileUpdates.vegan_since = vs.length === 7 ? vs + '-01' : vs;
    }

    if (member.mission_survey_completed_at) return json({ error: 'already_completed' }, 409);
    if (!eligible) return json({ error: 'not_eligible' }, 403);

    const { error: updateErr } = await supabase.from('members').update({
      mission_survey_response: responseText,
      mission_survey_answers: answers,
      mission_survey_draft: null,
      ...profileUpdates,
      mission_survey_completed_at: new Date().toISOString(),
    }).eq('id', member.id);
    if (updateErr) return json({ error: 'update_failed', detail: updateErr.message }, 500);

    let points: unknown = null;
    try {
      const { data } = await supabase.rpc('award_points_bounty', {
        p_member_id: member.id, p_brand: 'vegans-explore',
        p_action_type: 'mission_survey_completed',
        p_ref_id: `mission_survey_completed:${member.id}`, p_reason: 'mission_survey',
      });
      points = data;
    } catch (e) { console.error('mission survey points award failed:', e); }

    return json({ ok: true, points });
  } catch (e) {
    return json({ error: 'server_error', detail: String(e) }, 500);
  }
});
