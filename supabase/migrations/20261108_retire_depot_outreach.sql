-- Depot > Outreach removed (Sean, 2026-11-08). Applied live through the connector.
-- The sender stops; ve_people_outreach and its notes stay for history. Every email goes through BrandDesk Outreach campaigns.
select cron.unschedule('ve-people-outreach');
