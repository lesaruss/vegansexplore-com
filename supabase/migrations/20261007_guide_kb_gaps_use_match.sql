-- The to-do list counts a question as answered when the matching answers it today, not only when the
-- saved wording is identical ("is honey vegan" stayed on the list after "Is honey Vegan?" went live).
create or replace view public.guide_kb_gaps as
  select q.brand_slug, q.question_key,
         (array_agg(q.question order by q.created_at desc))[1] as question,
         count(*) as times_asked,
         count(distinct q.member_id) as members,
         max(q.created_at) as last_asked,
         (array_agg(q.reply order by q.created_at desc) filter (where q.reply is not null))[1] as latest_guide_reply
  from public.guide_kb_questions q
  where q.outcome <> 'answered'
    and not exists (select 1 from public.guide_kb_match(q.brand_slug, q.question, 1) m where m.score >= 0.42 and m.answer is not null)
  group by q.brand_slug, q.question_key
  order by count(*) desc, max(q.created_at) desc;
revoke all on public.guide_kb_gaps from anon, authenticated;
