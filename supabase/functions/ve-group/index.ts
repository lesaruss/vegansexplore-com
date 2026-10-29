// ve-group: a group's life on Vegans Explore, live (Sean, 2026-10-29). Migration 20261029_group_live.sql.
// "build the live announcements for real groups", and "a way where the organizer can gift a Vegans Explore membership. It would cost
// whatever our half of the $11 would be based on where they are in the commission split. It would be deducted from their payout and
// be applied by them issuing an invite link to a specific address."
//
// verify_jwt off; the VE member token is checked here. Ops (Bearer LESARUSS_ADMIN_TOKEN) may act as a member with as_member, for tests.
// Public (a token is optional):
//   POST { action: 'page', listing_id }  -> { announcements (newest three, a pinned one first), total, members, viewer {signed_in,
//        active, joined, email_ok}, can_post }        the group's Overview and its Join card
//   POST { action: 'msg_get' | 'msg_stop' | 'msg_leave' | 'msg_report', token, note? }   a member's link from an announcement email
//        (/messages#g/<token>): read it, stop the group's emails, leave the group, or report it (pauses the group's emails)
// Members (a Passport):
//   POST { action: 'join', listing_id, email_ok } | { action: 'leave', listing_id } | { action: 'email_pref', listing_id, email_ok }
// The organizer (the listing's owner or the Group Partner lead; super admins too):
//   POST { action: 'dash', listing_id }  -> ve_group_dash: announcements, members, and the partnership (rate, link, events,
//        earnings, gift, gifts) once the group is a Group Partner
//   POST { action: 'group_announce', listing_id, title, body, email, pin }  posts it under About; email: to the members who said yes,
//        through us, at most emails_per_week (2) in 7 days; never while the group's emails are paused
//   POST { action: 'announce_remove', listing_id, id }
// The Group Partner's lead only:
//   POST { action: 'group_gift', listing_id, name, email, note?, send }  -> { url }   a Passport for one email, at our share of the $11
//        at the group's rate today (1,100 points with it), taken from the group's earnings; send: we email it, else they copy the link
//   POST { action: 'gift_send', listing_id, id } | { action: 'gift_cancel', listing_id, id }   cancel gives the cost back
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
const FROM = 'VEGANS EXPLORE <hello@vegansexplore.com>';
const DAY_MS = 24 * 60 * 60 * 1000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*[—–]\s*/g, ', ').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const firstName = (n: string) => String(n || '').trim().split(/\s+/)[0] || 'there';
const shortName = (n: string) => { const p = String(n || '').trim().split(/\s+/); return p[0] + (p[1] ? ' ' + p[1][0] + '.' : ''); };
const money = (c: number) => '$' + (c / 100).toFixed(2);

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
// Same key derivation as ve-auth's signJWT.
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlToBytes(s), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function secret(key: string): Promise<string | null> {
  const env = Deno.env.get(key);
  if (env) return env;
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value && data.value !== 'pending' ? String(data.value) : null;
}
async function memberOf(req: Request, body: any): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const admin = await secret('LESARUSS_ADMIN_TOKEN');
  if (admin && token.length === admin.length && token === admin) return isId(body.as_member) ? body.as_member : null;
  return await verifyToken(token);
}

async function sendOne(to: string, subject: string, html: string, replyTo = SEAN_EMAIL): Promise<string | null> {
  if (!RESEND_KEY) return null;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, reply_to: replyTo, to: [to], subject, html }),
    });
    const d = res.ok ? await res.json() : null;
    if (!res.ok) console.error('Resend error:', await res.text());
    return d?.id ?? null;
  } catch (e) { console.error('Resend failed:', e); return null; }
}
async function sendBatch(items: { to: string; subject: string; html: string }[]) {
  const ids: (string | null)[] = [];
  for (let i = 0; i < items.length; i += 100) {
    const chunk = items.slice(i, i + 100);
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((m) => ({ from: FROM, reply_to: SEAN_EMAIL, to: [m.to], subject: m.subject, html: m.html }))),
      });
      const d = res.ok ? await res.json() : null;
      if (!res.ok) console.error('Resend batch error:', await res.text());
      chunk.forEach((_m, k) => ids.push(d?.data?.[k]?.id || null));
    } catch (e) { console.error('Resend batch failed:', e); chunk.forEach(() => ids.push(null)); }
  }
  return ids;
}
const FOOT = `<p style="font-size:12px;color:#777;margin:18px 0 0">Vegans Explore, a LESARUSS brand. 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301.</p>`;

// One announcement, as a member gets it: from Vegans Explore with the group's name, the organizer's words as plain text, and the
// member's own link to read it, stop the group's emails, leave or report it. No email address is shown either way; replies come to us.
function announcementEmail(group: any, a: { title: string; body: string }, token: string, name: string) {
  const link = `${SITE}/messages#g/${token}`;
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="font-size:13px;color:#555;margin:0 0 14px">An announcement from <b>${esc(group.name)}</b>, sent through Vegans Explore.</p>` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(name))},</p>` +
    `<div style="border-left:3px solid #3A9B3E;background:#f7f8f7;padding:14px 16px;border-radius:6px;margin:0 0 18px"><b>${esc(a.title)}</b><br>${esc(a.body).replace(/\r?\n/g, '<br>')}</div>` +
    `<p style="font-size:13px;color:#555;margin:0 0 8px">You are getting this because you joined ${esc(group.name)} on Vegans Explore and said yes to its announcements. ${esc(group.name)} does not see your email address.</p>` +
    `<p style="font-size:13px;margin:0"><a href="${SITE}/directory/${encodeURIComponent(group.slug)}" style="color:#1f5f22;font-weight:700">See ${esc(group.name)}</a> &middot; <a href="${link}" style="color:#1f5f22;font-weight:700">Stop these emails</a> &middot; <a href="${link}" style="color:#1f5f22;font-weight:700">Report this</a></p>${FOOT}</div>`;
}
// The gift: one person, one link, from the organizer and their group.
function giftEmail(group: any, giver: string, inv: any, note: string) {
  const url = `${SITE}/invite?c=${inv.code}`;
  const pts = Number(inv.points || 0).toLocaleString('en-US');
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:560px">` +
    `<p style="margin:0 0 12px">Hi ${esc(firstName(inv.name))},</p>` +
    `<p style="margin:0 0 12px"><b>${esc(giver)}</b> of <b>${esc(group.name)}</b> gave you a Vegans Explore Passport: a Founding Membership, on them, with <b>${pts} points</b> to start.</p>` +
    (note ? `<div style="border-left:3px solid #3A9B3E;background:#f7f8f7;padding:14px 16px;border-radius:6px;margin:0 0 14px">${esc(note).replace(/\r?\n/g, '<br>')}</div>` : '') +
    `<p style="margin:0 0 12px">Vegans Explore is a community for Vegans, city by city: the places, the events, the groups and the people. Your Passport opens all of it, and ${esc(group.name)} is waiting for you there.</p>` +
    `<p style="margin:0 0 16px"><a href="${url}" style="display:inline-block;background:#2d7d31;color:#fff;font-weight:800;text-decoration:none;padding:12px 18px;border-radius:6px">Accept your Passport</a></p>` +
    `<p style="font-size:13px;color:#555;margin:0">This gift is just for ${esc(inv.email)} and works once, until ${esc(new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'America/New_York' }))}. Nothing to pay.</p>${FOOT}</div>`;
}

async function groupOf(lid: unknown) {
  if (!isId(lid)) return null;
  const { data } = await db.from('listings').select('id, name, slug, category, status, owner_member_id, claimed_by_member_id, claim_status').eq('id', lid).maybeSingle();
  return data && data.status === 'approved' && data.category === 'Groups' ? data : null;
}
async function partnerOf(lid: string) {
  const { data } = await db.from('ve_group_partners').select('id, listing_id, lead_member_id, status, code').eq('listing_id', lid).maybeSingle();
  return data;
}
async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'group_partner_program').maybeSingle();
  return (data?.value ?? {}) as any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const memberId = await memberOf(req, body);
  const { data: member } = memberId ? await db.from('members').select('id, name, email, membership_status, is_superadmin').eq('id', memberId).maybeSingle() : { data: null };
  const active = member?.membership_status === 'active';

  // ---- A member's link from an announcement email (no sign-in: the link is theirs alone).
  if (action.startsWith('msg_')) {
    const tok = typeof body.token === 'string' && /^[0-9a-f]{64}$/.test(body.token) ? body.token : '';
    const { data: d } = tok ? await db.from('ve_group_announcement_deliveries').select('id, member_id, announcement_id, read_at, reported_at').eq('token', tok).maybeSingle() : { data: null };
    const { data: a } = d ? await db.from('ve_group_announcements').select('id, listing_id, title, body, created_at').eq('id', d.announcement_id).maybeSingle() : { data: null };
    const g = a ? await groupOf(a.listing_id) : null;
    if (!d || !a || !g) return json({ error: 'not_found' }, 404);
    const { data: gm } = await db.from('ve_group_members').select('email_ok, left_at').eq('listing_id', g.id).eq('member_id', d.member_id).maybeSingle();
    if (action === 'msg_get') {
      if (!d.read_at) await db.from('ve_group_announcement_deliveries').update({ read_at: new Date().toISOString() }).eq('id', d.id);
      return json({ group: { name: g.name, slug: g.slug }, title: a.title, body: a.body, sent_at: a.created_at,
        stopped: !gm?.email_ok, left: !!gm?.left_at, reported: !!d.reported_at });
    }
    if (action === 'msg_stop') { await db.from('ve_group_members').update({ email_ok: false, email_ok_at: new Date().toISOString() }).eq('listing_id', g.id).eq('member_id', d.member_id); return json({ ok: true }); }
    if (action === 'msg_leave') { await db.from('ve_group_members').update({ left_at: new Date().toISOString(), email_ok: false }).eq('listing_id', g.id).eq('member_id', d.member_id); return json({ ok: true }); }
    if (action === 'msg_report') {
      if (d.reported_at) return json({ ok: true });
      const at = new Date().toISOString(), note = clean(body.note, 1000);
      await db.from('ve_group_announcement_deliveries').update({ reported_at: at, report_note: note || null }).eq('id', d.id);
      await db.from('ve_group_members').update({ email_ok: false, email_ok_at: at }).eq('listing_id', g.id).eq('member_id', d.member_id);
      // A report pauses the group's emails until the team looks (the page posts stay).
      await db.from('ve_group_mail_holds').upsert({ listing_id: g.id, paused_at: at, reason: 'A member reported an announcement' }, { onConflict: 'listing_id' });
      await sendOne(SEAN_EMAIL, `[Groups] A member reported ${g.name}'s announcement`,
        `<p>A member reported an announcement from <b>${esc(g.name)}</b>. Its emails are paused until the team looks (delete the group's row in ve_group_mail_holds to resume).</p>` +
        `<p><b>${esc(a.title)}</b><br>${esc(a.body).replace(/\r?\n/g, '<br>')}</p>${note ? `<p>Why they reported it: ${esc(note)}</p>` : ''}` +
        `<p><a href="${SITE}/directory/${encodeURIComponent(g.slug)}">The group's page</a></p>`);
      return json({ ok: true });
    }
    return json({ error: 'unknown_action' }, 400);
  }

  const g = await groupOf(body.listing_id);
  if (!g) return json({ error: 'not_found' }, 404);
  const partner = await partnerOf(g.id);
  const isLead = !!memberId && !!partner && partner.lead_member_id === memberId && ['onboarding', 'active', 'paused'].includes(partner.status);
  const isOwner = !!memberId && (g.owner_member_id === memberId || g.claimed_by_member_id === memberId);
  const canPost = isLead || isOwner || !!member?.is_superadmin;

  if (action === 'page') {
    const [{ data: anns, count }, { count: members }, { data: me }] = await Promise.all([
      db.from('ve_group_announcements').select('id, title, body, pinned, created_at', { count: 'exact' }).eq('listing_id', g.id).is('removed_at', null)
        .order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
      db.from('ve_group_members').select('member_id', { count: 'exact', head: true }).eq('listing_id', g.id).is('left_at', null),
      memberId ? db.from('ve_group_members').select('email_ok, left_at').eq('listing_id', g.id).eq('member_id', memberId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return json({ announcements: (anns || []).map((a: any) => ({ id: a.id, title: a.title, body: a.body, pinned: a.pinned, at: a.created_at })), total: count || 0,
      members: members || 0, partner: !!partner && ['onboarding', 'active'].includes(partner.status),
      viewer: { signed_in: !!member, active, joined: !!me && !me.left_at, email_ok: !!me && !me.left_at && me.email_ok }, can_post: canPost });
  }

  if (action === 'join' || action === 'leave' || action === 'email_pref') {
    if (!member) return json({ error: 'not_authenticated' }, 401);
    const now = new Date().toISOString();
    if (action === 'leave') {
      await db.from('ve_group_members').update({ left_at: now, email_ok: false }).eq('listing_id', g.id).eq('member_id', member.id);
      return json({ ok: true, joined: false });
    }
    if (!active) return json({ error: 'members_only', message: 'Groups are for Passport holders.' }, 403);
    const ok = body.email_ok === true;
    if (action === 'email_pref') {
      const { data } = await db.from('ve_group_members').update({ email_ok: ok, email_ok_at: now }).eq('listing_id', g.id).eq('member_id', member.id).is('left_at', null).select('member_id');
      if (!data?.length) return json({ error: 'not_joined' }, 400);
      return json({ ok: true, email_ok: ok });
    }
    const { error } = await db.from('ve_group_members').upsert({ listing_id: g.id, member_id: member.id, joined_at: now, left_at: null, email_ok: ok, email_ok_at: now, via: 'page' }, { onConflict: 'listing_id,member_id' });
    if (error) return json({ error: 'save_failed' }, 500);
    return json({ ok: true, joined: true, email_ok: ok });
  }

  // ---- The organizer from here on.
  if (!member) return json({ error: 'not_authenticated' }, 401);
  if (!canPost) return json({ error: 'not_organizer' }, 403);
  const dash = async () => { const { data } = await db.rpc('ve_group_dash', { p_listing: g.id }); return data || {}; };

  if (action === 'dash') return json({ ok: true, ...(await dash()), lead: isLead });

  if (action === 'group_announce') {
    const title = clean(body.title, 121), text = clean(body.body, 1001);
    if (!title) return json({ error: 'missing', message: 'Give it a title.' }, 400);
    if (!text) return json({ error: 'missing', message: 'Write the message.' }, 400);
    if (title.length > 120) return json({ error: 'too_long', message: 'Keep the title to 120 characters.' }, 400);
    if (text.length > 1000) return json({ error: 'too_long', message: 'Keep it to 1,000 characters.' }, 400);
    const cfg = await settings();
    const { count: today } = await db.from('ve_group_announcements').select('id', { count: 'exact', head: true }).eq('listing_id', g.id).gte('created_at', new Date(Date.now() - DAY_MS).toISOString());
    if ((today || 0) >= (cfg.posts_per_day ?? 5)) return json({ error: 'cap', message: `${cfg.posts_per_day ?? 5} announcements a day at most.` }, 429);
    const email = body.email === true;
    if (email) {
      const { data: hold } = await db.from('ve_group_mail_holds').select('listing_id').eq('listing_id', g.id).maybeSingle();
      if (hold) return json({ error: 'paused', message: 'Your emails are paused while our team looks at a member\'s report. You can still post on your page: untick the email.' }, 403);
      const { count: week } = await db.from('ve_group_announcements').select('id', { count: 'exact', head: true }).eq('listing_id', g.id).eq('emailed', true).gte('created_at', new Date(Date.now() - 7 * DAY_MS).toISOString());
      if ((week || 0) >= (cfg.emails_per_week ?? 2)) return json({ error: 'email_cap', message: `${cfg.emails_per_week ?? 2} emails a week at most. Untick the email to post it on your page now.` }, 429);
    }
    if (body.pin === true) await db.from('ve_group_announcements').update({ pinned: false }).eq('listing_id', g.id).eq('pinned', true);
    const { data: a, error } = await db.from('ve_group_announcements').insert({ listing_id: g.id, author_id: member.id, title, body: text, pinned: body.pin === true, emailed: email })
      .select('id, title, body').single();
    if (error || !a) return json({ error: 'save_failed' }, 500);
    let sent = 0, recipients = 0;
    if (email) {
      const { data: gm } = await db.from('ve_group_members').select('member_id').eq('listing_id', g.id).is('left_at', null).eq('email_ok', true).neq('member_id', member.id).limit(5000);
      const ids = (gm || []).map((x: any) => x.member_id);
      const { data: ms } = ids.length ? await db.from('members').select('id, name, email, membership_status').in('id', ids) : { data: [] };
      const who: Record<string, any> = {}; for (const x of ms || []) if (x.email && x.membership_status === 'active') who[x.id] = x;
      const to = ids.filter((id: string) => who[id]);
      recipients = to.length;
      if (to.length) {
        const { data: dels } = await db.from('ve_group_announcement_deliveries').insert(to.map((id: string) => ({ announcement_id: a.id, member_id: id }))).select('id, member_id, token');
        const list = dels || [];
        const out = await sendBatch(list.map((x: any) => ({ to: who[x.member_id].email, subject: `${g.name}: ${a.title}`, html: announcementEmail(g, a, x.token, who[x.member_id].name) })));
        const now = new Date().toISOString();
        await Promise.all(list.map((x: any, k: number) => db.from('ve_group_announcement_deliveries').update(out[k] ? { email_status: 'sent', email_id: out[k], sent_at: now } : { email_status: 'failed' }).eq('id', x.id)));
        sent = out.filter(Boolean).length;
      }
      await db.from('ve_group_announcements').update({ recipients, sent }).eq('id', a.id);
    }
    return json({ ok: true, sent, recipients, ...(await dash()) });
  }

  if (action === 'announce_remove') {
    if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
    await db.from('ve_group_announcements').update({ removed_at: new Date().toISOString(), removed_by: member.id, pinned: false }).eq('id', body.id).eq('listing_id', g.id);
    return json({ ok: true, ...(await dash()) });
  }

  // ---- Gifts: the Group Partner's lead only, from the group's earnings.
  if (['group_gift', 'gift_send', 'gift_cancel'].includes(action)) {
    if (!isLead || !partner || !['onboarding', 'active'].includes(partner.status)) return json({ error: 'not_lead', message: 'Gifts are for a Group Partner\'s lead.' }, 403);
    if (action === 'gift_send' || action === 'gift_cancel') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: inv } = await db.from('universe_invites').select('*').eq('id', body.id).eq('points_to', 'gift').eq('listing_id', g.id).maybeSingle();
      if (!inv) return json({ error: 'not_found' }, 404);
      if (['joined', 'accepted', 'canceled', 'expired', 'declined'].includes(inv.status)) return json({ error: 'closed', message: 'That gift is closed.' }, 409);
      if (action === 'gift_cancel') {
        await db.from('universe_invites').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('id', inv.id);
        return json({ ok: true, ...(await dash()) });
      }
      const id = await sendOne(inv.email, `${member.name ? firstName(member.name) + ' of ' : ''}${g.name} gave you a Vegans Explore Passport`, giftEmail(g, shortName(member.name), inv, inv.reason || ''));
      if (!id) return json({ error: 'send_failed', message: 'The email did not go out. Copy the link instead, or try again.' }, 502);
      await db.from('universe_invites').update({ sent_via: 'email', sent_at: new Date().toISOString(), resend_email_id: id, updated_at: new Date().toISOString() }).eq('id', inv.id);
      return json({ ok: true, ...(await dash()) });
    }
    const name = clean(body.name, 120), email = clean(body.email, 200).toLowerCase(), note = clean(body.note, 501);
    if (!name) return json({ error: 'missing', message: 'Who is it for? Give their name.' }, 400);
    if (!isEmail(email)) return json({ error: 'bad_email', message: 'That email does not look right.' }, 400);
    if (note.length > 500) return json({ error: 'too_long', message: 'Keep the note to 500 characters.' }, 400);
    const cfg = await settings();
    const { data: reg } = await db.from('members').select('id, membership_status').ilike('email', email).limit(1);
    if (reg?.length && reg[0].membership_status === 'active') return json({ error: 'member', message: 'They are already a member. Nothing to gift.' }, 409);
    const { data: open } = await db.from('universe_invites').select('id, email').eq('points_to', 'gift').eq('listing_id', g.id).in('status', ['ready', 'sent', 'opened']);
    if ((open || []).some((x: any) => String(x.email).toLowerCase() === email)) return json({ error: 'open', message: 'You already have a gift waiting for that email.' }, 409);
    if ((open || []).length >= (cfg.gift_open_max ?? 20)) return json({ error: 'too_many', message: `${cfg.gift_open_max ?? 20} gifts can wait at once. Cancel one or wait for them to be used.` }, 429);
    const [{ data: rate }, { data: bal }] = await Promise.all([db.rpc('ve_group_rate', { p_group: partner.id }), db.rpc('ve_group_balance', { p_group: partner.id })]);
    const ratePct = Number((rate as any)?.rate_pct ?? 20);
    const cost = Math.round(1100 * (100 - ratePct) / 100);
    const credit = Number(cfg.gift_credit_cents ?? 0);
    if (Number(bal || 0) + credit < cost) return json({ error: 'balance', message: `A gift costs ${money(cost)} from your earnings, and you have ${money(Math.max(0, Number(bal || 0)))}. Gifts come out of what your group has earned.` }, 402);
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
    const now = new Date();
    const { data: inv, error } = await db.from('universe_invites').insert({
      code, brand: 'vegans-explore', name, email, comp: true, points: Number(cfg.gift_points ?? 1100), reason: note || null, points_to: 'gift', listing_id: g.id,
      status: 'sent', sent_via: body.send === true ? 'email' : 'copied', sent_at: now.toISOString(),
      expires_at: new Date(now.getTime() + Number(cfg.gift_days ?? 30) * DAY_MS).toISOString(), created_by: `member:${member.id}`, pool: 'group-gift',
    }).select('*').single();
    if (error || !inv) return json({ error: 'save_failed', message: error?.message }, 500);
    const { error: ce } = await db.from('ve_affiliate_commissions').insert({
      group_partner_id: partner.id, product: 'gift', product_ref: inv.id, ref: `gift:${inv.id}`, sale_cents: 1100, level: 0, rate_pct: ratePct,
      commission_cents: -cost, route: 'group', route_listing_id: g.id, status: 'ready', hold_until: now.toISOString(), note: `A Passport gift to ${name} (${email})`,
    });
    if (ce) { await db.from('universe_invites').delete().eq('id', inv.id); return json({ error: 'save_failed', message: ce.message }, 500); }
    let emailed = false;
    if (body.send === true) {
      const id = await sendOne(email, `${firstName(member.name)} of ${g.name} gave you a Vegans Explore Passport`, giftEmail(g, shortName(member.name), inv, note));
      emailed = !!id;
      await db.from('universe_invites').update(id ? { resend_email_id: id } : { sent_via: 'copied' }).eq('id', inv.id);
    }
    return json({ ok: true, url: `${SITE}/invite?c=${code}`, emailed, cost_cents: cost, ...(await dash()) });
  }

  return json({ error: 'unknown_action' }, 400);
});
