-- The business dashboard's Media kit (playbook ve-business-dashboard, build step 2; Sean, 2026-11-13: "Approved, merge it and start the
-- Media kit"). Every time Vegans Explore features a business, it lands in its Media kit with what it needs to share it: the post, the story,
-- its own tracked link and a caption. One source in the database, never a list in the page's code.
--
-- ve_media_kit_items: the share kit made for one feature of one listing (graphics rendered by scripts/brand-templates/featured-business.js
-- from the locked brand kit templates, or find-us.js for the Find us post). status draft until Sean approves the kind's words; owners only
-- ever see ready rows. key: find-us | holiday:<gift id> | content:<ve_pulse_content id> | pulse:<ve_pulse_posts id>.
-- ve_media_kit(listing): every feature of the listing from the places we already record them (ve_holiday_gifts, ve_content_mentions shown on
-- published content, ve_pulse_posts, the Find us post), each with its ready kit when one is made. All of it is already public on the
-- listing's own page, so the function is open to read.

create table if not exists public.ve_media_kit_items (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  key text not null,
  kind text not null check (kind in ('find_us', 'holiday', 'podcast', 'article', 'pulse', 'guide', 'carousel')),
  title text not null,
  where_label text,
  where_url text,
  post_url text,
  story_url text,
  link_code text,
  caption text,
  status text not null default 'draft' check (status in ('draft', 'ready', 'hidden')),
  featured_at timestamptz,
  made_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz,
  unique (listing_id, key)
);
alter table public.ve_media_kit_items enable row level security;
drop policy if exists ve_media_kit_items_read on public.ve_media_kit_items;
create policy ve_media_kit_items_read on public.ve_media_kit_items for select to anon, authenticated using (status = 'ready');

-- The Find us on Vegans Explore posts made 2026-11-12 (find-us.js into /public/claims/<slug>/, links from
-- 20261112_claims_approved_links_and_liz_email.sql), moved here from the page's POST_OK list. Ready: Sean locked them 2026-11-12.
insert into public.ve_media_kit_items (listing_id, key, kind, title, where_label, where_url, post_url, story_url, link_code, caption, status, featured_at, approved_by, approved_at)
select l.id, 'find-us', 'find_us', 'Find us on Vegans Explore', 'Your page', '/directory/' || l.slug,
  '/public/claims/' || l.slug || '/post.jpg', '/public/claims/' || l.slug || '/story.jpg', v.code,
  'Find us on @vegansexplore ' || U&'\+01F331' || ' Our menu, hours and signature dishes, all in one place. Link in bio.',
  'ready', '2026-11-12', 'Sean (2026-11-12, ve-claims-onboarding)', '2026-11-12'
from (values ('chaska','chaska'), ('next-level-veggie-grill','nlvg-pasadena'), ('next-level-veggie-grill-burbank-d55b','nlvg-burbank'),
  ('next-level-veggie-grill-long-beach-b4fc','nlvg-long-beach'), ('next-level-veggie-grill-los-angeles-9f8d','nlvg-sunset'),
  ('next-level-veggie-grill-tustin','nlvg-tustin'), ('veggie-grill','nlvg-ucla')) v(slug, code)
join public.listings l on l.slug = v.slug
on conflict (listing_id, key) do nothing;

create or replace function public.ve_media_kit(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with f as (
    select 'holiday:' || g.id key, 'holiday' kind, g.title, 'The Holiday Guide' where_label,
      '/guides/holiday-guide#/' || case g.holiday_slug when 'christmas' then 'xm-gifts' else 'gifts' end where_url, g.created_at featured_at
    from ve_holiday_gifts g where g.listing_id = p_listing and g.status = 'live'
    union all
    select distinct on (c.id) 'content:' || c.id, case when c.content_type = 'podcast' then 'podcast' else 'article' end, c.title,
      coalesce(nullif(c.podcast_show, ''), 'The Daily Pulse'), '/pulse/' || c.slug, coalesce(c.published_at, c.created_at)
    from ve_content_mentions m join ve_pulse_content c on c.id = m.content_id
    where m.listing_id = p_listing and m.status = 'shown' and c.status = 'published'
    union all
    select 'pulse:' || p.id, 'pulse', p.headline, 'The Daily Pulse', null, coalesce(p.published_at, p.created_at)
    from ve_pulse_posts p where p.listing_id = p_listing and p.published_at is not null
    union all
    select i.key, i.kind, i.title, i.where_label, i.where_url, i.featured_at from ve_media_kit_items i
    where i.listing_id = p_listing and i.status = 'ready' and i.key = 'find-us'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'key', f.key, 'kind', f.kind, 'title', f.title, 'where_label', f.where_label, 'where_url', f.where_url, 'featured_at', f.featured_at,
      'ready', i.id is not null, 'post_url', i.post_url, 'story_url', i.story_url, 'link_code', i.link_code, 'caption', i.caption
    ) order by (f.kind = 'find_us') desc, f.featured_at desc nulls last), '[]'::jsonb)
  from f left join ve_media_kit_items i on i.listing_id = p_listing and i.key = f.key and i.status = 'ready';
$$;
revoke all on function public.ve_media_kit(uuid) from public;
grant execute on function public.ve_media_kit(uuid) to anon, authenticated;
