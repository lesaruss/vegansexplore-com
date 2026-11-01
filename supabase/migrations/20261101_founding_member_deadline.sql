-- Founding Member: everyone who pays the $11 before midnight Eastern on January 1, 2027 (Sean, 2026-11-01: "your chance of
-- becoming a founding member expires at midnight on January 1st... that's a thing that sits on your profile").
-- Until today only invitations set members.founding_member, so paying members (Ron Arrindell, John Thomas) were never marked.
-- No more comped memberships (Sean, same day: "I'm not going to comp anybody"). Comps already given stay Founding Members.

insert into ve_site_settings (key, value)
values ('founding_member', jsonb_build_object('deadline', '2027-01-01T05:00:00Z', 'deadline_words', 'midnight Eastern on January 1, 2027', 'comps', false))
on conflict (key) do update set value = excluded.value;

create or replace function ve_founding_deadline() returns timestamptz
language sql stable security definer set search_path = public as $$
  select coalesce((select (value->>'deadline')::timestamptz from ve_site_settings where key = 'founding_member'), '2027-01-01T05:00:00Z'::timestamptz)
$$;

create or replace function ve_founding_on_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.entry_paid_at is not null
     and (tg_op = 'INSERT' or old.entry_paid_at is null)
     and new.entry_paid_at < ve_founding_deadline()
     and coalesce(new.member_class, 'member') <> 'agent' then
    new.founding_member := true;
  end if;
  return new;
end $$;

drop trigger if exists trg_ve_founding_on_paid on members;
create trigger trg_ve_founding_on_paid before insert or update of entry_paid_at on members
  for each row execute function ve_founding_on_paid();

-- Everyone who has already paid, the Guide accounts left out.
update members set founding_member = true
where entry_paid_at is not null and entry_paid_at < ve_founding_deadline()
  and coalesce(member_class, 'member') <> 'agent' and not coalesce(founding_member, false);
