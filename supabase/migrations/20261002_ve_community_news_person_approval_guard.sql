-- City news reaches a hub only when a person approves it (Sean, 2026-10-02).
-- On 2026-09-27 an agent session bulk-approved 14 South Florida RSS stories with a raw UPDATE
-- and stamped them reviewed_by contact@lesaruss.com. From here, any row becoming approved must
-- come through ve_news_approve / ve_news_share_new, which require a Vegans Explore superadmin
-- and record that person as reviewed_by. A raw UPDATE or INSERT to approved is refused.

create or replace function public.ve_community_news_guard_approval()
returns trigger language plpgsql set search_path = public as $$
declare who text := nullif(current_setting('ve.news_approver', true), '');
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    if who is null then
      raise exception 'needs_person: city news is approved only by a person in the Depot Inbox, never by an agent or a raw write'
        using errcode = 'P0001';
    end if;
    new.reviewed_by := who;
    new.reviewed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists ve_community_news_guard_approval on public.ve_community_news;

create trigger ve_community_news_guard_approval
  before insert or update on public.ve_community_news
  for each row execute function public.ve_community_news_guard_approval();

create or replace function public.ve_news_check_approver(p_approver text)
returns text language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_approver, '')));
begin
  if e = '' then raise exception 'needs_person' using errcode = 'P0001'; end if;
  if not exists (select 1 from members where lower(email) = e and is_superadmin) then
    raise exception 'approver_not_superadmin' using errcode = 'P0001';
  end if;
  perform set_config('ve.news_approver', e, true);
  return e;
end $$;

-- Approve an existing row (a City News story or member submission waiting in the Inbox).
create or replace function public.ve_news_approve(p_approver text, p_id uuid, p_city text default null, p_published_at timestamptz default null)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  perform public.ve_news_check_approver(p_approver);
  update ve_community_news
     set status = 'approved', city_slug = coalesce(p_city, city_slug),
         published_at = coalesce(p_published_at, published_at, now())
   where id = p_id;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  return p_id;
end $$;

-- Share a News Desk lead to a hub as a new approved link.
create or replace function public.ve_news_share_new(p_approver text, p_city text, p_headline text, p_summary text, p_url text, p_image_url text, p_source_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform public.ve_news_check_approver(p_approver);
  insert into ve_community_news (city_slug, headline, summary, url, image_url, source_type, source_name, status, published_at)
  values (p_city, p_headline, p_summary, p_url, p_image_url, 'manual', p_source_name, 'approved', now())
  returning id into new_id;
  return new_id;
end $$;

revoke all on function public.ve_news_check_approver(text) from public, anon, authenticated;

revoke all on function public.ve_news_approve(text, uuid, text, timestamptz) from public, anon, authenticated;

revoke all on function public.ve_news_share_new(text, text, text, text, text, text, text) from public, anon, authenticated;

grant execute on function public.ve_news_approve(text, uuid, text, timestamptz) to service_role;

grant execute on function public.ve_news_share_new(text, text, text, text, text, text, text) to service_role;
