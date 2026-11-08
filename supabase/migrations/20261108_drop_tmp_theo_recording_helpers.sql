-- ve-holiday-guide: drop the temp helpers left from recording Theo's Hanukkah and Christmas lines (2026-11-08).
-- Used once to call el-media tts and stt from the database; nothing reads them.
drop function if exists public.tmp_theo_rec_next();
drop function if exists public.tmp_theo_stt(text[]);
drop table if exists public.tmp_theo_rec;
