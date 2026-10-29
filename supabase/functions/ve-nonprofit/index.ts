// ve-nonprofit: Nonprofit Partners (LOCKED by Sean 2026-10-29, playbook ve-nonprofit-partners; migration 20261029_nonprofit_partners.sql).
// The organization is the partner: its own link (/r/<code>), 20% of the Passport and Guides bought through it (ve_affiliate_earn, route
// 'partner'), its own points (ve_nonprofit_partner_points), a badge and its own Guide (/nonprofits/welcome). The lead on the account
// opens that Guide; the team runs it from Depot > People > Nonprofit Partners (/admin/depot/nonprofit-partners).
// The lead (member token):
//   POST { action: 'me', partner_id? }              the partnerships they lead, with the numbers (a super admin may open any, partner_id)
//   POST { action: 'use_points', partner_id, what, note? }   ask the team to use the organization's points on a service (logged and emailed)
// Super admins:
//   POST { action: 'list' }                          every partner with its numbers, and the Nonprofit Partner invitations
//   POST { action: 'get', id }                       one partner
//   POST { action: 'save', id, status?, rate_pct?, note?, code?, lead_email? }
//   POST { action: 'points', id, amount, note? }     give (or, with a negative amount, take back) the organization's points
// verify_jwt is off; the member token is checked here, like ve-affiliate.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
// What the organization's points can go toward. Each is a request to the team for now; nothing is spent until the team does it.
const USES: Record<string, string> = {
  event: 'Promote one of our events',
  feature: 'A feature on Vegans Explore',
  social: 'A social push',
  guide: 'A Guide for our people',
  other: 'Something else',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const clip = (v: unknown, n: number) => { const s = String(v ?? '').trim(); return s ? s.slice(0, n) : null; };
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const likeEsc = (s: string) => s.replace(/[%_\\]/g, '\\$&');

function b64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
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
const bearer = (req: Request) => (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');

async function view(id: string) {
  const { data, error } = await db.rpc('ve_nonprofit_partner_view', { p_partner: id });
  if (error) { console.error('view:', error); return null; }
  return data ? { ...data, link: `${SITE}/r/${data.code}` } : null;
}

async function sendEmail(to: string[], subject: string, html: string, replyTo?: string | null) {
  if (!RESEND_KEY || !to.length) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'VEGANS EXPLORE <hello@vegansexplore.com>', to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) { console.error('Resend failed:', e); return false; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const sub = await verifyToken(bearer(req));
    if (!sub) return json({ error: 'not_authenticated' }, 401);
    const { data: me } = await db.from('members').select('id, name, email, membership_status, is_superadmin').eq('id', sub).maybeSingle();
    if (!me) return json({ error: 'not_authenticated' }, 401);
    const admin = !!me.is_superadmin;

    if (action === 'me') {
      let ids: string[] = [];
      if (admin && isId(body.partner_id)) ids = [body.partner_id];
      else {
        const { data } = await db.from('ve_nonprofit_partners').select('id').eq('lead_member_id', me.id).neq('status', 'ended').order('started_at');
        ids = (data ?? []).map((r: any) => r.id);
        // A super admin with no partnership of their own previews the first one (Depot > Nonprofit Partners > See their Guide).
        if (!ids.length && admin) {
          const { data: any1 } = await db.from('ve_nonprofit_partners').select('id').neq('status', 'ended').order('started_at').limit(1);
          ids = (any1 ?? []).map((r: any) => r.id);
        }
      }
      const partners = (await Promise.all(ids.map(view))).filter(Boolean);
      return json({ ok: true, admin, preview: admin && !partners.some((p: any) => p.lead_member_id === me.id), partners, uses: USES });
    }

    if (action === 'use_points') {
      if (!isId(body.partner_id) || !USES[body.what]) return json({ error: 'bad_request', message: 'Pick what you would like.' }, 400);
      const { data: p } = await db.from('ve_nonprofit_partners').select('id, listing_id, lead_member_id, points, status').eq('id', body.partner_id).maybeSingle();
      if (!p || (p.lead_member_id !== me.id && !admin)) return json({ error: 'not_found' }, 404);
      if (p.status !== 'active') return json({ error: 'paused', message: 'This partnership is paused. Write to contact@lesaruss.com.' }, 409);
      const { data: org } = await db.from('listings').select('name, slug').eq('id', p.listing_id).maybeSingle();
      const note = clip(body.note, 1000);
      const { error } = await db.from('ve_initiative_interest').insert({
        initiative_slug: 'nonprofit-partners', member_id: me.id, action_type: 'sponsor_tier', tier_label: USES[body.what], status: 'new',
        email: me.email, name: String(me.name || '').slice(0, 120), source: 'form',
        note: `${org?.name ?? 'Organization'}: ${USES[body.what]}${note ? '. ' + note : ''}`.slice(0, 2000),
        tags: ['nonprofit-partner', 'use-points', body.what, `partner:${p.id}`],
      });
      if (error) { console.error('use_points:', error); return json({ error: 'save_failed', message: 'That did not go through.' }, 500); }
      await sendEmail([SEAN_EMAIL], `[Nonprofit Partners] ${org?.name ?? 'A partner'} wants to use its points`,
        `<p>${esc(me.name || 'The lead')} (${esc(me.email || '')}) asked to use ${esc(org?.name ?? 'their organization')}'s points (${Number(p.points).toLocaleString('en-US')} held) for: <b>${esc(USES[body.what])}</b>.</p>` +
        (note ? `<p>Their note: ${esc(note)}</p>` : '') +
        `<p><a href="${SITE}/admin/depot/nonprofit-partners#p/${p.id}">Depot &gt; Nonprofit Partners</a> · <a href="${SITE}/dashboard/leads">Leads</a></p>`, me.email);
      return json({ ok: true });
    }

    if (!admin) return json({ error: 'forbidden' }, 403);

    if (action === 'list') {
      const [{ data: rows }, { data: invites }] = await Promise.all([
        db.from('ve_nonprofit_partners').select('id').order('started_at', { ascending: false }),
        db.from('universe_invites').select('id, name, email, status, sent_at, opened_at, email_opened_at, joined_at, declined_at, points, listing_id, created_at, expires_at')
          .eq('points_to', 'nonprofit').order('created_at', { ascending: false }).limit(200),
      ]);
      const partners = (await Promise.all((rows ?? []).map((r: any) => view(r.id)))).filter(Boolean);
      const orgIds = [...new Set((invites ?? []).map((i: any) => i.listing_id).filter(Boolean))];
      const { data: orgs } = orgIds.length ? await db.from('listings').select('id, name, slug').in('id', orgIds) : { data: [] };
      const O = new Map((orgs ?? []).map((o: any) => [o.id, o]));
      const now = Date.now();
      return json({ ok: true, partners, invites: (invites ?? []).map((i: any) => ({ ...i, org: O.get(i.listing_id) ?? null,
        status: ['sent', 'opened'].includes(i.status) && i.expires_at && Date.parse(i.expires_at) < now ? 'expired' : i.status })) });
    }

    if (action === 'get') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const p = await view(body.id);
      return p ? json({ ok: true, partner: p }) : json({ error: 'not_found' }, 404);
    }

    if (action === 'save') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (['active', 'paused', 'ended'].includes(body.status)) patch.status = body.status;
      if ('rate_pct' in body) {
        const r = Number(body.rate_pct);
        if (!Number.isFinite(r) || r < 0 || r > 30) return json({ error: 'bad_rate', message: 'The rate is 0 to 30%.' }, 400);
        patch.rate_pct = Math.round(r * 100) / 100;
      }
      if ('note' in body) patch.note = clip(body.note, 1000);
      if ('code' in body) {
        const c = String(body.code ?? '').trim().toUpperCase();
        if (!/^[A-Z0-9-]{3,24}$/.test(c)) return json({ error: 'bad_code', message: 'Use 3 to 24 letters, numbers or dashes.' }, 400);
        const [{ data: m }, { data: o }] = await Promise.all([
          db.from('members').select('id').eq('referral_code', c).limit(1),
          db.from('ve_nonprofit_partners').select('id').eq('code', c).neq('id', body.id).limit(1),
        ]);
        if (m?.length || o?.length) return json({ error: 'taken', message: 'That link is taken.' }, 409);
        patch.code = c;
      }
      // A new lead: the partnership stays with the organization; the new lead must already have an account.
      if (clip(body.lead_email, 200)) {
        const { data: m } = await db.from('members').select('id, membership_status').ilike('email', likeEsc(clip(body.lead_email, 200)!)).is('merged_into_member_id', null).limit(1);
        if (!m?.length) return json({ error: 'no_account', message: 'No account has that email. Invite them first.' }, 404);
        patch.lead_member_id = m[0].id;
      }
      const { error } = await db.from('ve_nonprofit_partners').update(patch).eq('id', body.id);
      if (error) { console.error('save:', error); return json({ error: 'save_failed', message: 'That did not save.' }, 500); }
      // The badge goes with an active partnership.
      const { data: p } = await db.from('ve_nonprofit_partners').select('listing_id, status').eq('id', body.id).maybeSingle();
      if (p) {
        const { data: l } = await db.from('listings').select('tags').eq('id', p.listing_id).maybeSingle();
        const tags: string[] = (l?.tags ?? []).filter((t: string) => t !== 've-nonprofit-partner');
        if (p.status === 'active') tags.push('ve-nonprofit-partner');
        await db.from('listings').update({ tags }).eq('id', p.listing_id);
      }
      return json({ ok: true, partner: await view(body.id) });
    }

    if (action === 'points') {
      if (!isId(body.id)) return json({ error: 'bad_id' }, 400);
      const amount = Math.round(Number(body.amount) || 0);
      if (!amount || Math.abs(amount) > 100000) return json({ error: 'bad_points', message: 'Give between 1 and 100,000 points.' }, 400);
      const { data: g, error } = await db.rpc('ve_partner_points_grant', { p_partner: body.id, p_amount: amount, p_reason: amount > 0 ? 'team_gift' : 'team_adjust',
        p_ref: `team:${crypto.randomUUID()}`, p_note: clip(body.note, 300), p_by: me.id });
      if (error || g?.error) return json({ error: g?.error ?? 'grant_failed', message: g?.error === 'not_enough' ? 'They do not hold that many.' : 'The points did not go through.' }, 400);
      return json({ ok: true, balance: g.balance, partner: await view(body.id) });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-nonprofit:', e);
    return json({ error: 'server_error' }, 500);
  }
});
