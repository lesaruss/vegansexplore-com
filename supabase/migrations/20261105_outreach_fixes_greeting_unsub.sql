-- Sean, 2026-11-05 (playbook ve-restaurant-guide): three fixes to the business outreach emails, all still drafts, nothing sent.
-- 1. Day 0 no longer carries a line from the monthly check-up ({free_check}). A machine-read finding in the very first email
--    has too thin a margin of error. The full check stays in the Guide, where the business reads it in context.
-- 2. A generic greeting when we are not sure of the name: the contact's first name is used only when the email address itself
--    contains it (jessica@sobev.com -> Hi Jessica). Otherwise "Hi there," and no name in the subject. People lists are unchanged.
-- 3. Business outreach gets its own sender brand, so its unsubscribe page is vegansexplore.com/unsubscribe, not Sean's newsletter's
--    (seanarussell.com). Same from line (Sean A. Russell <sean@mail.lesaruss.ai>), same replies (contact@lesaruss.com).

update ve_outreach_templates
   set body = replace(body, '{free_check}', ''), updated_at = now()
 where program = 'business-outreach' and step = 1 and position('{free_check}' in body) > 0;

insert into email_brands (slug, display_name, from_name, from_email, reply_to, unsubscribe_page_url, postal_address, active, notes, accent_color)
values ('ve-business-outreach', 'Vegans Explore business outreach', 'Sean A. Russell', 'sean@mail.lesaruss.ai', 'contact@lesaruss.com',
        'https://vegansexplore.com/unsubscribe', 'LESARUSS Inc., 300 SW 1st Ave, Suite 155, Fort Lauderdale, FL 33301', true,
        'Business outreach from Sean to Vegan businesses (ve-outreach city lists and partner onboarding). Unsubscribes land on vegansexplore.com.', '#2d7d31')
on conflict (slug) do nothing;

update ve_outreach_cities set sender_brand = 've-business-outreach' where kind = 'city';

-- No suppression carries over: on 2026-11-05 every suppression was scope global or blink, and global still applies.

create or replace function public.ve_outreach_name_ok(p_name text, p_email text)
returns boolean language sql immutable as $$
  select length(f) >= 2 and position(f in regexp_replace(lower(split_part(coalesce(p_email, ''), '@', 1)), '[^a-z]', '', 'g')) > 0
    from (select regexp_replace(lower(split_part(btrim(coalesce(p_name, '')), ' ', 1)), '[^a-z]', '', 'g') as f) x
$$;

create or replace function public.ve_outreach_render(p_contact uuid, p_step integer default 1)
returns table(subject text, body text, to_email text, page_url text, guide_url text)
language sql stable security definer set search_path to 'public' as $function$
  with x as (
    select r.*, c.listing_id, split_part(btrim(coalesce(c.contact_name, '')), ' ', 1) as first,
           (c.listing_id is null or ve_outreach_name_ok(c.contact_name, c.email)) as name_ok
      from ve_outreach_render_base(p_contact, p_step) r
      left join ve_outreach_contacts c on c.id = p_contact
  )
  select case when nullif(first, '') is not null and name_ok
              then replace(x.subject, '{first_name}', first)
              else replace(replace(x.subject, ', {first_name}', ''), '{first_name}', '') end,
         case when name_ok or nullif(first, '') is null then b
              else replace(b, 'Hi ' || first || ',', 'Hi there,') end,
         x.to_email, x.page_url, x.guide_url
    from x,
    lateral (select case when position('{free_check}' in x.body) > 0
                         then replace(x.body, '{free_check}', coalesce(case when x.listing_id is not null then ve_outreach_free_check(x.listing_id) end, ''))
                         else x.body end as b) bb
$function$;
