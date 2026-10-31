-- The handshake, step 1 (canon canon-ve-front-of-house v8, LOCKED by Sean 2026-10-31; built the same day: "then the handshakes").
-- Business outreach's first email gives them their page and the top things from their free restaurant check, no price. An upgrade to
-- what we offer, so it may go into the emails during a city's 15-day commitment (CLAUDE.md, Business outreach).
--
-- ve_outreach_free_check(listing): their latest finished audit from the last 45 days (the monthly check-ups cover every listed food
-- place; a full audit holds the free check's ten items), its free-check items to fix, most important first, three at most, each in the
-- check's own words ("Your home page has no search description."), and a link to their whole free check in the Vegan Restaurant Guide
-- (anyone opening it sees the free view). Nothing to fix, no audit, or an old one: an empty string, so the email reads as it did.
-- ve_outreach_render fills {free_check} from it (the earlier function is kept as ve_outreach_render_base and called first, so nothing
-- else in the email changes). The first email's template gains {free_check} after the guide line.
create or replace function public.ve_outreach_free_check(p_listing uuid)
returns text
language sql stable security definer set search_path to 'public'
as $$
  with a as (
    select au.id, au.items from ve_audits au
     where au.listing_id = p_listing and au.status = 'done' and au.created_at > now() - interval '45 days'
     order by au.created_at desc limit 1
  ), f as (
    select clean_found as found, cr.weight from a, jsonb_array_elements(a.items) i
      join ve_audit_criteria cr on cr.key = i->>'key' and cr.active and cr.in_free
      cross join lateral (select btrim(regexp_replace(coalesce(i->>'found', ''), '\s+', ' ', 'g')) as clean_found) x
     where i->>'state' = 'fix' and length(clean_found) between 8 and 220
     order by cr.weight desc limit 3
  )
  select case when (select count(*) from f) = 0 then '' else
    E'\n\nWe also ran our free restaurant check on ' || (select name from listings where id = p_listing) || E'. The first things worth fixing:\n' ||
    (select string_agg('- ' || found, E'\n' order by weight desc) from f) ||
    E'\n\nEvery item, and how to fix it, free: https://vegansexplore.com/guides/vegan-restaurant-guide#/audit/r/' || (select id from a)
  end
$$;
revoke all on function public.ve_outreach_free_check(uuid) from public, anon, authenticated;
grant execute on function public.ve_outreach_free_check(uuid) to service_role;

do $$
begin
  if not exists (select 1 from pg_proc where proname = 've_outreach_render_base') then
    alter function public.ve_outreach_render(uuid, integer) rename to ve_outreach_render_base;
  end if;
end $$;

create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
returns table(subject text, body text, to_email text, page_url text, guide_url text)
language sql stable security definer set search_path to 'public'
as $$
  select r.subject,
         case when position('{free_check}' in r.body) > 0
              then replace(r.body, '{free_check}', coalesce(case when c.listing_id is not null then ve_outreach_free_check(c.listing_id) end, ''))
              else r.body end,
         r.to_email, r.page_url, r.guide_url
    from ve_outreach_render_base(p_contact, p_step) r
    left join ve_outreach_contacts c on c.id = p_contact
$$;
revoke all on function public.ve_outreach_render(uuid, integer) from public, anon, authenticated;
grant execute on function public.ve_outreach_render(uuid, integer) to service_role;
revoke all on function public.ve_outreach_render_base(uuid, integer) from public, anon, authenticated;
grant execute on function public.ve_outreach_render_base(uuid, integer) to service_role;

update public.ve_outreach_templates
   set body = replace(body, '{link}{guide_line}', '{link}{guide_line}{free_check}'), updated_at = now()
 where program = 'business-outreach' and step = 1 and body not like '%{free_check}%';
