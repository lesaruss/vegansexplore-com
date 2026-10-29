-- Our Amazon Associates tracking ID (Sean, 2026-10-29). ve-links adds it to every /go/ link that leaves for amazon.com
-- (withAffiliate, cached 5 minutes). Other Amazon stores go untagged until their own tag is added under tags. Safe to run twice.
insert into ve_site_settings (key, value)
values ('amazon_associates', '{"tag": "vegansexplore-20", "tags": {}}'::jsonb)
on conflict (key) do update set value = jsonb_set(ve_site_settings.value, '{tag}', '"vegansexplore-20"');
