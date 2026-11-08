// ve-outreach-buckets: fill the Wednesday Nov 11 founding cohort follow-ups (migration 20261111_founding_cohort_1_wednesday_fill.sql).
// Deploy as ve-once-founding-wed with verify_jwt false and a fresh KEY from the scratchpad. Run ?step=show (reads only,
// returns the counts by bucket), then ?step=fill. Check with a SELECT, send a test of each, then redeploy the 410 stub.
import postgres from 'npm:postgres@3.4.4'

const KEY = '<random 48 hex characters>'
const CTE = `with s as (
  select m.person_key, m.person_name, m.person_id,
         bool_or(e.clicked_at is not null) clicked,
         bool_or(e.opened_at is not null) opened,
         bool_or(e.bounced_at is not null or e.complained_at is not null) bad,
         count(e.id) filter (where e.sent_at is not null) sent
  from public.ve_outreach_campaign_members m
  left join public.email_sends e
    on e.list_ref = 've-outreach-campaign:founding-cohort-1-2026-11'
   and e.campaign_ref like '%-c' || left(replace(m.id::text, '-', ''), 8) || '-%'
  where m.campaign_slug = 'founding-cohort-1-2026-11' and m.removed_at is null and m.step >= 1
  group by 1, 2, 3),
ok as (
  select s.*, case when clicked then 'founding-cohort-1-wed-clicked'
                   when opened then 'founding-cohort-1-wed-opened'
                   else 'founding-cohort-1-wed-quiet' end as bucket
  from s
  where sent > 0 and not bad
    and not exists (select 1 from public.email_suppressions x where x.active and lower(x.email) = lower(s.person_key))
    and not exists (select 1 from public.ve_outreach_campaign_members w
                    where w.campaign_slug like 'founding-cohort-1-wed-%' and w.removed_at is null
                      and lower(w.person_key) = lower(s.person_key)))
`
const STEPS: Record<string, string> = {
  show: CTE + `select bucket, count(*)::int n from ok group by bucket order by bucket;`,
  fill: CTE + `insert into public.ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status)
select bucket, person_key, person_name, person_id, 0, 'waiting' from ok;`,
}

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-run-key') !== KEY) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try {
    const out = await sql.begin(async (tx) => {
      const r: any = await tx.unsafe(STEPS[step])
      if (step === 'show') return { step, rows: Array.from(r) }
      // One count per statement, so a multi-statement step shows what each one touched.
      const counts = Array.isArray(r) && Array.isArray(r[0]) ? r.map((x: any) => x.count) : [r.count]
      return { step, counts }
    })
    return Response.json(out)
  } catch (e) {
    return Response.json({ step, error: String(e) }, { status: 500 })
  } finally {
    await sql.end()
  }
})

// The stub, once every step has run:
// Deno.serve(() => new Response(JSON.stringify({ error: 'gone' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
