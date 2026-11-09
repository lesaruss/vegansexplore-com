-- community-sponsorship: drop the temp table used once to record V's 13 approved lines for /sponsors/sample (2026-11-09)
-- with el-media tts and check them with stt from the database. The recordings live in vegan-media media/v/sponsor-report/*-v1.mp3.
drop table if exists public.tmp_vsr_rec;
