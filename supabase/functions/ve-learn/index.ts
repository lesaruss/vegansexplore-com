// ve-learn: runs Guide Engine courses (learn_* tables) for Vegans Explore members.
//
// First course: the Community Manager Certification, the handbook as a course
// (Sean, 2026-09-25, modeled on the BCPS MarCom certification). Same tables and
// shape as the LESARUSS Guide Engine, so nothing BCPS-owned is touched.
//
// Auth: the VE app token (ve_token), HMAC-verified exactly like ve-auth.
// Access: each course lists who may take it in COURSE_ACCESS below.
// Quizzes are graded here; correct answers never leave the server.
//
// POST { action, course, module?, page?, answers? }  Authorization: Bearer <ve_token>
//   outline  -> course, modules with pages and progress, certificate if issued
//   page     -> one page (quiz pages come without answers); records the visit
//   complete -> marks a content page done
//   quiz     -> grades answers, records the attempt, marks the page done on a pass
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

type Member = { id: string; email: string; name: string | null; ve_role: string | null; is_superadmin: boolean | null; home_community: string | null };

// Who may take each course. Superadmins can always open a course (to review it).
const COURSE_ACCESS: Record<string, (m: Member) => boolean> = {
  've-community-manager-certification': (m) => m.ve_role === 'community_manager',
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`));
    if (!ok) return null;
    const decoded = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    if (typeof decoded.sub !== 'string' || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded.sub;
  } catch { return null; }
}

async function loadPages(course: string) {
  const [{ data: modules }, { data: pages }] = await Promise.all([
    db.from('learn_modules').select('module_key, number, title, video_slot, sort_order').eq('course_slug', course).order('sort_order'),
    db.from('learn_pages').select('module_key, page_key, title, type, pass_mark, sort_order').eq('course_slug', course).order('sort_order'),
  ]);
  return { modules: modules || [], pages: pages || [] };
}

async function certificate(memberId: string, course: string) {
  const { data } = await db.from('learn_completions').select('id, issued_at').eq('member_id', memberId).eq('course_slug', course).maybeSingle();
  return data;
}

// Issue the certificate once every page in the course is complete.
async function maybeCertify(memberId: string, course: string) {
  const existing = await certificate(memberId, course);
  if (existing) return existing;
  const [{ pages }, { data: done }] = await Promise.all([
    loadPages(course),
    db.from('learn_progress').select('module_key, page_key').eq('member_id', memberId).eq('course_slug', course).eq('completed', true),
  ]);
  const doneSet = new Set((done || []).map((d) => d.module_key + '/' + d.page_key));
  if (!pages.length || !pages.every((p) => doneSet.has(p.module_key + '/' + p.page_key))) return null;
  const { data } = await db.from('learn_completions').upsert({ member_id: memberId, course_slug: course }, { onConflict: 'member_id,course_slug' }).select('id, issued_at').maybeSingle();
  return data;
}

async function markProgress(memberId: string, course: string, module: string, page: string, completed: boolean) {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = { member_id: memberId, course_slug: course, module_key: module, page_key: page, last_visited_at: now };
  if (completed) { row.completed = true; row.completed_at = now; }
  // Never un-complete a page on a later visit.
  const { data: prev } = await db.from('learn_progress').select('completed').eq('member_id', memberId).eq('course_slug', course).eq('module_key', module).eq('page_key', page).maybeSingle();
  if (prev?.completed) { delete row.completed; delete row.completed_at; }
  await db.from('learn_progress').upsert(row, { onConflict: 'member_id,course_slug,module_key,page_key' });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const action = String(body.action || '');
  const course = String(body.course || '');

  const { data: member } = await db.from('members').select('id, email, name, ve_role, is_superadmin, home_community').eq('id', memberId).maybeSingle();
  if (!member) return json({ error: 'member_not_found' }, 404);

  const { data: meta } = await db.from('learn_courses').select('slug, title, subtitle, summary, brand_slug, status, estimated_minutes').eq('slug', course).maybeSingle();
  const gate = COURSE_ACCESS[course];
  if (!meta || meta.brand_slug !== 'vegans-explore' || !gate) return json({ error: 'course_not_found' }, 404);
  const isAdmin = !!member.is_superadmin;
  if (!isAdmin && (meta.status !== 'published' || !gate(member as Member))) return json({ error: 'no_access' }, 403);

  if (action === 'outline') {
    const [{ modules, pages }, { data: progress }, { data: attempts }, cert] = await Promise.all([
      loadPages(course),
      db.from('learn_progress').select('module_key, page_key, completed').eq('member_id', memberId).eq('course_slug', course),
      db.from('learn_quiz_attempts').select('module_key, score, passed').eq('member_id', memberId).eq('course_slug', course),
      certificate(memberId, course),
    ]);
    const done = new Set((progress || []).filter((p) => p.completed).map((p) => p.module_key + '/' + p.page_key));
    const best: Record<string, number> = {};
    (attempts || []).forEach((a) => { best[a.module_key] = Math.max(best[a.module_key] ?? 0, a.score); });
    const out = modules.map((m) => ({
      key: m.module_key, number: m.number, title: m.title,
      pages: pages.filter((p) => p.module_key === m.module_key).map((p) => ({ key: p.page_key, title: p.title, type: p.type, completed: done.has(m.module_key + '/' + p.page_key) })),
      best_score: best[m.module_key] ?? null,
    }));
    const total = pages.length, completed = pages.filter((p) => done.has(p.module_key + '/' + p.page_key)).length;
    // Self-heal: if every page is done but no certificate exists yet (e.g. two
    // tabs finished at once), issue it now.
    const issued = cert || (total > 0 && completed === total ? await maybeCertify(memberId, course) : null);
    return json({
      course: meta, member: { name: member.name, email: member.email, home_community: member.home_community, is_admin: isAdmin },
      modules: out, total, completed, certificate: issued,
    });
  }

  const module = String(body.module || ''), pageKey = String(body.page || '');
  const { data: page } = await db.from('learn_pages').select('module_key, page_key, title, type, content, questions, pass_mark').eq('course_slug', course).eq('module_key', module).eq('page_key', pageKey).maybeSingle();
  if (!page) return json({ error: 'page_not_found' }, 404);

  if (action === 'page') {
    await markProgress(memberId, course, module, pageKey, false);
    const questions = page.type === 'quiz' ? (page.questions || []).map((q: any) => ({ question: q.question, options: q.options })) : undefined;
    return json({ page: { module: page.module_key, key: page.page_key, title: page.title, type: page.type, content: page.content, pass_mark: page.pass_mark, questions } });
  }

  if (action === 'complete') {
    if (page.type === 'quiz') return json({ error: 'quiz_pages_complete_by_passing' }, 400);
    await markProgress(memberId, course, module, pageKey, true);
    const cert = await maybeCertify(memberId, course);
    return json({ ok: true, certificate: cert });
  }

  if (action === 'quiz') {
    if (page.type !== 'quiz') return json({ error: 'not_a_quiz' }, 400);
    const questions = (page.questions || []) as { correctIndex: number }[];
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== questions.length) return json({ error: 'answer_every_question' }, 400);
    const results = questions.map((q, i) => Number(answers[i]) === q.correctIndex);
    const score = Math.round((results.filter(Boolean).length / questions.length) * 100);
    const passed = score >= (page.pass_mark ?? 80);
    await db.from('learn_quiz_attempts').insert({ member_id: memberId, course_slug: course, module_key: module, score, passed, answers });
    if (passed) await markProgress(memberId, course, module, pageKey, true);
    const cert = passed ? await maybeCertify(memberId, course) : null;
    return json({ score, passed, pass_mark: page.pass_mark ?? 80, results, certificate: cert });
  }

  return json({ error: 'unknown_action' }, 400);
});
