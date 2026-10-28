// ve-campaign-window: member profiles, phase 3 (Sean, 2026-10-28: "go ahead with phase 3"; playbook
// ve-member-profiles-partner-windows, migration 20261028_campaign_window.sql).
//
// Saving a listing is a bookmark, never consent. Saving a listing a business has claimed offers an unticked "Let <name> message
// me during their campaigns" (ve_listing_optins), 25 points once per listing; unsaving withdraws it. The team sets a campaign's
// dates (ve_listing_campaigns, Depot > Brand campaigns). While one is live, the owner sees the shown profile parts of the members
// who said yes and messages them through us; otherwise, and for everyone else, counts by chapter, never names.
//
// Anyone (no sign-in; the token is the member's own link from a message email):
// POST { action: 'msg_get' | 'msg_stop' | 'msg_report', token, note? }   read it, stop that listing's messages (withdraws the
//        yes), or report it (pauses the campaign until the team resumes it, withdraws the yes, emails Sean)
// Member (Authorization: Bearer <ve_token>):
// POST { action: 'optin_get', listing_id }  -> state          claimed, saved, said yes, points paid, the live campaign
// POST { action: 'optin_set', listing_id, on }  -> state      only a paid member, a claimed listing, and while it is saved
// POST { action: 'mine' }                    -> { optins, claimed }  the listings they said yes to, and their saves that a
//        business has claimed (My Saves shows the switch on those)
// Owner (listings.owner_member_id, claim approved) or a super admin (reads only):
// POST { action: 'audience', listing_id }    -> counts and segments; during a live campaign the profiles, messages and limits
// POST { action: 'message_send', listing_id, body }   the owner only, during a live campaign: 1 a week, 4 a campaign, 1,000 characters
// Super admin (Depot > Brand campaigns):
// POST { action: 'campaigns' } | { action: 'campaign_get', id } | { action: 'campaign_save', campaign } |
//      { action: 'campaign_end' | 'campaign_resume', id } | { action: 'listings', q }
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SEAN_EMAIL = 'contact@lesaruss.com';
const SITE = 'https://vegansexplore.com';
const DAY_MS = 24 * 60 * 60 * 1000;
const MSG = { perCampaign: 4, gapMs: 7 * DAY_MS, max: 1000 };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const p = (s: string) => `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">${s}</p>`;
const firstName = (n: unknown) => String(n || '').trim().split(/\s+/)[0] || 'there';
const longDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));

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

async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_KEY || !to.length) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) { console.error('Resend failed:', e); return false; }
}
async function sendBatch(items: { to: string; subject: string; html: string }[]) {
  const ids: (string | null)[] = [];
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((m) => ({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', reply_to: SEAN_EMAIL, to: [m.to], subject: m.subject, html: m.html }))),
      });
      const d = res.ok ? await res.json() : null;
      if (!res.ok) console.error('Resend batch error:', await res.text());
      chunk.forEach((_m, k) => ids.push(d?.data?.[k]?.id || null));
    } catch (e) { console.error('Resend batch failed:', e); chunk.forEach(() => ids.push(null)); }
  }
  return ids;
}

// One message as each member gets it: from Vegans Explore with the listing's name, their words as plain text, and the member's own
// link to read it, stop them or report it. No email address is shown either way, and replies come to us.
function messageEmail(name: string, slug: string, campaign: any, body: string, token: string, member: string) {
  const link = `${SITE}/messages#c/${token}`;
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="font-size:13px;color:#555;margin:0 0 14px">A message from <b>${esc(name)}</b> about <b>${esc(campaign.name)}</b>, sent through Vegans Explore.</p>` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(member))},</p>` +
    `<div style="border-left:3px solid #3A9B3E;background:#f7f8f7;padding:14px 16px;border-radius:6px;margin:0 0 18px">${esc(body).replace(/\r?\n/g, '<br>')}</div>` +
    `<p style="font-size:13px;color:#555;margin:0 0 8px">You are getting this because you saved <a href="${SITE}/directory/${esc(slug)}" style="color:#1f5f22">${esc(name)}</a> on Vegans Explore and said they could message you during their campaigns. ${esc(name)} does not see your email address. This campaign's messages stop after ${esc(longDay(campaign.ends_on))}.</p>` +
    `<p style="font-size:13px;margin:0"><a href="${link}" style="color:#1f5f22;font-weight:700">Read it on Vegans Explore</a> &middot; <a href="${link}" style="color:#1f5f22;font-weight:700">Stop messages from ${esc(name)}</a> &middot; <a href="${link}" style="color:#1f5f22;font-weight:700">Report this message</a></p>` +
    `<p style="font-size:12px;color:#777;margin:18px 0 0">Vegans Explore, a LESARUSS brand. 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p></div>`;
}

// A member's link from a message email.
async function messageLink(action: string, body: any) {
  const tok = typeof body.token === 'string' && /^[0-9a-f]{64}$/.test(body.token) ? body.token : '';
  if (!tok) return json({ error: 'not_found' }, 404);
  const { data: d } = await db.from('ve_campaign_message_deliveries').select('id, member_id, read_at, reported_at, message_id').eq('token', tok).maybeSingle();
  if (!d) return json({ error: 'not_found' }, 404);
  const { data: m } = await db.from('ve_campaign_messages').select('id, body, created_at, campaign_id, listing_id').eq('id', d.message_id).maybeSingle();
  if (!m) return json({ error: 'not_found' }, 404);
  const [{ data: l }, { data: c }] = await Promise.all([
    db.from('listings').select('id, name, slug').eq('id', m.listing_id).maybeSingle(),
    db.from('ve_listing_campaigns').select('id, name, ends_on').eq('id', m.campaign_id).maybeSingle(),
  ]);
  const { data: o } = await db.from('ve_listing_optins').select('withdrawn_at').eq('member_id', d.member_id).eq('listing_id', m.listing_id).maybeSingle();
  const name = l?.name || 'This business';
  const stop = () => db.from('ve_listing_optins').update({ withdrawn_at: new Date().toISOString() }).eq('member_id', d.member_id).eq('listing_id', m.listing_id).is('withdrawn_at', null);

  if (action === 'msg_get') {
    if (!d.read_at) await db.from('ve_campaign_message_deliveries').update({ read_at: new Date().toISOString() }).eq('id', d.id);
    return json({ name, slug: l?.slug || null, campaign: c ? { name: c.name, ends_on: c.ends_on } : null, body: m.body, sent_at: m.created_at, stopped: !o || !!o.withdrawn_at, reported: !!d.reported_at });
  }
  if (action === 'msg_stop') { await stop(); return json({ ok: true, name }); }
  if (action === 'msg_report') {
    if (d.reported_at) return json({ ok: true, name });
    const note = clean(body.note, 1000), at = new Date().toISOString();
    await db.from('ve_campaign_message_deliveries').update({ reported_at: at, report_note: note || null }).eq('id', d.id);
    await db.from('ve_listing_campaigns').update({ paused_at: at, paused_reason: 'A member reported a message' }).eq('id', m.campaign_id).is('paused_at', null);
    await stop();
    await sendEmail([SEAN_EMAIL], `[Brand campaigns] A member reported ${name}'s message`,
      p(`A member reported a message from <b>${esc(name)}</b> during <b>${esc(c?.name || 'their campaign')}</b>. The campaign's messages are paused until the team looks.`) +
      p(`The message:<br>${esc(m.body).replace(/\r?\n/g, '<br>')}`) + (note ? p(`Why they reported it: ${esc(note)}`) : '') +
      p(`<a href="${SITE}/admin/depot/brand-campaigns#c/${m.campaign_id}">Open it in Depot &gt; Brand campaigns</a> to resume or end it.`));
    return json({ ok: true, name });
  }
  return json({ error: 'unknown_action' }, 400);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  if (['msg_get', 'msg_stop', 'msg_report'].includes(action)) return messageLink(action, body);

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);
  const { data: me } = await db.from('members').select('id, name, is_superadmin').eq('id', memberId).maybeSingle();
  if (!me) return json({ error: 'member_not_found' }, 404);
  const admin = !!me.is_superadmin;
  const needAdmin = () => (admin ? null : json({ error: 'no_access' }, 403));

  switch (action) {
    case 'optin_get':
    case 'optin_set': {
      if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
      if (action === 'optin_get') {
        const { data } = await db.rpc('ve_listing_optin_state', { p_listing: body.listing_id, p_member: memberId });
        return data ? json({ ok: true, state: data }) : json({ error: 'not_found' }, 404);
      }
      const { data, error } = await db.rpc('ve_listing_optin_set', { p_member: memberId, p_listing: body.listing_id, p_on: !!body.on });
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      const why: Record<string, string> = { not_eligible: 'This is for Passport holders.', not_found: 'That listing is not here.', not_claimed: 'This listing has no owner on Vegans Explore yet.', not_saved: 'Save it first.' };
      if (data?.error) return json({ error: data.error, message: why[data.error] || 'That did not save.' }, 400);
      return json({ ok: true, state: data });
    }

    case 'mine': {
      const { data: os } = await db.from('ve_listing_optins').select('listing_id, created_at').eq('member_id', memberId).is('withdrawn_at', null);
      // Their saves that a business has claimed: the ones that can ask, so My Saves can offer the switch.
      const { data: sv } = await db.from('ve_listing_saves').select('listing_id, listings!inner(owner_member_id, status)').eq('member_id', memberId).not('listings.owner_member_id', 'is', null).eq('listings.status', 'approved');
      return json({ optins: (os || []).map((o) => o.listing_id), claimed: (sv || []).map((x: any) => x.listing_id) });
    }

    case 'audience':
    case 'message_send': {
      if (!isId(body.listing_id)) return json({ error: 'bad_id' }, 400);
      const { data: l } = await db.from('listings').select('id, name, slug, owner_member_id, claim_status').eq('id', body.listing_id).maybeSingle();
      if (!l) return json({ error: 'not_found' }, 404);
      const owner = l.owner_member_id === memberId;
      if (!owner && !admin) return json({ error: 'not_owner' }, 403);
      const verified = l.claim_status === 'verified' || admin;
      const { data: seg } = await db.rpc('ve_listing_segments', { p_listing: l.id });
      const { data: liveId } = await db.rpc('ve_listing_campaign_live', { p_listing: l.id });
      const { data: cs } = await db.from('ve_listing_campaigns').select('id, name, starts_on, ends_on, ended_at, paused_at, paused_reason').eq('listing_id', l.id).order('starts_on', { ascending: false });
      const live = (cs || []).find((c) => c.id === liveId) || null;
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      const next = (cs || []).filter((c) => !c.ended_at && c.starts_on > today).sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0] || null;
      let sent: any[] = [];
      if (live) ({ data: sent } = await db.from('ve_campaign_messages').select('id, body, recipients, sent, created_at').eq('campaign_id', live.id).order('created_at', { ascending: false }) as any);
      const last = sent?.[0] ? new Date(sent[0].created_at).getTime() : 0;
      const left = live ? Math.max(0, MSG.perCampaign - (sent?.length || 0)) : 0;
      const nextAt = last && Date.now() - last < MSG.gapMs ? new Date(last + MSG.gapMs).toISOString() : null;

      if (action === 'message_send') {
        if (!owner) return json({ error: 'not_owner', message: 'Only the owner sends their messages.' }, 403);
        if (l.claim_status !== 'verified') return json({ error: 'not_verified', message: 'Messages open once we approve your claim.' }, 403);
        if (!live) return json({ error: 'closed', message: 'Messages open only while one of your campaigns is running.' }, 400);
        if (live.paused_at) return json({ error: 'paused', message: 'Your campaign\'s messages are paused while our team looks at a member\'s report.' }, 403);
        const text = clean(body.body, MSG.max + 1);
        if (!text) return json({ error: 'missing', message: 'Write your message first.' }, 400);
        if (text.length > MSG.max) return json({ error: 'too_long', message: `Keep it to ${MSG.max.toLocaleString('en-US')} characters.` }, 400);
        if (!left) return json({ error: 'cap', message: `You have sent all ${MSG.perCampaign} messages for this campaign.` }, 429);
        if (nextAt) return json({ error: 'wait', message: 'One message a week. You can send the next one ' + new Date(nextAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' }) + '.' }, 429);
        const { data: aud } = await db.rpc('ve_listing_audience', { p_listing: l.id });
        const ids = ((aud || []) as any[]).map((x) => (typeof x === 'string' ? x : Object.values(x)[0])).filter(Boolean) as string[];
        if (!ids.length) return json({ error: 'nobody', message: 'No members have said you can message them yet.' }, 400);
        const { data: msg, error: me2 } = await db.from('ve_campaign_messages').insert({ campaign_id: live.id, listing_id: l.id, sender_id: memberId, body: text, recipients: ids.length }).select('id').single();
        if (me2 || !msg) return json({ error: 'save_failed', message: me2?.message }, 500);
        const { data: dels } = await db.from('ve_campaign_message_deliveries').insert(ids.map((id) => ({ message_id: msg.id, member_id: id }))).select('id, member_id, token');
        const { data: ms } = await db.from('members').select('id, name, email').in('id', ids);
        const who: Record<string, any> = {}; for (const x of ms || []) who[x.id] = x;
        const list = (dels || []).filter((x) => who[x.member_id]?.email);
        const out = await sendBatch(list.map((x) => ({ to: who[x.member_id].email, subject: `${l.name}: ${live.name}`, html: messageEmail(l.name, l.slug, live, text, x.token, who[x.member_id].name) })));
        const now = new Date().toISOString();
        await Promise.all(list.map((x, k) => db.from('ve_campaign_message_deliveries').update(out[k] ? { email_status: 'sent', email_id: out[k], sent_at: now } : { email_status: 'failed' }).eq('id', x.id)));
        const ok = out.filter(Boolean).length;
        await db.from('ve_campaign_messages').update({ sent: ok }).eq('id', msg.id);
        return json({ ok: true, sent: ok, recipients: ids.length });
      }

      // Names only inside a live campaign, and only of those who said yes, as ve_profile_public shows them.
      let people: any[] = [];
      if (live && verified) {
        const { data: aud } = await db.rpc('ve_listing_audience', { p_listing: l.id });
        const ids = ((aud || []) as any[]).map((x) => (typeof x === 'string' ? x : Object.values(x)[0])).filter(Boolean) as string[];
        people = (await Promise.all(ids.slice(0, 500).map(async (id) => (await db.rpc('ve_profile_public', { p_member: id })).data))).filter(Boolean)
          .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)));
      }
      return json({
        ok: true, owner, verified, saved: seg?.saved || 0, opted_in: seg?.opted_in || 0, by_chapter: seg?.by_chapter || [],
        campaign: live ? { name: live.name, starts_on: live.starts_on, ends_on: live.ends_on, paused: !!live.paused_at } : null,
        next: next ? { name: next.name, starts_on: next.starts_on, ends_on: next.ends_on } : null,
        past: (cs || []).filter((c) => c.ends_on < today || c.ended_at).length,
        people, messages: sent || [],
        limits: { per_campaign: MSG.perCampaign, left, next_at: nextAt, max: MSG.max },
      });
    }

    // ---- Depot > Brand campaigns
    case 'listings': {
      const gate = needAdmin(); if (gate) return gate;
      const q = clean(body.q, 80);
      let r = db.from('listings').select('id, name, slug, category, address_city, owner_member_id, claim_status').eq('status', 'approved').not('owner_member_id', 'is', null).order('name').limit(30);
      if (q) r = r.ilike('name', `%${q.replace(/[%_]/g, '')}%`);
      const { data } = await r;
      return json({ listings: data || [] });
    }

    case 'campaigns': {
      const gate = needAdmin(); if (gate) return gate;
      const { data: cs } = await db.from('ve_listing_campaigns').select('id, listing_id, name, starts_on, ends_on, note, ended_at, paused_at, paused_reason, created_at').order('starts_on', { ascending: false }).limit(500);
      const lids = [...new Set((cs || []).map((c) => c.listing_id))];
      const ls: Record<string, any> = {};
      if (lids.length) { const { data } = await db.from('listings').select('id, name, slug').in('id', lids); for (const x of data || []) ls[x.id] = x; }
      const cids = (cs || []).map((c) => c.id);
      const counts: Record<string, { messages: number; reports: number }> = {};
      if (cids.length) {
        const { data: ms } = await db.from('ve_campaign_messages').select('id, campaign_id').in('campaign_id', cids);
        for (const m of ms || []) (counts[m.campaign_id] ||= { messages: 0, reports: 0 }).messages++;
        if (ms?.length) {
          const { data: rp } = await db.from('ve_campaign_message_deliveries').select('message_id').in('message_id', ms.map((m) => m.id)).not('reported_at', 'is', null);
          const byMsg: Record<string, string> = {}; for (const m of ms) byMsg[m.id] = m.campaign_id;
          for (const r of rp || []) (counts[byMsg[r.message_id]] ||= { messages: 0, reports: 0 }).reports++;
        }
      }
      return json({ campaigns: (cs || []).map((c) => ({ ...c, listing: ls[c.listing_id] || null, ...(counts[c.id] || { messages: 0, reports: 0 }) })),
        today: new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) });
    }

    case 'campaign_get': {
      const gate = needAdmin(); if (gate) return gate;
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: c } = await db.from('ve_listing_campaigns').select('*').eq('id', body.id).maybeSingle();
      if (!c) return json({ error: 'not_found' }, 404);
      const { data: l } = await db.from('listings').select('id, name, slug, owner_member_id, claim_status').eq('id', c.listing_id).maybeSingle();
      const { data: owner } = l?.owner_member_id ? await db.from('members').select('name, email').eq('id', l.owner_member_id).maybeSingle() : { data: null };
      const { data: seg } = await db.rpc('ve_listing_segments', { p_listing: c.listing_id });
      const { data: ms } = await db.from('ve_campaign_messages').select('id, body, recipients, sent, created_at').eq('campaign_id', c.id).order('created_at', { ascending: false });
      const reports: Record<string, any[]> = {};
      if (ms?.length) {
        const { data: rp } = await db.from('ve_campaign_message_deliveries').select('message_id, reported_at, report_note').in('message_id', ms.map((m) => m.id)).not('reported_at', 'is', null);
        for (const r of rp || []) (reports[r.message_id] ||= []).push({ at: r.reported_at, note: r.report_note });
      }
      return json({ campaign: c, listing: l, owner, saved: seg?.saved || 0, opted_in: seg?.opted_in || 0, by_chapter: seg?.by_chapter || [],
        messages: (ms || []).map((m) => ({ ...m, reports: reports[m.id] || [] })) });
    }

    case 'campaign_save': {
      const gate = needAdmin(); if (gate) return gate;
      const c = body.campaign || {};
      const row: Record<string, unknown> = { name: clean(c.name, 120), starts_on: c.starts_on, ends_on: c.ends_on, note: clean(c.note, 1000) || null };
      if (!row.name) return json({ error: 'missing', message: 'Give the campaign a name.' }, 400);
      if (!isDate(c.starts_on) || !isDate(c.ends_on)) return json({ error: 'missing', message: 'Pick the first and last day.' }, 400);
      if (c.ends_on < c.starts_on) return json({ error: 'dates', message: 'The last day comes after the first.' }, 400);
      if (isId(c.id)) {
        const { error } = await db.from('ve_listing_campaigns').update(row).eq('id', c.id);
        if (error) return json({ error: 'save_failed', message: error.message }, 500);
        return json({ ok: true, id: c.id });
      }
      if (!isId(c.listing_id)) return json({ error: 'missing', message: 'Pick the listing.' }, 400);
      const { data: l } = await db.from('listings').select('id, owner_member_id').eq('id', c.listing_id).maybeSingle();
      if (!l?.owner_member_id) return json({ error: 'not_claimed', message: 'Only a listing its business has claimed can run a campaign window.' }, 400);
      const { data, error } = await db.from('ve_listing_campaigns').insert({ ...row, listing_id: l.id, created_by: memberId }).select('id').single();
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true, id: data.id });
    }

    case 'campaign_end':
    case 'campaign_resume': {
      const gate = needAdmin(); if (gate) return gate;
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const patch = action === 'campaign_end' ? { ended_at: new Date().toISOString() } : { paused_at: null, paused_reason: null };
      const { error } = await db.from('ve_listing_campaigns').update(patch).eq('id', body.id);
      if (error) return json({ error: 'save_failed', message: error.message }, 500);
      return json({ ok: true });
    }

    default:
      return json({ error: 'unknown_action' }, 400);
  }
});
