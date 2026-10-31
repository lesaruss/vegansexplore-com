-- The photographer shot list on the Gig Board (BrandDesk build order, after onboarding; canon canon-ve-front-of-house v4:
-- "our Higgsfield photos for the sample restaurants are the standard photographers meet (a paid three-item trial, else the
-- blueprint)"). A client's starter shoot is a gig (gig_kind 'photo') tied to their listing (shoot_listing_id). Photographers
-- apply with a pitch, examples and their rate; when we ask, they send a paid three-item trial (the ask 'trial', sent only once
-- requested); the one we book is added to the client's brand kit as its photographer and works from the shot list
-- (/business/shoot?listing=<slug>), which is drawn from their Cartridge (photos.shoot names the menu items in this shoot).

alter table public.ve_bounties add column if not exists shoot_listing_id uuid references public.listings(id);
create index if not exists ve_bounties_shoot_listing on public.ve_bounties(shoot_listing_id) where shoot_listing_id is not null;

alter table public.ve_bounties drop constraint if exists ve_bounties_gig_kind_check;
alter table public.ve_bounties add constraint ve_bounties_gig_kind_check
  check (gig_kind in ('campaign', 'collab', 'hosting', 'event', 'content', 'bounty', 'photo'));

alter table public.ve_bounties drop constraint if exists ve_bounties_gig_fields_check;
alter table public.ve_bounties add constraint ve_bounties_gig_fields_check check (
  (perk is null or char_length(perk) <= 200)
  and (partner_name is null or char_length(partner_name) <= 120)
  and (req_min_followers is null or (req_min_followers >= 1 and req_min_followers <= 100000000))
  and (req_level is null or (req_level >= 1 and req_level <= 4))
  and req_platforms <@ array['instagram', 'tiktok', 'youtube', 'facebook', 'podcast']
  and asks <@ array['pitch', 'examples', 'audition', 'rate', 'trial']
  and (audition_prompt is null or char_length(audition_prompt) <= 600)
  and (apply_mode <> 'audition' or 'audition' = any (asks))
);
