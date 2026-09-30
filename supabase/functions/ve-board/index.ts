// ve-board: the Community Board (Sean, 2026-09-30). One board per city community, built for
// the question rescue leaders ask all day in a WhatsApp group that nobody can search: "do you
// know anybody who can take these chickens?" A post is a request or an offer; it can be
// searched, answered, marked resolved, and reported.
//
// Open to see, join to interact (Sean, 2026-09-30): anyone can list, search and read posts.
// Posting, replying, resolving and reporting need an active member (the $11 Founding
// Membership), and a poster's contact line is only returned to active members, because
// rescues share phone numbers and addresses here.
//
// POST { action: 'list', community, q?, kind?, category?, status?: 'open'|'resolved'|'all', before? }
//   -> { posts, viewer }                         public; token optional
// POST { action: 'get', id }                    -> { post, replies, viewer }   public
// POST { action: 'create', community, kind, category, title, body, area?, contact? }  member
// POST { action: 'reply', post_id, body }       member
// POST { action: 'resolve', post_id, reopen? }  the poster, or a moderator
// POST { action: 'report', post_id? | reply_id?, reason, details? }  member
// POST { action: 'moderate', post_id? | reply_id?, op: 'hide'|'restore' }  moderator
// POST { action: 'reports', community? }        moderator -> open reports
//
// Authorization: Bearer <ve_token>, checked here the same way ve-votes and ve-auth check it
// (verify_jwt is false on deploy). Reports email that city's Community Manager with Sean
// copied (ve_partner_cities.manager_email), or Sean alone while a city has none. Three reports
// from three different members hide a post or reply until a moderator looks at it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
const COMMUNITIES = ['south-florida', 'central-florida', 'atlanta', 'dmv', 'new-york', 'philadelphia', 'los-angeles', 'london'];
// Hub slug -> ve_partner_cities slug, where the two differ.
const MANAGER_CITY: Record<string, string> = { 'central-florida': 'orlando-north-central-florida' };
const KINDS = ['request', 'offer'];
const CATEGORIES = ['rescue', 'transport', 'fostering', 'food', 'services', 'volunteers', 'other'];
const REASONS = ['not_who_they_say', 'unsafe', 'scam', 'spam', 'harassment', 'other'];
const REASON_LABEL: Record<string, string> = {
  not_who_they_say: 'Not who they say they are', unsafe: 'Unsafe for animals or people', scam: 'Scam or money request',
  spam: 'Spam', harassment: 'Harassment', other: 'Something else',
};
const HIDE_AT = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const LIMITS = { post: 10, reply: 60, report: 20 };
const PAGE = 30;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

type Viewer = { id: string; name: string | null; email: string | null; active: boolean; moderator: boolean } | null;

async function loadViewer(req: Request): Promise<Viewer> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data: m } = await db.from('members')
    .select('id, name, email, membership_status, is_superadmin, staff_role, ve_role').eq('id', id).maybeSingle();
  if (!m) return null;
  const moderator = !!m.is_superadmin || m.staff_role === 'community_manager' || m.ve_role === 'community_manager';
  return { id: m.id, name: m.name, email: m.email, active: m.membership_status === 'active', moderator };
}

// What a reader can see about the person behind a post: enough to decide whether to trust
// them, never their email. "helped" counts their offers and replies on the Board.
async function posterCards(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return {} as Record<string, unknown>;
  const [{ data: people }, { data: offers }, { data: replies }] = await Promise.all([
    db.from('members').select('id, name, initials, color, avatar_url, profile_image_url, profile_headline, home_community, created_at, founding_member, entry_paid_at, staff_role, ve_role').in('id', unique),
    db.from('ve_board_posts').select('member_id').in('member_id', unique).eq('kind', 'offer').neq('status', 'hidden'),
    db.from('ve_board_replies').select('member_id').in('member_id', unique).eq('status', 'visible'),
  ]);
  const helped: Record<string, number> = {};
  for (const r of [...(offers || []), ...(replies || [])]) helped[r.member_id] = (helped[r.member_id] || 0) + 1;
  const out: Record<string, unknown> = {};
  for (const p of people || []) {
    out[p.id] = {
      name: p.name || 'Member', initials: p.initials || (p.name || 'M').slice(0, 1).toUpperCase(), color: p.color || '#1a1a1a',
      avatar: p.profile_image_url || p.avatar_url || null, headline: p.profile_headline || null, community: p.home_community || null,
      // founding_member is not yet set by the webhook (Launch Playbook group C), so a recorded
      // $11 entry payment counts too.
      member_since: p.created_at, founding: !!p.founding_member || !!p.entry_paid_at,
      community_manager: p.staff_role === 'community_manager' || p.ve_role === 'community_manager', helped: helped[p.id] || 0,
    };
  }
  return out;
}

function shapePost(p: any, cards: Record<string, unknown>, viewer: Viewer) {
  return {
    id: p.id, community: p.community_slug, kind: p.kind, category: p.category, title: p.title, body: p.body, area: p.area,
    status: p.status, resolved_at: p.resolved_at, reply_count: p.reply_count, created_at: p.created_at,
    contact: viewer?.active ? p.contact : null, has_contact: !!p.contact,
    mine: !!viewer && viewer.id === p.member_id, poster: cards[p.member_id] || null,
  };
}

async function countSince(table: string, column: string, memberId: string) {
  const { count } = await db.from(table).select('id', { count: 'exact', head: true })
    .eq(column, memberId).gt('created_at', new Date(Date.now() - DAY_MS).toISOString());
  return count || 0;
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (!RESEND_KEY || !to.length) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) { console.error('Resend failed:', e); return false; }
}

async function reportRecipients(community: string): Promise<string[]> {
  const { data } = await db.from('ve_partner_cities').select('manager_email').eq('slug', MANAGER_CITY[community] || community).maybeSingle();
  return data?.manager_email ? [data.manager_email, SEAN_EMAIL] : [SEAN_EMAIL];
}

const needMember = (viewer: Viewer) => {
  if (!viewer) return json({ error: 'not_authenticated', message: 'Sign in to join the conversation.' }, 401);
  if (!viewer.active) return json({ error: 'payment_required', message: 'Become a Founding Member to post, reply and help your community on the Board.' }, 402);
  return null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const viewer = await loadViewer(req);
  const viewerOut = viewer ? { signed_in: true, member: viewer.active, moderator: viewer.moderator } : { signed_in: false, member: false, moderator: false };

  switch (body.action) {
    case 'list': {
      const community = clean(body.community, 40);
      if (!COMMUNITIES.includes(community)) return json({ error: 'bad_community' }, 400);
      let q = db.from('ve_board_posts')
        .select('id, community_slug, member_id, kind, category, title, body, area, contact, status, resolved_at, reply_count, created_at')
        .eq('community_slug', community).order('created_at', { ascending: false }).limit(PAGE);
      const status = clean(body.status, 10) || 'open';
      if (status === 'open' || status === 'resolved') q = q.eq('status', status);
      else q = q.neq('status', 'hidden');
      if (KINDS.includes(body.kind)) q = q.eq('kind', body.kind);
      if (CATEGORIES.includes(body.category)) q = q.eq('category', body.category);
      const before = clean(body.before, 40);
      if (before && !isNaN(Date.parse(before))) q = q.lt('created_at', before);
      const text = clean(body.q, 120);
      if (text) q = q.textSearch('search', text, { type: 'websearch', config: 'english' });
      const { data, error } = await q;
      if (error) return json({ error: 'list_failed', message: error.message }, 500);
      const cards = await posterCards((data || []).map((p) => p.member_id));
      return json({ posts: (data || []).map((p) => shapePost(p, cards, viewer)), more: (data || []).length === PAGE, viewer: viewerOut });
    }

    case 'get': {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('*').eq('id', body.id).maybeSingle();
      if (!p || (p.status === 'hidden' && !viewer?.moderator && viewer?.id !== p.member_id)) return json({ error: 'not_found' }, 404);
      const { data: replies } = await db.from('ve_board_replies').select('id, member_id, body, status, created_at')
        .eq('post_id', p.id).order('created_at', { ascending: true }).limit(200);
      const visible = (replies || []).filter((r) => r.status === 'visible' || viewer?.moderator);
      const cards = await posterCards([p.member_id, ...visible.map((r) => r.member_id)]);
      return json({
        post: { ...shapePost(p, cards, viewer), hidden_reason: viewer?.moderator ? p.hidden_reason : undefined },
        replies: visible.map((r) => ({ id: r.id, body: r.body, created_at: r.created_at, hidden: r.status === 'hidden', mine: viewer?.id === r.member_id, poster: cards[r.member_id] || null })),
        viewer: viewerOut,
      });
    }

    case 'create': {
      const gate = needMember(viewer); if (gate) return gate;
      const community = clean(body.community, 40);
      if (!COMMUNITIES.includes(community)) return json({ error: 'bad_community' }, 400);
      if (!KINDS.includes(body.kind)) return json({ error: 'bad_kind', message: 'Choose request or offer.' }, 400);
      if (!CATEGORIES.includes(body.category)) return json({ error: 'bad_category', message: 'Choose a category.' }, 400);
      const title = clean(body.title, 140), text = clean(body.body, 4000);
      if (title.length < 3) return json({ error: 'bad_title', message: 'Give your post a short title.' }, 400);
      if (!text) return json({ error: 'bad_body', message: 'Tell people what you need or what you can offer.' }, 400);
      if (await countSince('ve_board_posts', 'member_id', viewer!.id) >= LIMITS.post) return json({ error: 'rate_limited', message: 'You have posted a lot today. Try again tomorrow.' }, 429);
      const { data, error } = await db.from('ve_board_posts').insert({
        community_slug: community, member_id: viewer!.id, kind: body.kind, category: body.category, title, body: text,
        area: clean(body.area, 120) || null, contact: clean(body.contact, 200) || null,
      }).select('id').single();
      if (error) return json({ error: 'create_failed', message: error.message }, 500);
      return json({ ok: true, id: data.id });
    }

    case 'reply': {
      const gate = needMember(viewer); if (gate) return gate;
      if (!isId(body.post_id)) return json({ error: 'bad_id' }, 400);
      const text = clean(body.body, 2000);
      if (!text) return json({ error: 'bad_body', message: 'Write a reply first.' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('id, status').eq('id', body.post_id).maybeSingle();
      if (!p || p.status === 'hidden') return json({ error: 'not_found' }, 404);
      if (await countSince('ve_board_replies', 'member_id', viewer!.id) >= LIMITS.reply) return json({ error: 'rate_limited', message: 'You have replied a lot today. Try again tomorrow.' }, 429);
      const { data, error } = await db.from('ve_board_replies').insert({ post_id: p.id, member_id: viewer!.id, body: text }).select('id').single();
      if (error) return json({ error: 'reply_failed', message: error.message }, 500);
      const { count } = await db.from('ve_board_replies').select('id', { count: 'exact', head: true }).eq('post_id', p.id).eq('status', 'visible');
      await db.from('ve_board_posts').update({ reply_count: count || 0, updated_at: new Date().toISOString() }).eq('id', p.id);
      return json({ ok: true, id: data.id });
    }

    case 'resolve': {
      if (!viewer) return json({ error: 'not_authenticated' }, 401);
      if (!isId(body.post_id)) return json({ error: 'bad_id' }, 400);
      const { data: p } = await db.from('ve_board_posts').select('id, member_id, status').eq('id', body.post_id).maybeSingle();
      if (!p || p.status === 'hidden') return json({ error: 'not_found' }, 404);
      if (p.member_id !== viewer.id && !viewer.moderator) return json({ error: 'forbidden', message: 'Only the person who posted can mark it resolved.' }, 403);
      const reopen = body.reopen === true;
      const { error } = await db.from('ve_board_posts').update({
        status: reopen ? 'open' : 'resolved', resolved_at: reopen ? null : new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', p.id);
      if (error) return json({ error: 'resolve_failed', message: error.message }, 500);
      return json({ ok: true, status: reopen ? 'open' : 'resolved' });
    }

    case 'report': {
      const gate = needMember(viewer); if (gate) return gate;
      if (!REASONS.includes(body.reason)) return json({ error: 'bad_reason', message: 'Choose a reason.' }, 400);
      const details = clean(body.details, 1000) || null;
      let post: any = null, reply: any = null;
      if (isId(body.reply_id)) {
        const { data } = await db.from('ve_board_replies').select('id, post_id, member_id, body, report_count').eq('id', body.reply_id).maybeSingle();
        reply = data; if (!reply) return json({ error: 'not_found' }, 404);
        const { data: parent } = await db.from('ve_board_posts').select('id, community_slug, title').eq('id', reply.post_id).maybeSingle();
        post = parent;
      } else if (isId(body.post_id)) {
        const { data } = await db.from('ve_board_posts').select('id, community_slug, member_id, title, body, report_count').eq('id', body.post_id).maybeSingle();
        post = data;
      }
      if (!post) return json({ error: 'not_found' }, 404);
      const reported = reply ? reply.member_id : post.member_id;
      if (reported === viewer!.id) return json({ error: 'own_post', message: 'You cannot report your own post.' }, 400);
      if (await countSince('ve_board_reports', 'reporter_member_id', viewer!.id) >= LIMITS.report) return json({ error: 'rate_limited', message: 'You have sent a lot of reports today. The team is on it.' }, 429);
      const { error } = await db.from('ve_board_reports').insert({
        community_slug: post.community_slug, reporter_member_id: viewer!.id, post_id: post.id, reply_id: reply?.id ?? null,
        reported_member_id: reported, reason: body.reason, details,
      });
      if (error) {
        if (error.code === '23505') return json({ ok: true, already: true, message: 'You already reported this. Thank you.' });
        return json({ error: 'report_failed', message: error.message }, 500);
      }
      // Count distinct reporters and hide at the threshold until a moderator reviews it.
      const target = reply ? 've_board_replies' : 've_board_posts';
      const { count } = await db.from('ve_board_reports').select('id', { count: 'exact', head: true })
        .eq(reply ? 'reply_id' : 'post_id', reply ? reply.id : post.id).eq('status', 'open');
      const reports = count || 0;
      const hide = reports >= HIDE_AT;
      await db.from(target).update(reply
        ? { report_count: reports, ...(hide ? { status: 'hidden' } : {}) }
        : { report_count: reports, ...(hide ? { status: 'hidden', hidden_reason: `Hidden after ${reports} reports, awaiting review` } : {}) }).eq('id', reply ? reply.id : post.id);
      const hub = post.community_slug;
      const link = `${SITE}/board?community=${hub}&post=${post.id}`;
      await sendEmail(await reportRecipients(hub), `[Community Board] Report: ${REASON_LABEL[body.reason]}${hide ? ' (now hidden)' : ''}`,
        `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">A member reported ${reply ? 'a reply on' : 'a post on'} the ${esc(hub)} Community Board.</p>
<p style="font-family:sans-serif;font-size:14px;line-height:1.6"><b>Reason:</b> ${esc(REASON_LABEL[body.reason])}<br><b>Post:</b> ${esc(post.title || '')}<br>
${reply ? `<b>Reply:</b> ${esc(String(reply.body).slice(0, 400))}<br>` : ''}${details ? `<b>Details:</b> ${esc(details)}<br>` : ''}
<b>Reported by:</b> ${esc(viewer!.name || 'Member')} (${esc(viewer!.email || '')})<br><b>Open reports on it:</b> ${reports}${hide ? ' (hidden until reviewed)' : ''}</p>
<p style="font-family:sans-serif;font-size:14px"><a href="${link}">Open it on the Board</a></p>`);
      return json({ ok: true, hidden: hide, message: 'Thank you. Your Community Manager will take a look.' });
    }

    case 'moderate': {
      if (!viewer?.moderator) return json({ error: 'forbidden' }, 403);
      const op = body.op === 'restore' ? 'restore' : body.op === 'hide' ? 'hide' : null;
      if (!op) return json({ error: 'bad_op' }, 400);
      const now = new Date().toISOString();
      if (isId(body.reply_id)) {
        await db.from('ve_board_replies').update({ status: op === 'hide' ? 'hidden' : 'visible', ...(op === 'restore' ? { report_count: 0 } : {}) }).eq('id', body.reply_id);
        await db.from('ve_board_reports').update({ status: op === 'hide' ? 'actioned' : 'dismissed', reviewed_by: viewer.id, reviewed_at: now }).eq('reply_id', body.reply_id).eq('status', 'open');
        const { data: r } = await db.from('ve_board_replies').select('post_id').eq('id', body.reply_id).maybeSingle();
        if (r) {
          const { count } = await db.from('ve_board_replies').select('id', { count: 'exact', head: true }).eq('post_id', r.post_id).eq('status', 'visible');
          await db.from('ve_board_posts').update({ reply_count: count || 0 }).eq('id', r.post_id);
        }
      } else if (isId(body.post_id)) {
        await db.from('ve_board_posts').update(op === 'hide'
          ? { status: 'hidden', hidden_reason: clean(body.note, 200) || 'Hidden by a moderator', updated_at: now }
          : { status: 'open', hidden_reason: null, report_count: 0, updated_at: now }).eq('id', body.post_id);
        await db.from('ve_board_reports').update({ status: op === 'hide' ? 'actioned' : 'dismissed', reviewed_by: viewer.id, reviewed_at: now }).eq('post_id', body.post_id).is('reply_id', null).eq('status', 'open');
      } else return json({ error: 'bad_id' }, 400);
      return json({ ok: true });
    }

    case 'reports': {
      if (!viewer?.moderator) return json({ error: 'forbidden' }, 403);
      let q = db.from('ve_board_reports').select('id, community_slug, post_id, reply_id, reason, details, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(100);
      const community = clean(body.community, 40);
      if (COMMUNITIES.includes(community)) q = q.eq('community_slug', community);
      const { data, error } = await q;
      if (error) return json({ error: 'reports_failed', message: error.message }, 500);
      return json({ reports: (data || []).map((r) => ({ ...r, reason_label: REASON_LABEL[r.reason] })) });
    }
  }
  return json({ error: 'unknown_action' }, 400);
});
