-- Sean, 2026-11-15: "yes, build the prize form". A business gives its prize from its dashboard (Opportunities > 11 Days of Giving): what it
-- is, its value, how many, a photo. It waits as pledged for our check (Depot > 11 Days of Giving), then goes live on the Holiday Guide page.
-- created_by is the owner who gave it (their 250 points per prize go to them when it goes live); note is anything they want us to know.
-- The opportunity's button now opens the form (cta ?pd=giving, "Give a prize") instead of logging interest; interest already logged stays.
-- Safe to run twice.
alter table public.ve_giving_prizes add column if not exists created_by uuid references public.members(id) on delete set null;
alter table public.ve_giving_prizes add column if not exists note text check (note is null or length(note) <= 500);
alter table public.ve_giving_prizes add column if not exists reviewed_at timestamptz;
alter table public.ve_giving_prizes add column if not exists reviewed_by uuid references public.members(id) on delete set null;
create index if not exists ve_giving_prizes_listing_idx on public.ve_giving_prizes (listing_id);

update public.ve_dashboard_cards set cta_url = '?pd=giving', cta_label = 'Give a prize', interest_slug = null,
  body = 'December 1 to 11, our members enter free for a chance to win prizes from Vegan businesses, drawn at random in the open. Give up to $100 in prizes (four $25 prizes work best). Nothing to pay or ship now: you send each prize straight to its winner within 30 days after the giveaway ends. Your business is shown with your prize, and you earn 250 points for each one.'
 where title = '11 Days of Giving: give a prize' and coalesce(cta_url, '') <> '?pd=giving';
