// ve-once-qa-session: mints a session for the standing QA login (vegan@lesaruss.com, view only) so a headless browser can check a page.
// Canon agent-headless-page-verification. Redeploy as the 410 stub after use.
// Deploy as ve-once-qa-session (verify_jwt false), curl it with -o into the scratchpad (never print), build the
// sb-fwbhwfxpncrsfhttimna-auth-token.N cookie (base64- + base64url JSON, 3180-char chunks) for hq.lesaruss.ai,
// sign out after (POST /auth/v1/logout?scope=global), then redeploy the 410 stub.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
const KEY = '<random 48 hex characters, scratchpad only>'
Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: 'vegan@lesaruss.com' })
  if (error) return Response.json({ error: String(error.message) }, { status: 500 })
  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } })
  const v = await anon.auth.verifyOtp({ type: 'magiclink', token_hash: data.properties.hashed_token })
  if (v.error) return Response.json({ error: String(v.error.message) }, { status: 500 })
  return Response.json({ session: v.data.session })
})
