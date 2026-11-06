-- ve-signature-dishes J: the note 3 days before a paid slot ends (un-parked 2026-11-06, built off; NOT APPLIED until Sean says go).
-- ve-nurture's dishTick claims a slot period by setting reminded_at before it sends, so a slot gets one note at most.
-- remind_result: sending | sent | already_sent | suppressed | invalid | kept | not_owner | nothing_comes_off | not_sendable.
-- It sends only while ve_site_settings nurture.dish_on is true AND nurture.dish_approved_hash equals the hash of the words in the code.
alter table ve_dish_slots add column if not exists reminded_at timestamptz;
alter table ve_dish_slots add column if not exists remind_result text;
alter table ve_dish_slots add column if not exists remind_send_id text;
