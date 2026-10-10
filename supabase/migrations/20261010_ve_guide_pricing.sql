-- Guide pricing (Sean, 2026-10-10, canon-ve-guide-pricing): every paid Guide is $11 or 1,100 points,
-- Passport opens every Guide (ve-guide-unlock), and free Guides (the Welcome Guide, the Partner Guide)
-- open for everyone. The Dairy Guide moves from "comes with the membership" to points once its page
-- offers the unlock; members active today keep it, because they were told it came with their membership.

alter table public.ve_guides drop constraint if exists ve_guides_access_rule_check;
alter table public.ve_guides add constraint ve_guides_access_rule_check check (access_rule in ('points', 'membership', 'free'));

update public.ve_guides set cost_lesars = 1100 where access_rule = 'points' and cost_lesars <> 1100;

-- Members active on 2026-10-10 keep the Dairy Guide (no points spent, no ledger entry).
insert into public.ve_guide_purchases (member_id, guide_id, lesars_spent)
select m.id, g.id, 0
from public.members m cross join public.ve_guides g
where m.membership_status = 'active' and g.slug in ('vegan-dairy-guide', 'vegan-dairy-guide-site')
on conflict (member_id, guide_id) do nothing;

-- Run when the Dairy Guide page offers the 1,100-point unlock:
-- update public.ve_guides set access_rule = 'points', cost_lesars = 1100 where slug in ('vegan-dairy-guide', 'vegan-dairy-guide-site');
