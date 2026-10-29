-- Sean's own People profile (Sean, 2026-10-29: "yes, make me a People profile", after Pre-Vegans went into Books). The May Instagram
-- import held him quarantined as "Sean Russell" (@seanarussell82); that row becomes the profile, keeping the handle, the way the
-- directors' rows did. Founders, every chapter, no place. Host of every episode of the Vegans Explore Podcast, the SoFlo Vegans Podcast
-- and the Pre-Vegans Podcast (the shows' own descriptions name him for SoFlo and Pre-Vegans; the Vegans Explore transcripts are his
-- interviews). In the family `pre-vegans`, so his page carries the Pre-Vegans Podcast tab and his Books tab with Pre-Vegans. The bio is
-- written afterwards from his episodes (ve-people bio_draft) and his photo checked by eye. Safe to run twice.
with promote as (
  update public.listings x set status = 'approved', name = 'Sean Russell', slug = 'sean-russell', category = 'Founders', communities = array['all'],
    location = 'Online', vegan_status = null, crawl_source = 'people', initials = 'S', updated_at = now(),
    details = coalesce(x.details, '{}'::jsonb) || jsonb_build_object('family', 'pre-vegans', 'person', jsonb_build_object(
      'added', 'Sean, 2026-10-29, from the May import', 'title', 'Founder of Vegans Explore and host of the Vegans Explore Podcast',
      'speaker_names', jsonb_build_array('Sean Russell', 'Sean A. Russell', 'Sean'),
      'links', jsonb_build_array(
        jsonb_build_object('label', 'Pre-Vegans, his book', 'url', 'https://vegansexplore.com/directory/pre-vegans-by-sean-russell'),
        jsonb_build_object('label', 'Vegans Explore Podcast', 'url', 'https://vegansexplore.com/directory/vegans-explore-podcast'),
        jsonb_build_object('label', 'SoFlo Vegans Podcast', 'url', 'https://vegansexplore.com/directory/soflo-vegans-podcast'),
        jsonb_build_object('label', 'LESARUSS', 'url', 'https://lesaruss.com'))))
  where x.slug = 'seanarussell82' and x.status = 'quarantined' and not exists (select 1 from listings y where y.slug = 'sean-russell')
  returning x.id
), closed as (
  update public.ve_backlog_checks b set decision = 'listed', decided_at = now() from promote where b.listing_id = promote.id and b.decision is null
  returning b.listing_id
)
insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select p.id, 'episode', 'Host', c.id, c.published_at::date
from promote p join ve_pulse_content c on c.status = 'published'
  and c.podcast_show in ('Vegans Explore Podcast', 'SoFlo Vegans Podcast', 'Pre-Vegans Podcast')
on conflict do nothing;

-- The book names its author's profile.
update listings set details = details || '{"creator": "Sean Russell"}'::jsonb where slug = 'pre-vegans-by-sean-russell';
update ve_books b set author_listing_id = l.id from listings l where l.slug = 'sean-russell' and b.title_key = 'pre vegans' and b.author_key = 'russell';

-- Afterwards, the same day: the bio was written by ve-people bio_draft from his episodes (one line reworded to name Pre-Vegans), the
-- title set to "Founder of Vegans Explore and SoFlo Vegans, podcast host", the website seanarussell.com from his Instagram, and his
-- photo copied from @seanarussell82 through ve-people photo_instagram, all saved through ve-people save.
