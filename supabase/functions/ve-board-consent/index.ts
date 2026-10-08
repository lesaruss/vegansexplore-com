import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ve-board-consent: the directors' written consent for Vegans Explore Inc.
// (to be renamed LESARUSS Foundation, Inc.), Sean 2026-10-08.
//
// Each director has a personal link /board-consent?k=<token>. Only the sha256 of the
// token is stored (foundation_board_consents.token_hash), so the link itself is the key:
// no login. The table has RLS on and no policies; this function uses the service role.
//
// Actions (POST ?action=):
//   view     {k}                              -> {director, full_name, response|null}
//   respond  {k, choice, signed_name?, note?} -> {ok, response}
//            choice: approve | resign | talk. approve and resign need signed_name and
//            agreed=true (the electronic signature). One answer per director: a second
//            answer is refused (already_responded); Sean changes it by hand if asked.
//
// verify_jwt stays OFF: the token in the body is the credential.

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function sha256Hex(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function publicResponse(row: Record<string, unknown>) {
  if (!row.choice) return null;
  return { choice: row.choice, signed_name: row.signed_name, responded_at: row.responded_at };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const action = new URL(req.url).searchParams.get('action');

  try {
    const body = await req.json().catch(() => ({}));
    const k = typeof body.k === 'string' ? body.k.trim() : '';
    if (!/^[0-9a-f]{32}$/.test(k)) return json({ error: 'bad_link' }, 400);

    const { data: row } = await supabase
      .from('foundation_board_consents')
      .select('director, full_name, choice, signed_name, responded_at')
      .eq('token_hash', await sha256Hex(k))
      .maybeSingle();
    if (!row) return json({ error: 'bad_link' }, 404);

    if (action === 'view') {
      return json({ director: row.director, full_name: row.full_name, response: publicResponse(row) });
    }

    if (action === 'respond') {
      if (row.choice) return json({ error: 'already_responded', response: publicResponse(row) }, 409);
      const choice = body.choice;
      if (!['approve', 'resign', 'talk'].includes(choice)) return json({ error: 'bad_choice' }, 400);
      const signed = typeof body.signed_name === 'string' ? body.signed_name.trim().slice(0, 120) : '';
      const needsSign = choice === 'approve' || choice === 'resign';
      if (needsSign && (signed.length < 3 || body.agreed !== true)) return json({ error: 'signature_required' }, 400);
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 1000) : '';

      const { data: saved, error } = await supabase
        .from('foundation_board_consents')
        .update({
          choice,
          signed_name: needsSign ? signed : null,
          note: note || null,
          responded_at: new Date().toISOString(),
          user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
        })
        .eq('director', row.director)
        .is('choice', null)
        .select('director, full_name, choice, signed_name, responded_at')
        .maybeSingle();
      if (error) {
        console.error('respond error:', error);
        return json({ error: 'internal_error' }, 500);
      }
      if (!saved) return json({ error: 'already_responded' }, 409);
      return json({ ok: true, response: publicResponse(saved) });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    console.error('ve-board-consent error:', e);
    return json({ error: 'internal_error' }, 500);
  }
});
