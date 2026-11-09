// ve-explorer-path step 6 proof (2026-11-09): badges held, main badge, Explorer refused, take back, finish again.
// Runs as one DO block that always raises, so nothing is kept; the report is in the error. Deployed as ve-once-badges-proof, then the 410 stub.
import postgres from 'npm:postgres@3.4.4'

const KEY = '<random 48 hex characters>'
const STEPS: Record<string, string> = {
  proof: `do $$
declare m uuid := '272f2e70-6a33-41fb-a04b-245176690525'; k text := 'brionhurley@gmail.com'; adm uuid; r jsonb; o text := '';
begin
  select id into adm from members where is_superadmin and member_class <> 'agent' order by created_at limit 1;
  insert into ve_survey_completions(member_id, survey_slug, completed_at) values (m,'creator-guide', now()-interval '2 min');
  insert into ve_survey_completions(member_id, survey_slug, completed_at) values (m,'vegan-events-guide', now()-interval '1 min');
  o := o || '1 held=' || (select string_agg(b->>'key'||(case when (b->>'main')::bool then '*' else '' end), ',') from jsonb_array_elements(ve_member_badges(m)) b);
  r := ve_member_badge_set_main(m,'badge-creator');
  o := o || ' | 2 set creator ok=' || (r->>'ok') || ' main=' || (select b->>'key' from jsonb_array_elements(ve_member_badges(m)) b where (b->>'main')::bool);
  r := ve_member_badge_set_main(m,'badge-explorer');
  o := o || ' | 3 set explorer=' || coalesce(r->>'error','ok') || ' main_col=' || coalesce((select main_badge from members where id=m),'null');
  r := ve_tag_remove(k,'badge-creator',adm,'test take back');
  o := o || ' | 4 remove=' || coalesce(r::text,'null') || ' main=' || coalesce((select b->>'key' from jsonb_array_elements(ve_member_badges(m)) b where (b->>'main')::bool),'none')
     || ' held=' || (select string_agg(b->>'key', ',') from jsonb_array_elements(ve_member_badges(m)) b);
  delete from ve_survey_completions where member_id=m and survey_slug='creator-guide';
  insert into ve_survey_completions(member_id, survey_slug) values (m,'creator-guide');
  o := o || ' | 5 refinish held=' || (select string_agg(b->>'key', ',') from jsonb_array_elements(ve_member_badges(m)) b);
  r := ve_member_badge_set_main(m,'badge-creator');
  o := o || ' | 6 set removed creator=' || coalesce(r->>'error','ok');
  raise exception 'ROLLBACK REPORT: %', o;
end $$;`,
}

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try {
    const out = await sql.begin(async (tx) => { await tx.unsafe(STEPS[step]); return { step, ok: true } })
    return Response.json(out)
  } catch (e) {
    return Response.json({ step, report: String(e) }, { status: 200 })
  } finally {
    await sql.end()
  }
})
