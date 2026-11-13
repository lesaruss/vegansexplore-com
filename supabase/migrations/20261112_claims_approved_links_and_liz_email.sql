-- Sean, 2026-11-12 ("go"), playbook ve-claims-onboarding. Applied 2026-11-12 through the Supabase connector.
-- 1. Each approved business's own tracked link for its Find us on Vegans Explore post (initiative ve-claims-onboarding).
insert into ve_links (code, label, destination, initiative_slug, tags, channel)
select v.code, v.label, 'https://vegansexplore.com/directory/' || v.slug, 've-claims-onboarding', array['find-us-post', v.slug], 'social'
from (values ('chaska','chaska','Chaska: Find us on Vegans Explore post'),
  ('nlvg-pasadena','next-level-veggie-grill','Next Level Veggie Grill Pasadena: Find us post'),
  ('nlvg-burbank','next-level-veggie-grill-burbank-d55b','Next Level Veggie Grill Burbank: Find us post'),
  ('nlvg-long-beach','next-level-veggie-grill-long-beach-b4fc','Next Level Veggie Grill Long Beach: Find us post'),
  ('nlvg-sunset','next-level-veggie-grill-los-angeles-9f8d','Next Level Veggie Grill Los Angeles (Sunset): Find us post'),
  ('nlvg-tustin','next-level-veggie-grill-tustin','Next Level Veggie Grill Tustin: Find us post'),
  ('nlvg-ucla','veggie-grill','Next Level Veggie Grill UCLA: Find us post')) v(code, slug, label)
where not exists (select 1 from ve_links x where x.code = v.code);
-- 2. The program claims-approved-2026-11 and the people campaign claims-approved-liz (approved, starts 2026-11-13, weekday sending hours):
--    one email from Liz per approved business, its link each person's own tracked link to /dashboard/business. Members: Chaska
--    (Rajendra Jain) and Next Level Veggie Grill (marketing), each with its own approved words (personal_emails). The exact rows were
--    inserted with the statement in the session; see ve_campaign_programs, ve_campaign_program_steps, ve_outreach_campaigns,
--    ve_outreach_campaign_emails and ve_outreach_campaign_members where the slug or campaign_slug is claims-approved-*.
