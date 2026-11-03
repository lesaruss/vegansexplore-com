// ve-person-profile: Depot > People > a person (Sean, 2026-11-03, playbook ve-pathways, "profiles with groups" step 2).
// POST { action, ... } with a signed-in super admin's token (or LESARUSS_ADMIN_TOKEN with as_member). verify_jwt off, checked here.
// A person is a person_key (lower-case email, ig:<handle> or a key we set): only people we have touched have one.
//   { action: 'list', q?, tag?, limit?, offset? }   people we have touched, with their tags and last contact
//   { action: 'get', key }                          who they are, tags, one timeline, notes, the member (if any) with points
//   { action: 'tags' }                              the tag catalog
//   { action: 'tag_add', key, tag, note? } | { action: 'tag_remove', key, tag, note }   (a removal needs a reason; rules never re-add it)
//   { action: 'note_add', key, body }
//   { action: 'give_points', key, amount, note } | { action: 'take_points', key, amount, note }   members only
import { createClient } from 'jsr:@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const keyOf = (v: unknown) => clean(v, 200).toLowerCase();
const isEmail = (k: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k);

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
async function adminToken(): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', 'LESARUSS_ADMIN_TOKEN').maybeSingle();
  return data?.value ?? null;
}

const MEMBER_COLS = 'id, name, email, initials, color, avatar_url, standing, membership_status, entry_via, entry_paid_at, founding_member, member_class, ve_role, created_at, last_activity_at, home_community, lesars_balance, referral_code, is_superadmin';

type Ev = { at: string; kind: string; title: string; detail?: string; link?: string };

async function memberFor(key: string) {
  if (!isEmail(key)) return null;
  const { data } = await db.from('members').select(MEMBER_COLS).ilike('email', key).limit(1).maybeSingle();
  return data || null;
}

async function profile(key: string) {
  const email = isEmail(key) ? key : null;
  const [msgs, notes, tags, member, interest, sends, linksByEmail] = await Promise.all([
    db.from('ve_people_outreach').select('id, day, name, org, bucket, channel, to_address, subject, status, campaign, link_code, why, sent_at, done_at, created_at').eq('person_key', key).order('day', { ascending: false }).limit(200),
    db.from('ve_people_outreach_notes').select('id, body, author_name, message_id, created_at').eq('person_key', key).order('created_at', { ascending: false }).limit(200),
    db.from('ve_person_tags').select('tag_slug, source, rule_id, added_by, note, added_at, removed_at, removed_by, remove_note').eq('person_key', key).order('added_at', { ascending: false }),
    memberFor(key),
    email ? db.from('ve_initiative_interest').select('id, initiative_slug, action_type, note, tags, source, clicks, last_click_at, created_at').ilike('email', email).order('created_at', { ascending: false }).limit(100) : Promise.resolve({ data: [] as any[] }),
    email ? db.from('email_sends').select('campaign_ref, subject, status, sent_at, opened_at, clicked_at, bounced_at').ilike('to_email', email).order('sent_at', { ascending: false }).limit(100) : Promise.resolve({ data: [] as any[] }),
    email ? db.from('ve_links').select('code, label, initiative_slug, clicks, last_click_at, created_at').ilike('recipient_email', email).limit(100) : Promise.resolve({ data: [] as any[] }),
  ]);
  const m = msgs.data || [];
  // Opens and bounces for our people messages come from the email system, keyed by the campaign ref.
  const refs = m.filter((x) => x.channel === 'email' && x.status === 'sent').map((x) => `ve-people-${x.id}`);
  const opened = new Map<string, string>(), bounced = new Map<string, string>();
  if (refs.length) {
    const { data: evs } = await db.from('email_events').select('campaign_ref, event_type, event_at').in('campaign_ref', refs.slice(0, 200)).in('event_type', ['email.opened', 'email.bounced']);
    for (const e of evs || []) { const id = String(e.campaign_ref).slice('ve-people-'.length); const mp = e.event_type === 'email.opened' ? opened : bounced; if (!mp.has(id) || String(e.event_at) < mp.get(id)!) mp.set(id, String(e.event_at)); }
  }
  const codes = m.map((x) => x.link_code).filter(Boolean) as string[];
  const clickMap = new Map<string, { clicks: number; last: string | null }>();
  if (codes.length) {
    const { data: ls } = await db.from('ve_links').select('code, clicks, last_click_at').in('code', codes);
    for (const l of ls || []) clickMap.set(l.code, { clicks: l.clicks || 0, last: l.last_click_at });
  }
  const tl: Ev[] = [];
  for (const x of m) {
    const what = x.channel === 'email' ? 'Email' : x.channel === 'instagram' ? 'Instagram message' : x.channel === 'text' ? 'Text' : x.channel === 'call' ? 'Call' : 'Message';
    const c = x.link_code ? clickMap.get(x.link_code) : null;
    if (x.status === 'sent' && x.sent_at) tl.push({ at: x.sent_at, kind: 'sent', title: `${what} sent: ${x.subject || '(no subject)'}`, detail: x.campaign || '', link: `/admin/depot/outreach#m/${x.id}` });
    else if (x.status === 'done' && x.done_at) tl.push({ at: x.done_at, kind: 'done', title: `${what} done by hand${x.subject ? ': ' + x.subject : ''}`, detail: x.campaign || '', link: `/admin/depot/outreach#m/${x.id}` });
    else tl.push({ at: x.created_at, kind: 'planned', title: `${what} ${x.status === 'skipped' ? 'skipped' : x.status === 'approved' ? 'scheduled' : 'drafted'} for ${x.day}${x.subject ? ': ' + x.subject : ''}`, detail: x.campaign || '', link: `/admin/depot/outreach#m/${x.id}` });
    if (opened.get(x.id)) tl.push({ at: opened.get(x.id)!, kind: 'opened', title: `Opened: ${x.subject || 'the email'}`, detail: x.campaign || '' });
    if (bounced.get(x.id)) tl.push({ at: bounced.get(x.id)!, kind: 'bounced', title: `Bounced: ${x.subject || 'the email'}` });
    if (c && c.clicks > 0) tl.push({ at: c.last || x.sent_at || x.created_at, kind: 'clicked', title: `Clicked their link ${c.clicks} time${c.clicks === 1 ? '' : 's'}`, detail: `${x.subject || x.campaign || ''} (last click shown)` });
  }
  const outreachRefs = new Set(m.map((x) => `ve-people-${x.id}`));
  for (const s of sends.data || []) {
    if (outreachRefs.has(String(s.campaign_ref))) continue; // already shown as a message
    if (s.sent_at) tl.push({ at: s.sent_at, kind: 'sent', title: `Email sent: ${s.subject || s.campaign_ref || ''}`, detail: s.campaign_ref || '' });
    if (s.opened_at) tl.push({ at: s.opened_at, kind: 'opened', title: `Opened: ${s.subject || s.campaign_ref || ''}` });
    if (s.clicked_at) tl.push({ at: s.clicked_at, kind: 'clicked', title: `Clicked in: ${s.subject || s.campaign_ref || ''}` });
    if (s.bounced_at) tl.push({ at: s.bounced_at, kind: 'bounced', title: `Bounced: ${s.subject || s.campaign_ref || ''}` });
  }
  for (const i of interest.data || []) {
    tl.push({ at: i.last_click_at || i.created_at, kind: 'action', title: `${i.action_type === 'link_click' ? 'Clicked a link' : (i.action_type || 'Acted').replace(/_/g, ' ')} (${i.initiative_slug})`, detail: [i.note, (i.tags || []).join(', ')].filter(Boolean).join(' · ') });
  }
  for (const t of tags.data || []) {
    tl.push({ at: t.added_at, kind: 'tag', title: `Tagged ${t.tag_slug.replace(/-/g, ' ')} (${t.source === 'rule' ? 'by a rule' : 'by hand'})`, detail: t.note || '' });
    if (t.removed_at) tl.push({ at: t.removed_at, kind: 'tag', title: `Tag taken off: ${t.tag_slug.replace(/-/g, ' ')}`, detail: t.remove_note || '' });
  }
  for (const n of notes.data || []) tl.push({ at: n.created_at, kind: 'note', title: `Note from ${n.author_name || 'the team'}`, detail: n.body });

  let points: any = null, ledger: any[] = [];
  if (member) {
    const [p, l] = await Promise.all([
      db.from('member_points').select('total_points, available_points, spent_points').eq('member_id', member.id).maybeSingle(),
      db.from('points_ledger').select('delta, reason, ref_id, created_at').eq('member_id', member.id).order('created_at', { ascending: false }).limit(30),
    ]);
    points = p.data || { total_points: 0, available_points: 0, spent_points: 0 };
    ledger = l.data || [];
    for (const r of ledger) tl.push({ at: r.created_at, kind: 'points', title: `${r.delta >= 0 ? '+' : ''}${r.delta} points: ${String(r.reason || '').replace(/_/g, ' ')}` });
  }
  tl.sort((a, b) => (a.at < b.at ? 1 : -1));
  const first = m[0];
  const name = first?.name || member?.name || key;
  return {
    key, name, org: first?.org || null, email: email, channels: [...new Set(m.map((x) => x.channel))],
    handles: key.startsWith('ig:') ? [key.slice(3)] : [],
    tags: (tags.data || []).map((t) => ({ ...t, active: !t.removed_at })),
    notes: notes.data || [], timeline: tl.slice(0, 400), member, points, ledger,
    counts: { messages: m.length, sent: m.filter((x) => x.status === 'sent' || x.status === 'done').length, opened: opened.size, clicks: [...clickMap.values()].reduce((a, c) => a + (c.clicks > 0 ? 1 : 0), 0) },
    campaigns: [...new Set(m.map((x) => x.campaign).filter(Boolean))],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tok) return json({ error: 'not_authenticated' }, 401);
  let judge: string | null = null;
  const ops = tok === (await adminToken());
  if (ops) { judge = UUID.test(String(b.as_member || '')) ? b.as_member : null; if (!judge) return json({ error: 'as_member_needed' }, 400); }
  else judge = await verifyToken(tok);
  if (!judge) return json({ error: 'not_authenticated' }, 401);
  const { data: jm } = await db.from('members').select('id, name, is_superadmin, standing').eq('id', judge).maybeSingle();
  if (!jm?.is_superadmin || (jm.standing && jm.standing !== 'good')) return json({ error: 'no_access' }, 403);
  const action = String(b.action || '');

  if (action === 'tags') {
    const { data } = await db.from('ve_tags').select('slug, name, kind, color, description, active').eq('active', true).order('name');
    return json({ ok: true, tags: data || [] });
  }

  if (action === 'list') {
    const q = clean(b.q, 80).toLowerCase(), tag = clean(b.tag, 60);
    const limit = Math.min(Math.max(Number(b.limit) || 60, 1), 200), offset = Math.max(Number(b.offset) || 0, 0);
    const [{ data: rows }, { data: ptags }, { data: catalog }] = await Promise.all([
      db.from('ve_people_outreach').select('person_key, name, org, bucket, channel, status, campaign, day, sent_at, done_at').not('person_key', 'is', null).order('day', { ascending: false }).limit(10000),
      db.from('ve_person_tags').select('person_key, tag_slug').is('removed_at', null).limit(10000),
      db.from('ve_tags').select('slug, name, color').eq('active', true).order('name'),
    ]);
    const by = new Map<string, any>();
    for (const r of rows || []) {
      const p = by.get(r.person_key) || { key: r.person_key, name: r.name, org: r.org, last: null as string | null, messages: 0, sent: 0, campaigns: new Set<string>(), tags: [] as string[] };
      p.messages++;
      if (r.status === 'sent' || r.status === 'done') p.sent++;
      const at = r.sent_at || r.done_at || r.day;
      if (at && (!p.last || String(at) > p.last)) p.last = String(at);
      if (r.campaign) p.campaigns.add(r.campaign);
      by.set(r.person_key, p);
    }
    for (const t of ptags || []) {
      const p = by.get(t.person_key) || { key: t.person_key, name: t.person_key, org: null, last: null, messages: 0, sent: 0, campaigns: new Set<string>(), tags: [] };
      p.tags.push(t.tag_slug); by.set(t.person_key, p);
    }
    let out = [...by.values()];
    if (tag) out = out.filter((p) => p.tags.includes(tag));
    if (q) out = out.filter((p) => `${p.key} ${p.name || ''} ${p.org || ''}`.toLowerCase().includes(q));
    out.sort((a, b2) => ((b2.last || '') > (a.last || '') ? 1 : -1));
    return json({ ok: true, total: out.length, tags: catalog || [], people: out.slice(offset, offset + limit).map((p) => ({ ...p, campaigns: [...p.campaigns] })) });
  }

  const key = keyOf(b.key);
  if (['get', 'tag_add', 'tag_remove', 'note_add', 'give_points', 'take_points'].includes(action) && key.length < 3) return json({ error: 'bad_person' }, 400);

  if (action === 'get') {
    const [pr, { data: catalog }] = await Promise.all([profile(key), db.from('ve_tags').select('slug, name, color, description').eq('active', true).order('name')]);
    const touched = pr.counts.messages > 0 || pr.tags.length > 0 || pr.notes.length > 0 || pr.timeline.length > 0;
    if (!touched && !pr.member) return json({ error: 'not_found' }, 404);
    return json({ ok: true, ...pr, catalog: catalog || [] });
  }

  if (action === 'tag_add') {
    const { data, error } = await db.rpc('ve_tag_add', { p_key: key, p_tag: clean(b.tag, 60), p_by: judge, p_note: clean(b.note, 500) });
    return error ? json({ error: 'save_failed' }, 500) : json(data?.ok ? { ok: true } : { error: data?.error || 'save_failed' }, data?.ok ? 200 : 400);
  }
  if (action === 'tag_remove') {
    const note = clean(b.note, 500);
    if (note.length < 3) return json({ error: 'note_required' }, 400);
    const { data, error } = await db.rpc('ve_tag_remove', { p_key: key, p_tag: clean(b.tag, 60), p_by: judge, p_note: note });
    return error ? json({ error: 'save_failed' }, 500) : json(data?.ok ? { ok: true } : { error: data?.error || 'save_failed' }, data?.ok ? 200 : 400);
  }
  if (action === 'note_add') {
    const body = clean(b.body, 2000);
    if (body.length < 2) return json({ error: 'note_required' }, 400);
    const { data, error } = await db.from('ve_people_outreach_notes').insert({ person_key: key, author_id: judge, author_name: jm.name || 'Team', body }).select('id, body, author_name, created_at').single();
    return error ? json({ error: 'save_failed' }, 500) : json({ ok: true, note: data });
  }

  if (action === 'give_points' || action === 'take_points') {
    const member = await memberFor(key);
    if (!member) return json({ error: 'not_a_member' }, 400);
    if (member.is_superadmin || member.member_class === 'agent') return json({ error: 'not_for_this_account' }, 400);
    const amount = Math.floor(Number(b.amount));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return json({ error: 'bad_amount' }, 400);
    const note = clean(b.note, 200).replace(/\s+/g, ' ');
    if (note.length < 3) return json({ error: 'reason_needed' }, 400);
    const give = action === 'give_points';
    const { data, error } = give
      ? await db.rpc('ve_points_grant', { p_member: member.id, p_amount: amount, p_reason: 'admin_adjust', p_ref: `founder:${crypto.randomUUID()}:${note}` })
      : await db.rpc('ve_points_take', { p_member: member.id, p_amount: amount, p_ref: `founder-take:${crypto.randomUUID()}:${note}` });
    if (error || data?.error) return json({ error: data?.error || (give ? 'grant_failed' : 'take_failed') }, data?.error === 'insufficient_points' ? 400 : 500);
    if (give && data?.frozen) return json({ error: 'account_frozen' }, 400);
    const { data: pts } = await db.from('member_points').select('total_points, available_points, spent_points').eq('member_id', member.id).maybeSingle();
    return json({ ok: true, [give ? 'granted' : 'taken']: amount, points: pts || null });
  }

  return json({ error: 'unknown_action' }, 400);
});
