-- ve-chapter-rankings: a member's next-chapter suggestion lands in the Inbox (2026-11-09).
-- Adds one union to ve_inbox_items: a New suggestion from ve_next_chapter_suggestions, linking to
-- Depot > Next chapter suggestions (/admin/depot/next-chapters). It leaves the Inbox once it is added
-- to the board or set aside. A member named [TEST] stays out.
-- Applied by patching the live definition in place (the function is long and other sessions add
-- unions to it), so this never overwrites a union added since. Safe to run twice.
do $mig$
declare d text;
begin
  d := pg_get_functiondef('public.ve_inbox_items'::regproc);
  if position('next_chapter' in d) > 0 then return; end if;
  if position('  order by 3 desc;' in d) = 0 then raise exception 've_inbox_items: order by marker not found'; end if;
  d := replace(d, '  order by 3 desc;', $u$  union all
  select 'next_chapter', s.id, s.created_at, 'Next chapter suggestion', s.place,
    left(s.why, 200), s.member_id, m.name, m.email, m.home_community, '/admin/depot/next-chapters#s/' || s.id
  from ve_next_chapter_suggestions s left join members m on m.id = s.member_id
  where s.created_at >= p_since and s.status = 'new' and coalesce(m.name, '') not like '[TEST]%'
  order by 3 desc;$u$);
  execute d;
end $mig$;
