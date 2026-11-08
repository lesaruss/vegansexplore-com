-- ve-mobile-app (2026-11-07): Key Room rows for the app store keys. Applied through the Supabase connector.
-- Values were pasted by Sean in Key Room; they are never in this file. The lesaruss_secrets rows were made
-- as 'pending' placeholders so Key Room's save (an update) had a row to write to.
insert into lesaruss_secrets (key, value, description, updated_at) values
('ASC_API_KEY_P8','pending','App Store Connect API key (.p8 contents), Team Keys, App Manager (ve-mobile-app).','2000-01-01'),
('ASC_KEY_ID','pending','Key ID of ASC_API_KEY_P8 (ve-mobile-app).','2000-01-01'),
('ASC_ISSUER_ID','pending','App Store Connect Issuer ID (ve-mobile-app).','2000-01-01'),
('GOOGLE_PLAY_SERVICE_JSON','pending','Google Cloud service account JSON with release access in Play Console (ve-mobile-app).','2000-01-01'),
('EXPO_TOKEN','pending','Expo access token, user lesaruss, project @lesaruss/sapphire (ve-mobile-app).','2000-01-01')
on conflict (key) do nothing;
-- secret_rotation_plan rows (tier monthly, provider Apple / Google Play / Expo, requested_at set, request_note with the
-- step-by-step Sean followed) for the same five keys; see the live rows for the full notes.
-- Also 2026-11-07: knowledge_records canon-ve-mobile-app; briefings ve-mobile-app; ve_playbook_index ve-mobile-app.
