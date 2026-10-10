-- Cleaning up the Directory from the outreach console (Sean, 2026-10-10: "the first two are no longer businesses... move
-- them to the closed and move them off the main list. People could still find them if they choose the closed option...
-- and I can also maybe leave a note"). ve-outreach listing_closed / listing_note / listing_logo_letter write the listing;
-- this keeps the email list in step however a listing gets closed (the console, or the listing page's admin editor).
-- Notes live in listings.details.admin_notes: [{at, by, kind: note|closed|logo, text}].

-- A listing marked permanently closed leaves the email list (anything not finished).
create or replace function public.ve_outreach_listing_closed() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if new.business_status = 'CLOSED_PERMANENTLY' and old.business_status is distinct from 'CLOSED_PERMANENTLY' then
    update ve_outreach_contacts set status = 'held', stop_reason = 'no longer in business', next_send_at = null,
      batch_id = case when status = 'not_sent' then null else batch_id end
    where listing_id = new.id and status in ('not_sent', 'in_sequence', 'interested');
  end if;
  return new;
end $fn$;
revoke all on function public.ve_outreach_listing_closed() from public, anon, authenticated;
create or replace trigger trg_ve_outreach_listing_closed after update of business_status on public.listings
  for each row execute function public.ve_outreach_listing_closed();

-- Planning never picks a closed business.
create or replace function public.ve_outreach_plan(p_city text, p_start date, p_sizes integer[])
returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare d date := p_start; i integer; b uuid; n integer := 0; k integer;
begin
  for i in 1 .. coalesce(array_length(p_sizes, 1), 0) loop
    while extract(isodow from d) > 5 loop d := d + 1; end loop;
    insert into ve_outreach_batches (community_slug, send_on) values (p_city, d) returning id into b;
    update ve_outreach_contacts set batch_id = b where id in (
      select c.id from ve_outreach_contacts c join listings l on l.id = c.listing_id
      where c.community_slug = p_city and c.status = 'not_sent' and c.batch_id is null
        and l.business_status is distinct from 'CLOSED_PERMANENTLY'
      order by (c.segment = 'brand') desc, l.name limit greatest(p_sizes[i], 0));
    get diagnostics k = row_count;
    if k = 0 then delete from ve_outreach_batches where id = b; exit; end if;
    n := n + k; d := d + 1;
  end loop;
  return n;
end $fn$;
revoke all on function public.ve_outreach_plan(text, date, integer[]) from public, anon, authenticated;
grant execute on function public.ve_outreach_plan(text, date, integer[]) to service_role;

-- 2026-10-10: five businesses the Directory already marked permanently closed were on the list (Raw Juce, The Chocolate
-- Chip Bakery, Bunkhouse Coffee, Crust, Purlife Cafe); they came off before anything was sent.
update public.ve_outreach_contacts c set status = 'held', stop_reason = 'closed: the Directory already marks this business permanently closed', batch_id = null
from public.listings l where l.id = c.listing_id and l.business_status = 'CLOSED_PERMANENTLY' and c.status = 'not_sent';
