// ve-cookbook: the Cookbook, Phase 1 (Sean, 2026-10-07; built 2026-10-10). Recipes live in public.recipes
// (migration 20261010_ve_cookbook.sql). Members read them, vote, say "didn't work for me" and submit their own;
// Sean reviews submissions and retests in Depot > Cookbook (/admin/depot/cookbook). Recipes are members-only
// content, so the table has no public read: everything goes through here.
//
// POST { action: 'list', guide? }                 anyone; a member gets the recipes, everyone else only the titles
//   -> { member, recipes: [...], voted: [ids], reported: [ids] }
// POST { action: 'submit', title, summary?, time_text?, servings?, ingredients: [..], steps: [..], tip?, guide? }  member
//   -> { ok, id, slug }   pending until approved; 50 points on approval (ve_recipe_review)
// POST { action: 'vote', recipe_id, on }          member -> { ok, vote_count }   one vote per member per recipe
// POST { action: 'report', recipe_id, note? }     member -> { ok, status }       3 different members pull it for retesting
// POST { action: 'mine' }                         member -> { recipes: [...] }   their submissions with their status
// POST { action: 'queue' }                        super admin -> { pending, retesting, live, rejected }
// POST { action: 'review', recipe_id, op: approve|reject|restore|retire, note? }  super admin
//
// Round 2 (Sean, 2026-10-10, migration 20261010_dairy_guide_v2.sql). With a guide, a "member" is someone who owns that
// Guide (ve_owns_guide; credits pricing), not just any active member; a super admin always is.
// POST { action: 'gvotes', guide }                anyone -> { counts: {swap:{key:n}, episode:{key:n}}, mine: {swap:[keys], ...} }
// POST { action: 'gvote', guide, kind, key, on }  Guide member -> { ok, count }    kind swap | episode
// POST { action: 'photos', recipe_id, guide }     Guide member -> { photos: [{url, name}], mine: [{url, status}] }
// POST { action: 'photo_start', recipe_id, guide, type }  Guide member -> { photo_id, upload_url }   PUT the file there
// POST { action: 'photo_done', photo_id }         the uploader -> { ok }   waits for Sean in Depot > Cookbook
// POST { action: 'photo_queue' }                  super admin -> { photos: [...] }
// POST { action: 'photo_review', photo_id, op: approve|reject }  super admin
//
// Authorization: Bearer <ve_token> (the VE app token, checked the way ve-votes and ve-board check it).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const SITE = 'https://vegansexplore.com';
const SEAN_EMAIL = 'contact@lesaruss.com';
const GUIDES: Record<string, string> = { 'vegan-dairy-guide': 'The Vegan Dairy Guide' };
const GUIDE_NAMES: Record<string, string> = { maya: 'Maya' };
const LIMITS = { submit: 5, report: 20, photo: 5 };
const MEDIA = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/`;
const DAY_MS = 24 * 60 * 60 * 1000;

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

type Viewer = { id: string; name: string | null; email: string | null; active: boolean; admin: boolean } | null;
async function loadViewer(req: Request): Promise<Viewer> {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const id = token ? await verifyToken(token) : null;
  if (!id) return null;
  const { data: m } = await db.from('members').select('id, name, email, membership_status, is_superadmin').eq('id', id).maybeSingle();
  if (!m) return null;
  return { id: m.id, name: m.name, email: m.email, active: m.membership_status === 'active', admin: !!m.is_superadmin };
}

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\s*—\s*/g, ', ').trim().slice(0, max) : '');
// "Vegan" is always capitalized on our pages.
const tidy = (v: unknown, max: number) => clean(v, max).replace(/\bvegan(ism|s)?\b/g, (_m: string, x?: string) => 'Vegan' + (x || ''));
// One line each. A list marker someone pasted ("-", "•", "1.", "1)") comes off; a quantity ("1 cup", "1/2 cup") stays.
const lines = (v: unknown, maxItems: number, maxLen: number) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/\n+/) : []).map((x) => tidy(x, maxLen).replace(/^\s*(?:[-*•]+|\d+[.)])\s+/, '').trim()).filter(Boolean).slice(0, maxItems);
const isId = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'recipe';
// A member's name on a recipe: first name and last initial, never their email.
function shortName(n: string | null) {
  const p = String(n || '').trim().split(/\s+/).filter(Boolean);
  return p.length ? p[0] + (p.length > 1 ? ' ' + p[p.length - 1][0].toUpperCase() + '.' : '') : 'A member';
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
const p = (s: string) => `<p style="font-family:sans-serif;font-size:15px;line-height:1.6">${s}</p>`;

async function countSince(table: string, col: string, id: string, extra?: (q: any) => any) {
  let q = db.from(table).select('id', { count: 'exact', head: true }).eq(col, id).gte(table === 'recipes' ? 'submitted_at' : 'created_at', new Date(Date.now() - DAY_MS).toISOString());
  if (extra) q = extra(q);
  const { count } = await q;
  return count || 0;
}

const FIELDS = 'id, slug, title, summary, time_text, servings, ingredients, instructions, tip, status, author_kind, author_member_id, author_guide, guide_tags, vote_count, report_count, live_at, submitted_at, review_note, created_at, photo_url, photo_illustrative';
async function shape(rows: any[]) {
  const ids = [...new Set(rows.map((r) => r.author_member_id).filter(Boolean))];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data } = await db.from('members').select('id, name').in('id', ids);
    for (const m of data || []) names[m.id] = shortName(m.name);
  }
  return rows.map((r) => ({
    id: r.id, slug: r.slug, title: r.title, summary: r.summary, time: r.time_text, servings: r.servings,
    // Member recipes keep each ingredient as one line; older rows may carry amount and unit.
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map((i: any) => typeof i === 'string' ? i : [i.amount, i.unit, i.name].filter(Boolean).join(' ')).filter(Boolean),
    steps: r.instructions || [], tip: r.tip, status: r.status, guides: r.guide_tags || [],
    photo: r.photo_url || null, photo_illustrative: !!r.photo_illustrative,
    votes: r.vote_count || 0, reports: r.report_count || 0, live_at: r.live_at, submitted_at: r.submitted_at, review_note: r.review_note,
    author: r.author_kind === 'guide' ? { kind: 'guide', name: GUIDE_NAMES[r.author_guide] || 'Your Guide', guide: r.author_guide }
      : r.author_kind === 'member' ? { kind: 'member', name: names[r.author_member_id] || 'A member' }
      : { kind: r.author_kind, name: 'Vegans Explore' },
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  const viewer = await loadViewer(req);
  const guide = GUIDES[body.guide] ? String(body.guide) : null;
  // Inside a Guide, the Cookbook is the Guide's: its owners (and super admins) are its members.
  let owns = false;
  if (viewer && guide) {
    if (viewer.admin) owns = true;
    else { const { data } = await db.rpc('ve_owns_guide', { p_member: viewer.id, p_guide: guide }); owns = !!data; }
  }
  const isMember = () => !!viewer && (guide ? owns : viewer.active);
  const needMember = () => !viewer ? json({ error: 'not_authenticated', message: 'Sign in to use the Cookbook.' }, 401)
    : !isMember() ? json({ error: 'payment_required', message: guide ? 'The Cookbook comes with ' + GUIDES[guide] + ': $11 or 1 Guide credit.' : 'The Cookbook comes with the $11 Founding Membership, one time.' }, 402) : null;

  switch (body.action) {
    case 'list': {
      let q = db.from('recipes').select(FIELDS).in('status', ['live', 'retesting']).order('vote_count', { ascending: false }).order('live_at', { ascending: false }).limit(300);
      if (guide) q = q.contains('guide_tags', [guide]);
      const { data, error } = await q;
      if (error) return json({ error: 'list_failed', message: error.message }, 500);
      // Everyone else sees what is in the Cookbook, never the recipes themselves.
      if (!isMember()) return json({ member: false, recipes: (data || []).map((r) => ({ title: r.title, author: { kind: r.author_kind } })) });
      const ids = (data || []).map((r) => r.id);
      const [{ data: v }, { data: rp }] = ids.length ? await Promise.all([
        db.from('recipe_votes').select('recipe_id').eq('member_id', viewer.id).in('recipe_id', ids),
        db.from('recipe_reports').select('recipe_id').eq('member_id', viewer.id).eq('status', 'open').in('recipe_id', ids),
      ]) : [{ data: [] }, { data: [] }];
      return json({ member: true, recipes: await shape(data || []), voted: (v || []).map((x) => x.recipe_id), reported: (rp || []).map((x) => x.recipe_id) });
    }

    // Votes on a Guide's swaps and episodes (recipes, brands and cookbooks have their own). Counts are for everyone.
    case 'gvotes': {
      if (!guide) return json({ error: 'guide_required' }, 400);
      const { data, error } = await db.from('ve_guide_votes').select('kind, item_key, member_id').eq('guide_slug', guide).limit(20000);
      if (error) return json({ error: 'votes_failed', message: error.message }, 500);
      const counts: Record<string, Record<string, number>> = { swap: {}, episode: {} }, mine: Record<string, string[]> = { swap: [], episode: [] };
      for (const v of data || []) {
        counts[v.kind][v.item_key] = (counts[v.kind][v.item_key] || 0) + 1;
        if (viewer && v.member_id === viewer.id) mine[v.kind].push(v.item_key);
      }
      return json({ counts, mine, member: isMember() });
    }
    case 'gvote': {
      if (!guide) return json({ error: 'guide_required' }, 400);
      const gate = needMember(); if (gate) return gate;
      const kind = String(body.kind || ''), key = String(body.key || '').slice(0, 120);
      if (!['swap', 'episode'].includes(kind) || !/^[a-z0-9-]{2,120}$/.test(key)) return json({ error: 'bad_request' }, 400);
      const row = { guide_slug: guide, kind, item_key: key, member_id: viewer!.id };
      if (body.on === false) await db.from('ve_guide_votes').delete().match(row);
      else { const { error } = await db.from('ve_guide_votes').insert(row); if (error && error.code !== '23505') return json({ error: 'vote_failed', message: error.message }, 500); }
      const { count } = await db.from('ve_guide_votes').select('member_id', { count: 'exact', head: true }).eq('guide_slug', guide).eq('kind', kind).eq('item_key', key);
      return json({ ok: true, voted: body.on !== false, count: count || 0 });
    }

    // "Made it?" Members' photos of a recipe: photos only, no written reviews (Sean, 2026-10-10). Each one waits for Sean.
    case 'photos': {
      const gate = needMember(); if (gate) return gate;
      if (!isId(body.recipe_id)) return json({ error: 'bad_id' }, 400);
      const { data } = await db.from('recipe_photos').select('id, path, status, member_id, created_at').eq('recipe_id', body.recipe_id)
        .or(`status.eq.live,member_id.eq.${viewer!.id}`).order('created_at', { ascending: false }).limit(60);
      const ids = [...new Set((data || []).map((x) => x.member_id))];
      const names: Record<string, string> = {};
      if (ids.length) { const { data: m } = await db.from('members').select('id, name').in('id', ids); for (const x of m || []) names[x.id] = shortName(x.name); }
      return json({
        photos: (data || []).filter((x) => x.status === 'live').map((x) => ({ url: MEDIA + x.path, name: names[x.member_id] || 'A member' })),
        mine: (data || []).filter((x) => x.member_id === viewer!.id && (x.status === 'pending' || x.status === 'rejected')).map((x) => ({ url: MEDIA + x.path, status: x.status })),
      });
    }
    case 'photo_start': {
      const gate = needMember(); if (gate) return gate;
      if (!isId(body.recipe_id)) return json({ error: 'bad_id' }, 400);
      const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[String(body.type || '')];
      if (!ext) return json({ error: 'type', message: 'Send a JPG, PNG or WebP photo.' }, 400);
      const { data: r } = await db.from('recipes').select('id, status').eq('id', body.recipe_id).maybeSingle();
      if (!r || !['live', 'retesting'].includes(r.status)) return json({ error: 'not_found' }, 404);
      if (await countSince('recipe_photos', 'member_id', viewer!.id) >= LIMITS.photo) return json({ error: 'rate_limited', message: 'That is a lot of photos for one day. Send the rest tomorrow.' }, 429);
      const path = `media/guides/dairy/made/${r.id}/${crypto.randomUUID()}.${ext}`;
      const { data: up, error } = await db.storage.from('vegan-media').createSignedUploadUrl(path);
      if (error || !up) return json({ error: 'upload_failed', message: error?.message }, 500);
      const { data: row, error: e2 } = await db.from('recipe_photos').insert({ recipe_id: r.id, member_id: viewer!.id, path }).select('id').single();
      if (e2) return json({ error: 'upload_failed', message: e2.message }, 500);
      return json({ photo_id: row.id, upload_url: up.signedUrl });
    }
    case 'photo_done': {
      if (!viewer) return json({ error: 'not_authenticated' }, 401);
      if (!isId(body.photo_id)) return json({ error: 'bad_id' }, 400);
      const { data: ph } = await db.from('recipe_photos').select('id, path, status, recipe_id, member_id').eq('id', body.photo_id).maybeSingle();
      if (!ph || ph.member_id !== viewer.id) return json({ error: 'not_found' }, 404);
      if (ph.status !== 'uploading') return json({ ok: true, status: ph.status });
      const head = await fetch(MEDIA + ph.path, { method: 'HEAD' });
      if (!head.ok) return json({ error: 'not_uploaded', message: 'The photo did not arrive. Try again.' }, 400);
      if (Number(head.headers.get('content-length') || 0) > 15 * 1024 * 1024) return json({ error: 'too_big', message: 'That photo is over 15 MB. Send a smaller one.' }, 400);
      await db.from('recipe_photos').update({ status: 'pending' }).eq('id', ph.id);
      const { data: r } = await db.from('recipes').select('title').eq('id', ph.recipe_id).single();
      await sendEmail([SEAN_EMAIL], `[Cookbook] New photo waiting: ${r?.title || 'a recipe'}`,
        p(`${esc(viewer.name || 'A member')} shared a photo of <b>${esc(r?.title || 'a recipe')}</b> they made.`) +
        p(`<img src="${MEDIA + ph.path}" alt="" style="max-width:320px;border-radius:8px">`) +
        p(`<a href="${SITE}/admin/depot/cookbook#photos">Approve it in Depot &gt; Cookbook</a>.`));
      return json({ ok: true, status: 'pending' });
    }
    case 'photo_queue': {
      if (!viewer?.admin) return json({ error: 'forbidden' }, 403);
      const { data } = await db.from('recipe_photos').select('id, path, status, recipe_id, member_id, created_at').in('status', ['pending', 'live', 'rejected']).order('created_at', { ascending: false }).limit(300);
      const rids = [...new Set((data || []).map((x) => x.recipe_id))], mids = [...new Set((data || []).map((x) => x.member_id))];
      const titles: Record<string, string> = {}, who: Record<string, string> = {};
      if (rids.length) { const { data: rr } = await db.from('recipes').select('id, title, slug').in('id', rids); for (const x of rr || []) titles[x.id] = x.title; }
      if (mids.length) { const { data: mm } = await db.from('members').select('id, name, email').in('id', mids); for (const x of mm || []) who[x.id] = `${x.name || ''} (${x.email || ''})`; }
      return json({ photos: (data || []).map((x) => ({ id: x.id, url: MEDIA + x.path, status: x.status, recipe: titles[x.recipe_id] || '', member: who[x.member_id] || '', created_at: x.created_at })) });
    }
    case 'photo_review': {
      if (!viewer?.admin) return json({ error: 'forbidden' }, 403);
      if (!isId(body.photo_id) || !['approve', 'reject'].includes(body.op)) return json({ error: 'bad_request' }, 400);
      const { error } = await db.from('recipe_photos').update({ status: body.op === 'approve' ? 'live' : 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: viewer.id })
        .eq('id', body.photo_id).in('status', ['pending', 'live', 'rejected']);
      if (error) return json({ error: 'review_failed', message: error.message }, 500);
      return json({ ok: true, status: body.op === 'approve' ? 'live' : 'rejected' });
    }

    case 'submit': {
      const gate = needMember(); if (gate) return gate;
      const title = tidy(body.title, 80), ingredients = lines(body.ingredients, 40, 160), steps = lines(body.steps, 30, 600);
      if (title.length < 3) return json({ error: 'title', message: 'Give your recipe a name.' }, 400);
      if (ingredients.length < 2) return json({ error: 'ingredients', message: 'List at least two ingredients, one per line.' }, 400);
      if (!steps.length) return json({ error: 'steps', message: 'Add the steps, one per line.' }, 400);
      if (await countSince('recipes', 'author_member_id', viewer!.id) >= LIMITS.submit) return json({ error: 'rate_limited', message: 'That is a lot of recipes for one day. Send the rest tomorrow.' }, 429);
      const row = {
        title, slug: slugify(title) + '-' + crypto.randomUUID().slice(0, 6), summary: tidy(body.summary, 240) || null,
        time_text: tidy(body.time_text, 40) || null, servings: tidy(body.servings, 40) || null, tip: tidy(body.tip, 300) || null,
        ingredients, instructions: steps, status: 'pending', author_kind: 'member', author_member_id: viewer!.id,
        guide_tags: guide ? [guide] : [], source_type: 'member', source_name: shortName(viewer!.name), is_vegan: true, submitted_at: new Date().toISOString(),
      };
      const { data, error } = await db.from('recipes').insert(row).select('id, slug').single();
      if (error) return json({ error: 'submit_failed', message: error.message }, 500);
      await sendEmail([SEAN_EMAIL], `[Cookbook] New recipe waiting: ${title}`,
        p(`${esc(viewer!.name || 'A member')} (${esc(viewer!.email || '')}) sent a recipe to the Cookbook${guide ? ' from ' + esc(GUIDES[guide]) : ''}.`) +
        p(`<b>${esc(title)}</b><br>${ingredients.length} ingredients, ${steps.length} steps.`) +
        p(`<a href="${SITE}/admin/depot/cookbook#recipe/${data.id}">Review it in Depot &gt; Cookbook</a>. Approving puts it in the Cookbook and pays them 50 points.`));
      return json({ ok: true, id: data.id, slug: data.slug });
    }

    case 'vote': {
      const gate = needMember(); if (gate) return gate;
      if (!isId(body.recipe_id)) return json({ error: 'bad_id' }, 400);
      const { data: r } = await db.from('recipes').select('id, status, author_member_id').eq('id', body.recipe_id).maybeSingle();
      if (!r || !['live', 'retesting'].includes(r.status)) return json({ error: 'not_found' }, 404);
      if (r.author_member_id === viewer!.id) return json({ error: 'own_recipe', message: 'You cannot vote for your own recipe.' }, 400);
      if (body.on === false) await db.from('recipe_votes').delete().eq('recipe_id', r.id).eq('member_id', viewer!.id);
      else {
        const { error } = await db.from('recipe_votes').insert({ recipe_id: r.id, member_id: viewer!.id });
        if (error && error.code !== '23505') return json({ error: 'vote_failed', message: error.message }, 500);
      }
      const { data: after } = await db.from('recipes').select('vote_count').eq('id', r.id).single();
      return json({ ok: true, voted: body.on !== false, vote_count: after?.vote_count || 0 });
    }

    case 'report': {
      const gate = needMember(); if (gate) return gate;
      if (!isId(body.recipe_id)) return json({ error: 'bad_id' }, 400);
      const { data: r } = await db.from('recipes').select('id, title, status, author_member_id').eq('id', body.recipe_id).maybeSingle();
      if (!r || !['live', 'retesting'].includes(r.status)) return json({ error: 'not_found' }, 404);
      if (r.author_member_id === viewer!.id) return json({ error: 'own_recipe', message: 'This is your recipe. Send us a note instead.' }, 400);
      if (await countSince('recipe_reports', 'member_id', viewer!.id) >= LIMITS.report) return json({ error: 'rate_limited', message: 'You have sent a lot of these today. The team is on it.' }, 429);
      const note = tidy(body.note, 600) || null;
      const { error } = await db.from('recipe_reports').insert({ recipe_id: r.id, member_id: viewer!.id, note });
      if (error) {
        if (error.code === '23505') return json({ ok: true, already: true, status: r.status, message: 'You already told us. Thank you.' });
        return json({ error: 'report_failed', message: error.message }, 500);
      }
      const { data: after } = await db.from('recipes').select('status, report_count').eq('id', r.id).single();
      if (after?.status === 'retesting' && r.status === 'live') {
        await sendEmail([SEAN_EMAIL], `[Cookbook] Being retested: ${r.title}`,
          p(`${after.report_count} members said <b>${esc(r.title)}</b> didn't work for them, so it now shows as Being retested.`) +
          p(`<a href="${SITE}/admin/depot/cookbook#recipe/${r.id}">See their notes in Depot &gt; Cookbook</a>. Put it back once it is retested, or take it down.`));
      }
      return json({ ok: true, status: after?.status || r.status });
    }

    case 'mine': {
      const gate = needMember(); if (gate) return gate;
      const { data, error } = await db.from('recipes').select(FIELDS).eq('author_member_id', viewer!.id).order('submitted_at', { ascending: false }).limit(100);
      if (error) return json({ error: 'list_failed', message: error.message }, 500);
      return json({ recipes: await shape(data || []) });
    }

    case 'queue': {
      if (!viewer?.admin) return json({ error: 'forbidden' }, 403);
      const { data, error } = await db.from('recipes').select(FIELDS).in('status', ['pending', 'retesting', 'live', 'rejected', 'retired']).order('submitted_at', { ascending: false, nullsFirst: false }).limit(500);
      if (error) return json({ error: 'queue_failed', message: error.message }, 500);
      const rows = await shape(data || []);
      const watch = rows.filter((r) => r.status === 'retesting' || r.reports > 0).map((r) => r.id);
      const notes: Record<string, unknown[]> = {};
      if (watch.length) {
        const { data: rp } = await db.from('recipe_reports').select('recipe_id, note, created_at').in('recipe_id', watch).eq('status', 'open').order('created_at', { ascending: false });
        for (const x of rp || []) (notes[x.recipe_id] = notes[x.recipe_id] || []).push({ note: x.note, at: x.created_at });
      }
      // The submitter's email is for the Depot only.
      const authors = [...new Set((data || []).map((r) => r.author_member_id).filter(Boolean))];
      const emails: Record<string, string> = {};
      if (authors.length) { const { data: m } = await db.from('members').select('id, email').in('id', authors); for (const x of m || []) emails[x.id] = x.email; }
      const byId: Record<string, string> = {}; for (const r of data || []) if (r.author_member_id) byId[r.id] = emails[r.author_member_id] || '';
      return json({ recipes: rows.map((r) => ({ ...r, notes: notes[r.id] || [], author_email: byId[r.id] || null })) });
    }

    case 'review': {
      if (!viewer?.admin) return json({ error: 'forbidden' }, 403);
      if (!isId(body.recipe_id) || !['approve', 'reject', 'restore', 'retire'].includes(body.op)) return json({ error: 'bad_request' }, 400);
      const note = tidy(body.note, 600) || null;
      if (body.op === 'reject' && !note) return json({ error: 'note', message: 'Say why, so they can fix it and send it again.' }, 400);
      const { data: res, error } = await db.rpc('ve_recipe_review', { p_recipe: body.recipe_id, p_op: body.op, p_reviewer: viewer.id, p_note: note });
      if (error) return json({ error: 'review_failed', message: error.message }, 500);
      if (res?.error) return json(res, 409);
      // Tell the member when their recipe goes in, or why it did not.
      const { data: r } = await db.from('recipes').select('title, author_member_id, guide_tags').eq('id', body.recipe_id).single();
      if (r?.author_member_id && (body.op === 'approve' || body.op === 'reject')) {
        const { data: m } = await db.from('members').select('name, email').eq('id', r.author_member_id).maybeSingle();
        const where = (r.guide_tags || []).includes('vegan-dairy-guide') ? `${SITE}/guides/vegan-dairy-guide#/cookbook` : SITE;
        if (m?.email) await sendEmail([m.email], body.op === 'approve' ? `Your recipe is in the Cookbook: ${r.title}` : `About your recipe: ${r.title}`,
          body.op === 'approve'
            ? p(`Hi ${esc(shortName(m.name).split(' ')[0])}, <b>${esc(r.title)}</b> is now in the Vegans Explore Cookbook${res.points_paid ? ', and 50 points are in your account' : ''}. Thank you for sharing it.`) + p(`<a href="${where}">See it in the Cookbook</a>`)
            : p(`Hi ${esc(shortName(m.name).split(' ')[0])}, thank you for sending <b>${esc(r.title)}</b>. It is not in the Cookbook yet:`) + p(esc(note || '')) + p(`Make the change and send it again from the Cookbook. <a href="${where}">Open the Cookbook</a>`));
      }
      return json({ ok: true, ...res });
    }
  }
  return json({ error: 'unknown_action' }, 400);
});
