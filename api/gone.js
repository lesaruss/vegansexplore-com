// Vercel Serverless Function: /api/gone (old addresses, rewritten in vercel.json, and the 404 page's fallback)
// Signal (Sean, 2026-11-06): "let's fix it so that there's no one goes to a broken site, and if they do go to a page that's not
// redirected somewhere, let's redirect them to the Explorer page... they're all going through that intake, and then we can monitor
// that over time." The database function signal_resolve_old(path) decides where an old address goes: a listing or a Pulse article
// when one matches (301), else the Explorer intake, /passport?from=old-link (302). Every visit is a signal_old_hits row (bots flagged),
// which Signal reads. If Supabase is slow or down, the visitor still goes to the Explorer intake.

const SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
const EXPLORER = '/passport?from=old-link';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|curl|wget|python|headless|lighthouse|monitor|scan/i;

module.exports = async (req, res) => {
  let p = String((req.query && req.query.p) || '/');
  if (p.charAt(0) !== '/') p = '/' + p;
  p = p.slice(0, 400);
  const ua = String(req.headers['user-agent'] || '');
  let target = EXPLORER, permanent = false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/signal_resolve_old', {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_path: p, p_referrer: String(req.headers.referer || ''), p_bot: BOT.test(ua) || !ua, p_log: true }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    const d = await r.json();
    if (d && typeof d.target === 'string' && /^\/(?!\/)/.test(d.target)) { target = d.target; permanent = !!d.permanent; }
  } catch (e) { /* the visitor still goes to the Explorer intake */ }
  // The old address rides along (&was=), so Google Analytics also shows which old link sent them.
  if (target === EXPLORER) target += '&was=' + encodeURIComponent(p.replace(/\/+$/, '').slice(0, 120));
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = permanent ? 301 : 302;
  res.setHeader('Location', target);
  res.end();
};
