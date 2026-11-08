-- ve-demo-showroom: Sean's lookbook notes on the Green Leaf tour v2 (2026-11-08). Applied live through the connector.
with n as (select s.id, row_number() over (order by s.chapter_n, s.ord) fr
           from ve_video_shots s join ve_video_tours t on t.id = s.tour_id where t.slug = 'green-leaf-tour')
update ve_video_shots s set status = 'redo', decided_at = now(), updated_at = now(), note = case
  when n.fr = 3 then 'Sean 2026-11-08: jumbled, can''t tell what I''m looking at. Pick a better shot.'
  when n.fr = 4 then 'Sean 2026-11-08: text cut off halfway. Frame the whole section.'
  when n.fr in (19,20,21) then 'Sean 2026-11-08: halfway decent. Keep the idea; clearer, more headroom, no zoom-in.'
  else 'Sean 2026-11-08: mostly decent, needs headroom at the top (show it as it really looks on mobile), no zoom-in, clearer image.' end
from n where n.id = s.id;
