-- Nutrition Guide: drop the temp helpers used once to stt-check Theo's 15 recorded lines (2026-11-15). Nothing reads them.
drop function if exists public.tmp_ng_stt_next();
drop table if exists public.tmp_ng_stt;
