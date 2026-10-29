-- A Nonprofit Partner's link code keeps whole words (found in the 2026-10-29 test: "[TEST] Nonprofit Partner Org" became
-- TEST-NONPROFIT-PARTNE). Words are added while the code stays 21 characters or fewer, leaving room for a "-2" when taken.
-- Codes already made are left as they are. Safe to run twice.
create or replace function public.ve_partner_code(p_name text)
returns text language plpgsql stable security definer set search_path to 'public' as $$
declare base text := ''; w text; c text; k int := 1;
begin
  foreach w in array regexp_split_to_array(trim(both '-' from regexp_replace(upper(coalesce(p_name, '')), '[^A-Z0-9]+', '-', 'g')), '-') loop
    exit when w = '' or length(base) + length(w) + (case when base = '' then 0 else 1 end) > 21;
    base := base || case when base = '' then '' else '-' end || w;
  end loop;
  if base = '' then base := left(split_part(trim(both '-' from regexp_replace(upper(coalesce(p_name, '')), '[^A-Z0-9]+', '-', 'g')), '-', 1), 21); end if;
  if length(base) < 3 then base := 'ORG-' || upper(substr(md5(random()::text), 1, 4)); end if;
  c := base;
  while exists (select 1 from members where referral_code = c) or exists (select 1 from ve_nonprofit_partners where code = c) loop
    k := k + 1; c := base || '-' || k;
  end loop;
  return c;
end $$;
