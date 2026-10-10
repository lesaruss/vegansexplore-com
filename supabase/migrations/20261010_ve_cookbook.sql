-- The Cookbook, Phase 1 (Sean, 2026-10-07, playbook vegan-dairy-guide-content, group R).
-- Members submit recipes (a Depot queue, 50 points when approved), vote on them, and report "didn't work for me"
-- (3 reports puts a recipe under review with a Being retested tag). Maya's recipes are the model, with a Guide badge.
--
-- recipes already held the 45 "Make Your Own by Javant" recipes (source_type 'book'). They stay private (status
-- 'private') until Javant says yes (Phase 2). Only rows that are live or being retested are ever shown, and only
-- through the ve-cookbook function: recipes are members-only content, so there is no public read policy.
-- This file is served by Vercel like everything in the repo, so it holds no recipe text: Maya's recipes are copied
-- from the members-only ve_guides row in the database.

alter table public.recipes
  add column if not exists slug text,
  add column if not exists status text not null default 'private',
  add column if not exists author_kind text not null default 'book',
  add column if not exists author_member_id uuid references public.members(id) on delete set null,
  add column if not exists author_guide text,
  add column if not exists guide_tags text[] not null default '{}',
  add column if not exists summary text,
  add column if not exists time_text text,
  add column if not exists servings text,
  add column if not exists tip text,
  add column if not exists photo_url text,
  add column if not exists vote_count integer not null default 0,
  add column if not exists report_count integer not null default 0,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid,
  add column if not exists review_note text,
  add column if not exists live_at timestamptz;

alter table public.recipes drop constraint if exists recipes_status_check;
alter table public.recipes add constraint recipes_status_check
  check (status in ('private', 'pending', 'live', 'retesting', 'rejected', 'retired'));
alter table public.recipes drop constraint if exists recipes_author_kind_check;
alter table public.recipes add constraint recipes_author_kind_check
  check (author_kind in ('book', 'guide', 'member', 'chef'));
create unique index if not exists recipes_slug_key on public.recipes (slug) where slug is not null;
create index if not exists recipes_status_idx on public.recipes (status);
create index if not exists recipes_guide_tags_idx on public.recipes using gin (guide_tags);

-- One vote per member per recipe (they can take it back).
create table if not exists public.recipe_votes (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipe_id, member_id)
);
alter table public.recipe_votes enable row level security;

-- "Didn't work for me": one open report per member per recipe. Clearing a retest closes them.
create table if not exists public.recipe_reports (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  note text,
  status text not null default 'open' check (status in ('open', 'cleared')),
  created_at timestamptz not null default now()
);
create unique index if not exists recipe_reports_one_open on public.recipe_reports (recipe_id, member_id) where status = 'open';
alter table public.recipe_reports enable row level security;

create or replace function public.ve_recipe_counts() returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid := coalesce(new.recipe_id, old.recipe_id);
begin
  if tg_table_name = 'recipe_votes' then
    update recipes set vote_count = (select count(*) from recipe_votes where recipe_id = rid) where id = rid;
  else
    update recipes set report_count = (select count(*) from recipe_reports where recipe_id = rid and status = 'open') where id = rid;
    -- Three different members saying it didn't work pulls a live recipe for retesting.
    update recipes set status = 'retesting' where id = rid and status = 'live' and report_count >= 3;
  end if;
  return null;
end $$;
drop trigger if exists trg_recipe_votes_count on public.recipe_votes;
create trigger trg_recipe_votes_count after insert or delete on public.recipe_votes for each row execute function public.ve_recipe_counts();
drop trigger if exists trg_recipe_reports_count on public.recipe_reports;
create trigger trg_recipe_reports_count after insert or update or delete on public.recipe_reports for each row execute function public.ve_recipe_counts();

-- Points for an approved recipe.
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup','referral','daily_login','listing_like','listing_create','discussion_post','discussion_reply','discussion_vote','event_attend','profile_complete','profile_field','admin_adjust','purchase','redemption','vote_given','vote_received','vote_refunded','featured_purchase','transfer_sent','transfer_received','store_purchase','store_refund','points_purchase','bartering','boost_purchase','seed_initial','Welcome bonus + early activity','campaign_back','questionnaire','wizard_redeem','ve_hunt_complete','ve_hunt_anchor','guide_redeem','cycle_grant','bounty','comp_membership','recipe_approved']::text[])) not valid;
insert into public.points_earn_rules (brand, action_type, points_awarded, min_tier, repeatable, active, notes, display_label, is_live)
select 'vegans-explore', 'recipe_approved', 50, 'free', true, true,
  'Sean, 2026-10-07: a member recipe approved into the Cookbook. Paid once per recipe by ve_recipe_review (ref recipe:<id>).',
  'Get a recipe into the Cookbook', true
where not exists (select 1 from public.points_earn_rules where brand = 'vegans-explore' and action_type = 'recipe_approved');

-- The Depot's review: approve (pending -> live, 50 points once to a member author), reject (with a note),
-- restore (retesting -> live, the open reports cleared), retire (taken down).
create or replace function public.ve_recipe_review(p_recipe uuid, p_op text, p_reviewer uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r recipes; w jsonb; paid boolean := false;
begin
  select * into r from recipes where id = p_recipe for update;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if p_op = 'approve' then
    if r.status not in ('pending', 'rejected') then return jsonb_build_object('error', 'not_pending'); end if;
    update recipes set status = 'live', live_at = coalesce(live_at, now()), reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    if r.author_kind = 'member' and r.author_member_id is not null
       and not exists (select 1 from points_ledger where ref_id = 'recipe:' || r.id) then
      insert into points_ledger (member_id, delta, reason, ref_id) values (r.author_member_id, 50, 'recipe_approved', 'recipe:' || r.id);
      -- Both balances, the way spend_points_for_guide moves them: a Guide unlock spends members.lesars_balance.
      update members set lesars_balance = coalesce(lesars_balance, 0) + 50 where id = r.author_member_id;
      select apply_member_points_delta(r.author_member_id, 50) into w;
      paid := true;
    end if;
    return jsonb_build_object('ok', true, 'status', 'live', 'points_paid', paid);
  elsif p_op = 'reject' then
    if r.status <> 'pending' then return jsonb_build_object('error', 'not_pending'); end if;
    update recipes set status = 'rejected', reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'rejected');
  elsif p_op = 'restore' then
    if r.status not in ('retesting', 'retired') then return jsonb_build_object('error', 'not_retesting'); end if;
    update recipe_reports set status = 'cleared' where recipe_id = r.id and status = 'open';
    update recipes set status = 'live', reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'live');
  elsif p_op = 'retire' then
    update recipes set status = 'retired', reviewed_at = now(), reviewed_by = p_reviewer, review_note = p_note where id = r.id;
    return jsonb_build_object('ok', true, 'status', 'retired');
  end if;
  return jsonb_build_object('error', 'bad_op');
end $$;
revoke all on function public.ve_recipe_review(uuid, text, uuid, text) from public, anon, authenticated;

-- Maya's recipes, from the Dairy Guide (ve_guides vegan-dairy-guide-site): her two recipes, and each pantry swap
-- that is a recipe of its own (the swap's "from your pantry" method), all with her Guide badge.
insert into public.recipes (title, slug, source_type, source_name, category, instructions, tip, time_text, status, author_kind, author_guide, guide_tags, is_vegan, live_at)
select r->>'title', 'maya-' || trim(both '-' from regexp_replace(lower(r->>'title'), '[^a-z0-9]+', '-', 'g')), 'guide', 'Maya, your Guide',
  'dairy-free', array(select jsonb_array_elements_text(r->'steps')), nullif(r->>'tip', ''), r->>'time', 'live', 'guide', 'maya', array['vegan-dairy-guide'], true, now()
from public.ve_guides g, jsonb_array_elements(((regexp_match(g.content_html, '<script type="application/json" id="dg-data">(.*)</script>'))[1])::jsonb -> 'recipes') r
where g.slug = 'vegan-dairy-guide-site'
on conflict do nothing;

insert into public.recipes (title, slug, source_type, source_name, category, instructions, tip, status, author_kind, author_guide, guide_tags, is_vegan, live_at)
select 'Homemade ' || lower(regexp_replace(s->>'replace', ', (cooking|baking)$', '')),
  'maya-homemade-' || trim(both '-' from regexp_replace(lower(regexp_replace(s->>'replace', ', (cooking|baking)$', '')), '[^a-z0-9]+', '-', 'g')),
  'guide', 'Maya, your Guide', 'dairy-free', array[s->>'pantry'], nullif(s->>'tip', ''), 'live', 'guide', 'maya', array['vegan-dairy-guide'], true, now()
from public.ve_guides g, jsonb_array_elements(((regexp_match(g.content_html, '<script type="application/json" id="dg-data">(.*)</script>'))[1])::jsonb -> 'swaps') s
where g.slug = 'vegan-dairy-guide-site'
  and length(s->>'pantry') > 40 and (s->>'pantry') ~* 'blend|pulse|simmer|whip|stir|warm|tbsp|cup'
on conflict do nothing;
