-- ve-holiday-guide: a gift suggested from the Gift Guide can come from the brand itself, with a soft ask (Sean, 2026-11-10: "in the
-- submission, we can also ask optional, is there any item that you would like to contribute to our holiday giveaway that will start in
-- December? ... They could either say yes or no"). brand: the gift's brand as typed; brand_owner: they said it is their brand; giveaway:
-- their answer to the giveaway question (null when not asked or skipped); giveaway_note: what they would give. Safe to run twice.
alter table ve_holiday_wishes add column if not exists brand text;
alter table ve_holiday_wishes add column if not exists brand_owner boolean not null default false;
alter table ve_holiday_wishes add column if not exists giveaway text check (giveaway is null or giveaway in ('yes', 'no'));
alter table ve_holiday_wishes add column if not exists giveaway_note text;
