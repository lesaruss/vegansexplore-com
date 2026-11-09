-- ve-demo-showroom: Sean approved the 20-second v3 sample and said render the full video (2026-11-08, "approved, render the full video").
-- Wrap-up before the render: playbook record, playbook row, checkpoint and stream event. The full render is the next session's first job.
do $$
begin
  if not exists (select 1 from playbook_records where slug = 've-demo-showroom' and body like 've-demo-showroom: Green Leaf tour v3 sample approved%') then
    insert into playbook_records (slug, brand_slug, author, source, kind, body) values ('ve-demo-showroom', 'vegans-explore', 'Logan', 'text', 'decision',
      've-demo-showroom: Green Leaf tour v3 sample approved (Sean, 2026-11-08: "approved, render the full video"). '
      || 'The 23 s sample (frames 1-4, 1080 x 1350, still frames about 5 to 7 s, 0.4 s crossfades, no zoom, V''s own recordings, bed story-dining-v2 at -19 dB, -16 LUFS) is the look for the full 2:12. '
      || 'Live on main ee33c022: one-row Sample bars on /business/sample and /business/sample/site (More opens the controls), the lookbook pause fix and NOZOOM for green-leaf-tour. '
      || 'Next: render all 25 frames from scripts/tour-video/v3 (shots.json timings, all 11 lines), captions v-tour-v3.vtt, upload media/business/sample/v-tour-v3.mp4 through ve-once-tour-v3 (redeploy the uploader, then the 410 stub), point business/tour.html at v3 (keep v1), check live at 1440 and 390 px. '
      || 'Then the owner''s BrandDesk view, then the pricing_v9 build. Waiting on Sean: the pace rule (canon-video-shot-pace unchanged), V''s three line changes, check-ins every two weeks, optional phone recordings for frames 5, 14, 17, 22.');
  end if;

  update ve_playbook_index set status = 'building', owner = 'Logan', updated_at = now(),
         next_action = 'Render the full Green Leaf tour v3 (25 frames, the approved sample''s look), upload as v-tour-v3.mp4, point business/tour.html at it (keep v1), check live at 1440 and 390 px'
   where slug = 've-demo-showroom';

  insert into brief_checkpoints (brand_slug, station, account, status, session_label, summary, next_step, handoff_url)
  values ('vegans-explore', 'cloud', 'logan', 'handed_off', 've-demo-showroom: Green Leaf tour v3 sample approved',
    've-demo-showroom: v3 frames in the lookbook, Sample bars one row and the lookbook pause fix live (main ee33c022), 20 s sample approved by Sean.',
    'Render the full v3 tour, upload it, point the tour page at it, check live; then the owner BrandDesk view and pricing_v9.',
    'docs/handoff/2026-11-08-ve-demo-showroom-tour-v3-sample-approved.md');

  insert into stream_events (owner, station, summary, keywords, status)
  values ('logan', 'vegans-explore', 've-demo-showroom: Green Leaf tour v3 sample approved by Sean; full render next',
    array['ve-demo-showroom','green-leaf','tour','video'], 'completed');
end $$;
