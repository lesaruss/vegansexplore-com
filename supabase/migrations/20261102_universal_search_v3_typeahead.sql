-- Typeahead: a half-typed last word ("egg subst", "restaur in miami") is completed from the vocabulary before the search is read.
-- Only when the word is at least 5 letters, or the words before it already name something; "Sun" stays a name.
alter function ve_search(text, float8, float8, int, text) rename to ve_search_core;
revoke all on function ve_search_core(text, float8, float8, int, text) from public;
grant execute on function ve_search_core(text, float8, float8, int, text) to service_role;

create or replace function ve_search(p_q text, p_lat float8 default null, p_lng float8 default null, p_limit int default 20, p_brand text default 'vegans-explore')
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  q text := coalesce(p_q, ''); lastw text; head text; cw text; head_has boolean := false;
begin
  if q !~ '\s$' and length(btrim(q)) >= 4 then
    lastw := lower(regexp_replace(btrim(q), '^.*\s', ''));
    head := btrim(lower(regexp_replace(btrim(q), '\s*\S+$', '')));
    lastw := regexp_replace(lastw, '[^a-z0-9]', '', 'g');
    if length(lastw) >= 3 and not exists (select 1 from (select unnest(string_to_array(phrase, ' ')) w from ve_search_vocab where brand = p_brand) t where w = lastw or w = lastw || 's') then
      if head <> '' then
        head_has := exists (select 1 from ve_search_vocab where brand = p_brand and (' ' || head || ' ') like '% ' || phrase || ' %');
      end if;
      if length(lastw) >= 5 or head_has then
        select w into cw from (select unnest(string_to_array(phrase, ' ')) w from ve_search_vocab where brand = p_brand) t
          where w like lastw || '%' and w <> lastw group by w order by length(w), w limit 1;
        if cw is not null then
          q := btrim(regexp_replace(btrim(q), '\S+$', '')) || ' ' || cw;
        end if;
      end if;
    end if;
  end if;
  return ve_search_core(q, p_lat, p_lng, p_limit, p_brand);
end
$fn$;
revoke all on function ve_search(text, float8, float8, int, text) from public;
grant execute on function ve_search(text, float8, float8, int, text) to service_role;

insert into ve_search_benchmark (q, expect_label, expect_name, expect_place, note) values
 ('egg subst', 'Egg alternatives', 'JUST Egg', null, 'typeahead: a half-typed word'),
 ('restaur in miami', 'Restaurants', null, 'Miami', 'typeahead: a half-typed word'),
 ('sun', null, null, null, 'a short half word stays a name and is not turned into sunscreen');
