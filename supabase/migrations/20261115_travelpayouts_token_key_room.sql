-- Key Room slot for the Travelpayouts API token (playbook ve-travel, 2026-11-15).
-- Sean pastes the token at hq.lesaruss.ai/keys; it is never pasted into a chat.
insert into lesaruss_secrets (key, value, description) values ('TRAVELPAYOUTS_TOKEN', 'pending', 'Travelpayouts API token, LESARUSS account (Vegansexplore project): program status and Booking.com partner links for ve-travel')
on conflict (key) do nothing;
insert into secret_rotation_plan (key, provider, tier, dashboard_url, label, requested_at, request_note, notes)
values ('TRAVELPAYOUTS_TOKEN', 'Travelpayouts', 'manual', 'https://app.travelpayouts.com/profile/api-token',
 'Travelpayouts API token (Vegans Explore travel booking links)', now(),
 '1) Click "Open Travelpayouts" below and sign in to the LESARUSS account. 2) If the page does not open on it, go to your profile (top right) > API token. 3) Copy the API token, paste it in the box below, Save. Then tell Logan "saved".',
 'Playbook ve-travel. Read only by Logan to check the Booking.com program and make partner links; links go on the website only.')
on conflict (key) do update set requested_at = now(), request_note = excluded.request_note, dashboard_url = excluded.dashboard_url, label = excluded.label;
