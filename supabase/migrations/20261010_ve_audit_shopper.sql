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

-- Every change to a report merges in one locked step, so two saves at once (Welcome and wait saves two sections; a shopper
-- on two devices) never overwrite each other. Found on the first live test: eight saves sent together left only two.
-- p_patch merges into the report; p_photo_add / p_photo_remove change the photos list; p_advance moves the status forward
-- only (to_arrange -> scheduled -> visited -> reported). A sent report never changes. Returns the report, or null.
create or replace function public.ve_audit_shopper_patch(p_order uuid, p_patch jsonb, p_advance text default null,
  p_photo_add jsonb default null, p_photo_remove text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  update ve_audit_orders o set
    shopper_report = (select case when p_photo_add is null and p_photo_remove is null then b
        else jsonb_set(b, '{photos}', coalesce((select jsonb_agg(x) from jsonb_array_elements(coalesce(b->'photos', '[]'::jsonb)) x
          where x->>'path' is distinct from coalesce(p_photo_remove, p_photo_add->>'path')), '[]'::jsonb)
          || case when p_photo_add is not null then jsonb_build_array(p_photo_add) else '[]'::jsonb end) end
      from (select coalesce(o.shopper_report, '{}'::jsonb) || coalesce(p_patch, '{}'::jsonb) b) s),
    shopper_status = case
      when p_advance = 'scheduled' and coalesce(o.shopper_status, 'to_arrange') = 'to_arrange' then 'scheduled'
      when p_advance = 'visited' and coalesce(o.shopper_status, 'to_arrange') in ('to_arrange', 'scheduled') then 'visited'
      when p_advance = 'reported' then 'reported'
      else o.shopper_status end
  where o.id = p_order and coalesce(o.shopper_status, '') <> 'reported'
  returning o.shopper_report into r;
  return r;
end $$;
revoke all on function public.ve_audit_shopper_patch(uuid, jsonb, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.ve_audit_shopper_patch(uuid, jsonb, text, jsonb, text) to service_role;
