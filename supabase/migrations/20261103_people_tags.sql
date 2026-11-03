-- ve-pathways, profiles with groups, step 1 (Sean, 2026-11-03: "Go with your recommendation on all four"):
-- the proposal's "group" (a stakeholder bucket) is called a TAG here, so it never clashes with community groups (ve_group_*).
-- A person is keyed the way Depot > Outreach keys them (ve_people_outreach.person_key): a lower-case email, ig:<handle>, or a key we set.
-- Only people we have touched get a profile; a tag is put on by hand or by a rule. Rules start OFF and can be previewed before they are on.
-- A tag taken off is never put back by a rule (the row stays, removed_at set), the way In this story treats a removed match.

create table if not exists ve_tags (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null,
  kind        text not null default 'stakeholder',
  color       text not null default '#2D5C27',
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists ve_person_tags (
  id          uuid primary key default gen_random_uuid(),
  person_key  text not null check (person_key = lower(person_key) and length(person_key) between 3 and 200),
  tag_slug    text not null references ve_tags(slug) on update cascade,
  source      text not null check (source in ('hand','rule')),
  rule_id     uuid,
  added_by    uuid,
  note        text,
  added_at    timestamptz not null default now(),
  removed_at  timestamptz,
  removed_by  uuid,
  remove_note text,
  unique (person_key, tag_slug)
);
create index if not exists ve_person_tags_tag on ve_person_tags (tag_slug) where removed_at is null;

create table if not exists ve_tag_rules (
  id         uuid primary key default gen_random_uuid(),
  tag_slug   text not null references ve_tags(slug) on update cascade,
  name       text not null,
  kind       text not null check (kind in ('link_click')),
  -- link_click: any of initiative_slug, tag (one of the link's tags), code_prefix, all must match
  match      jsonb not null default '{}'::jsonb,
  enabled    boolean not null default false,
  created_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_added int
);

alter table ve_tags enable row level security;
alter table ve_person_tags enable row level security;
alter table ve_tag_rules enable row level security;

insert into ve_tags (slug, name, kind, color, description) values
  ('sponsor-interested', 'Sponsor interested', 'stakeholder', '#F69820', 'Showed interest in sponsoring: clicked a sponsor link or asked.'),
  ('vendor',             'Vendor',              'stakeholder', '#3A9B3E', 'Sells or could sell at our events and markets.'),
  ('volunteer',          'Volunteer',           'stakeholder', '#2D5C27', 'Offered to help or has helped.'),
  ('pre-ticket',         'Pre-ticket',          'stakeholder', '#0F1F14', 'Wants tickets before they open.')
on conflict (slug) do nothing;

-- Who would a rule tag right now (by its match), whether or not it is on. Empty match matches nobody (never "everyone").
create or replace function ve_tag_rule_matches(p_rule uuid)
returns table (person_key text, why text)
language plpgsql stable security definer set search_path = public as $$
declare r ve_tag_rules; m jsonb;
begin
  select * into r from ve_tag_rules where id = p_rule;
  if not found then return; end if;
  m := r.match;
  if r.kind = 'link_click' then
    if coalesce(m->>'initiative_slug','') = '' and coalesce(m->>'tag','') = '' and coalesce(m->>'code_prefix','') = '' then return; end if;
    return query
      select lower(i.email), 'Clicked a link'
             || coalesce(' (' || nullif(l.code,'') || ')', '')
        from ve_initiative_interest i
        left join ve_links l on l.id = i.link_id
       where i.action_type = 'link_click'
         and coalesce(i.email,'') <> ''
         and (coalesce(m->>'initiative_slug','') = '' or i.initiative_slug = m->>'initiative_slug')
         and (coalesce(m->>'tag','') = '' or (m->>'tag') = any (coalesce(i.tags, '{}')))
         and (coalesce(m->>'code_prefix','') = '' or l.code like (m->>'code_prefix') || '%')
       group by lower(i.email), l.code;
  end if;
end $$;

-- Run the rules. p_apply false: only report who each rule would tag. p_apply true: tag for rules that are ON, never anyone
-- who had the tag taken off. Returns one row a rule.
create or replace function ve_tag_rules_run(p_apply boolean default false)
returns table (out_rule uuid, out_name text, out_tag text, out_enabled boolean, would_tag int, tagged int)
language plpgsql security definer set search_path = public as $$
declare r record; n_would int; n_added int;
begin
  for r in select * from ve_tag_rules order by created_at loop
    select count(distinct m.person_key) into n_would
      from ve_tag_rule_matches(r.id) m
     where not exists (select 1 from ve_person_tags t where t.person_key = m.person_key and t.tag_slug = r.tag_slug);
    n_added := 0;
    if p_apply and r.enabled then
      with ins as (
        insert into ve_person_tags (person_key, tag_slug, source, rule_id, note)
        select distinct on (m.person_key) m.person_key, r.tag_slug, 'rule', r.id, m.why from ve_tag_rule_matches(r.id) m
        on conflict (person_key, tag_slug) do nothing
        returning 1)
      select count(*) into n_added from ins;
      update ve_tag_rules set last_run_at = now(), last_added = n_added where id = r.id;
    end if;
    out_rule := r.id; out_name := r.name; out_tag := r.tag_slug; out_enabled := r.enabled; would_tag := n_would; tagged := n_added;
    return next;
  end loop;
end $$;

-- By hand. Adding a tag that was taken off puts it back (a person decided).
create or replace function ve_tag_add(p_key text, p_tag text, p_by uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text := lower(btrim(p_key));
begin
  if k is null or length(k) < 3 then return jsonb_build_object('ok', false, 'error', 'bad_person'); end if;
  if not exists (select 1 from ve_tags where slug = p_tag and active) then return jsonb_build_object('ok', false, 'error', 'no_such_tag'); end if;
  insert into ve_person_tags (person_key, tag_slug, source, added_by, note)
  values (k, p_tag, 'hand', p_by, nullif(btrim(p_note), ''))
  on conflict (person_key, tag_slug) do update
     set removed_at = null, removed_by = null, remove_note = null, source = 'hand', added_by = p_by, added_at = now(),
         note = coalesce(nullif(btrim(p_note), ''), ve_person_tags.note);
  return jsonb_build_object('ok', true);
end $$;

-- Taking one off needs a reason; the row stays so history reads and a rule never puts it back.
create or replace function ve_tag_remove(p_key text, p_tag text, p_by uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k text := lower(btrim(p_key)); n int;
begin
  if coalesce(btrim(p_note), '') = '' then return jsonb_build_object('ok', false, 'error', 'note_required'); end if;
  update ve_person_tags set removed_at = now(), removed_by = p_by, remove_note = btrim(p_note)
   where person_key = k and tag_slug = p_tag and removed_at is null;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0, 'error', case when n = 0 then 'not_tagged' end);
end $$;

revoke all on function ve_tag_rule_matches(uuid), ve_tag_rules_run(boolean), ve_tag_add(text,text,uuid,text), ve_tag_remove(text,text,uuid,text) from public, anon, authenticated;
grant execute on function ve_tag_rule_matches(uuid), ve_tag_rules_run(boolean), ve_tag_add(text,text,uuid,text), ve_tag_remove(text,text,uuid,text) to service_role;

-- Applies only rules that are ON, so this does nothing until Sean turns a rule on.
select cron.schedule('ve-tag-rules', '*/15 * * * *', $$select * from ve_tag_rules_run(true)$$)
 where not exists (select 1 from cron.job where jobname = 've-tag-rules');
