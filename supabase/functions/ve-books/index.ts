// ve-books: books from our podcast transcripts and by our People (Sean, 2026-10-29: "as you're reading the transcripts for the
// podcast, maybe we do a crawl, any books that are mentioned in the podcast, we put on... a background list to be built out and put
// into the page. And any books from any of the people, then we do a crawl for any books written by any of our people. And then those
// get put into our books section"). Migration 20261029_ve_books_crawl.sql has the tables and the crons.
//
// POST { action: 'scan', limit?: 1..6, content_id? }   transcripts -> the books said in them (ve_books found, ve_book_mentions)
// POST { action: 'crawl', limit?: 1..6, listing_id? }  People listings -> the books Open Library lists for them (found)
// POST { action: 'build', limit?: 1..6, book_id? }     found books -> Google Books match (else Open Library), cover, synopsis, listing
// Google Books is read with our Google key (lesaruss_secrets GOOGLE_PLACES_API_KEY); Open Library refuses our server at times.
// POST { action: 'status' }                            counts, for the team
// POST { action: 'probe' }                             whether Google Books and Open Library answer our server
//   These take the cron's x-cron-secret, the LESARUSS_ADMIN_TOKEN or a super admin's VE token; wait: true answers with the results.
// POST { action: 'episode', listing_id, guid } | { action: 'episode', content_id }   public: the episode's referenced books
// POST { action: 'book', listing_id }                  public: the episodes that talked about a Books listing
// POST { action: 'admin_list', status } | 'admin_get', id | 'admin_set', id, to: set_aside|retry|list   Depot > Books
// verify_jwt is false.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(SUPABASE_URL, SERVICE_KEY);
const MODEL = 'claude-opus-5-5';
const TENANT = '00000000-0000-4000-a000-000000000002';
const COVERS = `${SUPABASE_URL}/storage/v1/object/public/vegan-media/media/logos/books/`;
const OL_UA = 'VegansExplore/1.0 (+https://vegansexplore.com/contact)';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BOOK_TYPES = ['cookbook', 'memoir', 'educational', 'health', 'lifestyle', 'children'];

function b64urlDecodeToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
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
const secrets: Record<string, string | null> = {};
async function secret(key: string): Promise<string | null> {
  if (key in secrets) return secrets[key];
  const { data } = await db.from('lesaruss_secrets').select('value').eq('key', key).maybeSingle();
  const v = (data?.value as string) ?? null;
  secrets[key] = v && v !== 'pending' ? v : null;
  return secrets[key];
}
async function allowed(req: Request): Promise<boolean> {
  const cron = req.headers.get('x-cron-secret');
  if (cron) { const cs = await secret('CRON_SECRET'); return !!cs && cron === cs; }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const ops = await secret('LESARUSS_ADMIN_TOKEN');
  if (ops && token === ops) return true;
  const id = await verifyToken(token);
  if (!id) return false;
  const { data: m } = await db.from('members').select('is_superadmin').eq('id', id).maybeSingle();
  return !!m?.is_superadmin;
}

// ---- Claude, structured output ----
async function ask(system: string, user: string, schema: unknown, effort: 'low' | 'medium' = 'low', max = 4000): Promise<any> {
  const key = await secret('ANTHROPIC_API_KEY');
  const client = new Anthropic(key ? { apiKey: key } : {});
  const msg: any = await client.beta.messages.create({
    model: MODEL, max_tokens: max, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort, format: { type: 'json_schema', schema } },
    system, messages: [{ role: 'user', content: user }],
  } as any);
  if (msg.stop_reason === 'refusal') throw new Error('refused');
  return JSON.parse((msg.content || []).find((c: any) => c.type === 'text')?.text || '{}');
}

// ---- Open Library, one call at a time with a gap (it refuses a burst) ----
let olLast = 0;
async function ol(path: string): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const wait = olLast + 1500 - Date.now();
    if (wait > 0) await sleep(wait);
    olLast = Date.now();
    try {
      const r = await fetch('https://openlibrary.org' + path, { headers: { 'User-Agent': OL_UA, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch { /* try again */ }
    await sleep(3000 * (attempt + 1));
  }
  throw new Error('Open Library did not answer');
}
const SEARCH_FIELDS = 'key,title,subtitle,author_name,first_publish_year,edition_count,publisher,subject,language';


// ---- Google Books (the API key we hold for Google, which has the Books API) and Open Library, in one shape ----
// A candidate is one book: its editions grouped by title and author's last name.
type Cand = { title: string; subtitle: string; authors: string[]; year: number | null; editions: number; publishers: string[]; subjects: string[];
  isbns: string[]; isbnPub: Record<string, string>; description: string; ol_work?: string; covers: { id: string; isbn: string; publisher: string }[] };
async function gb(q: string, max = 40): Promise<any[]> {
  const key = await secret('GOOGLE_PLACES_API_KEY');
  if (!key) throw new Error('No Google key');
  // Google Books answers 503 now and then; a short wait and it answers.
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${max}&printType=books&langRestrict=en&key=${key}`, { signal: AbortSignal.timeout(15000) });
    if (r.ok) return (await r.json()).items || [];
    const text = (await r.text()).replace(/\s+/g, ' ').slice(0, 160);
    if (attempt < 3 && [429, 500, 502, 503].includes(r.status)) { await sleep(1500 * (attempt + 1)); continue; }
    throw new Error(`Google Books answered ${r.status}: ${text}`);
  }
}
// The first of several searches that finds anything (Google's operators miss some books a plain search finds).
async function gbFirst(qs: string[], max: number): Promise<any[]> {
  for (const q of qs) { const items = await gb(q, max); if (items.length) return items; }
  return [];
}
function groupGB(items: any[]): Cand[] {
  const by = new Map<string, Cand>();
  for (const it of items) {
    const v = it.volumeInfo || {};
    if (!v.title) continue;
    const k = words(String(v.title).split(':')[0]) + '|' + words((v.authors || [])[0] || '').split(' ').pop();
    let g = by.get(k);
    if (!g) { g = { title: v.title, subtitle: v.subtitle || '', authors: v.authors || [], year: null, editions: 0, publishers: [], subjects: [], isbns: [], isbnPub: {}, description: '', covers: [] }; by.set(k, g); }
    g.editions++;
    const y = parseInt(String(v.publishedDate || '').slice(0, 4));
    if (y && (!g.year || y < g.year)) g.year = y;
    if (v.publisher && !g.publishers.includes(v.publisher)) g.publishers.push(v.publisher);
    for (const c of v.categories || []) if (!g.subjects.includes(c)) g.subjects.push(c);
    if ((v.language || 'en') === 'en') for (const id of v.industryIdentifiers || []) {
      if (id.type === 'ISBN_13' && /^978/.test(id.identifier) && !g.isbns.includes(id.identifier)) { g.isbns.push(id.identifier); g.isbnPub[id.identifier] = v.publisher || ''; }
    }
    const d = String(v.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (d.length > g.description.length) g.description = d;
    // An edition Google has a cover picture for (imageLinks), kept for when Amazon has none.
    if (v.imageLinks && it.id && (v.language || 'en') === 'en') g.covers.push({ id: it.id, isbn: ((v.industryIdentifiers || []).find((x: any) => x.type === 'ISBN_13') || {}).identifier || '', publisher: v.publisher || '' });
  }
  return [...by.values()];
}
function fromOL(docs: any[]): Cand[] {
  return docs.map((d: any) => ({ title: d.title, subtitle: d.subtitle || '', authors: d.author_name || [], year: d.first_publish_year || null, editions: d.edition_count || 0,
    publishers: (d.publisher || []).slice(0, 5), subjects: (d.subject || []).slice(0, 12), isbns: [], isbnPub: {}, description: '', covers: [], ol_work: String(d.key).replace('/works/', '') }));
}
const quoteQ = (s: string) => '"' + String(s).replace(/"/g, '').trim() + '"';
const lastName = (s: string) => String(s || '').replace(/,.*$/, '').replace(/\s+(MD|PhD|RD|DO|Jr\.?|Sr\.?)$/i, '').trim().split(/\s+/).pop() || '';
// The books under one title (and author).
async function findTitle(title: string, author: string | null): Promise<{ cands: Cand[]; via: string; why?: string }> {
  let why = '';
  try {
    const qs = [`intitle:${quoteQ(title)}${author ? ' inauthor:' + quoteQ(lastName(author)) : ''}`, ...(author ? [`${quoteQ(title)} ${lastName(author)}`] : []), `intitle:${quoteQ(title)}`, quoteQ(title)];
    return { cands: groupGB(await gbFirst(qs, 30)).slice(0, 8), via: 'google' };
  } catch (e) { why = String((e as Error).message || e); }
  try {
    const q = (withAuthor: boolean) => `/search.json?title=${encodeURIComponent(title)}${withAuthor && author ? '&author=' + encodeURIComponent(author) : ''}&fields=${SEARCH_FIELDS}&limit=8`;
    let docs = (await ol(q(true)))?.docs || [];
    if (!docs.length && author) docs = (await ol(q(false)))?.docs || [];
    return { cands: fromOL(docs), via: 'openlibrary', why };
  } catch (e) { throw new Error(`${why}; Open Library: ${String((e as Error).message || e)}`); }
}
// The books under one author's name.
async function findAuthor(name: string): Promise<{ cands: Cand[]; via: string; why?: string }> {
  let why = '';
  try { return { cands: groupGB(await gbFirst([`inauthor:${quoteQ(name)}`, quoteQ(name)], 40)), via: 'google' }; }
  catch (e) { why = String((e as Error).message || e); }
  try {
    const r = await ol(`/search.json?author=${encodeURIComponent(name)}&fields=${SEARCH_FIELDS}&limit=40&sort=editions`);
    return { cands: fromOL(r?.docs || []), via: 'openlibrary', why };
  } catch (e) { throw new Error(`${why}; Open Library: ${String((e as Error).message || e)}`); }
}
const candView = (c: Cand, i: number) => ({ index: i, title: c.title, subtitle: c.subtitle, authors: c.authors.slice(0, 4), year: c.year, editions: c.editions,
  publishers: c.publishers.slice(0, 3), subjects: c.subjects.slice(0, 8), about: c.description.slice(0, 300) });

const words = (s: string) => String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = (s: string) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90).replace(/-+$/, '');
function isbn10(i13: string): string | null {
  if (!/^978\d{10}$/.test(i13)) return null;
  const b = i13.slice(3, 12);
  let s = 0; for (let k = 0; k < 9; k++) s += (10 - k) * +b[k];
  const c = (11 - (s % 11)) % 11;
  return b + (c === 10 ? 'X' : String(c));
}
const clean = (s: string) => String(s || '').replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/\bvegan(s|ism)?\b/g, (m) => 'V' + m.slice(1)).trim();

async function upsertBook(title: string, author: string | null, source: string, authorListing: string | null): Promise<string | null> {
  const { data, error } = await db.rpc('ve_book_upsert', { p_title: title, p_author: author, p_source: source, p_author_listing: authorListing });
  if (error) throw new Error(error.message);
  return (data as string) || null;
}

// ---- scan: the books said in one transcript ----
const SCAN_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['books'],
  properties: {
    books: {
      type: 'array', items: {
        type: 'object', additionalProperties: false, required: ['title', 'author', 'second', 'speaker', 'quote', 'context'],
        properties: {
          title: { type: 'string', description: 'The book\'s title as published, without the subtitle.' },
          author: { type: 'string', description: 'The author as published, or empty when you are not sure.' },
          second: { type: 'number', description: 'The start second of the line where the book is named.' },
          speaker: { type: 'string', description: 'Who names it, or Host or Guest.' },
          quote: { type: 'string', description: 'Words copied exactly from the transcript around the mention, 15 to 200 characters.' },
          context: { type: 'string', enum: ['their_own', 'recommended', 'discussed', 'mentioned'] },
        },
      },
    },
  },
};
const SCAN_SYSTEM = `You read a podcast transcript from the Vegans Explore network and list the books that are named in it.
- Only books: not films, documentaries, podcasts, websites, studies, articles or magazines. A book must be named clearly enough to find it (its title, or a title and author). Skip a vague "I read a book about this".
- Captions misspell names and titles. Give the title and author as they are really published when you are confident which book it is; leave the author empty when you are not sure. If you cannot tell which real book is meant, leave it out.
- second: the start second of the line where it is named (each line is "seconds|words"). quote: copy 15 to 200 characters exactly from that line or the next ones, including the words that name the book. Change nothing in the quote.
- context: their_own when the speaker or the guest wrote it, recommended when someone tells listeners to read it, discussed when it is talked about at some length, mentioned otherwise.
- One entry per book; use the first time it is named. An episode often has none; then return an empty list.`;

async function scanOne(contentId: string) {
  await db.from('ve_content_transcripts').update({ books_status: 'scanning', books_at: new Date().toISOString() }).eq('content_id', contentId);
  const { data: c } = await db.from('ve_pulse_content').select('id, title, podcast_show, guest_name').eq('id', contentId).maybeSingle();
  const { data: lines } = await db.rpc('ve_content_transcript_lines', { p_content: contentId });
  const text = String(lines || '');
  if (!c || !text) {
    await db.from('ve_content_transcripts').update({ books_status: 'failed', books_note: 'No transcript lines' }).eq('content_id', contentId);
    return { content_id: contentId, ok: false, why: 'no_lines' };
  }
  const segs = text.split('\n').map((l) => { const i = l.indexOf('|'); return { s: +l.slice(0, i), t: l.slice(i + 1) }; }).filter((x) => isFinite(x.s));
  // Long episodes go in parts of about 60,000 characters, on line breaks.
  const parts: string[] = []; let cur = '';
  for (const l of text.split('\n')) { if (cur.length + l.length > 60000 && cur) { parts.push(cur); cur = ''; } cur += l + '\n'; }
  if (cur) parts.push(cur);
  const found: any[] = [];
  for (const part of parts) {
    const out = await ask(SCAN_SYSTEM, `Episode: ${c.title} (${c.podcast_show || 'podcast'}${c.guest_name ? ', guest ' + c.guest_name : ''})\nTranscript lines:\n${part}`, SCAN_SCHEMA, 'medium', 6000);
    for (const b of out.books || []) found.push(b);
  }
  const { data: ep } = await db.rpc('ve_content_feed_episode', { p_content: contentId });
  const feed = Array.isArray(ep) && ep[0] ? ep[0] : null;
  const kept: string[] = [], dropped: string[] = [];
  for (const b of found) {
    const title = String(b.title || '').trim();
    if (!title) continue;
    // The quote has to be in the transcript, within two minutes of the second it was given.
    const near = words(segs.filter((x) => x.s >= (+b.second || 0) - 60 && x.s <= (+b.second || 0) + 120).map((x) => x.t).join(' '));
    const q = words(b.quote);
    if (q.length < 10 || !near.includes(q)) { dropped.push(title); continue; }
    const id = await upsertBook(title, String(b.author || '').trim() || null, 'transcript', null);
    if (!id) continue;
    await db.from('ve_book_mentions').upsert({
      book_id: id, content_id: contentId, show_listing_id: feed?.show_listing_id || null, guid: feed?.guid || null,
      second: +b.second || null, speaker: String(b.speaker || '').slice(0, 80) || null, quote: String(b.quote).slice(0, 300), context: b.context,
    }, { onConflict: 'book_id,content_id', ignoreDuplicates: true });
    kept.push(title);
  }
  const note = (kept.length ? `${kept.length} book${kept.length > 1 ? 's' : ''}: ${kept.join('; ')}` : 'No books named') + (dropped.length ? `. Quote not found for: ${dropped.join('; ')}` : '') + (feed ? '' : '. No feed episode matched');
  await db.from('ve_content_transcripts').update({ books_status: 'scanned', books_at: new Date().toISOString(), books_note: note.slice(0, 500) }).eq('content_id', contentId);
  return { content_id: contentId, ok: true, kept, dropped, guid: feed?.guid || null };
}

// ---- crawl: the books one of our People wrote ----
const CRAWL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['books', 'note'],
  properties: {
    books: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['index', 'title'], properties: {
      index: { type: 'integer' }, title: { type: 'string', description: 'The title as published, without the subtitle.' } } } },
    note: { type: 'string', description: 'One short sentence for the team.' },
  },
};
const CRAWL_SYSTEM = `You are given one person from the Vegans Explore People directory (their name and what they do) and Open Library's search results for books under that author name.
Return the books this person wrote or co-wrote. Leave out:
- books by someone else with the same or a similar name (judge by the subjects, the years and what the person does),
- the same book listed twice (another edition, a translation, a large print or audio edition): keep one, the original English title,
- study guides, summaries or workbooks about their books by others, journal articles, and titles that are not real books.
If none are theirs, return an empty list. index is the result's number in the list.`;

const PEN_SCHEMA = { type: 'object', additionalProperties: false, required: ['names'], properties: { names: { type: 'array', items: { type: 'string' } } } };
const PEN_SYSTEM = `Given a person from the Vegans Explore People directory, list up to two other full names they publish books under (for example a stage name's real name: Earthling Ed publishes as Ed Winters). Use their profile and what you know. Return an empty list when there is no other name or you are not sure.`;

async function crawlOne(listingId: string) {
  const { data: p } = await db.from('listings').select('id, slug, name, category, description, details').eq('id', listingId).maybeSingle();
  if (!p) return { listing_id: listingId, ok: false };
  const name = String(p.name).replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(Dr\.?|Chef)\s+/i, '').trim();
  const names = [name, ...((p.details?.person?.aka || []) as string[])].filter((n) => /\S\s+\S/.test(n)).slice(0, 2);
  const cands: Cand[] = []; let via = '';
  for (const n of names) {
    const r = await findAuthor(n); via = r.via;
    for (const c of r.cands) if (!cands.some((x) => words(x.title) === words(c.title))) cands.push(c);
  }
  let found = 0, note = `No books under this name (${via})`;
  // Someone known by another name (Earthling Ed writes as Ed Winters): Claude names what they publish under, from their profile.
  const run = async () => {
    const list = cands.slice(0, 60).map(candView);
    return await ask(CRAWL_SYSTEM, JSON.stringify({ person: { name: p.name, also_known_as: p.details?.person?.aka || [], does: p.details?.person?.title || p.category, about: String(p.description || '').slice(0, 800) }, results: list }), CRAWL_SCHEMA, 'medium');
  };
  let out: any = cands.length ? await run() : { books: [] };
  const penNames: string[] = [];
  if (!(out.books || []).length) {
    const alt = await ask(PEN_SYSTEM, JSON.stringify({ name: p.name, also_known_as: p.details?.person?.aka || [], does: p.details?.person?.title || p.category, about: String(p.description || '').slice(0, 800) }), PEN_SCHEMA);
    const more = ((alt.names || []) as string[]).map((n) => String(n).trim()).filter((n) => /\S\s+\S/.test(n) && !names.some((x) => words(x) === words(n))).slice(0, 2);
    for (const n of more) {
      penNames.push(n);
      const r = await findAuthor(n); via = r.via;
      for (const c of r.cands) if (!cands.some((x) => words(x.title) === words(c.title))) cands.push(c);
    }
    if (more.length && cands.length) out = await run();
  }
  if (cands.length) {
    const titles: string[] = [];
    for (const b of out.books || []) {
      const c = cands[b.index]; if (!c) continue;
      // The name on the cover, the one of its authors that is this person (Ed Winters, not Earthling Ed).
      const tried = [...names, ...penNames].map((n) => words(lastName(n)));
      const who = c.authors.find((a) => tried.includes(words(lastName(a)))) || c.authors[0] || name;
      const id = await upsertBook(String(b.title || c.title).trim(), who, 'author_crawl', p.id);
      if (!id) continue;
      found++; titles.push(b.title || c.title);
      if (c.ol_work) await db.from('ve_books').update({ ol_work: c.ol_work }).eq('id', id).is('ol_work', null);
      // A book already in the Directory joins their page now.
      const { data: row } = await db.from('ve_books').select('status, listing_id').eq('id', id).maybeSingle();
      if (row?.status === 'built' && row.listing_id) {
        const { data: bl } = await db.from('listings').select('id, details').eq('id', row.listing_id).maybeSingle();
        if (bl) await joinFamily(bl.id, bl.details, p);
      }
    }
    note = found ? `${found} (${via}): ${titles.join('; ')}` : `${String(out.note || 'None of the results were theirs')} (${via})`;
  }
  await db.from('ve_book_author_checks').upsert({ listing_id: p.id, checked_at: new Date().toISOString(), found, note: note.slice(0, 500) });
  return { listing_id: p.id, name: p.name, ok: true, found, note };
}

// ---- build: match, cover, synopsis, listing ----
const PICK_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['match', 'vegan_related', 'book_type', 'note'],
  properties: {
    match: { type: 'integer', description: 'The number of the result that is this book, or -1 when none is.' },
    vegan_related: { type: 'boolean', description: 'True when the book is about Vegan or plant-based living, food or health, animals, animal rights or the effect of food on the planet.' },
    book_type: { type: 'string', enum: BOOK_TYPES },
    note: { type: 'string' },
  },
};
const PICK_SYSTEM = `You match a book to Open Library's search results. The book came from a podcast transcript (captions can misspell it) or from an author's list.
Pick the result that is this exact book (same title and author; a subtitle may differ), or -1 when none is. Then say whether it is about Vegan or plant-based living, food or health, animals, animal rights or food and the planet, and which kind it is: cookbook, memoir (biography and memoir), educational (animals, ethics, the food system, science), health (health and nutrition), lifestyle, or children (a children's book).`;
const WRITE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['description', 'summary', 'note'],
  properties: {
    description: { type: 'string', description: 'One sentence, 80 to 200 characters, for the book\'s card.' },
    summary: { type: 'string', description: 'The synopsis: one to three short paragraphs separated by a blank line, 250 to 900 characters in all.' },
    note: { type: 'string', description: 'Where the facts came from (say the publisher\'s description, the subjects or the podcast), one short sentence for the team.' },
  },
};
const WRITE_SYSTEM = `You write the card line and the synopsis for a book's page in the Vegans Explore Directory.
- Use only what the sources say: the publisher's description (from Google Books or Open Library), the subtitle, the subjects, and what was said about it on our podcasts. Never invent a claim, an award, a bestseller list, a number or a quote.
- When the sources say little, keep it short and plain: what the book is and who wrote it.
- Third person, present tense, warm and plain, no hype words (best, amazing, must read). Name the author once.
- Spell Vegan with a capital V. No dashes of any kind (no em or en dash, no hyphen used as a dash); use commas or periods.`;

async function amazonCover(i10: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(`https://m.media-amazon.com/images/P/${i10}.01._SCLZZZZZZZ_.jpg`, { signal: AbortSignal.timeout(12000) });
    const buf = new Uint8Array(await r.arrayBuffer());
    return r.ok && /jpeg/.test(r.headers.get('content-type') || '') && buf.length > 6000 ? buf : null;
  } catch { return null; }
}

async function buildOne(bookId: string) {
  const { data: b } = await db.from('ve_books').select('*').eq('id', bookId).maybeSingle();
  if (!b) return { book_id: bookId, ok: false };
  await db.from('ve_books').update({ status: 'building', marked_at: new Date().toISOString(), tries: (b.tries || 0) + 1 }).eq('id', bookId);
  const fail = async (status: string, note: string) => {
    await db.from('ve_books').update({ status, note: note.slice(0, 500), updated_at: new Date().toISOString() }).eq('id', bookId);
    return { book_id: bookId, title: b.title, ok: false, status, note };
  };
  const { data: author } = b.author_listing_id
    ? await db.from('listings').select('id, slug, name, description, details').eq('id', b.author_listing_id).maybeSingle() : { data: null as any };
  const { data: ments } = await db.from('ve_book_mentions').select('speaker, quote, context').eq('book_id', bookId).limit(5);

  // Already a Directory listing under this title (and author)? Then it is that one.
  const { data: same } = await db.from('listings').select('id, slug, name, details').eq('category', 'Books').eq('status', 'approved').ilike('name', `${b.title.replace(/[%_]/g, '')}%`).limit(5);
  const twin = (same || []).find((l: any) => !b.author_key || words(l.name).includes(b.author_key) || words(l.details?.creator || '').includes(b.author_key));
  if (twin) {
    await joinFamily(twin.id, twin.details, author);
    await db.from('ve_books').update({ status: 'built', listing_id: twin.id, note: 'Already in the Directory', updated_at: new Date().toISOString() }).eq('id', bookId);
    return { book_id: bookId, title: b.title, ok: true, status: 'built', listing: twin.slug, existing: true };
  }

  // Google Books (else Open Library): the title and author, else the title alone.
  const found = await findTitle(b.title, b.author);
  const cands = found.cands;
  if (!cands.length) return fail('not_found', `No book by that title (${found.via})`);
  const pick = await ask(PICK_SYSTEM, JSON.stringify({ book: { title: b.title, author: b.author, said_on_our_podcasts: ments || [], author_profile: author ? { name: author.name, about: String(author.description || '').slice(0, 500) } : null }, results: cands.map(candView) }), PICK_SCHEMA);
  const d = cands[pick.match];
  if (!d || pick.match < 0) return fail('not_found', `No match (${found.via}): ` + String(pick.note || '').slice(0, 300));

  // Open Library's editions when that is where it came from.
  if (!d.isbns.length && d.ol_work) {
    const eds = (await ol(`/works/${d.ol_work}/editions.json?limit=60`))?.entries || [];
    for (const e of eds) {
      if (e.languages && !e.languages.some((l: any) => l.key === '/languages/eng')) continue;
      for (const x of e.isbn_13 || []) if (/^978/.test(x) && !d.isbns.includes(x)) { d.isbns.push(x); d.isbnPub[x] = (e.publishers || [])[0] || ''; }
    }
    const wk = await ol(`/works/${d.ol_work}.json`);
    d.description = typeof wk?.description === 'string' ? wk.description : wk?.description?.value || '';
  }
  // An English edition whose cover Amazon has; else Google's own cover picture of an English edition.
  let cover: Uint8Array | null = null, i13 = '', i10 = '', publisher = '', coverFrom = '';
  for (const x of d.isbns.slice(0, 10)) {
    const t = isbn10(x); if (!t) continue;
    const img = await amazonCover(t);
    if (img) { cover = img; i13 = x; i10 = t; publisher = d.isbnPub[x] || d.publishers[0] || ''; coverFrom = `Amazon cover for ISBN ${x}`; break; }
  }
  if (!cover) for (const c of (d.covers || []).slice(0, 4)) {
    const img = await googleCover(c.id);
    if (img) { cover = img; i13 = /^97[89]\d{10}$/.test(c.isbn) ? c.isbn : (d.isbns[0] || ''); i10 = isbn10(i13) || ''; publisher = c.publisher || d.publishers[0] || ''; coverFrom = `Google Books cover, volume ${c.id}`; break; }
  }
  if (!cover) return fail('not_found', `No English edition with a cover on Amazon or Google Books (${found.via})`);
  // The same edition already listed under another author line (The China Study, 2026-10-29): that listing, never a second one.
  if (i13) {
    const { data: dup } = await db.from('listings').select('id, slug, details').eq('category', 'Books').eq('status', 'approved').eq('details->>isbn', i13).limit(1).maybeSingle();
    if (dup) {
      await joinFamily(dup.id, dup.details, author);
      await db.from('ve_books').update({ status: 'built', listing_id: dup.id, isbn13: i13, note: 'Already in the Directory (same ISBN)', updated_at: new Date().toISOString() }).eq('id', bookId);
      return { book_id: bookId, title: b.title, ok: true, status: 'built', listing: dup.slug, existing: true };
    }
  }

  const authorName = b.author || d.authors[0] || '';
  const wrote = await ask(WRITE_SYSTEM, JSON.stringify({
    title: d.title, subtitle: d.subtitle, author: authorName, first_published: d.year, publisher,
    publisher_description: String(d.description).replace(/\[.*?\]\(.*?\)/g, '').slice(0, 4000), subjects: d.subjects.slice(0, 12), said_on_our_podcasts: ments || [],
  }), WRITE_SCHEMA);
  const title = String(d.title || b.title).trim();
  const slug = slugify(`${title} by ${authorName}`);
  const { error: upErr } = await db.storage.from('vegan-media').upload(`media/logos/books/${slug}.jpg`, cover, { contentType: 'image/jpeg', upsert: true, cacheControl: '86400' });
  if (upErr) return fail('found', 'Cover upload: ' + upErr.message);
  const facts = {
    title, author: authorName, isbn13: i13 || null, isbn10: i10 || null, publisher, year: d.year, ol_work: d.ol_work || null, cover_url: COVERS + slug + '.jpg',
    description: clean(wrote.description).slice(0, 240), summary: clean(wrote.summary), book_type: pick.book_type, vegan_related: !!pick.vegan_related,
    buy_link: await buyLink(title, authorName, i10, slug, author),
  };
  // Make it a listing (the Depot) counts as Vegan related.
  // Only books about Vegan living become listings, our People's included (Sean, 2026-10-29: "Only the books relevant to Veganism").
  if (!pick.vegan_related && b.vegan_related !== true) {
    await db.from('ve_books').update({ ...facts, status: 'referenced', note: String(wrote.note || '').slice(0, 300), updated_at: new Date().toISOString() }).eq('id', bookId);
    return { book_id: bookId, title, ok: true, status: 'referenced' };
  }
  const made = await makeListing({ ...b, ...facts }, author, { cover_source: coverFrom, book_facts_from: found.via, note: wrote.note });
  if (!made.ok) return fail('found', 'Listing: ' + made.why);
  return { book_id: bookId, title, ok: true, status: 'built', listing: made.slug };
}
// Google's own cover picture of a volume, as large as it gives it.
async function googleCover(id: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch(`https://books.google.com/books/content?id=${encodeURIComponent(id)}&printsec=frontcover&img=1&zoom=1&fife=w800`, { signal: AbortSignal.timeout(12000) });
    const buf = new Uint8Array(await r.arrayBuffer());
    return r.ok && /jpeg/.test(r.headers.get('content-type') || '') && buf.length > 8000 ? buf : null;
  } catch { return null; }
}
// The tracked Amazon link: the book's own page by ISBN-10, else an Amazon search for it (ve-links adds our Associates tag).
async function buyLink(title: string, author: string, i10: string, slug: string, person: any): Promise<string> {
  const code = i10 ? `book-${i10.toLowerCase()}` : `book-${slug}`.slice(0, 48).replace(/-+$/, '');
  const destination = i10 ? `https://www.amazon.com/dp/${i10}` : `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${author}`.trim())}&i=stripbooks`;
  await db.from('ve_links').upsert({ code, label: `Buy on Amazon: ${title}`.slice(0, 120), destination, initiative_slug: 'books',
    tags: ['book', 'amazon', ...(person ? [person.slug] : [])].slice(0, 12), channel: 'other' }, { onConflict: 'code', ignoreDuplicates: true });
  return '/go/' + code;
}
// A book from the list becomes a Books listing (in its author's family when we know them).
async function makeListing(b: any, author: any, extra: { cover_source?: string; book_facts_from?: string; note?: string } = {}) {
  const fam = author ? await familyOf(author) : null;
  const authorName = b.author || '';
  const slug = slugify(`${b.title} by ${authorName}`);
  const initials = (String(b.title).replace(/^(The|A|An)\s+/i, '').match(/\b[A-Za-z0-9]/g) || ['B']).slice(0, 2).join('').toUpperCase();
  const { data: made, error } = await db.from('listings').insert({
    tenant_id: TENANT, name: `${b.title} by ${authorName}`, slug, category: 'Books', specialty: 'Books', status: 'approved', description: b.description, logo_url: b.cover_url,
    website: b.buy_link ? `https://vegansexplore.com${b.buy_link}` : null, location: 'United States', address_country: 'US', vegan_status: 'fully_vegan', business_status: 'OPERATIONAL',
    communities: ['all'], initials,
    details: { ...(fam ? { family: fam } : {}), creator: authorName, isbn: b.isbn13, publisher: b.publisher, release_year: b.year, book_type: b.book_type,
      media_type: 'book', summary: b.summary, buy_link: b.buy_link, cover_source: extra.cover_source || 'Copied when the book was built', cover_checked: false,
      book_facts_from: extra.book_facts_from || null, added_by: 've-books', book_source: b.source },
  }).select('id, slug').single();
  if (error) return { ok: false, why: error.message };
  await db.from('ve_books').update({ ...pickFacts(b), status: 'built', listing_id: made.id, note: String(extra.note || b.note || '').slice(0, 300), updated_at: new Date().toISOString() }).eq('id', b.id);
  return { ok: true, slug: made.slug, id: made.id };
}
const pickFacts = (b: any) => ({ title: b.title, author: b.author, isbn13: b.isbn13, isbn10: b.isbn10, publisher: b.publisher, year: b.year, ol_work: b.ol_work,
  cover_url: b.cover_url, description: b.description, summary: b.summary, book_type: b.book_type, vegan_related: b.vegan_related, buy_link: b.buy_link });
// The author's family (details.family), made from their slug when they have none, so the book shows on their Books tab.
async function familyOf(author: any): Promise<string> {
  const fam = author.details?.family;
  if (fam) return fam;
  const next = { ...(author.details || {}), family: author.slug };
  await db.from('ve_listing_edits').insert({ listing_id: author.id, field: 'details', old_value: author.details || {}, new_value: next, meta: { by: 've-books', why: 'Their book joined their page' } });
  await db.from('listings').update({ details: next }).eq('id', author.id);
  author.details = next;
  return author.slug;
}
async function joinFamily(listingId: string, details: any, author: any) {
  if (!author || details?.family) return;
  const fam = await familyOf(author);
  const next = { ...(details || {}), family: fam };
  await db.from('ve_listing_edits').insert({ listing_id: listingId, field: 'details', old_value: details || {}, new_value: next, meta: { by: 've-books', why: 'Joined its author\'s page' } });
  await db.from('listings').update({ details: next }).eq('id', listingId);
}

// ---- the episode's referenced books (public) ----
async function episodeBooks(body: any) {
  let q = db.from('ve_book_mentions').select('second, speaker, context, ve_books!inner(id, title, author, cover_url, buy_link, status, listing_id, listings:listing_id(slug))');
  if (body.content_id) q = q.eq('content_id', String(body.content_id));
  else if (body.listing_id && body.guid) q = q.eq('show_listing_id', String(body.listing_id)).eq('guid', String(body.guid).slice(0, 500));
  else return { ok: false, books: [] };
  const { data } = await q.in('ve_books.status', ['built', 'referenced']).order('second', { ascending: true }).limit(30);
  return {
    ok: true,
    books: (data || []).map((m: any) => ({
      title: m.ve_books.title, author: m.ve_books.author, cover: m.ve_books.cover_url, buy: m.ve_books.buy_link,
      page: m.ve_books.listings?.slug ? '/directory/' + m.ve_books.listings.slug : null, speaker: m.speaker, context: m.context, second: m.second,
    })),
  };
}

// ---- a book's episodes (public): where our shows talked about it, for its page and the Books tab ----
async function bookTalks(listingId: string) {
  const { data: rows } = await db.from('ve_books').select('id').eq('listing_id', listingId);
  const ids = (rows || []).map((r: any) => r.id);
  if (!ids.length) return { ok: true, episodes: [] };
  const { data } = await db.from('ve_book_mentions')
    .select('second, speaker, context, quote, guid, content:content_id(title, slug, published_at, episode_number, podcast_show), show:show_listing_id(slug, name, logo_url)')
    .in('book_id', ids).limit(40);
  const episodes = (data || []).map((m: any) => ({
    title: m.content?.title || '', date: m.content?.published_at || null, show: m.show?.name || m.content?.podcast_show || '',
    image: m.show?.logo_url || '', speaker: m.speaker, context: m.context, quote: m.quote,
    href: m.show?.slug && m.guid ? `/directory/${m.show.slug}?ep=${encodeURIComponent(m.guid)}` : m.content?.slug ? `/pulse/${m.content.slug}` : null,
  })).sort((a: any, b: any) => String(b.date || '').localeCompare(String(a.date || '')));
  return { ok: true, episodes };
}

// ---- Depot > Books (super admin) ----
const LIST_COLS = 'id, title, author, status, source, vegan_related, cover_url, note, tries, year, listing_id, author_listing_id, updated_at, created_at';
async function adminList(body: any) {
  const status = String(body.status || 'built');
  const { data: books } = await db.from('ve_books').select(LIST_COLS).in('status', status === 'waiting' ? ['found', 'building'] : [status])
    .order('updated_at', { ascending: false }).limit(500);
  const ids = (books || []).map((b: any) => b.id);
  const { data: ms } = ids.length ? await db.from('ve_book_mentions').select('book_id').in('book_id', ids) : { data: [] as any[] };
  const count: Record<string, number> = {}; (ms || []).forEach((m: any) => { count[m.book_id] = (count[m.book_id] || 0) + 1; });
  const lids = [...new Set((books || []).flatMap((b: any) => [b.listing_id, b.author_listing_id]).filter(Boolean))];
  const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name').in('id', lids) : { data: [] as any[] };
  const L: Record<string, any> = {}; (ls || []).forEach((l: any) => { L[l.id] = l; });
  const { data: st } = await db.rpc('ve_books_status');
  return { ok: true, status: st, books: (books || []).map((b: any) => ({ ...b, mentions: count[b.id] || 0, listing: L[b.listing_id] || null, person: L[b.author_listing_id] || null })) };
}
async function adminGet(id: string) {
  const { data: b } = await db.from('ve_books').select('*').eq('id', id).maybeSingle();
  if (!b) return { ok: false, why: 'not_found' };
  const { data: ms } = await db.from('ve_book_mentions')
    .select('second, speaker, context, quote, guid, content:content_id(title, slug, published_at, podcast_show), show:show_listing_id(slug, name)').eq('book_id', id);
  const lids = [b.listing_id, b.author_listing_id].filter(Boolean);
  const { data: ls } = lids.length ? await db.from('listings').select('id, slug, name').in('id', lids) : { data: [] as any[] };
  const L: Record<string, any> = {}; (ls || []).forEach((l: any) => { L[l.id] = l; });
  return { ok: true, book: b, listing: L[b.listing_id] || null, person: L[b.author_listing_id] || null, mentions: ms || [] };
}
// set_aside, retry (back to the builder), list (make it a Books listing: now, from what the builder found, or on its next build).
async function adminSet(id: string, to: string) {
  const { data: b } = await db.from('ve_books').select('*').eq('id', id).maybeSingle();
  if (!b) return { ok: false, why: 'not_found' };
  const now = new Date().toISOString();
  if (to === 'set_aside') { await db.from('ve_books').update({ status: 'set_aside', note: 'Set aside by the team', updated_at: now }).eq('id', id); return { ok: true }; }
  if (to === 'retry') { await db.from('ve_books').update({ status: 'found', tries: 0, note: 'Sent back to the builder by the team', updated_at: now }).eq('id', id); return { ok: true }; }
  if (to === 'list') {
    if (b.listing_id) return { ok: true, already: true };
    if (b.status === 'referenced' && b.cover_url && b.summary) {
      const { data: author } = b.author_listing_id ? await db.from('listings').select('id, slug, name, details').eq('id', b.author_listing_id).maybeSingle() : { data: null as any };
      const made = await makeListing({ ...b, vegan_related: true }, author, { cover_source: 'Copied when the book was built', note: 'Made a listing by the team' });
      return made.ok ? { ok: true, slug: made.slug } : { ok: false, why: made.why };
    }
    await db.from('ve_books').update({ status: 'found', tries: 0, vegan_related: true, note: 'To be listed (the team)', updated_at: now }).eq('id', id);
    return { ok: true, queued: true };
  }
  return { ok: false, why: 'unknown' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: 'bad_json' }, 400); }
  if (body.action === 'episode') return json(await episodeBooks(body));
  if (body.action === 'book') return json(/^[0-9a-f-]{36}$/.test(String(body.listing_id || '')) ? await bookTalks(String(body.listing_id)) : { ok: false, episodes: [] });
  if (!(await allowed(req))) return json({ error: 'not_allowed' }, 403);
  if (body.action === 'admin_list') return json(await adminList(body));
  if (body.action === 'admin_get') return json(await adminGet(String(body.id || '')));
  if (body.action === 'admin_set') return json(await adminSet(String(body.id || ''), String(body.to || '')));

  if (body.action === 'probe') {
    const out: any = {};
    try {
      const items = await gb(body.q ? String(body.q).slice(0, 200) : 'intitle:"cheese trap" inauthor:barnard', 10);
      out.google = { ok: true, results: items.length, titles: items.slice(0, 10).map((it: any) => `${it.volumeInfo?.title} / ${(it.volumeInfo?.authors || []).join(', ')}`) };
    } catch (e) { out.google = { ok: false, why: String((e as Error).message || e) }; }
    try { out.openlibrary = { ok: true, results: ((await ol('/search.json?title=cheese+trap&limit=3&fields=key'))?.docs || []).length }; } catch (e) { out.openlibrary = { ok: false, why: String((e as Error).message || e) }; }
    return json(out);
  }
  if (body.action === 'status') {
    const { data } = await db.rpc('ve_books_status');
    return json({ ok: true, ...(data || {}) });
  }
  const limit = Math.min(Math.max(+body.limit || 2, 1), 6);
  let ids: string[] = [], run: (id: string) => Promise<any>;
  if (body.action === 'scan') {
    ids = body.content_id ? [String(body.content_id)] : ((await db.rpc('ve_books_scan_due', { p_limit: limit })).data || []).map((r: any) => r.content_id);
    if (ids.length) await db.from('ve_content_transcripts').update({ books_status: 'scanning', books_at: new Date().toISOString() }).in('content_id', ids);
    run = scanOne;
  } else if (body.action === 'crawl') {
    ids = body.listing_id ? [String(body.listing_id)] : ((await db.rpc('ve_books_crawl_due', { p_limit: limit })).data || []).map((r: any) => r.listing_id);
    // Mark them looked at first, so a slow run is not picked up twice.
    for (const id of ids) await db.from('ve_book_author_checks').upsert({ listing_id: id, checked_at: new Date().toISOString(), note: 'Looking' }, { onConflict: 'listing_id', ignoreDuplicates: false });
    run = crawlOne;
  } else if (body.action === 'build') {
    ids = body.book_id ? [String(body.book_id)] : ((await db.rpc('ve_books_build_due', { p_limit: limit })).data || []).map((r: any) => r.book_id);
    if (ids.length) await db.from('ve_books').update({ status: 'building', marked_at: new Date().toISOString() }).in('id', ids);
    run = buildOne;
  } else return json({ error: 'unknown_action' }, 400);

  const work = (async () => {
    const out = [];
    for (const id of ids) {
      try { out.push(await run(id)); }
      catch (e) {
        const why = String((e as Error).message || e).slice(0, 300);
        if (body.action === 'scan') await db.from('ve_content_transcripts').update({ books_status: 'queued', books_note: 'Will try again: ' + why }).eq('content_id', id);
        if (body.action === 'crawl') await db.from('ve_book_author_checks').update({ checked_at: new Date(Date.now() - 179 * 86400000).toISOString(), note: 'Will try again tomorrow: ' + why }).eq('listing_id', id);
        // A source that does not answer is not the book's fault: that try does not count.
        if (body.action === 'build') {
          const down = /did not answer|Google Books answered|No Google key/.test(why);
          const { data: r } = await db.from('ve_books').select('tries').eq('id', id).maybeSingle();
          await db.from('ve_books').update({ status: 'found', note: 'Will try again: ' + why, tries: down ? Math.max(0, (r?.tries || 1) - 1) : r?.tries }).eq('id', id);
        }
        out.push({ id, ok: false, why });
      }
    }
    return out;
  })();
  if (body.wait) return json({ ok: true, results: await work });
  (EdgeRuntime as any).waitUntil(work);
  return json({ ok: true, started: ids.length });
});
