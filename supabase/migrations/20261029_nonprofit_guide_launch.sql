-- The Nonprofit Guide launches (Sean, 2026-10-29: "This is good as a V1. You can go ahead and launch it for the site.").
-- The page is indexed, its card is sixth in the Guide catalog (label Nonprofits, replacing the Coming soon card) and it is in
-- the sitemap. The ve_guides row was already published at build; this keeps it so. Safe to run twice.
update public.ve_guides set published = true where slug = 'nonprofit-guide' and published is distinct from true;
insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-guide','vegans-explore','Logan','decision','text',$v$Launched 2026-10-29 (Sean: "good as a V1... launch it"). noindex off, the Guide catalog's Coming soon Nonprofit card replaced by the live one (sixth, label Nonprofits, Dani's banner), in the sitemap. $11 or 1,100 points, tip 1 free. Susan Hargreaves' Nonprofit Partner invitation can go out now (Depot > Founding Members). Still open: Dani's lines are text drafts (no clips), the survey's 100 points is Logan's default.$v$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-guide' and author='Logan' and body like 'Launched 2026-10-29%');
insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan','vegans-explore','VEGANS EXPLORE: Nonprofit Guide launched (/guides/nonprofit-guide indexed, card in the Guide catalog, sitemap). Susan Hargreaves'' invitation can go out.', array['vegans-explore','nonprofits','guides','launch'], 'completed', 've-nonprofit-guide-launched'
where not exists (select 1 from stream_events where context_link='ve-nonprofit-guide-launched');
