// One-time write of three product labels from the brands' own websites (migration 20261101_product_brand_site_labels.sql), run through a
// one-time function because the connector holds writes. Only the run key's SHA-256 is here. Redeployed as the 410 stub once run.
import postgres from 'npm:postgres@3.4.4'

const KEY_SHA256 = "b052a610dd148be72a8f0b58371a0d99e49d08816926c14aa81f3bdd9de085a0"
const STEPS: Record<string, string> = {
 "labels": "\nupdate listings set details = jsonb_set(details, '{dairy_guide}', (\n    select jsonb_agg(case when e->>'cat' = 'Yogurt' then e || '{\"base\":\"Almond milk\",\"note\":\"Unsweetened Plain and Vanilla\"}'::jsonb else e end)\n    from jsonb_array_elements(details->'dairy_guide') e))\nwhere name = '365 by Whole Foods' and jsonb_typeof(details->'dairy_guide') = 'array';\n\nwith labels(slug, nf, src) as (values\n  ('365-by-whole-foods-cheese-slices', '{\"cal\":70,\"serving\":\"1 slice (23g)\",\"product\":\"365 Non-Dairy Cheddar Slices\",\"rows\":[[\"Total Fat\",\"5g\",\"6%\",0,1],[\"Saturated Fat\",\"4g\",\"20%\",1],[\"Cholesterol\",\"0mg\",\"0%\",0,1],[\"Sodium\",\"230mg\",\"10%\",0,1],[\"Total Carbohydrate\",\"6g\",\"2%\",0,1],[\"Dietary Fiber\",\"0g\",\"0%\",1],[\"Total Sugars\",\"0g\",\"\",1],[\"Protein\",\"0g\",\"\",0,1,1],[\"Calcium\",\"0mg\",\"0%\"],[\"Iron\",\"0mg\",\"0%\"]]}'::jsonb,\n   'Whole Foods Market''s product page for 365 Non-Dairy Cheddar Slices'),\n  ('365-by-whole-foods-yogurt', '{\"cal\":160,\"serving\":\"3/4 cup (170g)\",\"product\":\"365 Nondairy Almondmilk Yogurt, Unsweetened Plain\",\"rows\":[[\"Total Fat\",\"13g\",\"17%\",0,1],[\"Saturated Fat\",\"1g\",\"5%\",1],[\"Trans Fat\",\"0g\",\"\",1],[\"Cholesterol\",\"0mg\",\"0%\",0,1],[\"Sodium\",\"10mg\",\"0%\",0,1],[\"Total Carbohydrate\",\"9g\",\"3%\",0,1],[\"Dietary Fiber\",\"2g\",\"7%\",1],[\"Total Sugars\",\"1g\",\"\",1],[\"Protein\",\"5g\",\"\",0,1,1],[\"Calcium\",\"60mg\",\"4%\"],[\"Iron\",\"0.8mg\",\"4%\"]]}'::jsonb,\n   'Whole Foods Market''s product page for 365 Nondairy Almondmilk Yogurt, Unsweetened Plain'),\n  ('panacheeza-parmesan', '{\"cal\":50,\"serving\":\"1 Tbsp\",\"product\":\"Panacheeza Original\",\"rows\":[[\"Total Fat\",\"3g\",\"4%\",0,1],[\"Cholesterol\",\"0mg\",\"0%\",0,1],[\"Total Carbohydrate\",\"3g\",\"1%\",0,1],[\"Protein\",\"2g\",\"\",0,1,1]]}'::jsonb,\n   'Panacheeza''s product page (fat and carbohydrate worked out from the % Daily Value it gives)'))\nupdate ve_products p set nutrition = l.nf, macros = ve_nf_macros(l.nf), nutrition_source = l.src,\n  made_from = case when p.slug = '365-by-whole-foods-yogurt' then 'Almond milk' else p.made_from end\nfrom labels l where p.slug = l.slug;\n"
}

Deno.serve(async (req: Request) => {
  const given = new TextEncoder().encode(req.headers.get('x-run-key') || '')
  const hex = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', given))).map((b) => b.toString(16).padStart(2, '0')).join('')
  if (hex !== KEY_SHA256) return new Response('not found', { status: 404 })
  const step = new URL(req.url).searchParams.get('step') || ''
  if (!STEPS[step]) return Response.json({ error: 'unknown_step' }, { status: 400 })
  const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { max: 1, prepare: false })
  try {
    const out = await sql.begin(async (tx) => {
      const r: any = await tx.unsafe(STEPS[step])
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
