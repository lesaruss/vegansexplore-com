// ve-research: the unanswered-question queue, the answer bank's check and the question panels (Sean, 2026-11-03, playbook ve-universal-search).
// Public (no sign-in):
//   { action: 'ask', question, source?, visitor? }  "Send it to our team": queued (or answered at once when the bank already has it)
//   { action: 'answer', q }                           the live, unexpired banked answer for a question, or none (guide_kb_match, score 0.65 or more)
// Super admin (the VE token) or ops (LESARUSS_ADMIN_TOKEN):
//   queue {status?}, item {id}, draft_save {id, answer, also_asked?, link_url?, link_label?, kind?, evidence?}, check {id}, publish {id},
//   needs_sean {id, note?}, set_aside {id, note?}, reopen {id}, retire {id}, sync,
//   panels, panel {id}, panel_create {name, note?, questions:[{question, category, origin, expect?}]}, panel_run {id, from?, to?},
//   panel_judge {question_id, verdict, note?}, panel_finish {id}
// A research answer goes live only through publish, which needs a recorded check with evidence; the database refuses it any other way
// (trigger ve_kb_guard). It expires in 90 days, 30 for stock and hours (ve_kb_publish); an expired one is retired and its question is
// back in the queue (cron ve-kb-expire). verify_jwt is off; the token is checked here.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const BRAND = 'vegans-explore';
const ANSWER_FLOOR = 0.65;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const isUuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
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
async function secret(key: string): Promise<string | null> {
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}
// Who is asking: ops (Logan, by the admin token) or a super admin member. Returns a short name for the check and the audit.
async function actor(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  if (token === (await secret('LESARUSS_ADMIN_TOKEN'))) return 'logan';
  const sub = await verifyToken(token);
  if (!sub) return null;
  const { data: me } = await db.from('members').select('is_superadmin, email').eq('id', sub).maybeSingle();
  return me?.is_superadmin ? String(me.email || 'admin:' + sub.slice(0, 8)) : null;
}

const KINDS = ['evergreen', 'stock_hours'];
function cleanEvidence(v: unknown): { label: string; url?: string; note?: string }[] | null {
  if (!Array.isArray(v)) return null;
  const out: { label: string; url?: string; note?: string }[] = [];
  for (const e of v.slice(0, 10)) {
    const label = str(e?.label, 200), url = str(e?.url, 500), note = str(e?.note, 500);
    if (!label && !url) continue;
    if (url && !/^https?:\/\//i.test(url)) continue;
    out.push({ label: label || url, ...(url ? { url } : {}), ...(note ? { note } : {}) });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || '');

  // ---- public ----
  if (action === 'ask') {
    const { data, error } = await db.rpc('ve_research_capture', { p_brand: BRAND, p_question: str(b.question, 300), p_source: str(b.source, 20) || 'search_box', p_visitor: str(b.visitor, 40) });
    if (error) { console.error('ve-research ask:', error); return json({ error: 'server_error' }, 500); }
    return json(data);
  }
  if (action === 'answer') {
    const q = str(b.q, 200);
    if (q.length < 8 || q.split(/\s+/).length < 3) return json({ found: false });
    const { data, error } = await db.rpc('guide_kb_match', { p_brand: BRAND, p_question: q, p_limit: 1 });
    if (error) return json({ found: false });
    const m = (data ?? [])[0];
    // 0.65, not the Guides' 0.42: the first panel (2026-11-03) showed 0.42 to 0.64 serving near-miss answers to place and product questions.
    if (!m || !m.answer || m.score < ANSWER_FLOOR) return json({ found: false });
    return json({ found: true, question: m.question, answer: m.answer, link_url: m.link_url, link_label: m.link_label });
  }

  // ---- team ----
  const who = await actor(req);
  if (!who) return json({ error: 'not_authenticated' }, 401);
  try {
    if (action === 'queue') {
      const { data: rows, error } = await db.from('ve_research_queue').select('id, question, source, asks, visitors, first_asked, last_asked, status, kb_answer_id, note').eq('brand_slug', BRAND).order('asks', { ascending: false }).order('last_asked', { ascending: false }).limit(500);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of rows ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
      const { data: bank } = await db.from('guide_kb_answers').select('status, origin, expires_at').eq('brand_slug', BRAND);
      const soon = Date.now() + 14 * 864e5;
      const stats = {
        live_total: (bank ?? []).filter((x) => x.status === 'live').length,
        live_research: (bank ?? []).filter((x) => x.status === 'live' && x.origin === 'research').length,
        expiring_14d: (bank ?? []).filter((x) => x.status === 'live' && x.origin === 'research' && x.expires_at && Date.parse(x.expires_at) < soon).length,
      };
      return json({ ok: true, rows: rows ?? [], counts, stats });
    }
    if (action === 'item') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const { data: q } = await db.from('ve_research_queue').select('*').eq('id', b.id).maybeSingle();
      if (!q) return json({ error: 'not_found' }, 404);
      const [answer, listing, content, store, near] = await Promise.all([
        q.kb_answer_id ? db.from('guide_kb_answers').select('id, question, answer, also_asked, link_url, link_label, kind, status, expires_at, checked_at, checked_by, evidence, notes').eq('id', q.kb_answer_id).maybeSingle() : Promise.resolve({ data: null }),
        db.rpc('ve_search', { p_q: q.question, p_lat: null, p_lng: null, p_limit: 5, p_brand: BRAND }),
        db.rpc('ve_search_content', { p_q: q.question, p_limit: 3, p_brand: BRAND }),
        db.rpc('ve_search_store', { p_q: q.question, p_limit: 5 }),
        db.rpc('guide_kb_match', { p_brand: BRAND, p_question: q.question, p_limit: 3 }),
      ]);
      // What the engine already has for this question, so the person researching starts from our own data.
      const l: any = listing.data ?? {}, c: any = content.data ?? {};
      return json({
        ok: true, item: q, answer: answer.data ?? null,
        engine: {
          read: l.interpretation ?? null, total: l.total ?? 0,
          listings: (l.results ?? []).slice(0, 5).map((x: any) => ({ name: x.name, slug: x.slug, category: x.category, city: x.city })),
          moments: (c.moments ?? []).slice(0, 3).map((x: any) => ({ quote: x.quote, speaker: x.speaker, show: x.show, slug: x.slug })),
          episodes: (c.episodes ?? []).slice(0, 3).map((x: any) => ({ title: x.title, show: x.show, slug: x.slug })),
          store: store.data ?? null,
          bank: (near.data ?? []).map((x: any) => ({ question: x.question, score: Math.round(x.score * 100) / 100 })),
        },
      });
    }
    if (action === 'draft_save') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const answer = str(b.answer, 1500);
      if (answer.length < 20) return json({ error: 'answer_too_short', message: 'Write at least a sentence.' }, 400);
      const kind = KINDS.includes(b.kind) ? b.kind : 'evergreen';
      const evidence = b.evidence === undefined ? undefined : cleanEvidence(b.evidence);
      if (evidence === null) return json({ error: 'bad_evidence' }, 400);
      const linkUrl = str(b.link_url, 500) || null;
      if (linkUrl && !/^(https?:\/\/|\/)/i.test(linkUrl)) return json({ error: 'bad_link' }, 400);
      const alsoAsked = Array.isArray(b.also_asked) ? b.also_asked.map((x: unknown) => str(x, 200)).filter(Boolean).slice(0, 8) : [];
      const { data: q } = await db.from('ve_research_queue').select('id, question, kb_answer_id, status').eq('id', b.id).maybeSingle();
      if (!q) return json({ error: 'not_found' }, 404);
      const fields: Record<string, unknown> = { answer, kind, link_url: linkUrl, link_label: linkUrl ? (str(b.link_label, 80) || 'Learn more') : null, also_asked: alsoAsked, updated_by: who };
      if (evidence !== undefined) fields.evidence = evidence;
      let aid = q.kb_answer_id as string | null;
      if (aid) {
        // Changing the words of a checked answer clears the check (the trigger does it for a live one; do the same for a draft).
        const { data: cur } = await db.from('guide_kb_answers').select('answer, status').eq('id', aid).maybeSingle();
        if (cur && cur.answer !== answer) Object.assign(fields, { checked_at: null, checked_by: null });
        if (cur && cur.status === 'retired') fields.status = 'draft';
        const { error } = await db.from('guide_kb_answers').update(fields).eq('id', aid);
        if (error) throw error;
      } else {
        const { data: ins, error } = await db.from('guide_kb_answers').insert({
          brand_slug: BRAND, topic: 'search', question: q.question, status: 'draft', source: who === 'logan' ? 'logan' : 'sean', origin: 'research',
          created_by: who, evidence: evidence ?? [], ...fields,
        }).select('id').single();
        if (error) {
          if (String(error.message).includes('duplicate')) return json({ error: 'already_in_bank', message: 'An answer with this exact question already exists in the bank.' }, 409);
          throw error;
        }
        aid = ins.id;
      }
      await db.from('ve_research_queue').update({ kb_answer_id: aid, status: 'drafted', updated_at: new Date().toISOString() }).eq('id', q.id);
      return json({ ok: true, kb_answer_id: aid });
    }
    if (action === 'check') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const { data: q } = await db.from('ve_research_queue').select('kb_answer_id').eq('id', b.id).maybeSingle();
      if (!q?.kb_answer_id) return json({ error: 'no_draft', message: 'Save a draft first.' }, 400);
      const { data: a } = await db.from('guide_kb_answers').select('evidence, status, origin').eq('id', q.kb_answer_id).maybeSingle();
      if (!a || a.origin !== 'research') return json({ error: 'not_research' }, 400);
      if (!Array.isArray(a.evidence) || a.evidence.length === 0) return json({ error: 'no_evidence', message: 'Add at least one source (a page on our site, a listing, an episode) before checking it.' }, 400);
      const { error } = await db.from('guide_kb_answers').update({ checked_at: new Date().toISOString(), checked_by: who }).eq('id', q.kb_answer_id);
      if (error) throw error;
      return json({ ok: true, checked_by: who });
    }
    if (action === 'publish') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const { data: q } = await db.from('ve_research_queue').select('kb_answer_id').eq('id', b.id).maybeSingle();
      if (!q?.kb_answer_id) return json({ error: 'no_draft', message: 'Save a draft first.' }, 400);
      const { data, error } = await db.rpc('ve_kb_publish', { p_answer: q.kb_answer_id, p_by: who });
      if (error) throw error;
      return json(data);
    }
    if (action === 'retire') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const { data: q } = await db.from('ve_research_queue').select('kb_answer_id').eq('id', b.id).maybeSingle();
      if (!q?.kb_answer_id) return json({ error: 'no_draft' }, 400);
      await db.from('guide_kb_answers').update({ status: 'retired', updated_by: who }).eq('id', q.kb_answer_id).eq('origin', 'research');
      await db.from('ve_research_queue').update({ status: 'new', updated_at: new Date().toISOString() }).eq('id', b.id);
      return json({ ok: true });
    }
    if (action === 'needs_sean' || action === 'set_aside' || action === 'reopen') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const status = action === 'reopen' ? 'new' : action;
      const { error } = await db.from('ve_research_queue').update({ status, note: str(b.note, 500) || null, updated_at: new Date().toISOString() }).eq('id', b.id);
      if (error) throw error;
      return json({ ok: true, status });
    }
    if (action === 'sync') {
      const { data, error } = await db.rpc('ve_research_sync');
      if (error) throw error;
      return json({ ok: true, ...data });
    }

    // ---- panels ----
    if (action === 'panels') {
      const { data: runs } = await db.from('ve_panel_runs').select('id, name, note, status, created_by, created_at, run_at, judged_at').eq('brand_slug', BRAND).order('created_at', { ascending: false }).limit(50);
      const ids = (runs ?? []).map((r) => r.id);
      const { data: qs } = ids.length ? await db.from('ve_panel_questions').select('run_id, coverage, verdict').in('run_id', ids) : { data: [] };
      const sum: Record<string, any> = {};
      for (const x of qs ?? []) {
        const s = (sum[x.run_id] ??= { total: 0, coverage: {}, verdict: {} });
        s.total++; s.coverage[x.coverage ?? 'not_run'] = (s.coverage[x.coverage ?? 'not_run'] ?? 0) + 1; s.verdict[x.verdict ?? 'unjudged'] = (s.verdict[x.verdict ?? 'unjudged'] ?? 0) + 1;
      }
      return json({ ok: true, runs: (runs ?? []).map((r) => ({ ...r, summary: sum[r.id] ?? { total: 0, coverage: {}, verdict: {} } })) });
    }
    if (action === 'panel') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const { data: run } = await db.from('ve_panel_runs').select('*').eq('id', b.id).maybeSingle();
      if (!run) return json({ error: 'not_found' }, 404);
      const { data: questions } = await db.from('ve_panel_questions').select('id, n, question, category, origin, expect, engine, coverage, top_label, verdict, judge_note, judged_by').eq('run_id', b.id).order('n');
      return json({ ok: true, run, questions: questions ?? [] });
    }
    if (action === 'panel_create') {
      const name = str(b.name, 120);
      const qs = Array.isArray(b.questions) ? b.questions : [];
      if (!name || qs.length < 1 || qs.length > 300) return json({ error: 'bad_panel' }, 400);
      const ORIGINS = ['gsc', 'search_log', 'guide', 'logan'];
      const rows: any[] = [];
      for (let i = 0; i < qs.length; i++) {
        const question = str(qs[i]?.question, 300), category = str(qs[i]?.category, 60), origin = str(qs[i]?.origin, 20);
        if (question.length < 3 || !category || !ORIGINS.includes(origin)) return json({ error: 'bad_question', n: i + 1 }, 400);
        rows.push({ n: i + 1, question, category, origin, expect: str(qs[i]?.expect, 400) || null });
      }
      const { data: run, error } = await db.from('ve_panel_runs').insert({ brand_slug: BRAND, name, note: str(b.note, 500) || null, created_by: who }).select('id').single();
      if (error) throw error;
      const { error: e2 } = await db.from('ve_panel_questions').insert(rows.map((r) => ({ ...r, run_id: run.id })));
      if (e2) { await db.from('ve_panel_runs').delete().eq('id', run.id); throw e2; }
      return json({ ok: true, id: run.id, questions: rows.length });
    }
    if (action === 'panel_run') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const from = Math.max(1, Number(b.from) || 1), to = Math.min(1000, Number(b.to) || 1000);
      const { data, error } = await db.rpc('ve_panel_run', { p_run: b.id, p_from: from, p_to: to });
      if (error) throw error;
      return json(data);
    }
    if (action === 'panel_judge') {
      if (!isUuid(b.question_id)) return json({ error: 'bad_id' }, 400);
      if (!['pass', 'partial', 'fail'].includes(b.verdict)) return json({ error: 'bad_verdict' }, 400);
      const { error } = await db.from('ve_panel_questions').update({ verdict: b.verdict, judge_note: str(b.note, 500) || null, judged_by: who }).eq('id', b.question_id);
      if (error) throw error;
      return json({ ok: true });
    }
    if (action === 'panel_finish') {
      if (!isUuid(b.id)) return json({ error: 'bad_id' }, 400);
      const { count } = await db.from('ve_panel_questions').select('id', { count: 'exact', head: true }).eq('run_id', b.id).is('verdict', null);
      if ((count ?? 0) > 0) return json({ error: 'unjudged', message: count + ' questions still need a verdict.' }, 400);
      await db.from('ve_panel_runs').update({ status: 'judged', judged_at: new Date().toISOString() }).eq('id', b.id);
      return json({ ok: true });
    }
    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-research:', action, e);
    return json({ error: 'server_error' }, 500);
  }
});
