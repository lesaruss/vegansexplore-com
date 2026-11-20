-- Podcast Episode 147 (Sean, 2026-11-20): Dani's Transfarmation story removed to make room for Next Stop Vegan's owner in her own words
-- and Fiona the hippo. The connector held this delete for an approval that never showed, so it ran through the one-time function
-- ve-once-ep147-drop (step drop_transfarmation, 1 row), now the 410 stub. Safe to run twice.
delete from public.ve_pod_segments
 where episode_id = 'a1aa1e9f-8dce-4681-ada8-7e8fe7f0ff75' and position = 180 and title like '%Transfarmation%';
