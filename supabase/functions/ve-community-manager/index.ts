// ve-community-manager: the decision end of the Community Manager page
// (Sean, 2026-09-25: the page recruits, the candidate decides, and registering
// plus confirming is their acceptance).
//
// POST { action: 'question', name, email, message, city, hp? }       (no login)
//   Stores the question and emails it to Sean, reply-to the candidate.
// POST { action: 'confirm', city, acknowledgements }  Authorization: Bearer <ve_token>
//   Requires an active (paid) membership and every acknowledgement. Records the
//   confirmation and emails Sean. Approved Community Managers are 'confirmed';
//   anyone else is 'pending_review' for Sean to decide.
// POST { action: 'status' }  Authorization: Bearer <ve_token>
//   Whether this member has confirmed or applied, and whether they were invited.
// POST { action: 'apply_audio', city, key, audio_b64, mime }  Authorization: Bearer <ve_token>
//   Stores one recorded answer in the private cm-applications bucket; returns its path.
// POST { action: 'apply', city, answers: [{key, question, text, audio_path?}], phone? }
//   The application (Sean, 2026-09-26: open to every member, so there is always a
//   bench ready as cities grow). Requires an active membership. Emails Sean the
//   answers with week-long links to any recordings.
//
// Approval (Sean, 2026-10-03: "same switch for Ron"). Nobody becomes a Community Manager
// until Sean approves them, invited or not. An invite (ve_staff_invites) only marks the
// application "Invited"; it no longer sets the role at sign-up. Superadmins (Depot >
// Community Managers):
// POST { action: 'admin_list' }   every application, with its answers and one-hour links to recordings
// POST { action: 'admin_decide', id, decision: 'approve' | 'standby' | 'decline' | 'revoke' }
//   approve: members.ve_role and staff_role 'community_manager', home_community = the city,
//     the city's manager when it has none, application 'selected', and a welcome email.
//     The applicant's dashboard switches to the Community Manager view on their next load.
//   revoke: takes the role away (back to the member dashboard) and frees the city.
//   standby / decline: the application status only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SEAN_EMAIL = 'contact@lesaruss.com';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const ACKS = ['lead_city', 'trial', 'time', 'certification'];
const AUDIO_TYPES: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' };
const CITY_NAMES: Record<string, string> = {
  'south-florida': 'South Florida', 'orlando-north-central-florida': 'Orlando and North Central Florida',
  'philadelphia': 'Philadelphia', 'new-york': 'New York', 'los-angeles': 'Los Angeles',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

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

async function sendEmail(subject: string, html: string, replyTo?: string, to: string = SEAN_EMAIL) {
  if (!RESEND_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return res.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const citySlug = CITY_NAMES[String(body.city || '')] ? String(body.city) : null;
  const cityName = citySlug ? CITY_NAMES[citySlug] : 'your city';

  if (action === 'question') {
    if (body.hp) return json({ ok: true }); // honeypot
    const name = String(body.name || '').trim().slice(0, 120);
    const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 4000);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) return json({ error: 'name, email and a question are required' }, 400);
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await db.from('ve_cm_candidates').select('id', { count: 'exact', head: true }).eq('kind', 'question').eq('email', email).gte('created_at', since);
    if ((count ?? 0) >= 3) return json({ error: 'You have sent a few questions already. We will be in touch soon.' }, 429);
    await db.from('ve_cm_candidates').insert({ kind: 'question', email, name, city_slug: citySlug, message });
    const sent = await sendEmail(`Community Manager question from ${name} (${cityName})`,
      `<p><strong>${esc(name)}</strong> (${esc(email)}) has a question about the ${esc(cityName)} Community Manager role:</p><blockquote style="border-left:3px solid #3A9B3E;padding-left:12px;">${esc(message).replace(/\n/g, '<br>')}</blockquote><p>Reply to this email to answer them directly.</p>`, email);
    return json({ ok: true, emailed: sent });
  }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: member } = await db.from('members').select('id, email, name, ve_role, membership_status, home_community, is_superadmin').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'member_not_found' }, 404);
  const { data: invite } = await db.from('ve_staff_invites').select('email, city_slug').ilike('email', member.email).maybeSingle();
  // Invited is a label for Sean (someone he already talked to); approved is the switch.
  const invited = !!invite;
  const approved = member.ve_role === 'community_manager';

  // Sean's dashboard checklist (Depot > Dashboard checklist): which parts of the
  // dashboard each role sees. Only Hide marks are stored; anyone can read them.
  if (action === 'admin_dashboard_set') {
    if (!member.is_superadmin) return json({ error: 'no_access' }, 403);
    const value: Record<string, Record<string, boolean>> = {};
    for (const role of ['member', 'cm', 'superadmin']) {
      const marks = body.marks?.[role] || {};
      value[role] = {};
      for (const k of Object.keys(marks).slice(0, 100)) {
        if (/^[a-z0-9-]{1,40}$/.test(k) && marks[k] === false) value[role][k] = false;
      }
    }
    const { error } = await db.from('ve_site_settings').upsert({ key: 'dashboard_sections', value, updated_at: new Date().toISOString(), updated_by: memberId });
    if (error) return json({ error: 'save_failed', message: error.message }, 500);
    return json({ ok: true, value });
  }

  if (action === 'admin_list' || action === 'admin_decide') {
    if (!member.is_superadmin) return json({ error: 'no_access' }, 403);
    if (action === 'admin_list') {
      const { data: rows, error } = await db.from('ve_cm_candidates').select('id, member_id, email, name, city_slug, answers, phone, invited, status, created_at')
        .eq('kind', 'application').order('created_at', { ascending: false }).limit(300);
      if (error) return json({ error: 'list_failed', message: error.message }, 500);
      const ids = [...new Set((rows || []).map((r: any) => r.member_id).filter(Boolean))];
      const { data: people } = ids.length ? await db.from('members').select('id, ve_role, membership_status, member_class, home_community').in('id', ids) : { data: [] };
      const byId: Record<string, any> = {}; (people || []).forEach((m: any) => { byId[m.id] = m; });
      const { data: invites } = await db.from('ve_staff_invites').select('email');
      const invitedSet = new Set((invites || []).map((i: any) => String(i.email || '').toLowerCase()));
      const { data: cities } = await db.from('ve_partner_cities').select('slug, manager_member_id, manager_name');
      const out = await Promise.all((rows || []).map(async (r: any) => {
        const answers = await Promise.all((Array.isArray(r.answers) ? r.answers : []).map(async (a: any) => {
          let listen = null;
          if (a.audio_path) { const { data } = await db.storage.from('cm-applications').createSignedUrl(a.audio_path, 3600); listen = data?.signedUrl || null; }
          return { key: a.key, question: a.question, text: a.text, listen };
        }));
        const m = byId[r.member_id] || {};
        return { ...r, answers, invited: r.invited || invitedSet.has(String(r.email || '').toLowerCase()), approved: m.ve_role === 'community_manager',
          membership_status: m.membership_status || null, member_class: m.member_class || null, city_name: CITY_NAMES[r.city_slug] || r.city_slug };
      }));
      return json({ applications: out, cities: cities || [] });
    }
    // admin_decide
    const id = String(body.id || ''), decision = String(body.decision || '');
    if (!/^[0-9a-f-]{36}$/.test(id) || !['approve', 'standby', 'decline', 'revoke'].includes(decision)) return json({ error: 'bad_request' }, 400);
    const { data: app } = await db.from('ve_cm_candidates').select('id, member_id, email, name, city_slug, status').eq('id', id).eq('kind', 'application').maybeSingle();
    if (!app) return json({ error: 'not_found' }, 404);
    const city = CITY_NAMES[app.city_slug] || 'your city';
    let note = '';
    if (decision === 'approve' || decision === 'revoke') {
      if (!app.member_id) return json({ error: 'no_account' }, 409);
      const on = decision === 'approve';
      const patch: Record<string, unknown> = { ve_role: on ? 'community_manager' : 'member', staff_role: on ? 'community_manager' : null, updated_at: new Date().toISOString() };
      if (on && app.city_slug) patch.home_community = app.city_slug;
      const { error } = await db.from('members').update(patch).eq('id', app.member_id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      if (on && app.city_slug) {
        const { data: pc } = await db.from('ve_partner_cities').select('manager_member_id').eq('slug', app.city_slug).maybeSingle();
        if (pc && !pc.manager_member_id) await db.from('ve_partner_cities').update({ manager_member_id: app.member_id, manager_email: app.email }).eq('slug', app.city_slug);
        else if (pc && pc.manager_member_id !== app.member_id) note = 'The city already has a manager on file, so it was left as is.';
      }
      if (!on) await db.from('ve_partner_cities').update({ manager_member_id: null }).eq('manager_member_id', app.member_id);
    }
    const status = { approve: 'selected', standby: 'standby', decline: 'declined', revoke: 'standby' }[decision]!;
    await db.from('ve_cm_candidates').update({ status }).eq('id', app.id);
    if (decision === 'approve' && app.email) {
      await sendEmail(`Welcome, ${city} Community Manager`,
        `<p>Hi${app.name ? ' ' + esc(String(app.name).split(' ')[0]) : ''},</p><p>You have been selected as the Vegans Explore Community Manager for <strong>${esc(city)}</strong>. Welcome to the team.</p>` +
        `<p>Log in at <a href="https://vegansexplore.com/dashboard">vegansexplore.com/dashboard</a>. Your dashboard now has your Community Manager tools, and your certification is the first step.</p>` +
        `<p>We start with a three-month trial so we can both see if it is a fit. Reply to this email with any questions.</p><p>Sean and the Vegans Explore team</p>`, SEAN_EMAIL, app.email);
    }
    return json({ ok: true, status, approved: decision === 'approve' ? true : decision === 'revoke' ? false : undefined, note });
  }

  if (action === 'status') {
    const { data: row } = await db.from('ve_cm_candidates').select('status, city_slug, created_at').eq('member_id', memberId).eq('kind', 'confirmation').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: app } = await db.from('ve_cm_candidates').select('status, city_slug, created_at').eq('member_id', memberId).eq('kind', 'application').order('created_at', { ascending: false }).limit(1).maybeSingle();
    return json({ confirmed: !!row, status: row?.status ?? null, applied: !!app, application_status: app?.status ?? null, application_city: app?.city_slug ?? null, invited, approved, membership_status: member.membership_status });
  }

  if (action === 'apply_audio') {
    if (member.membership_status !== 'active') return json({ error: 'membership_required' }, 402);
    const key = String(body.key || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    const mime = String(body.mime || '').split(';')[0].trim().toLowerCase();
    if (!key || !AUDIO_TYPES[mime]) return json({ error: 'bad_audio' }, 400);
    let bytes: Uint8Array;
    try {
      const bin = atob(String(body.audio_b64 || ''));
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } catch { return json({ error: 'bad_audio' }, 400); }
    if (bytes.length < 500 || bytes.length > 12 * 1024 * 1024) return json({ error: 'bad_size' }, 400);
    const path = `${citySlug || 'no-city'}/${memberId}/${key}-${Date.now()}.${AUDIO_TYPES[mime]}`;
    const up = await db.storage.from('cm-applications').upload(path, bytes, { contentType: mime, upsert: false });
    if (up.error) return json({ error: 'upload_failed' }, 500);
    return json({ ok: true, path });
  }

  if (action === 'apply') {
    if (member.membership_status !== 'active') return json({ error: 'membership_required' }, 402);
    if (!citySlug) return json({ error: 'bad_city' }, 400);
    const raw = Array.isArray(body.answers) ? body.answers.slice(0, 20) : [];
    const answers = raw.map((a: any) => ({
      key: String(a?.key || '').slice(0, 40),
      question: String(a?.question || '').slice(0, 400),
      text: String(a?.text || '').trim().slice(0, 6000),
      audio_path: typeof a?.audio_path === 'string' && a.audio_path.startsWith(`${citySlug || 'no-city'}/${memberId}/`) ? a.audio_path : null,
    })).filter((a: any) => a.key && (a.text || a.audio_path));
    if (answers.length < 3) return json({ error: 'answer_more' }, 400);
    const phone = String(body.phone || '').replace(/[^\d+()\-. ]/g, '').slice(0, 30) || null;
    const { data: prior } = await db.from('ve_cm_candidates').select('id').eq('member_id', memberId).eq('kind', 'application').eq('city_slug', citySlug).maybeSingle();
    const row = { kind: 'application', member_id: memberId, email: member.email, name: member.name, city_slug: citySlug, answers, phone, invited, status: 'applied' };
    if (prior) await db.from('ve_cm_candidates').update({ ...row, created_at: new Date().toISOString() }).eq('id', prior.id);
    else await db.from('ve_cm_candidates').insert(row);
    const items = await Promise.all(answers.map(async (a: any) => {
      let listen = '';
      if (a.audio_path) {
        const { data } = await db.storage.from('cm-applications').createSignedUrl(a.audio_path, 7 * 24 * 3600);
        if (data?.signedUrl) listen = ` <a href="${esc(data.signedUrl)}">Listen to the recording</a>`;
      }
      return `<p style="margin:14px 0 4px;"><strong>${esc(a.question)}</strong></p><p style="margin:0;">${esc(a.text || '(Recorded answer only)').replace(/\n/g, '<br>')}${listen}</p>`;
    }));
    await sendEmail(`${prior ? 'Updated application' : 'New application'}: Community Manager, ${cityName}, ${member.name || member.email}`,
      `<p><strong>${esc(member.name || '')}</strong> (${esc(member.email)}${phone ? ', ' + esc(phone) : ''}) applied to be the Vegans Explore Community Manager for <strong>${esc(cityName)}</strong>.${invited ? ' You invited them.' : ''}</p>${items.join('')}<p style="margin-top:14px;">Approve, put on standby or decline them in the Depot: <a href="https://vegansexplore.com/admin/depot/community-managers">vegansexplore.com/admin/depot/community-managers</a></p><p style="margin-top:18px;color:#666;">Recording links work for 7 days. Reply to this email to reach them.</p>`, member.email);
    return json({ ok: true, invited, approved, updated: !!prior });
  }

  if (action === 'confirm') {
    if (member.membership_status !== 'active') return json({ error: 'membership_required' }, 402);
    const acks = body.acknowledgements || {};
    if (!ACKS.every((k) => acks[k] === true)) return json({ error: 'confirm_every_item' }, 400);
    const status = approved ? 'confirmed' : 'pending_review';
    const { data: existing } = await db.from('ve_cm_candidates').select('id, status').eq('member_id', memberId).eq('kind', 'confirmation').maybeSingle();
    if (!existing) {
      await db.from('ve_cm_candidates').insert({ kind: 'confirmation', member_id: memberId, email: member.email, name: member.name, city_slug: citySlug ?? invite?.city_slug ?? null, acknowledgements: acks, invited, status });
      await sendEmail(`${member.name || member.email} confirmed: Community Manager, ${cityName}`,
        `<p><strong>${esc(member.name || '')}</strong> (${esc(member.email)}) confirmed they want to be the Vegans Explore Community Manager for <strong>${esc(cityName)}</strong>.</p><ul><li>Wants to lead the city</li><li>Understands the three-month trial</li><li>Can give about 3 hours a week</li><li>Will complete the certification</li></ul><p>${approved ? 'You have approved them, so the certification is waiting in their dashboard.' : 'They are not approved yet. Approve them in the Depot to turn on their Community Manager dashboard: <a href="https://vegansexplore.com/admin/depot/community-managers">vegansexplore.com/admin/depot/community-managers</a>'}</p>`, member.email);
    }
    return json({ ok: true, invited, status: existing?.status ?? status });
  }

  return json({ error: 'unknown_action' }, 400);
});
