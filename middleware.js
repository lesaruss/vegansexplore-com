// Vercel Edge Middleware. An event's own page, /events?event=<id>, goes to api/event.js, which writes the event's title,
// share preview, schema.org Event and the event itself into the HTML (Sean, 2026-11-02). A vercel.json rewrite cannot do
// this: the static /events page (events/index.html) is served before rewrites are read. Every other request passes through.
export const config = { matcher: ['/events'] };

export default function middleware(req) {
  const u = new URL(req.url);
  const id = u.searchParams.get('event');
  if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) return;
  return new Response(null, { headers: { 'x-middleware-rewrite': new URL('/api/event?id=' + id.toLowerCase(), u).toString() } });
}
