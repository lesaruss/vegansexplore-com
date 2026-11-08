-- ve-outreach-buckets (Sean, 2026-11-08): "select the people in the list... an action drop down where I could hold them out of the batch, or
-- I can actually put them in a do not email list... people that have gotten through the filters that I no longer want to communicate with."
-- Do not email for people (campaign members by email, not listings). It adds them to people_suppression (reason do_not_contact), which
-- email_is_suppressed reads, so no brand's email reaches them, and stops them in every campaign they are in (kept, not removed, so the list
-- shows it and it can be undone). Off releases only a do_not_contact suppression (an unsubscribe stays) and puts them back where they were.
create or replace function public.ve_people_do_not_email(p_emails text[], p_on boolean, p_by text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare em text; n int := 0;
begin
  foreach em in array coalesce(p_emails, '{}') loop
    em := lower(btrim(em));
    continue when em is null or em = '' or position('@' in em) = 0;
    if p_on then
      insert into people_suppression (email, reason, active, created_by)
      values (em, 'do_not_contact', true, coalesce(p_by, 'outreach'))
      on conflict (email) do update set active = true, reason = 'do_not_contact', released_at = null
        where not people_suppression.active;
      update ve_outreach_campaign_members set send_status = 'stopped', stop_reason = 'do not email'
        where person_key = em and listing_id is null and removed_at is null and send_status <> 'finished';
    else
      update people_suppression set active = false, released_at = now() where email = em and reason = 'do_not_contact' and active;
      update ve_outreach_campaign_members
        set send_status = case when step > 0 then 'in_sequence' else 'waiting' end, stop_reason = null,
            next_send_at = case when step > 0 then now() else null end
        where person_key = em and listing_id is null and removed_at is null and stop_reason = 'do not email';
    end if;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'changed', n);
end $$;
revoke all on function public.ve_people_do_not_email(text[], boolean, text) from public, anon, authenticated;
