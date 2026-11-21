-- Sean, 2026-11-21: "remove the Dolphins game from our calendar... We're not doing the Dolphins. That's scratched. I haven't heard back from her
-- since the 9th... we might just have to regroup once we're able to lock in our audience." Unpublished (pending, not featured), not cancelled:
-- "cancelled" shows a page saying its official page called it off, which is not what happened. The row and its Fevo ticket link stay for a
-- regroup. Anyone who bought through the Dolphins' Fevo link still has a seat at the game.
update events set status = 'pending', is_featured = false, updated_at = now() where id = '3f6a7e2e-efff-4b0e-80ce-580428d3cb52';
