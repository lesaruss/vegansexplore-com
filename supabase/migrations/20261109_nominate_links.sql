-- ve-nominate-someone: point the existing Nominate someone doors at /nominate (Sean, 2026-11-09: "merge").
-- 1. The SoFlo Vegans Podcast's Be part of the show: details.show_line.nominate_url, read by showLine in directory/listing.html
--    (the old comment-request code stays as the fallback).
-- 2. The Daily Pulse's Monday Who should we interview?: ve_pulse_house builds the link; it now opens /nominate with the city picked.
-- 3. The [TEST] nominations from the proof are removed.
-- Safe to run twice.

update listings
   set details = jsonb_set(details, '{show_line,nominate_url}', to_jsonb('/nominate?city=south-florida&source=show'::text))
 where slug = 'soflo-vegans-podcast' and details ? 'show_line';

do $$
declare def text;
begin
  select pg_get_functiondef(p.oid) into def
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 've_pulse_house';
  if def is not null and position('''/pulse/suggest?city='' || p_city' in def) > 0 then
    execute replace(def, '''/pulse/suggest?city='' || p_city', '''/nominate?city='' || p_city || ''&source=pulse''');
  end if;
end $$;

delete from ve_nominations where nominee_name like '[TEST]%' or nominator_name like '[TEST]%';
