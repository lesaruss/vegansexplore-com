-- Books, phase 2 (Sean, 2026-10-29: "as you're reading the transcripts for the podcast... any books that are mentioned in the
-- podcast, we put on... a background list to be built out and put into the page. And any books from any of the people, then we
-- do a crawl for any books written by any of our people. And then those get put into our books section").
--
-- ve_books is that list: every book we know of, from a transcript (source transcript), from an author crawl of a People listing
-- (author_crawl), or already a Directory listing (listing). The edge function ve-books works it (crons below):
--   scan   reads each ready transcript (ve_content_transcripts.books_status queued), Claude names the books said in it, each
--          mention is kept only when its quote is really in the transcript, and the book joins ve_books (found).
--   crawl  looks each People listing up on Open Library and keeps the books Claude confirms are theirs (found, author_listing_id).
--   build  matches a found book to Open Library, takes an English edition whose cover Amazon has, copies the cover into
--          vegan-media/media/logos/books/, and Claude writes the description and synopsis from Open Library's own description.
--          A book about Vegan living, animals or plant-based health, or by one of our People, becomes a Books listing
--          (built, in its author's family so it shows on their Books tab); any other book stays a referenced book (referenced)
--          that shows only on the episodes that mention it. Each gets its tracked Amazon link (/go/book-<ISBN-10>).
-- ve_book_mentions ties a book to an episode (content_id, and the show's feed guid so the podcast page can find it); the episode
-- view on a podcast's page shows them as Referenced books (ve-books episode, public).
-- RLS on with no policies: everything goes through ve-books with the service role. Safe to run twice.

create table if not exists public.ve_books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  title_key text not null,
  author_key text not null default '',
  isbn13 text, isbn10 text, publisher text, year int, ol_work text,
  cover_url text, description text, summary text, book_type text,
  vegan_related boolean,
  author_listing_id uuid references public.listings(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  buy_link text,
  source text not null default 'transcript' check (source in ('transcript', 'author_crawl', 'listing', 'manual')),
  status text not null default 'found' check (status in ('found', 'building', 'built', 'referenced', 'not_found', 'set_aside')),
  note text,
  tries int not null default 0,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (title_key, author_key)
);
alter table public.ve_books enable row level security;
create index if not exists ve_books_status on public.ve_books (status, created_at);
create index if not exists ve_books_listing on public.ve_books (listing_id);

create table if not exists public.ve_book_mentions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.ve_books(id) on delete cascade,
  content_id uuid not null references public.ve_pulse_content(id) on delete cascade,
  show_listing_id uuid references public.listings(id) on delete set null,
  guid text,
  second numeric,
  speaker text,
  quote text,
  context text check (context in ('their_own', 'recommended', 'discussed', 'mentioned')),
  created_at timestamptz not null default now(),
  unique (book_id, content_id)
);
alter table public.ve_book_mentions enable row level security;
create index if not exists ve_book_mentions_ep on public.ve_book_mentions (show_listing_id, guid);

create table if not exists public.ve_book_author_checks (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  checked_at timestamptz not null default now(),
  found int not null default 0,
  note text
);
alter table public.ve_book_author_checks enable row level security;

-- Each transcript's place in the book scan. A transcript saved or replaced later goes back to queued (trigger below).
alter table public.ve_content_transcripts add column if not exists books_status text not null default 'queued'
  check (books_status in ('queued', 'scanning', 'scanned', 'failed'));
alter table public.ve_content_transcripts add column if not exists books_at timestamptz;
alter table public.ve_content_transcripts add column if not exists books_note text;

create or replace function public.ve_content_books_requeue() returns trigger language plpgsql as $$
begin
  if new.segments is distinct from old.segments or (new.status = 'ready' and old.status is distinct from 'ready') then
    new.books_status := 'queued'; new.books_note := null;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_content_books_requeue on public.ve_content_transcripts;
create trigger trg_ve_content_books_requeue before update on public.ve_content_transcripts
  for each row execute function public.ve_content_books_requeue();

-- The key a title is matched on: lower case, no subtitle, no leading "the", letters and digits only.
create or replace function public.ve_book_key(p text) returns text language sql immutable as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(split_part(split_part(p, ':', 1), ' (', 1), '')), '^(the|a|an)\s+', ''), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))
$$;
-- An author's key: the last word of the name ("Neal D. Barnard, MD" -> barnard), enough to tell two books of one title apart.
create or replace function public.ve_book_author_key(p text) returns text language sql immutable as $$
  select coalesce(nullif(regexp_replace(lower(btrim(regexp_replace(split_part(coalesce(p, ''), ',', 1), '\s+\m(MD|PhD|RD|DO|Jr|Sr)\M\.?', '', 'gi'))), '^.*\s', ''), ''), '')
$$;

-- The books already in the Directory join the list as built, so a mention of one links to its page.
insert into public.ve_books (title, author, title_key, author_key, isbn13, publisher, year, cover_url, description, summary, book_type,
  vegan_related, listing_id, buy_link, source, status, note)
select regexp_replace(l.name, '\s+by\s+.*$', ''), l.details ->> 'creator', ve_book_key(regexp_replace(l.name, '\s+by\s+.*$', '')),
  ve_book_author_key(coalesce(l.details ->> 'creator', substring(l.name from '\sby\s+(.*)$'))),
  replace(l.details ->> 'isbn', '-', ''), l.details ->> 'publisher', nullif(l.details ->> 'release_year', '')::int, l.logo_url, l.description,
  l.details ->> 'summary', l.details ->> 'book_type', true, l.id, l.details ->> 'buy_link', 'listing', 'built', 'In the Directory before the crawl'
from public.listings l
where l.category = 'Books' and l.status = 'approved'
on conflict (title_key, author_key) do nothing;

-- A transcript's episode in its show's feed (our four shows), so a mention can be shown on the podcast page's episode view.
-- Same match as ve_person_episodes: close titles, or out within 2 days with some likeness.
create or replace function public.ve_content_feed_episode(p_content uuid)
returns table (show_listing_id uuid, guid text)
language sql stable security definer set search_path = public, extensions as $$
  with c as (select id, title, published_at, podcast_show from ve_pulse_content where id = p_content),
  sm(show, slug) as (values ('Vegans Explore Podcast','vegans-explore-podcast'),('SoFlo Vegans Podcast','soflo-vegans-podcast'),
    ('Vegans Who Lift Podcast','vegans-who-lift-podcast'),('Pre-Vegans Podcast','pre-vegans-podcast'))
  select s.id, b.e ->> 'guid'
  from c join sm on sm.show = c.podcast_show
  join listings s on s.slug = sm.slug and s.status = 'approved' and s.category = 'Podcasts'
  join ve_podcast_feeds f on f.listing_id = s.id
  join lateral (
    select e from jsonb_array_elements(f.episodes) e
    where similarity(lower(e ->> 'title'), lower(c.title)) >= 0.45
       or (abs(extract(epoch from ((e ->> 'date')::timestamptz - c.published_at)) / 86400) <= 2 and similarity(lower(e ->> 'title'), lower(c.title)) >= 0.2)
    order by similarity(lower(e ->> 'title'), lower(c.title)) desc, abs(extract(epoch from ((e ->> 'date')::timestamptz - c.published_at))) limit 1
  ) b on true
  limit 1;
$$;

-- What ve-books works on next.
create or replace function public.ve_books_scan_due(p_limit int default 2)
returns table (content_id uuid) language sql stable security definer set search_path = public as $$
  select t.content_id from ve_content_transcripts t join ve_pulse_content c on c.id = t.content_id
  where t.status = 'ready' and (t.books_status = 'queued' or (t.books_status = 'scanning' and t.books_at < now() - interval '20 minutes'))
  order by c.published_at desc nulls last limit greatest(1, least(p_limit, 6));
$$;
create or replace function public.ve_books_crawl_due(p_limit int default 2)
returns table (listing_id uuid) language sql stable security definer set search_path = public as $$
  select l.id from listings l left join ve_book_author_checks k on k.listing_id = l.id
  where l.status = 'approved' and l.category in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders')
    and (k.listing_id is null or k.checked_at < now() - interval '180 days')
  order by k.checked_at nulls first, l.vote_count desc nulls last, l.name limit greatest(1, least(p_limit, 6));
$$;
create or replace function public.ve_books_build_due(p_limit int default 3)
returns table (book_id uuid) language sql stable security definer set search_path = public as $$
  select b.id from ve_books b
  where (b.status = 'found' or (b.status = 'building' and b.marked_at < now() - interval '20 minutes')) and b.tries < 3
  order by b.author_listing_id is null, b.created_at limit greatest(1, least(p_limit, 6));
$$;

-- Add a book to the list, or find it there: the same title (and author, when either side knows it) is the same book.
create or replace function public.ve_book_upsert(p_title text, p_author text, p_source text, p_author_listing uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare tk text := ve_book_key(p_title); ak text := ve_book_author_key(p_author); bid uuid;
begin
  if coalesce(tk, '') = '' then return null; end if;
  select id into bid from ve_books where title_key = tk and (author_key = ak or ak = '' or author_key = '')
    order by (author_key = ak) desc, (status = 'built') desc, created_at limit 1;
  if bid is not null then
    update ve_books set author = coalesce(author, nullif(btrim(p_author), '')),
      author_key = case when author_key = '' and ak <> '' and not exists (select 1 from ve_books x where x.title_key = tk and x.author_key = ak) then ak else author_key end,
      author_listing_id = coalesce(author_listing_id, p_author_listing), updated_at = now()
    where id = bid;
    return bid;
  end if;
  insert into ve_books (title, author, title_key, author_key, source, author_listing_id)
  values (btrim(p_title), nullif(btrim(p_author), ''), tk, ak, p_source, p_author_listing)
  on conflict (title_key, author_key) do update set updated_at = now()
  returning id into bid;
  return bid;
end $$;

-- Where the list stands, for the team (ve-books status).
create or replace function public.ve_books_status() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'books', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from ve_books group by 1) s),
    'transcripts', (select coalesce(jsonb_object_agg(books_status, n), '{}') from (select books_status, count(*) n from ve_content_transcripts where status = 'ready' group by 1) t),
    'mentions', (select count(*) from ve_book_mentions),
    'people', (select count(*) from listings where status = 'approved' and category in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders')),
    'people_checked', (select count(*) from ve_book_author_checks where note is distinct from 'Looking'),
    'people_with_books', (select count(*) from ve_book_author_checks where found > 0));
$$;

-- The crons: scan two transcripts every 5 minutes (it was 10 until 2026-10-29 afternoon), crawl two people every 10, build three books every 5. Each costs nothing once
-- nothing is due. Open Library refuses a burst, so ve-books spaces its calls and a run is small.
select cron.unschedule(j.jobid) from cron.job j where j.jobname in ('ve-books-scan', 've-books-crawl', 've-books-build');
select cron.schedule('ve-books-scan', '3-59/5 * * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-books',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"scan","limit":2}'::jsonb, timeout_milliseconds := 30000);
$c$);
select cron.schedule('ve-books-crawl', '7-59/10 * * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-books',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"crawl","limit":2}'::jsonb, timeout_milliseconds := 30000);
$c$);
select cron.schedule('ve-books-build', '1-59/5 * * * *', $c$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-books',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"build","limit":3}'::jsonb, timeout_milliseconds := 30000);
$c$);
