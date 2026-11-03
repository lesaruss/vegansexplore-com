// ve-abuse: Depot > Watchlist (Sean, 2026-11-03). The judge's console for the abuse watch (migrations 20261103_abuse_watch*.sql).
// POST { action, ... } with the signed-in super admin's token. verify_jwt off, the token is checked here. The system only gathers
// evidence; the signed-in super admin is the judge and every decision goes through ve_abuse_decide, which needs a note.
// Actions: list, get {id | member_id}, find {q}, watch {member_id, note}, decide {id, decision, note}, set_mode {mode}.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DECISIONS = ['clear', 'void', 'restore_points', 'suspend', 'ban', 'reinstate'];
const MEMBER_COLS = 'id, name, email, initials, color, avatar_url, standing, standing_at, membership_status, entry_via, entry_paid_at, founding_member, member_class, created_at, last_activity_at, home_community, lesars_balance, referred_by, referral_code, survey_door_at, mission_survey_completed_at';

function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
// Same key derivation as ve-auth's signJWT / decodeToken.
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
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

async function settings() {
  const { data } = await db.from('ve_site_settings').select('value').eq('key', 'abuse_watch').maybeSingle();
  const v: any = data?.value || {};
  return { mode: v.mode === 'on' ? 'on' : 'log_only', open_at: Number(v.open_at) || 40, watch_days: Number(v.watch_days) || 30, log_only_until: v.log_only_until || null };
}

// Everyone the scan would have opened a case for, but has not (log-only), with their score.
async function wouldFlag(openAt: number) {
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const { data: sig } = await db.from('ve_abuse_signals').select('member_id, kind, weight, created_at').gte('created_at', since).limit(5000);
  const by: Record<string, { kinds: Record<string, number>; last: string }> = {};
  for (const s of sig || []) {
    const m = (by[s.member_id] ||= { kinds: {}, last: s.created_at });
    m.kinds[s.kind] = Math.max(m.kinds[s.kind] || 0, s.weight);
    if (s.created_at > m.last) m.last = s.created_at;
  }
  const ids = Object.keys(by).filter((id) => Object.values(by[id].kinds).reduce((a, b) => a + b, 0) >= openAt);
  if (!ids.length) return [];
  const { data: open } = await db.from('ve_abuse_cases').select('member_id').in('member_id', ids).in('status', ['watching', 'voided', 'suspended', 'banned']);
  const openSet = new Set((open || []).map((c) => c.member_id));
  const left = ids.filter((id) => !openSet.has(id));
  if (!left.length) return [];
  const { data: ms } = await db.from('members').select('id, name, email, initials, color, standing').in('id', left);
  return (ms || []).map((m) => ({ member: m, score: Object.values(by[m.id].kinds).reduce((a, b) => a + b, 0), kinds: by[m.id].kinds, last: by[m.id].last }));
}

async function evidence(memberId: string) {
  const { data: member } = await db.from('members').select(MEMBER_COLS).eq('id', memberId).maybeSingle();
  if (!member) return null;
  const [pts, signals, cases, ledger, devices, referredBy, referred] = await Promise.all([
    db.from('member_points').select('total_points, available_points, spent_points').eq('member_id', memberId).maybeSingle(),
    db.from('ve_abuse_signals').select('id, kind, weight, day, evidence, created_at').eq('member_id', memberId).order('created_at', { ascending: false }).limit(60),
    db.from('ve_abuse_cases').select('*').eq('member_id', memberId).order('created_at', { ascending: false }).limit(10),
    db.from('points_ledger').select('delta, reason, ref_id, created_at').eq('member_id', memberId).order('created_at', { ascending: false }).limit(40),
    db.from('ve_member_devices').select('ip_hash, browser_hash, via, created_at').eq('member_id', memberId).limit(20),
    member.referred_by ? db.from('members').select('id, name, email, standing').eq('id', member.referred_by).maybeSingle() : Promise.resolve({ data: null }),
    db.from('members').select('id, name, email, entry_via, membership_status, standing, created_at').eq('referred_by', memberId).order('created_at', { ascending: false }).limit(60),
  ]);
  // Other accounts on the same browser or network.
  const dv = devices.data || [];
  const browsers = [...new Set(dv.map((d) => d.browser_hash).filter(Boolean))] as string[];
  const ips = [...new Set(dv.map((d) => d.ip_hash).filter(Boolean))] as string[];
  const linked: Record<string, { via: string[] }> = {};
  if (browsers.length) {
    const { data } = await db.from('ve_member_devices').select('member_id').in('browser_hash', browsers).neq('member_id', memberId).limit(60);
    for (const r of data || []) (linked[r.member_id] ||= { via: [] }).via.push('same browser');
  }
  let ipCount = 0;
  if (ips.length) {
    const { data } = await db.from('ve_member_devices').select('member_id').in('ip_hash', ips).neq('member_id', memberId).limit(200);
    const ids = [...new Set((data || []).map((r) => r.member_id))];
    ipCount = ids.length;
    // A busy network (an office, an event) says little: name accounts only when a handful share it.
    if (ids.length <= 12) for (const id of ids) (linked[id] ||= { via: [] }).via.push('same network');
  }
  const linkedIds = Object.keys(linked);
  const { data: lm } = linkedIds.length ? await db.from('members').select('id, name, email, standing, membership_status, created_at').in('id', linkedIds) : { data: [] as any[] };
  return {
    member, points: pts.data || { total_points: 0, available_points: 0, spent_points: 0 },
    signals: signals.data || [], cases: cases.data || [], ledger: ledger.data || [],
    devices: { rows: dv.length, browsers: browsers.length, networks: ips.length, network_accounts: ipCount },
    linked: (lm || []).map((m) => ({ ...m, via: [...new Set(linked[m.id].via)] })),
    referred_by: referredBy.data || null, referred: referred.data || [],
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'post_only' }, 405);
  let b: any = {};
  try { b = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const judge = tok ? await verifyToken(tok) : null;
  if (!judge) return json({ error: 'not_authenticated' }, 401);
  const { data: jm } = await db.from('members').select('is_superadmin, standing').eq('id', judge).maybeSingle();
  if (!jm?.is_superadmin || (jm.standing && jm.standing !== 'good')) return json({ error: 'no_access' }, 403);
  const action = String(b.action || '');

  if (action === 'list') {
    const cfg = await settings();
    const { data: cases, error } = await db.from('ve_abuse_cases').select('id, member_id, status, score, reasons, opened_by, watch_until, decided_at, decision_note, void_snapshot, created_at, updated_at').order('updated_at', { ascending: false }).limit(500);
    if (error) return json({ error: 'load_failed' }, 500);
    const ids = [...new Set((cases || []).map((c) => c.member_id))];
    const { data: ms } = ids.length ? await db.from('members').select('id, name, email, initials, color, standing, lesars_balance').in('id', ids) : { data: [] as any[] };
    const mm = Object.fromEntries((ms || []).map((m) => [m.id, m]));
    const would = await wouldFlag(cfg.open_at);
    const { count: sigCount } = await db.from('ve_abuse_signals').select('id', { count: 'exact', head: true });
    return json({ ok: true, settings: cfg, cases: (cases || []).map((c) => ({ ...c, voided: !!c.void_snapshot, void_snapshot: undefined, member: mm[c.member_id] || null })), would_flag: would, signals_total: sigCount ?? 0 });
  }

  if (action === 'find') {
    const q = clean(b.q, 80);
    if (q.length < 2) return json({ ok: true, rows: [] });
    const like = `%${q.replace(/[%_,()]/g, ' ')}%`;
    const { data } = await db.from('members').select('id, name, email, initials, color, standing, membership_status, member_class').or(`name.ilike.${like},email.ilike.${like},username.ilike.${like}`).limit(12);
    return json({ ok: true, rows: (data || []).filter((m) => m.member_class !== 'agent') });
  }

  if (action === 'get') {
    let memberId = String(b.member_id || '');
    if (b.id) {
      if (!UUID.test(String(b.id))) return json({ error: 'bad_id' }, 400);
      const { data: c } = await db.from('ve_abuse_cases').select('member_id').eq('id', b.id).maybeSingle();
      if (!c) return json({ error: 'not_found' }, 404);
      memberId = c.member_id;
    }
    if (!UUID.test(memberId)) return json({ error: 'bad_id' }, 400);
    const ev = await evidence(memberId);
    if (!ev) return json({ error: 'not_found' }, 404);
    const caseId = b.id || (ev.cases.find((c: any) => ['watching', 'voided', 'suspended', 'banned'].includes(c.status))?.id) || null;
    const { data: events } = caseId ? await db.from('ve_abuse_events').select('id, actor, action, note, snapshot, created_at').eq('case_id', caseId).order('created_at', { ascending: true }).limit(200) : { data: [] as any[] };
    const actorIds = [...new Set((events || []).map((e) => e.actor).filter(Boolean))] as string[];
    const { data: actors } = actorIds.length ? await db.from('members').select('id, name').in('id', actorIds) : { data: [] as any[] };
    const am = Object.fromEntries((actors || []).map((a) => [a.id, a.name]));
    return json({ ok: true, settings: await settings(), case_id: caseId, ...ev, events: (events || []).map((e) => ({ ...e, actor_name: e.actor ? (am[e.actor] || 'A team member') : 'The system' })) });
  }

  if (action === 'watch') {
    if (!UUID.test(String(b.member_id || ''))) return json({ error: 'bad_id' }, 400);
    if (b.member_id === judge) return json({ error: 'not_yourself' }, 400);
    const { data, error } = await db.rpc('ve_abuse_watch', { p_member: b.member_id, p_judge: judge, p_note: clean(b.note, 2000) });
    return error ? json({ error: 'save_failed' }, 500) : json(data?.error ? { error: data.error } : { ok: true, ...data }, data?.error ? 400 : 200);
  }

  if (action === 'decide') {
    if (!UUID.test(String(b.id || ''))) return json({ error: 'bad_id' }, 400);
    if (!DECISIONS.includes(String(b.decision))) return json({ error: 'bad_decision' }, 400);
    const { data: c } = await db.from('ve_abuse_cases').select('member_id').eq('id', b.id).maybeSingle();
    if (!c) return json({ error: 'not_found' }, 404);
    if (c.member_id === judge) return json({ error: 'not_yourself' }, 400);
    const { data, error } = await db.rpc('ve_abuse_decide', { p_case: b.id, p_judge: judge, p_action: b.decision, p_note: clean(b.note, 2000) });
    return error ? json({ error: 'save_failed' }, 500) : json(data?.error ? { error: data.error } : { ok: true, ...data }, data?.error ? 400 : 200);
  }

  if (action === 'set_mode') {
    const mode = b.mode === 'on' ? 'on' : b.mode === 'log_only' ? 'log_only' : '';
    if (!mode) return json({ error: 'bad_mode' }, 400);
    const cur = await settings();
    const { data: row } = await db.from('ve_site_settings').select('value').eq('key', 'abuse_watch').maybeSingle();
    const next = { ...((row?.value as any) || {}), mode, open_at: cur.open_at, watch_days: cur.watch_days, switched_by: judge, switched_at: new Date().toISOString() };
    const { error } = await db.from('ve_site_settings').upsert({ key: 'abuse_watch', value: next, updated_at: new Date().toISOString(), updated_by: judge });
    return error ? json({ error: 'save_failed' }, 500) : json({ ok: true, settings: await settings() });
  }

  return json({ error: 'unknown_action' }, 400);
});
