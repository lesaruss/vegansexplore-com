-- BrandDesk: the presence-gap ranking and the pitch pages (build order, after the photographer shot list;
-- canon canon-ve-front-of-house v1 "The pitch" and v3 "The door, the pitch and the reveal").
-- "A presence-gap ranking on the monthly check-ups, then a personal guided page per business (their audit, their site mocked
-- on our template, the two-week plan, the price), sent from Sean... with his approval." Prepared, never dressed as an instant
-- scan: "We looked at your business before we reached out." The reveal: a still picture of their home page on our template,
-- then I'm ready / Let me think about it / Talk to someone, each landing in the Inbox.

create table if not exists public.ve_branddesk_pitches (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references public.listings(id) on delete cascade,
  code text not null unique,                               -- /business/pitch?c=<code>
  status text not null default 'draft' check (status in ('draft', 'ready', 'sent', 'viewed', 'chose', 'client', 'closed')),
  warm boolean not null default false,                     -- Sean's warm list: first in the ranking
  audit_id uuid references public.ve_audits(id),           -- the audit the page shows (their latest full one when prepared)
  note text,                                               -- Sean's personal opening, in his words
  look text not null default 'fresh',                      -- the palette their home page is shown in
  plan jsonb,                                              -- the two weeks, day by day (null: the standard plan)
  contact_name text,
  contact_email text,
  link_code text,                                          -- their tracked /go/ link (made at the first send)
  sent_at timestamptz,
  sent_by uuid references public.members(id),
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  views int not null default 0,
  choice text check (choice in ('ready', 'think', 'talk', 'no')),
  choice_at timestamptz,
  choice_note text,
  follow_up_on date,                                       -- Let me think about it: the date they picked
  created_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_branddesk_pitches enable row level security;

-- The ranking: every open food place with a finished full audit (the monthly check-ups), most to gain first.
-- gap = how far their online presence is from a full score; worth = how real and loved the place is (Google rating and
-- reviews, how Vegan, our members' votes). Rank = gap x worth. Logan's defaults, Sean's to change.
create or replace function public.ve_branddesk_ranking(p_chapter text default null)
returns table (
  listing_id uuid, slug text, name text, category text, city text, chapter text, vegan_status text,
  audit_id uuid, audited_at timestamptz, presence int, areas jsonb, rating numeric, reviews int, votes int,
  gap_score int, top_fixes jsonb, fix_count int, contact_email text,
  pitch_id uuid, pitch_status text, warm boolean, choice text, views int
)
language sql stable security definer set search_path = public as $$
  with latest as (
    select distinct on (a.listing_id) a.*
    from ve_audits a
    where a.status = 'done' and a.tier = 'full' and a.max_score > 0
    order by a.listing_id, a.created_at desc
  ), base as (
    select l.id, l.slug, l.name, l.category, l.address_city, ve_chapter_of(l.address_city, l.address_state) as chapter, l.vegan_status,
      a.id as audit_id, a.created_at as audited_at, round(a.score * 100.0 / a.max_score)::int as presence, a.areas, a.items,
      nullif(a.facts->'google'->>'rating', '')::numeric as rating, coalesce(nullif(a.facts->'google'->>'reviews', '')::int, 0) as reviews,
      coalesce(l.voter_count, 0) as votes, a.closure_level, a.facts->'google'->>'status' as gstatus
    from latest a join listings l on l.id = a.listing_id
    where l.status = 'approved' and l.parent_id is null
      and l.category in ('Restaurants', 'Bakeries & Cafes', 'Food Trucks', 'Vendors', 'Catering', 'Meal Prep', 'Markets')
      and coalesce(l.business_status, 'OPERATIONAL') = 'OPERATIONAL'
      and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member', 've-grocery-store'])
      and not exists (select 1 from ve_branddesk_accounts b where b.listing_id = l.id and b.status in ('active', 'paused', 'canceling') and not b.test)
  )
  select b.id, b.slug, b.name, b.category, b.address_city, b.chapter, b.vegan_status, b.audit_id, b.audited_at, b.presence, b.areas,
    b.rating, b.reviews, b.votes,
    round((100 - b.presence)
      * (case b.vegan_status when 'fully_vegan' then 1.0 when 'vegan_options' then 0.75 else 0.65 end)
      * (0.5 + 0.5 * least(ln(1 + b.reviews) / ln(500), 1))
      * (case when b.rating is null then 0.7 when b.rating >= 4.3 then 1.0 when b.rating >= 4.0 then 0.9 when b.rating >= 3.5 then 0.75 else 0.55 end)
      * (1 + least(b.votes, 10) / 20.0))::int as gap_score,
    coalesce((select jsonb_agg(jsonb_build_object('key', f.key, 'label', f.label, 'area', f.area, 'found', f.found) order by f.weight desc)
      from (select c.key, c.label, c.area, c.weight, i->>'found' as found
            from jsonb_array_elements(b.items) i join ve_audit_criteria c on c.key = i->>'key'
            where i->>'state' = 'fix' order by c.weight desc limit 3) f), '[]'::jsonb) as top_fixes,
    (select count(*)::int from jsonb_array_elements(b.items) i where i->>'state' = 'fix') as fix_count,
    coalesce((select o.email from ve_outreach_contacts o where o.listing_id = b.id and o.email is not null order by o.created_at desc limit 1),
      (select nullif(l2.email, '') from listings l2 where l2.id = b.id)) as contact_email,
    p.id, p.status, coalesce(p.warm, false), p.choice, coalesce(p.views, 0)
  from base b left join ve_branddesk_pitches p on p.listing_id = b.id
  where b.closure_level is null and coalesce(b.gstatus, 'OPERATIONAL') = 'OPERATIONAL'
    and (p_chapter is null or b.chapter = p_chapter)
  order by coalesce(p.warm, false) desc, 15 desc, b.name;
$$;
revoke all on function public.ve_branddesk_ranking(text) from public, anon, authenticated;

-- The Inbox: a business's choice on its pitch page (I'm ready, Let me think about it, Talk to someone).
do $$
declare d text := pg_get_functiondef('public.ve_inbox_items(timestamptz)'::regprocedure);
begin
  if position('branddesk_pitch' in d) = 0 then
    d := replace(d, E'\n  order by 3 desc;',
      E'\n  union all\n  select ''branddesk_pitch'', p.id, p.choice_at,\n    case p.choice when ''ready'' then ''BrandDesk: ready to start'' when ''think'' then ''BrandDesk: thinking it over'' when ''talk'' then ''BrandDesk: wants to talk'' else ''BrandDesk: not now'' end,\n    l.name, left(concat_ws('' · '', case when p.follow_up_on is not null then ''Follow up '' || to_char(p.follow_up_on, ''Mon DD'') end, nullif(p.choice_note, '''')), 200),\n    null, p.contact_name, p.contact_email, ve_chapter_of(l.address_city, l.address_state), ''/admin/depot/branddesk#pitch/'' || l.slug\n  from ve_branddesk_pitches p join listings l on l.id = p.listing_id\n  where p.choice is not null and p.choice_at >= p_since and coalesce(p.contact_name, '''') not like ''[TEST]%''\n  order by 3 desc;');
    execute d;
  end if;
end $$;
