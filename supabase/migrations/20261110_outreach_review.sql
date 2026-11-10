-- People in review (Sean, 2026-11-10): "put them in a temporary review section where I could find that, like in the people section...
-- it might just be they're not a business or it's something benign. But if it's somebody that I don't want to communicate with, then I may
-- not want to make that decision right then and there." From any group's list, selected people move to Review: they stop waiting (not sent)
-- and leave the list; in People > Review Sean later puts them back, marks them Do not contact, or removes them from the group.

create table if not exists public.ve_outreach_review (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.ve_outreach_campaign_members(id) on delete cascade,
  campaign_slug text not null,
  person_key text,
  person_name text,
  listing_id uuid,
  note text,
  added_by text,
  added_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution text check (resolution in ('put_back','do_not_contact','removed'))
);
alter table public.ve_outreach_review enable row level security;
create unique index if not exists ve_outreach_review_open on public.ve_outreach_review (member_id) where resolved_at is null;

CREATE OR REPLACE FUNCTION public.ve_outreach_review_add(p_member_ids uuid[], p_note text DEFAULT NULL::text, p_by text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare n int := 0; r record;
begin
  for r in select * from ve_outreach_campaign_members where id = any(p_member_ids) and removed_at is null loop
    insert into ve_outreach_review (member_id, campaign_slug, person_key, person_name, listing_id, note, added_by)
    values (r.id, r.campaign_slug, r.person_key, r.person_name, r.listing_id, nullif(btrim(p_note), ''), p_by)
    on conflict (member_id) where resolved_at is null do nothing;
    update ve_outreach_campaign_members set send_status = 'stopped', stop_reason = 'in review'
      where id = r.id and coalesce(step, 0) = 0 and send_status in ('waiting','stopped');
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'changed', n);
end $function$;

CREATE OR REPLACE FUNCTION public.ve_outreach_review_resolve(p_ids uuid[], p_resolution text, p_by text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare n int := 0; r record;
begin
  if p_resolution not in ('put_back','do_not_contact','removed') then return jsonb_build_object('error','bad_resolution'); end if;
  for r in select * from ve_outreach_review where id = any(p_ids) and resolved_at is null loop
    if p_resolution = 'put_back' then
      update ve_outreach_campaign_members set send_status = 'waiting', stop_reason = null where id = r.member_id and stop_reason = 'in review' and coalesce(step,0) = 0;
    elsif p_resolution = 'removed' then
      update ve_outreach_campaign_members set removed_at = now(), stop_reason = 'removed after review' where id = r.member_id;
    else
      if r.listing_id is not null then perform ve_do_not_contact_set(array[r.listing_id], true, 'From review', p_by);
      elsif r.person_key like '%@%' then perform ve_people_do_not_email(array[r.person_key], true, p_by); end if;
      update ve_outreach_campaign_members set send_status = 'stopped', stop_reason = 'do not email' where id = r.member_id and coalesce(step,0) = 0;
    end if;
    update ve_outreach_review set resolved_at = now(), resolved_by = p_by, resolution = p_resolution where id = r.id;
    n := n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'changed', n);
end $function$;
revoke all on function public.ve_outreach_review_add(uuid[], text, text) from public, anon, authenticated;
revoke all on function public.ve_outreach_review_resolve(uuid[], text, text) from public, anon, authenticated;

-- First: Alex Chisholm (The Krazy Vegan), Business group, Sean 2026-11-10.
select ve_outreach_review_add(array(select id from ve_outreach_campaign_members where campaign_slug = 'holiday-launch-business'
  and lower(person_key) = 'thekrazyvegan@gmail.com' and removed_at is null), 'Sean, 2026-11-10: legal history; not ready to decide', 'Sean');

-- Sean, 2026-11-10: "put Tori and Brett... throw them in the everyone else pile" (he had pulled them from Creators for the email's wording).
select ve_outreach_review_resolve(array(select id from ve_outreach_review where resolved_at is null and campaign_slug='holiday-launch-creator'
  and lower(person_key) in ('torre@torrewashington.com','brettwyoungsac@gmail.com')), 'removed', 'Sean: moved to Everyone Else');
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status)
select 'holiday-launch-explore', e, n, 0, 'waiting' from (values ('torre@torrewashington.com','Torre Washington'),('brettwyoungsac@gmail.com','Brett Young')) v(e,n)
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug='holiday-launch-explore' and lower(m.person_key)=v.e);
