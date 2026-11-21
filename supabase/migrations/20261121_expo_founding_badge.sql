-- World Vegan Expo: counting in now earns the Founding badge (LOCKED by Sean 2026-11-21, "lock it", on the stakeholder panel's fix:
-- "Count in now and you're first. First access to tickets, booths and speaking slots before the public, plus a Founding badge on your
-- profile. No fee, no deposit.").
-- Badges are ve_person_tags keyed by email, so the badge shows on the profile of a member now, or as soon as that email becomes one.
-- A badge the team takes back (removed_at set) stays off: on conflict do nothing.

insert into ve_tags (slug, name, kind, color, description, active)
values ('badge-expo-founding', 'Expo Founding', 'badge', '#C2410C', 'Counted in for the World Vegan Expo before it opened to the public.', true)
on conflict (slug) do nothing;

create or replace function ve_expo_founding_badge() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.initiative_slug = 'vegans-explore-initiative-world-vegan-expo'
     and new.tags @> array['expo-2028']
     and new.email is not null and length(btrim(new.email)) between 3 and 200 then
    insert into ve_person_tags (person_key, tag_slug, source, note)
    values (lower(btrim(new.email)), 'badge-expo-founding', 'rule', 'Counted in for the World Vegan Expo')
    on conflict (person_key, tag_slug) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_ve_expo_founding_badge on ve_initiative_interest;
create trigger trg_ve_expo_founding_badge after insert on ve_initiative_interest
  for each row execute function ve_expo_founding_badge();
