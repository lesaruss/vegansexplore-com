-- National leads (Sean, 2026-10-04): a story from a US Vegan outlet that names none of our hub
-- cities is kept with status 'national' (ve-news-desk judge()). It feeds the national Daily Pulse
-- writer and stays out of the Depot Inbox, which lists 'new' leads only.
alter table public.ve_news_leads drop constraint if exists ve_news_leads_status_check;
alter table public.ve_news_leads add constraint ve_news_leads_status_check
  check (status = any (array['new','write','drafting','drafted','dismissed','published','shared','national']::text[]));

-- More national sources, tested live on 2026-10-04 (each posted within the last two weeks).
insert into public.ve_news_feeds (feed_name, feed_url, scope, locale, notes) values
 ('PETA', 'https://www.peta.org/feed/', 'vegan', 'US', 'Advocacy group: campaigns and actions. Added 2026-10-04 for the national Daily Pulse.'),
 ('Mercy For Animals', 'https://mercyforanimals.org/feed/', 'vegan', 'US', 'Advocacy group: investigations, policy and campaigns. Added 2026-10-04 for the national Daily Pulse.'),
 ('Physicians Committee (PCRM)', 'https://www.pcrm.org/rss.xml', 'vegan', 'US', 'Health and policy news. Added 2026-10-04 for the national Daily Pulse.'),
 ('One Green Planet', 'https://www.onegreenplanet.org/feed/', 'vegan', 'US', 'High volume, many recipes: the writer picks news only. Added 2026-10-04 for the national Daily Pulse.'),
 ('The Vegan Society', 'https://www.vegansociety.com/rss.xml', 'vegan', 'GB', 'UK charity. GB feed, so only London-named stories are kept. Added 2026-10-04.')
on conflict do nothing;
