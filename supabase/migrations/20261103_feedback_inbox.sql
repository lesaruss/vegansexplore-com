-- Depot > Feedback: the Inbox gains feedback sent through the site-wide Feedback button (appended to the live ve_inbox_items).
do $do$
declare d text;
begin
  d := pg_get_functiondef('public.ve_inbox_items(timestamp with time zone)'::regprocedure);
  if position('''feedback''' in d) > 0 then return; end if;
  d := regexp_replace(d, '\s*order by 3 desc;\s*\$function\$\s*$', '');
  d := d || $add$
  union all
  select 'feedback', f.id, f.created_at, 'Feedback', left(f.message, 160),
    left(concat_ws(' · ', f.kind, coalesce(f.page_label, f.page_url)), 200),
    null::uuid, f.name, f.email, null::text, '/admin/depot/feedback#item/' || f.id
  from ve_feedback f
  where f.created_at >= p_since and f.status = 'new' and coalesce(f.name, '') not like '[TEST]%'
  order by 3 desc;
$function$
$add$;
  execute d;
end $do$;
