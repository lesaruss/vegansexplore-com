# ve-feedback: Directory adds from Sean's drops, the hub page bar, logo Save under the square (2026-11-07)

Playbooks: `ve-feedback`, `ve-community-directory`.

## Done and live
- **Added** (checked live): Craving Lisa's Compassionate Cuisine (Food Truck, Port Richey, Central Florida by hand), MyForest Foods (Food Brands,
  meat), the Vegan Squad Retreat event (Jan 29 to Feb 1, 2027). **Natuurlik** moved to Lake Park and reopened, its takeout menu entered (41 items),
  the Boynton Beach duplicate merged. **WildKind Packaging** is a supplier in the Restaurant Guide's Sourcing tab. Record:
  `supabase/migrations/20261107_directory_adds_sean_drops.sql`.
- **Not added**: The Pop Up NYC (Eventbrite marks it Cancelled; Sean: no need).
- **City hubs** use the one-line page bar (no Expand art), `public/ve-city-banner.js` (`isHubPage` removed). Page tour stays in
  `communities/hub.html`'s actions, hidden, in case Sean wants it back.
- **Edit listing's logo editor**: Save and Cancel centered under the logo square (`public/ve-listing-admin.js`, `.ledit-acts.under`). Not yet
  clicked signed in. Depot > Logos keeps its own Save and next at the bottom.
- Main b2af861.

## Open, for Sean
- Vegan Squad code VEGANSEXPLORE ($250 off, $250 to Sean a ticket): on the event page only with an "I earn from this" line. Not added.
- Port Richey and Orange Springs are in no chapter list (the retreat shows on /events, not a chapter's calendar). Adding them to CF is a small change.
- Natuurlik's menu shows for 35 days; natuurlik.net did not answer, so after that the Menu tab links to a dead site.
- Angela Yvonne (Vegan Pop Eats) has a hidden import row; Logan recommends making it a People profile.

## Next (Logan's recommendation)
The Directory queue: 330 Ready to list (mostly rescues, sanctuaries, nonprofits; light check, add, best-guess category, no Google), then 15 events
waiting, 6 Needs support, 123 on hold, 595 to check, 177 event leads, 627 with no logo.
