// ve-theme-park-guide: the Magic Kingdom pilot (one-time function, canon ops-supabase-write-once-function and canon-ve-spend-budget).
// Deployed as ve-once-theme-park-pilot with verify_jwt false and a fresh run key kept in the session scratchpad, never in the repo.
// It asks Google Places for the park's centre and for each restaurant by name, biased to the park, and returns where Google puts each one,
// so the pins can be looked at by eye before anything is saved. It saves nothing. Every search is counted against
// ve_google_usage under the approved job and stops at ve_google_once_room (the quote is the ceiling, in code). No Place Details calls.
//   curl -X POST ".../functions/v1/ve-once-theme-park-pilot" -H "x-run-key: <KEY>"
// Then redeploy it as the 410 stub at the bottom.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const KEY = '<run key>';
const JOB = 'once:theme-park-magic-kingdom';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Restaurants and counters inside Magic Kingdom Park, by the names the park publishes. Google decides whether each exists and where.
const NAMES = [
  "Cinderella's Royal Table", 'Be Our Guest Restaurant', 'The Crystal Palace', 'Liberty Tree Tavern', "Tony's Town Square Restaurant",
  'The Plaza Restaurant', 'Skipper Canteen', 'Columbia Harbour House', 'Pecos Bill Tall Tale Inn and Cafe', "Casey's Corner",
  "Cosmic Ray's Starlight Cafe", 'Pinocchio Village Haus', "Friar's Nook", 'Sleepy Hollow', 'Tortuga Tavern', 'Aloha Isle',
  "Gaston's Tavern", 'Main Street Bakery', 'Plaza Ice Cream Parlor', 'Sunshine Tree Terrace', 'Storybook Treats', 'Cheshire Cafe',
  'Golden Oak Outpost', "Auntie Gravity's Galactic Goodies",
];

function metres(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * r, dLng = (b.longitude - a.longitude) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * r) * Math.cos(b.latitude * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 });
  const { data: k } = await db.from('lesaruss_secrets').select('value').eq('key', 'GOOGLE_PLACES_API_KEY').maybeSingle();
  const key = k?.value as string | undefined;
  if (!key || key === 'pending') return Response.json({ error: 'no_key' }, { status: 500 });

  const used: string[] = [];
  async function search(textQuery: string, bias?: { latitude: number; longitude: number }) {
    const { data: room } = await db.rpc('ve_google_once_room', { p_job: JOB, p_kind: 'search' });
    if (Number(room ?? 0) < 1) return { stopped: 'ceiling' as const };
    await db.rpc('ve_google_count', { p_kind: 'search', p_job: JOB, p_n: 1 });
    used.push(textQuery);
    const body: Record<string, unknown> = { textQuery, maxResultCount: 1 };
    if (bias) body.locationBias = { circle: { center: bias, radius: 1200 } };
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key!,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.businessStatus' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    return { status: r.status, place: (d.places || [])[0] || null, error: d.error?.message };
  }

  const park = await search('Magic Kingdom Park, Lake Buena Vista, FL');
  const centre = (park as any).place?.location;
  if (!centre) return Response.json({ error: 'no_park_centre', park }, { status: 502 });

  const rows: any[] = [];
  let stopped = false;
  for (const name of NAMES) {
    const r: any = await search(`${name} Magic Kingdom Walt Disney World`, centre);
    if (r.stopped) { stopped = true; break; }
    const p = r.place;
    rows.push({
      asked: name, status: r.status, error: r.error, found: p?.displayName?.text ?? null, google_id: p?.id ?? null,
      address: p?.formattedAddress ?? null, lat: p?.location?.latitude ?? null, lng: p?.location?.longitude ?? null,
      type: p?.primaryType ?? null, business_status: p?.businessStatus ?? null,
      from_centre_m: p?.location ? Math.round(metres(centre, p.location)) : null,
    });
  }

  // Pin quality: a pin within 25 m of the park's centre, or within 10 m of another restaurant's pin, is probably Google snapping to the
  // park rather than placing the restaurant. A pin more than 1,200 m from the centre is not in the park.
  for (const a of rows) {
    a.flags = [];
    if (a.lat == null) { a.flags.push('not_found'); continue; }
    if (a.from_centre_m < 25) a.flags.push('at_park_centre');
    if (a.from_centre_m > 1200) a.flags.push('outside_park');
    for (const b of rows) if (b !== a && b.lat != null && metres({ latitude: a.lat, longitude: a.lng }, { latitude: b.lat, longitude: b.lng }) < 10) { a.flags.push('same_spot_as:' + b.asked); }
  }
  const ok = rows.filter((r) => r.lat != null && !r.flags.length).length;
  return Response.json({
    job: JOB, searches_used: used.length, details_used: 0, stopped_at_ceiling: stopped,
    park: { name: (park as any).place?.displayName?.text, address: (park as any).place?.formattedAddress, ...centre },
    summary: { asked: NAMES.length, found: rows.filter((r) => r.lat != null).length, clean_pins: ok },
    rows,
  });
});

// The stub, once the pilot has run:
// Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
