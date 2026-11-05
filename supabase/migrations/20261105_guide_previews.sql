-- brooke-sellers: a Guide tailored to one person, held back as a preview (Sean, 2026-11-05: "Give her the Creator Guide tailored to her,
-- like the Restaurant Guide is tailored to a restaurant... build it in a preview and hold it back"). The Restaurant Guide's personal link is
-- ?b=<outreach code>; this is the same idea for a person: /guides/creator-guide?p=<token> opens a Your page tab drawn from ve_guide_preview().
-- One row a person and Guide. Nothing here is sent anywhere; the token is the only way in, and status 'revoked' closes it.
create table if not exists ve_guide_previews (
  token        text primary key,
  guide_slug   text not null,
  person_name  text not null,
  first_name   text not null,
  family       text not null,          -- listings.details.family / details.families of their pages
  main_slug    text not null,          -- their People listing
  status       text not null default 'preview' check (status in ('preview','shared','revoked')),
  note         text,
  created_by   text,
  created_at   timestamptz not null default now(),
  opened_at    timestamptz,
  open_count   integer not null default 0
);
alter table ve_guide_previews enable row level security;

-- What the page reads: who it is for, their pages and each page's numbers since it went up. Public by token only; a wrong, revoked or
-- other Guide's token gets null. Counts views only from ve_listing_events (bots are never logged there), our team's visits included.
create or replace function ve_guide_preview(p_token text, p_guide text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r ve_guide_previews; v jsonb;
begin
  select * into r from ve_guide_previews where token = p_token and guide_slug = p_guide and status <> 'revoked';
  if not found then return null; end if;
  update ve_guide_previews set opened_at = coalesce(opened_at, now()), open_count = open_count + 1 where token = p_token;
  select coalesce(jsonb_agg(x order by x->>'order', x->>'name'), '[]'::jsonb) into v from (
    select jsonb_build_object(
      'slug', l.slug, 'name', l.name, 'category', l.category, 'logo_url', l.logo_url, 'votes', coalesce(l.vote_count, 0),
      'order', case when l.slug = r.main_slug then '0' when l.category = 'YouTube' then '1' when l.category = 'Podcasts' then '2' else '3' end,
      'since', (select min(e.created_at) from ve_listing_events e where e.listing_id = l.id),
      'views', (select count(*) from ve_listing_events e where e.listing_id = l.id and e.kind = 'view'),
      'visitors', (select count(distinct e.visitor) from ve_listing_events e where e.listing_id = l.id and e.kind = 'view'),
      'views_7', (select count(*) from ve_listing_events e where e.listing_id = l.id and e.kind = 'view' and e.created_at > now() - interval '7 days'),
      'actions', (select count(*) from ve_listing_events e where e.listing_id = l.id and e.kind <> 'view')
    ) x
    from listings l
    where l.status = 'approved' and (l.details->>'family' = r.family or coalesce(l.details->'families', '[]'::jsonb) ? r.family)
  ) s;
  return jsonb_build_object('first_name', r.first_name, 'name', r.person_name, 'main_slug', r.main_slug, 'status', r.status, 'pages', v);
end $$;
revoke all on function ve_guide_preview(text, text) from public;
grant execute on function ve_guide_preview(text, text) to anon, authenticated;

insert into ve_guide_previews (token, guide_slug, person_name, first_name, family, main_slug, status, note, created_by)
select encode(gen_random_bytes(16), 'hex'), 'creator-guide', 'Brooke Sellers', 'Brooke', 'brooke-sellers', 'brooke-sellers', 'preview',
       'brooke-sellers: her tailored Creator Guide, held back. Do not send until Sean says.', 'logan'
where not exists (select 1 from ve_guide_previews where guide_slug = 'creator-guide' and family = 'brooke-sellers');
