-- The Vegan Dairy Guide: access comes with membership (Sean, 2026-10-07).
--
-- ve_guides.access_rule says how a Guide opens:
--   points      a member spends points (spend_points_for_guide); the Restaurant Survival Guide.
--   membership  any member with membership_status 'active' has it (the $11 Founding Membership,
--               Passport, or a membership on us); a ve_guide_purchases row also counts.
-- ve-guide-unlock reads it ('open' returns content_html only when the person has access).
--
-- content_html holds the Dairy Guide's members-only screens. It is loaded into the row
-- directly, never committed: Vercel serves this repository, so anything in it is public.
-- Editorial source: HQ playbook vegan-dairy-guide-content.

alter table public.ve_guides
  add column if not exists access_rule text not null default 'points';

do $$ begin
  alter table public.ve_guides add constraint ve_guides_access_rule_check check (access_rule in ('points', 'membership'));
exception when duplicate_object then null; end $$;

insert into public.ve_guides (slug, title, description, cost_lesars, published, access_rule, sort_order)
values (
  'vegan-dairy-guide',
  'The Vegan Dairy Guide',
  'Everything you need to go dairy-free: why it matters, the brands to buy, how to replace dairy when you cook, and recipes and books.',
  1100,
  true,
  'membership',
  2
)
on conflict (slug) do update set access_rule = excluded.access_rule, published = excluded.published;
