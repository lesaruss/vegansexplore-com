-- ve-explorer-path: Sean approved the Welcome Guide tour lookbook (2026-11-08: "We have a winner. I approve what I see.").
-- All 48 frames approved; the wrap-up record, playbook row, checkpoint and stream event; the capture's test search question removed.
do $$
declare tid uuid := (select id from ve_video_tours where slug = 'welcome-guide');
        sean uuid := (select id from members where is_superadmin and email = 'contact@lesaruss.com' limit 1);
begin
  update ve_video_shots set status = 'approved', decided_at = now(), decided_by = coalesce(decided_by, sean), note = null
   where tour_id = tid and status <> 'approved';

  delete from ve_search_question_askers where question_id in (select id from ve_search_questions where q_key = 'vegan ice skating rink');
  delete from ve_search_questions where q_key = 'vegan ice skating rink';

  if not exists (select 1 from playbook_records where slug = 've-explorer-path' and body like 've-explorer-path: Welcome Guide tour lookbook approved%') then
    insert into playbook_records (slug, brand_slug, author, source, kind, body) values ('ve-explorer-path', 'vegans-explore', 'Logan', 'text', 'decision',
      've-explorer-path: Welcome Guide tour lookbook approved (Sean, 2026-11-08: "We have a winner. I approve what I see."). '
      || 'Vertical 4:5 like the final video (ve_video_tours.aspect); image to image about every 3 s with a slight zoom; 48 frames, each its own picture: '
      || 'phone captures at 1080 x 1350, Guide scenes redrawn natively vertical (never stretched), city art outpainted, no Sample stamps on screen. '
      || 'Liz''s 8 chapters: chapter 1 re-recorded with a beat after "Let''s go" (tour-1-v3), chapter 4 adds what points are worth (tour-4-v2a: giveaways, '
      || 'opportunities and discounts on the way; businesses and nonprofits will be able to use points for promotion through us; worded as coming). '
      || 'Music bed under it (ve_video_tours.music_url, the launch bed). Image recipe locked in CLAUDE.md (Guide scenes). '
      || 'Next: render the final 4:5 video (frames, zoom, Liz, the bed), put it on the Welcome Guide, then step 4, the paths page (wording approved 2026-11-07).');
  end if;

  update ve_playbook_index set status = 'building', owner = 'Logan', updated_at = now(),
         next_action = 'Render the approved Welcome Guide tour as a 4:5 video (48 frames, slight zoom, Liz''s 8 chapters, the launch bed) and put it on the Welcome Guide; then build step 4, the paths page'
   where slug = 've-explorer-path';

  insert into brief_checkpoints (brand_slug, station, account, status, session_label, summary, next_step, handoff_url)
  values ('vegans-explore', 'cloud', 'logan', 'handed_off', 've-explorer-path: Welcome Guide tour lookbook approved',
    've-explorer-path: the tour lookbook is vertical 4:5, 48 frames all approved by Sean, chapter 1 and 4 re-recorded, music bed added, image recipe locked.',
    'Render the final 4:5 tour video and put it on the Welcome Guide; then the paths page.',
    'docs/handoff/2026-11-08-ve-explorer-path-tour-recorded.md');

  insert into stream_events (owner, station, summary, keywords, status)
  values ('logan', 'cloud', 've-explorer-path: Welcome Guide tour lookbook approved by Sean (48 vertical frames, new takes for chapters 1 and 4, music bed)',
    array['ve-explorer-path','welcome-guide','tour','lookbook'], 'done');
end $$;
