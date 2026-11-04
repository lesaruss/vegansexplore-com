-- ve-outreach-buckets: every outreach contact belongs to a door (Sean, 2026-11-04: "if it's a restaurant owner, they should get a restaurant...
-- if they're an entrepreneur... the entrepreneur... we're pulling them based off of the guide that's set up and ready to go").
-- A door is a Guide's front door. Only a door marked ready is pulled into a send; today only restaurant.
create table if not exists ve_outreach_doors (
  door text primary key,
  label text not null,
  guide_slug text,
  ready boolean not null default false,
  sort int not null default 100,
  note text
);
alter table ve_outreach_doors enable row level security;
insert into ve_outreach_doors (door, label, guide_slug, ready, sort, note) values
  ('restaurant', 'Restaurant', 'vegan-restaurant-guide', true, 10, 'Restaurants, bakeries and cafes, trucks, vendors, catering, meal prep'),
  ('business', 'Business', null, false, 20, 'Any other local business; its Guide is not ready'),
  ('brand', 'Brand', null, false, 30, 'Food and product brands'),
  ('nonprofit', 'Nonprofit', 'nonprofit-guide', false, 40, 'Nonprofits, rescues, sanctuaries'),
  ('group', 'Group', null, false, 50, 'Groups and events'),
  ('entrepreneur', 'Entrepreneur', null, false, 60, 'A person with a business idea, not a listing; set by hand'),
  ('supermarket', 'Supermarket', 'supermarket-guide', false, 70, 'Marketing staff of supermarket chains; set by hand')
on conflict (door) do nothing;

create or replace function ve_outreach_door_of(p_category text, p_segment text)
returns text language sql immutable as $$
  select case
    when p_segment = 'brand' then 'brand'
    when p_category in ('Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep') then 'restaurant'
    when p_category in ('Food Brands','Nutrition & Supplements','Brands') then 'brand'
    when p_category in ('Nonprofits','Rescues','Sanctuaries') then 'nonprofit'
    when p_category in ('Groups','Events') then 'group'
    else 'business' end
$$;

alter table ve_outreach_contacts add column if not exists door text;

create or replace function trg_ve_outreach_contact_door() returns trigger language plpgsql as $$
begin
  if new.door is null and new.listing_id is not null then
    new.door := ve_outreach_door_of((select category from listings where id = new.listing_id), new.segment);
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_outreach_contact_door on ve_outreach_contacts;
create trigger trg_ve_outreach_contact_door before insert on ve_outreach_contacts
  for each row execute function trg_ve_outreach_contact_door();

update ve_outreach_contacts c set door = ve_outreach_door_of(l.category, c.segment)
  from listings l where l.id = c.listing_id and c.door is null;
