-- 2026-10-29: book crawl cleanup (Logan, Build mode).
-- 1. Mastering Diabetes was built twice: Khambatta's 2020 hardcover and the 2022 paperback under Robby Barbaro.
--    Same book, so the paperback copy is merged into the hardcover listing (never deleted).
-- 2. La Promesa Del Meñique (Sailesh Rao) is a Spanish edition; the Directory lists English editions only.
update listings set status = 'rejected',
  details = details || jsonb_build_object('merged_into', '39c114b3-4fd6-4987-8499-9d56fc5f0c28',
    'merged_at', now(), 'status_before_merge', 'approved')
where id = '4a8bb5e1-2ecd-4450-a74a-61ee80fed9e6' and status = 'approved';
update ve_books set listing_id = '39c114b3-4fd6-4987-8499-9d56fc5f0c28',
  note = 'Same book as Khambatta''s Mastering Diabetes (2022 paperback); merged'
where id = 'af51358c-cb47-4ce3-86ab-59d5b1f7205b';

update listings set status = 'rejected',
  details = details || jsonb_build_object('removed_at', now(), 'removed_by', 'logan',
    'removed_reason', 'Spanish edition; the Directory lists English editions only', 'status_before_removed', 'approved')
where id = '4d56659b-5ca8-48bd-b669-9fe99154a483' and status = 'approved';
update ve_books set status = 'set_aside', note = 'Spanish edition; English editions only'
where id = '29cf5dfd-91cc-4132-9021-965b685fce08';
