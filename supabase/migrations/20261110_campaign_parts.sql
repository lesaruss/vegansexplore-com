-- Campaigns with parts (Sean, 2026-11-10: "shouldn't the holiday gift guide feature brands be under the holiday guide launch? So everything
-- living is together... Thanksgiving menu should be under the holiday guides launch as well... Founding cohort could be one campaign").
-- A part is a program with parent_slug; HQ shows one card per top campaign and a Parts bar inside it. Applied 2026-11-10.
alter table public.ve_campaign_programs add column if not exists parent_slug text references public.ve_campaign_programs(slug);
alter table public.ve_campaign_programs add column if not exists part_name text;
alter table public.ve_campaign_programs add column if not exists sort int;
update ve_campaign_programs set part_name = 'The email to everyone we know', sort = 1 where slug = 'holiday-launch-2026';
update ve_campaign_programs set parent_slug = 'holiday-launch-2026', part_name = 'ThanksLiving menus (restaurants)', sort = 2 where slug = 'thanksliving-menus-2026';
update ve_campaign_programs set parent_slug = 'holiday-launch-2026', part_name = 'Gift Guide brands', sort = 3 where slug = 'gift-guide-2026';
update ve_outreach_campaigns set program_slug = 'thanksliving-menus-2026' where slug = 'honest-cuban-comment-2026-11';
