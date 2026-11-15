-- Best contact per media outlet (Sean, 2026-11-15: "go ahead with the best contacts"; playbook ve-newsroom).
-- One contact per outlet is marked best, by plain rules so every pick has a reason Sean can check:
--   1 the writer of one of their Vegan articles (the contact was found on an article in our coverage), with an email
--   2 their food, dining, restaurant, features, lifestyle or health person, with an email
--   3 the writer of one of their Vegan articles, no email (reach them through the tips inbox)
--   4 their food or features person, no email
--   5 their news tips or newsroom inbox
-- Ties go to the most recent find. A contact marked do_not_contact or bounced is never picked.
alter table public.ve_media_contacts add column if not exists is_best boolean not null default false;
alter table public.ve_media_contacts add column if not exists best_reason text;
create unique index if not exists ve_media_contacts_best on public.ve_media_contacts (outlet_id) where is_best;

create or replace function public.ve_media_pick_best(p_outlet uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update ve_media_contacts set is_best = false, best_reason = null
  where is_best and (p_outlet is null or outlet_id = p_outlet);
  with ranked as (
    select c.id, c.outlet_id, c.name, c.kind = 'person' as kind_person,
      (c.source_url in (select url from ve_media_coverage v where v.outlet_id = c.outlet_id)) as wrote_vegan,
      (coalesce(c.beat, '') || ' ' || coalesce(c.role, '')) ~* '(food|dining|restaurant|feature|lifestyle|health|wellness|culinary|\meat\M|\mdrink)' as food_beat,
      c.email is not null as has_email,
      c.kind = 'desk' and c.email ~* '^(tips|news|newsroom|newsdesk|editor|editorial|features|food|desk|hello|info)' as tips_desk,
      c.found_at
    from ve_media_contacts c
    where c.status not in ('do_not_contact', 'bounced') and (p_outlet is null or c.outlet_id = p_outlet)
  ), scored as (
    select id, outlet_id,
      case
        when kind_person and wrote_vegan and has_email then 1
        when kind_person and food_beat and has_email then 2
        when kind_person and wrote_vegan then 3
        when kind_person and food_beat then 4
        when tips_desk then 5
      end as rank,
      found_at, name
    from ranked
  ), best as (
    select distinct on (outlet_id) id, outlet_id, rank from scored where rank is not null order by outlet_id, rank, found_at desc, name
  )
  update ve_media_contacts c set is_best = true, best_reason = case b.rank
      when 1 then 'Wrote their Vegan coverage, email on their page'
      when 2 then 'Their food or features person, email on their page'
      when 3 then 'Wrote their Vegan coverage; no email published, ' || coalesce('reach them through ' || d.email, 'reach them through their site''s contact form')
      when 4 then 'Their food or features person; no email published, ' || coalesce('reach them through ' || d.email, 'reach them through their site''s contact form')
      when 5 then 'Their news tips inbox' end
  from best b left join lateral (
    select x.email from ve_media_contacts x where x.outlet_id = b.outlet_id and x.kind = 'desk' and x.email is not null
      and x.status not in ('do_not_contact', 'bounced') order by (x.email ~* '^(tips|news)') desc, x.found_at limit 1) d on true
  where c.id = b.id;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.ve_media_pick_best(uuid) from public, anon, authenticated;

select public.ve_media_pick_best(null);
