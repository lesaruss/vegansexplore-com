// Vercel Serverless Function: /api/go (vegansexplore.com/go/<code>, rewritten in vercel.json)
// Tracked links (Sean, 2026-10-04): every link we send for a campaign is a /go/ link made in
// Depot > Links, carrying the campaign and tags. This logs the click through the ve-links edge
// function (which records interest when it knows who clicked, and ignores link previews and
// scanners) and redirects. If anything fails, the visitor still lands somewhere useful.

const FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-links';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
const HOME = 'https://vegansexplore.com/';

module.exports = async (req, res) => {
  const code = String((req.query && req.query.code) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48);
  let destination = HOME;
  if (code) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
        body: JSON.stringify({ action: 'click', code, ua: String(req.headers['user-agent'] || ''), referrer: String(req.headers.referer || ''), method: req.method }),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      const d = await r.json();
      if (d && typeof d.destination === 'string' && /^https?:\/\//.test(d.destination)) destination = d.destination;
    } catch (e) { /* the visitor still goes somewhere */ }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.statusCode = 302;
  res.setHeader('Location', destination);
  res.end();
};
