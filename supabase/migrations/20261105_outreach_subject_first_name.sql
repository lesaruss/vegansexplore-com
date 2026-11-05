-- ve-restaurant-guide: the business emails' subjects never filled {first_name} (found 2026-11-05 in a dry run: Day 4 would have gone out as
-- "Your page is waiting, {first_name}"). ve_outreach_render_base fills it in the body only. The wrapper now fills it in the subject too;
-- with no contact name, ", {first_name}" is dropped rather than saying "there". The base function is unchanged.
create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
 returns table(subject text, body text, to_email text, page_url text, guide_url text)
 language sql stable security definer set search_path to 'public'
as $function$
  select case when nullif(split_part(btrim(coalesce(c.contact_name, '')), ' ', 1), '') is not null
              then replace(r.subject, '{first_name}', split_part(btrim(c.contact_name), ' ', 1))
              else replace(replace(r.subject, ', {first_name}', ''), '{first_name}', '') end,
         case when position('{free_check}' in r.body) > 0
              then replace(r.body, '{free_check}', coalesce(case when c.listing_id is not null then ve_outreach_free_check(c.listing_id) end, ''))
              else r.body end,
         r.to_email, r.page_url, r.guide_url
    from ve_outreach_render_base(p_contact, p_step) r
    left join ve_outreach_contacts c on c.id = p_contact
$function$;
