-- 2026-11-13 (Logan): records for the LESARUSS.ai shop build (playbook ve-front-of-house, canon canon-ve-front-of-house v16
-- sales_route_v16). A playbook decision row, the canon's build note, a checkpoint and a stream event. Safe to run twice.
insert into public.playbook_records (slug, brand_slug, author, source, kind, body)
select 've-front-of-house', 'vegans-explore', 'Logan', 'text', 'decision',
 've-front-of-house: the LESARUSS.ai shop is live (2026-11-13). lesaruss.ai/shop lists seven items from lr_shop_items (lesaruss-hq migration 109): photos $250, video $250, press release $500 (Buy now, Stripe Checkout on LESARUSS Inc. acct ...HzdnUn through the lesaruss-shop edge function); Site $500 every 3 months, Managed $500 a month + $250 setup, social one platform $400 a month, PR outreach $750 a month (Get started: a request the team answers within one business day, until the v9 agreement is approved; flip lr_shop_items.mode to buy then). Each item shows what you get and a Green Leaf Kitchen example stamped Sample. Proven: a live $250 Checkout read back on HzdnUn, expired, [TEST] rows removed. Vegans Explore hands off: /business/managed, the pitch page''s Review and pay, /business photo and reel cards and the Business Guide''s Managed by us all go to the shop. The five bd_*_v9 Prices in the Vegans Explore account (acct ...C9oZhv) are inactive (0 subscriptions); bd_*_v1 untouched (one live managed_v1 client). Photographer jobs live on the Gig Board for Fort Lauderdale and Philadelphia ($75 paid trial, then their rate); the city list and drafts are in docs/outreach/2026-11-13-photographer-bench.md, waiting on Sean''s yes. Next: the coach frame and its sample coach demo (playbook lesaruss-ai-professional-frames).'
where not exists (select 1 from public.playbook_records where slug = 've-front-of-house' and body like 've-front-of-house: the LESARUSS.ai shop is live (2026-11-13)%');

update public.knowledge_records
   set body = jsonb_set(body, '{sales_route_v16}', ((body->'sales_route_v16') - 'not_built') || jsonb_build_object(
         'built', '2026-11-13 (Logan): lesaruss.ai/shop and /shop/<item> live (lesaruss-ai-site), the list in lr_shop_items, checkout in the lesaruss-shop edge function on STRIPE_SECRET_KEY_ACCT_LESARUSS (acct ...HzdnUn). One-time items buy now; Site, Managed, social and PR outreach take a request until the v9 agreement is approved. Every Vegans Explore buy button for these goes to the shop; the bd_*_v9 Prices in the Vegans Explore account are inactive. Photographer jobs live for Fort Lauderdale and Philadelphia.',
         'not_built', 'Subscriptions on the shop (flip lr_shop_items.mode to buy once the v9 agreement is approved); the managed social add-on ($500, two platforms) is not a shop item yet; ve-services still holds photo_shoot and reel at the old prices server-side (no page offers them).')),
       updated_at = now(), updated_by = 'Logan'
 where slug = 'canon-ve-front-of-house';

insert into public.brief_checkpoints (brand_slug, station, account, status, session_label, summary, next_step, open_items, handoff_url, files_touched)
select 'vegans-explore', 'Logan', 'contact@lesaruss.com', 'handed_off', 've-front-of-house: the LESARUSS.ai shop live (2026-11-13)',
 'lesaruss.ai/shop live: seven items with price, what you get and a Green Leaf Kitchen example; photos, video and press release buy on LESARUSS Inc. Stripe (proven live), the monthly plans start with a request until the v9 agreement. Vegans Explore buy buttons hand off to the shop; VE bd_*_v9 Prices inactive. Photographer jobs live in Fort Lauderdale and Philadelphia; list and drafts await Sean.',
 'The coach frame and its sample coach demo (playbook lesaruss-ai-professional-frames).',
 '["Sean: yes on the photographer drafts (docs/outreach/2026-11-13-photographer-bench.md)", "Sean: approve the v9 agreement; pick the lawyer service; then flip Site, Managed, social, PR outreach to Buy", "Sean: does Managed keep the 15-dish shoot, photo nights, ad allowance", "Still open: pace rule, V''s three line changes, check-ins every two weeks, phone recordings for frames 5, 14, 17, 22"]'::jsonb,
 'docs/handoff/2026-11-13-lesaruss-shop-live.md',
 '["lesaruss-ai-site: app/shop, lib/shop.ts, public/shop, app/site.tsx, app/sitemap.ts", "lesaruss-hq: supabase/functions/lesaruss-shop, supabase/migrations/109_lesaruss_shop.sql", "vegansexplore-com: business/managed.html, business/pitch.html, business/stops.html, business-guide.html, docs/outreach/2026-11-13-photographer-bench.md"]'::jsonb
where not exists (select 1 from public.brief_checkpoints where session_label = 've-front-of-house: the LESARUSS.ai shop live (2026-11-13)');

insert into public.stream_events (timestamp, owner, station, summary, keywords, status, context_link)
select now(), 'logan', 'lesaruss-ai', 'LESARUSS.ai shop live: lesaruss.ai/shop sells photos, video and press on LESARUSS Inc. Stripe; Vegans Explore buttons hand off; VE v9 Prices off; photographer jobs live in Fort Lauderdale and Philadelphia.',
 array['ve-front-of-house','lesaruss-shop','stripe','photographers'], 'completed', 'https://lesaruss.ai/shop'
where not exists (select 1 from public.stream_events where summary like 'LESARUSS.ai shop live:%');
