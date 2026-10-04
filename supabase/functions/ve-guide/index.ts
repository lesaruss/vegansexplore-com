// ve-guide: a member's Guide (Sean, 2026-10-04). The Guide is for registered members. Setting it up
// is a dashboard action item: the Guide gets to know them (the Mission Survey, when they have not done
// it), shows how to use it, and from then on the dock's Guide icon opens the conversation.
//
// POST { action: 'status' }                       Authorization: Bearer <ve_token>
//   -> { guide_slug, setup_at, can_choose, survey: { completed, eligible }, name, home_community }
// POST { action: 'setup', guide_slug?, finished? }  Authorization: Bearer <ve_token>
//   guide_slug: save which Guide (anyone may have Liz, the default; choosing another is Passport).
//   finished:   mark the setup done (members.guide_setup_at), which clears the action item.
//   -> the same as status   |  403 { error: 'passport_required' }   |  400 { error: 'bad_guide' }
//
// The survey itself is still ve-mission-survey; this only reports whether it is done. verify_jwt is
// false: the VE app token is checked here the same way ve-votes and ve-auth check it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const GUIDES = ['liz', 'maya', 'theo', 'nori', 'dani', 'river'];
const DEFAULT_GUIDE = 'liz';

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
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;
    const secret = new TextEncoder().encode(SERVICE_KEY.slice(0, 32).padEnd(32, '0'));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), new TextEncoder().encode(`${header}.${payload}`)))) return null;
    const d = JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    return typeof d.sub === 'string' && d.exp >= Math.floor(Date.now() / 1000) ? d.sub : null;
  } catch { return null; }
}

const FIELDS = 'id, name, home_community, guide_slug, guide_setup_at, ve_tier, membership_tier, membership_status, is_superadmin, mission_survey_completed_at';
// Passport shows up in either column today (the dashboard reads ve_tier, the Guide chat membership_tier).
// Super admins may choose too, so the whole experience can be seen.
const canChoose = (m: any) => m.ve_tier === 'passport' || m.membership_tier === 'passport' || m.is_superadmin === true;

function status(m: any) {
  return {
    guide_slug: GUIDES.includes(m.guide_slug) ? m.guide_slug : DEFAULT_GUIDE,
    setup_at: m.guide_setup_at,
    can_choose: canChoose(m),
    survey: {
      completed: !!m.mission_survey_completed_at,
      // ve-mission-survey takes answers from active members who are not guests.
      eligible: m.membership_status === 'active' && m.membership_tier !== 'guest',
    },
    name: m.name,
    home_community: m.home_community,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const memberId = token ? await verifyToken(token) : null;
  if (!memberId) return json({ error: 'not_authenticated' }, 401);

  const { data: m, error } = await db.from('members').select(FIELDS).eq('id', memberId).maybeSingle();
  if (error) return json({ error: 'load_failed', message: error.message }, 500);
  if (!m) return json({ error: 'member_not_found' }, 404);

  if (body.action === 'status') return json(status(m));

  if (body.action === 'setup') {
    const patch: Record<string, unknown> = {};
    if (body.guide_slug !== undefined) {
      const slug = String(body.guide_slug || '');
      if (!GUIDES.includes(slug)) return json({ error: 'bad_guide' }, 400);
      if (slug !== DEFAULT_GUIDE && !canChoose(m)) return json({ error: 'passport_required' }, 403);
      patch.guide_slug = slug;
    }
    if (body.finished === true && !m.guide_setup_at) patch.guide_setup_at = new Date().toISOString();
    if (!Object.keys(patch).length) return json(status(m));
    const { data: u, error: upErr } = await db.from('members').update(patch).eq('id', memberId).select(FIELDS).maybeSingle();
    if (upErr) return json({ error: 'save_failed', message: upErr.message }, 500);
    return json(status(u || m));
  }

  return json({ error: 'unknown_action' }, 400);
});
