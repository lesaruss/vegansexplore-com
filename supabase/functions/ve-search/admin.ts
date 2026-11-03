// Depot > Search questions (Sean, 2026-11-03, canon-ve-search-questions): the queue a person works. Super admin token only.
// Actions: q_list, q_get, q_set, q_notify {mode: 'preview' | 'test' | 'send'}, q_setting {send_on}.
// Nothing emails a real asker until the switch (ve_site_settings 'search_answers' send_on) is on, which only Sean turns on.
const STATUSES = ['open', 'working', 'answered', 'set_aside', 'quarantined'];
const SITE = 'https://vegansexplore.com';
const BRAND = 'vegans-explore';
const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
const clean = (v: unknown, n: number) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
function b64d(s: string): Uint8Array { const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4)); const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
async function verifyToken(token: string, key: string): Promise<string | null> {
  try {
    const [h, p, sg] = token.split('.');
    if (!h || !p || !sg) return null;
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key.slice(0, 32).padEnd(32, '0')), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', k, b64d(sg), new TextEncoder().encode(`${h}.${p}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64d(p)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}
// Liz delivers it (Sean: "sleek, clean"); her words are a text draft for Sean.
export function answerEmail(q: any) {
  const link = q.answer_url ? (/^https?:\/\//i.test(q.answer_url) ? q.answer_url : SITE + (q.answer_url.startsWith('/') ? '' : '/') + q.answer_url) : '';
  const subject = `We have an answer to "${String(q.q).slice(0, 70)}"`;
  const html = `<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;font-size:15px;line-height:1.65;color:#1a1a1a">` +
    `<p>Hi,</p><p>You asked Vegans Explore: <b>${esc(q.q)}</b></p><p>We did not have it then. We do now.</p>` +
    (q.answer_text ? `<p style="white-space:pre-wrap;background:#f3f7f4;border-left:3px solid #2D5C27;padding:12px 14px;border-radius:6px">${esc(q.answer_text)}</p>` : '') +
    (link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#2D5C27;color:#fff;text-decoration:none;font-weight:700;padding:11px 18px;border-radius:6px">See the answer</a></p>` : '') +
    `<p>Thank you for asking. Every question makes Vegans Explore better for the next person.</p><p>Liz<br>Your Guide at Vegans Explore</p>` +
    `<p style="font-size:12px;color:#666">You are getting this one email because you asked this question and left your address. We use it for nothing else.</p></div>`;
  return { subject, html };
}
export async function handleAdmin(b: any, req: Request, db: any, json: (b: unknown, s?: number) => Response, serviceKey: string, secret: (k: string) => Promise<string | null>) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const mid = tok ? await verifyToken(tok, serviceKey) : null;
  if (!mid) return json({ error: 'not_authenticated' }, 401);
  const { data: me } = await db.from('members').select('id, name, email, is_superadmin').eq('id', mid).maybeSingle();
  if (!me?.is_superadmin) return json({ error: 'no_access' }, 403);
  const settings = async () => (await db.from('ve_site_settings').select('value').eq('key', 'search_answers').maybeSingle()).data?.value || { send_on: false };

  if (b.action === 'q_list') {
    const { data: qs, error } = await db.from('ve_search_questions').select('id, q, status, asked_count, first_asked_at, last_asked_at, guide_slug, note, answered_at').eq('brand', 'vegans-explore').order('asked_count', { ascending: false }).order('last_asked_at', { ascending: false }).limit(1000);
    if (error) return json({ error: 'load_failed' }, 500);
    const ids = (qs || []).map((x: any) => x.id);
    const emails: Record<string, { n: number; left: number }> = {};
    if (ids.length) {
      const { data: as } = await db.from('ve_search_question_askers').select('question_id, email, notified_at').in('question_id', ids).not('email', 'is', null);
      for (const a of as || []) { const e = emails[a.question_id] || (emails[a.question_id] = { n: 0, left: 0 }); e.n++; if (!a.notified_at) e.left++; }
    }
    const { data: guides } = await db.from('ve_guides').select('slug, title').eq('published', true).order('title');
    return json({ ok: true, rows: (qs || []).map((x: any) => ({ ...x, emails: emails[x.id]?.n || 0, to_tell: emails[x.id]?.left || 0 })), guides: guides || [], settings: await settings() });
  }
  if (b.action === 'q_setting') {
    if (typeof b.send_on !== 'boolean') return json({ error: 'bad_value' }, 400);
    await db.from('ve_site_settings').upsert({ key: 'search_answers', value: { send_on: b.send_on }, updated_by: mid, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return json({ ok: true, settings: await settings() });
  }
  if (!/^[0-9a-f-]{36}$/i.test(String(b.id || ''))) return json({ error: 'bad_id' }, 400);
  const { data: q } = await db.from('ve_search_questions').select('*').eq('id', b.id).maybeSingle();
  if (!q) return json({ error: 'not_found' }, 404);

  if (b.action === 'q_get') {
    const { data: as } = await db.from('ve_search_question_askers').select('email, created_at, notified_at, member_id').eq('question_id', q.id).order('created_at', { ascending: false }).limit(200);
    const { data: guides } = await db.from('ve_guides').select('slug, title').eq('published', true).order('title');
    return json({ ok: true, row: q, askers: (as || []).map((a: any) => ({ email: a.email, at: a.created_at, notified_at: a.notified_at, member: !!a.member_id })), anonymous: (as || []).filter((a: any) => !a.email).length, guides: guides || [], settings: await settings(), preview: answerEmail(q) });
  }
  if (b.action === 'q_set') {
    const patch: Record<string, unknown> = {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return json({ error: 'bad_status' }, 400);
      patch.status = b.status;
      if (b.status === 'answered') { patch.answered_at = new Date().toISOString(); patch.answered_by = mid; }
    }
    if (b.note !== undefined) patch.note = clean(b.note, 2000) || null;
    if (b.guide_slug !== undefined) patch.guide_slug = clean(b.guide_slug, 80) || null;
    if (b.answer_text !== undefined) patch.answer_text = clean(b.answer_text, 3000) || null;
    if (b.answer_url !== undefined) {
      const u = clean(b.answer_url, 500);
      if (u && !/^(https?:\/\/|\/)/i.test(u)) return json({ error: 'bad_link' }, 400);
      patch.answer_url = u || null;
    }
    if (patch.status === 'answered' && !(patch.answer_text ?? q.answer_text) && !(patch.answer_url ?? q.answer_url)) return json({ error: 'answer_needed' }, 400);
    if (!Object.keys(patch).length) return json({ error: 'nothing_to_save' }, 400);
    const { data, error } = await db.from('ve_search_questions').update(patch).eq('id', q.id).select('*').maybeSingle();
    return error || !data ? json({ error: 'save_failed' }, 500) : json({ ok: true, row: data });
  }
  if (b.action === 'q_notify') {
    if (q.status !== 'answered' || !(q.answer_text || q.answer_url)) return json({ error: 'not_answered' }, 400);
    const mail = answerEmail(q);
    const admin = await secret('LESARUSS_ADMIN_TOKEN');
    const call = async (payload: Record<string, unknown>) => { try { const r = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-send`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${admin}` }, body: JSON.stringify(payload) }); return await r.json().catch(() => ({ ok: false, error: `email-send ${r.status}` })); } catch (e) { return { ok: false, error: String(e) }; } };
    if (b.mode === 'test') {
      if (!me.email) return json({ error: 'no_email' }, 400);
      const res: any = await call({ brand: BRAND, campaign_ref: `ve-search-answer-${q.id}`, list_ref: 've-search-answers', subject: '[Test] ' + mail.subject, html: mail.html, recipients: [{ email: me.email, name: me.name || undefined }], test_to: [me.email] });
      return json({ ok: !!res?.results?.[0] && res.results[0].result !== 'failed', result: res?.results?.[0]?.result || 'failed', error: res?.error || res?.results?.[0]?.error || null });
    }
    if (b.mode !== 'send') return json({ error: 'bad_mode' }, 400);
    if (!(await settings()).send_on) return json({ error: 'sending_off' }, 409);
    const { data: as } = await db.from('ve_search_question_askers').select('id, email').eq('question_id', q.id).is('notified_at', null).not('email', 'is', null);
    let sent = 0, skipped = 0, failed = 0;
    for (const a of as || []) {
      const { data: sup } = await db.rpc('email_is_suppressed', { p_email: String(a.email).toLowerCase().trim(), p_brand: BRAND });
      if (sup === true) { skipped++; await db.from('ve_search_question_askers').update({ notified_at: new Date().toISOString() }).eq('id', a.id); continue; }
      const res: any = await call({ brand: BRAND, campaign_ref: `ve-search-answer-${q.id}`, list_ref: 've-search-answers', subject: mail.subject, html: mail.html, recipients: [{ email: a.email }] });
      if (res?.results?.[0]?.result === 'sent') { sent++; await db.from('ve_search_question_askers').update({ notified_at: new Date().toISOString() }).eq('id', a.id); } else failed++;
    }
    return json({ ok: true, sent, skipped, failed });
  }
  return json({ error: 'bad_action' }, 400);
}
