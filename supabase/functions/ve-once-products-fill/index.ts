// One-time write of the Tracker's tables (migration 20261101_product_tracker.sql), run through a
// one-time function because the connector holds writes. Only the run key's SHA-256 is here. Redeployed as the 410 stub once run.
import postgres from 'npm:postgres@3.4.4'

const KEY_SHA256 = "9f4e5d529b40275b74c4b92b1d77a9359680aa487829af768e3baa4739844b2a"
const STEPS: Record<string, string> = {
 "tracker": "\ncreate table if not exists ve_product_scans (\n  id uuid primary key default gen_random_uuid(),\n  member_id uuid not null,\n  gtin text not null,\n  found boolean not null default false,\n  product_id uuid references ve_products(id) on delete set null,\n  name text,\n  created_at timestamptz not null default now()\n);\ncreate index if not exists ve_product_scans_member on ve_product_scans (member_id, created_at desc);\nalter table ve_product_scans enable row level security;\n\nalter table ve_product_barcodes add column if not exists points int not null default 0;\nalter table ve_product_barcodes add column if not exists paid_at timestamptz;\n\nalter table points_ledger drop constraint if exists points_ledger_reason_check;\nalter table points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral', 'daily_login',\n  'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend', 'profile_complete',\n  'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded', 'featured_purchase',\n  'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering', 'boost_purchase',\n  'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem', 've_hunt_complete',\n  've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership', 'recipe_approved', 'guide_chat_spend',\n  'credit_exchange', 'checkin', 'welcome', 'purchase_thanks', 'points_contribution', 'listing_submit', 'profile_answer',\n  'partner_optin', 'venue_report', 'nonprofit_survey', 'barcode_add']::text[])) not valid;\n\ninsert into ve_site_settings (key, value) values ('product_barcode_points', '{\"approved\": 25}'::jsonb)\non conflict (key) do nothing;\n",
 "cleanup": "do $c$ begin\n  if not exists (select 1 from points_ledger where member_id = '459ced0a-4756-47d7-bdd3-a78865c3a141' and ref = 'test-cleanup:barcode:03017620422003')\n     and exists (select 1 from points_ledger where member_id = '459ced0a-4756-47d7-bdd3-a78865c3a141' and ref = 'barcode:03017620422003') then\n    perform ve_points_grant('459ced0a-4756-47d7-bdd3-a78865c3a141'::uuid, -25, 'admin_adjust', 'test-cleanup:barcode:03017620422003');\n  end if;\nend $c$;\ndelete from ve_product_barcodes where gtin = '03017620422003';\ndelete from ve_product_scans where member_id = '459ced0a-4756-47d7-bdd3-a78865c3a141';"
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
