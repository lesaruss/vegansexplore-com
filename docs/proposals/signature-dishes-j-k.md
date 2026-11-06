# ve-signature-dishes: J (slot reminder, draft) and K (top dishes by chapter, proposal)

Un-parked 2026-11-06. Nothing is sent, applied, deployed or published. Live data that day: 0 dishes, 0 votes, 0 paid slots.

## J: the note before a paid slot ends (built, off, waiting for your read)

Built in `supabase/functions/ve-nurture/index.ts` (the email parent: it goes through email-send like the Restaurant Guide notes), on this
branch only. Not deployed. Migration `supabase/migrations/20261106_dish_slot_reminder.sql` (three columns on `ve_dish_slots`) is not applied.

**Who gets it**: the member who paid for slot 4 or 5, three days before it ends, once per slot period, only while they still own the
listing, and only when a featured dish would actually come off the page. A slot already kept for another 30 days, or a slot nobody is
using, gets nothing (Logan's defaults). Any day, 10 AM to 5 PM Eastern (a 3-day window cannot wait for Monday). From VEGANS EXPLORE,
signed Vegans Explore team, with the brand's unsubscribe and postal address. Campaign `ve-dish-slot-ending` in HQ > Email.

**It sends only when** you approve these exact words (`nurture.dish_approved_hash`) **and** the switch is on (`nurture.dish_on`).
Any change to the words puts it back to draft.

### The draft (sample business)

Subject: **Your dish slot 4 for Green Leaf Kitchen ends Sunday**

> Hi Alex,
>
> Slot 4 for Green Leaf Kitchen ends on Sunday, December 6. Slots do not renew on their own, so we wanted you to know ahead of time.
>
> When it ends, **Jerk Jackfruit Tacos** comes off your page. It stays saved in your dashboard, so you can put it back any time.
>
> To keep it on your page, add 30 more days for 50 points. Nothing is taken unless you choose to.
>
> [KEEP IT 30 MORE DAYS] → the dashboard's Signature dishes view, where that button already exists in a slot's last 7 days
>
> If you would rather let it end, there is nothing to do.
>
> Vegans Explore team

With two dishes coming off it reads "**X** and **Y** come off your page. They stay saved...".

### To turn it on (after you say go)
1. Merge this branch to `main`, apply the migration, deploy `ve-nurture` from that commit (source sha256 checked).
2. Preview and Send me a test: `ve-nurture` `preview` / `test` with `kind: 'dish-slot'` (optionally `slot_id`).
3. `settings` `{dish_approve: true}`, then `{dish_on: true}`.

## K: top Vegan dishes by chapter (proposal only, nothing built)

**What**: the most-voted featured signature dishes in each chapter, a short ranked list.

**Recommendation, with the defaults I take if you do not override:**
1. **Where it shows**: a **Top dishes** section on each chapter hub's Overview, under Most voted in <city> (six cards, the listing
   card family, each opening the listing). Not in the Directory's cards, not on a listing page (votes never change an owner's own
   order, and a public rank on their page would). Later, once there is enough, one line in the chapter's Daily Pulse "From Vegans
   Explore" once a month.
2. **What counts**: only dishes shown right now (featured, within the listing's cap, listing approved and claimed, not closed). A
   listing appears **once** (its top dish), so one place cannot fill the list.
3. **The window**: votes from the **last 90 days**, so a new dish can climb and an old one fades. All-time totals stay on each dish.
4. **Ties**: more distinct voters wins (they are the same today, one vote per member per dish), then the dish that reached that count
   first (the earliest last vote), then name A to Z. No owner or team boost, ever (featuring never buys rank).
5. **Showing up at all**: a chapter's list shows only once it has at least **3 dishes with 3 or more votes** each; until then the section
   is hidden (no "Coming soon").
6. **How Vegan**: the list carries the listing's How Vegan badge; Vegan-options places are included, labelled, never called Vegan.
   Being-vetted places (under 10 member votes, not claimed) cannot appear, since only claimed listings have dishes.
7. **Build**: one SQL function `ve_top_dishes(chapter, limit)` (chapter by `VE_HUBS` rule, the same as the Directory), a public action
   `top` in `ve-signature-dishes`, the section in `communities/hub.html` copied from Most voted in <city>.

**Open for you**: the 90-day window and the 3x3 threshold are mine; say if you want all-time or a lower bar.
