-- The Secret Shopper report (Sean, 2026-10-10: "Build the Secret Shopper report form next"). A $149 audit order comes with
-- a visit: the city's Community Manager (or a super admin) opens it at /dashboard/secret-shopper, sets the day, visits, and
-- fills in the report one step at a time (the visit, welcome and wait, menu and Vegan labels, the food, cleanliness, the
-- staff, photos, summary). Sending it emails the owner, who reads it in the Restaurant Guide (#/audit/shopper/<order>).
-- Everything goes through ve-restaurant-audit (shopper_* actions); the report lives in ve_audit_orders.shopper_report.

-- Which of our cities the order is in, set at payment, so a Community Manager sees their own city's visits.
alter table public.ve_audit_orders add column if not exists community_slug text;
update public.ve_audit_orders o set community_slug = c.community_slug
from public.listings l, public.ve_outreach_cities c
where o.community_slug is null and l.id = o.listing_id and c.community_slug <> 'brands'
  and l.address_city = any(c.cities) and (c.states is null or l.address_state = any(c.states));

-- Report photos are private: the owner, the shopper and the team see them through short-lived signed links.
insert into storage.buckets (id, name, public) values ('audit-shopper', 'audit-shopper', false) on conflict (id) do nothing;
