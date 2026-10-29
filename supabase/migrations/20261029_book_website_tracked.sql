-- A book listing's Website went straight to Amazon (https://www.amazon.com/dp/<ISBN-10>), so its clicks skipped our tracked link and
-- the Amazon Associates tag (2026-10-29). Every book with a tracked link now uses it as its Website; ve-books makeListing does the same
-- for new books. Safe to run twice.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'website', to_jsonb(website), to_jsonb('https://vegansexplore.com' || (details ->> 'buy_link')),
  jsonb_build_object('by', 'logan', 'why', 'Website through our tracked Amazon link so the Associates tag applies')
from listings where category = 'Books' and status = 'approved' and details ? 'buy_link' and website ilike '%amazon.%';
update listings set website = 'https://vegansexplore.com' || (details ->> 'buy_link'), updated_at = now()
where category = 'Books' and status = 'approved' and details ? 'buy_link' and website ilike '%amazon.%';
