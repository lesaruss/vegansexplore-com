-- Sean, 2026-11-11: "Let's use voice one for Pascal." (el-media save_voice -> xoZsUyv7Cr31qoQwMe70). Safe to run twice.
-- Already run directly: the pascal voice module in gfs_artist_bible and character_agents.elevenlabs_voice_id for pascal.
insert into public.gfs_artist_bible (artist_slug,module,module_label,data,version,status,updated_by)
select 'pascal','voice','Voice (Speaking / Singing)', jsonb_build_object('source','Voice Design from a chef brief (el-media design, voices/pascal/design-v1); Sean picked voice 1 of 3 on 2026-11-11.','status','approved','approved','Sean, 2026-11-11','provider','ElevenLabs','model_id','eleven_multilingual_v2','voice_id','xoZsUyv7Cr31qoQwMe70'),1,'complete','logan'
where not exists (select 1 from public.gfs_artist_bible where artist_slug='pascal' and module='voice');
update public.character_agents set elevenlabs_voice_id='xoZsUyv7Cr31qoQwMe70' where slug='pascal' and elevenlabs_voice_id is null;
update public.knowledge_records set version=2, updated_by='logan', updated_at=now(),
  change_summary='v2: Pascal''s voice picked (Sean: "Let''s use voice one for Pascal"); Liz covers every entrepreneur; the third show is SoFlo Vegans.',
  body = jsonb_set(jsonb_set(jsonb_set(body, '{roster,pascal,voice_id}', '"xoZsUyv7Cr31qoQwMe70"'::jsonb), '{open}', $j$["LESARUSS-style profile avatars after the Higgsfield top-up, in this order: Liz, Theo, Maya, River, Kai, Dani, Nori, Pascal; Kai's and Pascal's next drawings carry the Vegans Explore mark"]$j$::jsonb), '{entrepreneurs}', $j$"Sean, 2026-11-11: \"entrepreneurs are in everything we do. Every single guide is for entrepreneurs. So it doesn't make sense to have one person. So Liz is that person.\""$j$::jsonb)
where slug='canon-ve-guide-roster' and status='active' and version=1;
