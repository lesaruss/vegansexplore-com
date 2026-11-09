-- Wrap-up records, 2026-11-08 evening (ve-community-directory, ve-holiday-guide). Applied through the one-time ve-once-wrap-1108.
insert into playbook_records (slug, brand_slug, author, source, kind, body)
select v.slug, 'vegans-explore', 'logan', 'text', 'decision', v.body from (values
 ('ve-community-directory', 've-community-directory: listing sections live and the stricter name rule. Sean merged claude/epic-heisenberg-jjndg1 (main 74bc5be); Rowdy Girl, The Humane League and Renee King-Sonnen checked live at 1440 and 390 px. Name rule for brands and food places built on Sean''s go (20261109_listing_related_brands_food.sql, main 665447a): exact case, 2+ words and 9+ letters unless all generic, one-word names from details.match_names (16 listings), food places need their city in notes, whole-domain or @handle counts, 5+ notes-only on one show = one Show sponsor row, a show whose name contains the name never counts. Cron ve-listing-related every 15 min, 25 a run; 1,083 waiting at 8:50 PM ET, done about 9 AM ET Nov 9. Handoff docs/handoff/2026-11-09-ve-community-directory-ve-holiday-guide-wrap.md.'),
 ('ve-holiday-guide', 've-holiday-guide: Give Back flags decided by Sean and applied (20261108_give_back_flag_decisions.sql): Removed ena-kindness-in-action, lovelovinglove-inc, velveteen-rabbit-project, little-pet-project, pet-rehoming-network-philadelphia, fund-for-animals; On hold pets-washington-dc, thinking-animals-united; Donate off rude-ranch-animal-rescue, 101-paws-and-claws; locations fixed for Rude Ranch, Loving Acres, Freedom Hearts (renamed), Phoenix (Philadelphia chapter), Project Paws Alive (Braselton GA, every chapter). Hogs & Kisses: Why support kept, website to home page, comment request hogs-and-kisses to Anne Molina, Sean sends the link (no published email).')
) v(slug, body)
where not exists (select 1 from playbook_records p where p.slug = v.slug and p.body = v.body);

update ve_playbook_index set status = 'watching', owner = 'Logan', updated_at = now(),
  stage = 'Listing sections live (main 74bc5be); stricter name rule for brands and food places live (main 665447a), cache filling every 15 min until about 9 AM ET Nov 9.',
  next_action = 'Logan, Nov 9 after 9 AM ET: confirm the related cache finished for brands and food places and spot-check Oatly, Miyoko''s, Vedge, Beyond Meat at 1440 and 390 px.'
where slug = 've-community-directory';

update ve_playbook_index set status = 'waiting_on_sean', owner = 'Sean', updated_at = now(),
  stage = 'Give Back full run (558 of 673) and Sean''s flag decisions applied; Hogs & Kisses comment request ready.',
  next_action = 'Sean sends Anne Molina vegansexplore.com/comment/hogs-and-kisses; Logan writes Why support from her answer.'
where slug = 've-holiday-guide';

insert into brief_checkpoints (brand_slug, station, status, summary, next_step, session_label, handoff_url, files_touched, open_items)
select 'vegans-explore', 'vegans-explore', 'handed_off',
 've-community-directory: listing sections live, stricter name rule for brands and food places live. ve-holiday-guide: Give Back flags applied, Hogs & Kisses comment request',
 've-community-directory: confirm cache finished after 9 AM ET Nov 9 and spot-check pages. ve-holiday-guide: Sean sends Anne the Hogs & Kisses link',
 've-community-directory', 'docs/handoff/2026-11-09-ve-community-directory-ve-holiday-guide-wrap.md',
 '["directory/listing.html","supabase/migrations/20261109_listing_related_brands_food.sql","supabase/migrations/20261108_give_back_flag_decisions.sql","docs/proposals/listing-related-name-rule.md","CLAUDE.md"]'::jsonb,
 '["ve-community-directory: cache finish check Nov 9","ve-holiday-guide: Anne Molina comment","ve-holiday-guide: optional retry of 47 failed Give Back listings","ve-feedback: Directory / Directory breadcrumb on listings"]'::jsonb
where not exists (select 1 from brief_checkpoints where handoff_url = 'docs/handoff/2026-11-09-ve-community-directory-ve-holiday-guide-wrap.md');

insert into stream_events (owner, station, task_id, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', 've-community-directory',
 've-community-directory: stricter name rule for brands and food places live; ve-holiday-guide: Give Back flags applied',
 array['ve-community-directory','ve-holiday-guide','listing-related','give-back'], 'completed',
 'docs/handoff/2026-11-09-ve-community-directory-ve-holiday-guide-wrap.md'
where not exists (select 1 from stream_events where context_link = 'docs/handoff/2026-11-09-ve-community-directory-ve-holiday-guide-wrap.md');
