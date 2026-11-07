-- branddesk-production-wing: Platform health timed out (2026-11-07). ve_ops_snapshot(null, true) took about 8.4 s, over the API's 8 s
-- statement timeout (the authenticator role), so Platform health (ve-ops `health`, and BrandDesk > Insights > Health) answered
-- load_failed. The cause: the Scheduled jobs check read cron.job_run_details (320,000 rows, indexed only on runid) once per job with a
-- lateral join. This reads the last 24 hours once, grouped by job (about 0.17 s). Only that join changes; a job with no runs still counts
-- 0 failures. Applied by replacing the text inside the live definition, and it refuses if the text is not there.
do $$
declare
  def text := pg_get_functiondef('public.ve_ops_snapshot(text,boolean)'::regprocedure);
  old text := E'      from cron.job j\n      left join lateral (\n        select count(*) filter (where d.status = ''failed'') as fails, max(d.end_time) filter (where d.status = ''succeeded'') as last_ok\n        from cron.job_run_details d where d.jobid = j.jobid and d.start_time > now() - interval ''24 hours''\n      ) f on true\n';
  new text := E'      from cron.job j\n      left join (\n        select d.jobid, count(*) filter (where d.status = ''failed'') as fails, max(d.end_time) filter (where d.status = ''succeeded'') as last_ok\n        from cron.job_run_details d where d.start_time > now() - interval ''24 hours'' group by d.jobid\n      ) f0 on f0.jobid = j.jobid\n      cross join lateral (select coalesce(f0.fails, 0) as fails, f0.last_ok) f\n';
begin
  if position(old in def) = 0 then
    if position('f0 on f0.jobid = j.jobid' in def) > 0 then return; end if; -- already applied
    raise exception 've_ops_snapshot: the cron join text was not found';
  end if;
  execute replace(def, old, new);
end $$;
