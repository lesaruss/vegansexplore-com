-- Content lane fixes (benchmark round 1): the limit applied to the wrong thing (about 15 moments came back for 5), a place question
-- ("sushi near me") pulled in episodes, and generic words ("diet", "healthy") drowned the specific topic. Literal text weighs more.
delete from ve_search_topics where phrase in ('diet', 'healthy');
do $do$
declare d text;
begin
  select pg_get_functiondef('ve_search_content(text,int,text)'::regprocedure) into d;
  d := replace(d, '+ 6 * ts_rank(', '+ 10 * ts_rank(');
  d := replace(d, E'  rest := '' '' || q || '' '';\n', E'  rest := '' '' || q || '' '';\n  if rest ~ '' (near me|nearby|around me|close to me|nearest) '' then\n    return jsonb_build_object(''intent'', jsonb_build_object(''labels'', ''[]''::jsonb, ''topics'', ''[]''::jsonb), ''moments'', ''[]''::jsonb, ''episodes'', ''[]''::jsonb, ''shows'', ''[]''::jsonb);\n  end if;\n');
  d := replace(d, E'  return jsonb_build_object(''intent'', jsonb_build_object(''labels'', to_jsonb(labels), ''topics'', to_jsonb(tps), ''terms'', words),',
    E'  mom := (select coalesce(jsonb_agg(z.e order by z.i), ''[]''::jsonb) from (select a.e, a.i from jsonb_array_elements(mom) with ordinality a(e, i) order by a.i limit lim) z);\n  oth := (select coalesce(jsonb_agg(z.e order by z.i), ''[]''::jsonb) from (select a.e, a.i from jsonb_array_elements(oth) with ordinality a(e, i) order by a.i limit lim) z);\n  return jsonb_build_object(''intent'', jsonb_build_object(''labels'', to_jsonb(labels), ''topics'', to_jsonb(tps), ''terms'', words),');
  if position('10 * ts_rank(' in d) = 0 or position('near me|nearby' in d) = 0 or position('with ordinality a(e, i)' in d) = 0 then raise exception 'a patch did not apply'; end if;
  execute d;
end
$do$;
