# ve-signature-dishes: built, proven, merged, closed (2026-11-06)

Playbook `ve-signature-dishes` (canon `canon-ve-signature-dishes`). Done.

- **Rules (locked by Sean)**: any approved owner of a food listing features up to 3 dishes free; slots 4 and 5 are 50 points a slot for 30 days, no auto-renew; up to 20 saved; a featured dish needs a name, a photo at least 800 px on the shorter side and one line; the owner sets the order, votes never change it; Passport holders vote once per dish and can take it back; owners cannot vote on their own; it never replaces the menu.
- **Built**: migration `20261106_signature_dishes.sql` (tables `ve_signature_dishes`, `ve_dish_votes`, `ve_dish_slots`; `ve_dish_cap`, `ve_dish_slot_buy`; ledger reason `dish_slot`), edge function `ve-signature-dishes`, the owner's view on the business dashboard (`?tab=brand&pd=dishes`), the Overview section on listing pages (`#sig-dishes`), the sample business's three dishes, `/policies#business`, the Guides' facts and one saved answer (`20261106_signature_dishes_words.sql`), CLAUDE.md section.
- **Proven live** through `ve-once-dishes-proof` (now the 410 stub) on Love Life Cafe with test accounts; every test row, file and point put back; Love Life Cafe unclaimed again.
- **Merged to main** on Sean's word.
- **Parked by Sean**: J (slot reminder email 3 days before a paid slot ends), K (top Vegan dishes by chapter).
- **Open**: a real owner using it.
