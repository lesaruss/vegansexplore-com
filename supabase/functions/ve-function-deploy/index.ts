// ve-function-deploy (2026-10-06, Logan): deploys a Vegans Explore edge function straight from a
// commit in the public lesaruss/vegansexplore-com repo, so a large function (ve-auth is 100 KB) never
// has to be pasted by hand into a deploy call. Admin-token gated like url-probe. Only this repo, only
// supabase/functions/<slug>/index.ts, only a full 40-character commit sha, and the function keeps
// its current verify_jwt setting. Returns the sha256 of what it deployed so the caller can compare it
// with the repo file.
//
// POST { slug: "ve-auth", sha: "<40-char commit>" }  Authorization: Bearer <LESARUSS_ADMIN_TOKEN>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const REPO = 'lesaruss/vegansexplore-com';
const PROJECT_REF = 'fwbhwfxpncrsfhttimna';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: rows } = await supabase.from('lesaruss_secrets').select('key, value').in('key', ['LESARUSS_ADMIN_TOKEN', 'SUPABASE_PAT']);
  const secret = (k: string) => rows?.find((r: { key: string }) => r.key === k)?.value as string | undefined;
  const adminToken = secret('LESARUSS_ADMIN_TOKEN');
  const pat = secret('SUPABASE_PAT');

  const provided = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!adminToken || provided !== adminToken) return json({ error: 'Unauthorized' }, 401);
  if (!pat) return json({ error: 'SUPABASE_PAT missing' }, 500);

  let body: { slug?: string; sha?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const slug = String(body.slug ?? '');
  const sha = String(body.sha ?? '');
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(slug)) return json({ error: 'Invalid slug' }, 400);
  if (!/^[0-9a-f]{40}$/.test(sha)) return json({ error: 'sha must be a full 40-character commit' }, 400);

  const rawUrl = `https://raw.githubusercontent.com/${REPO}/${sha}/supabase/functions/${slug}/index.ts`;
  const rawRes = await fetch(rawUrl);
  if (!rawRes.ok) return json({ error: 'Source not found at that commit', status: rawRes.status, url: rawUrl }, 404);
  const source = await rawRes.text();
  if (source.length < 50) return json({ error: 'Source looks empty', length: source.length }, 400);

  const api = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`;
  const authH = { Authorization: `Bearer ${pat}` };

  const current = await fetch(`${api}/${slug}`, { headers: authH });
  const currentData = current.ok ? await current.json() : null;
  const verifyJwt = currentData ? Boolean(currentData.verify_jwt) : true;

  const form = new FormData();
  form.append('metadata', JSON.stringify({ name: slug, entrypoint_path: 'index.ts', verify_jwt: verifyJwt }));
  form.append('file', new Blob([source], { type: 'application/typescript' }), 'index.ts');

  const deployRes = await fetch(`${api}/deploy?slug=${encodeURIComponent(slug)}`, { method: 'POST', headers: authH, body: form });
  const deployText = await deployRes.text();
  let deployData: unknown = deployText;
  try { deployData = JSON.parse(deployText); } catch { /* keep text */ }

  return json({
    ok: deployRes.ok,
    status: deployRes.status,
    slug,
    sha,
    verify_jwt: verifyJwt,
    existed: Boolean(currentData),
    source_length: source.length,
    source_sha256: await sha256Hex(source),
    result: deployData,
  }, deployRes.ok ? 200 : 502);
});
