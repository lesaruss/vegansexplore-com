-- 2026-11-18 sweep: the Apify token has been rejected since about Nov 12 (account details viewed Nov 9 and 10). Sean rotates it in Apify
-- and pastes the new value in Key Room (hq.lesaruss.ai/keys); requested_at puts the slot at the top. Every Apify function reads
-- lesaruss_secrets.APIFY_API_TOKEN, so nothing else needs the value. Safe to run twice.
update secret_rotation_plan set
  label = 'Apify API token (web reader, place discovery, event crawls, logo hunt, menus)',
  requested_at = now(),
  request_note = '1) Click "Open Apify" below and sign in. 2) Under Personal API tokens, click Rotate next to your token and confirm. 3) Copy the new token (it starts with apify_api_), paste it in the box below, Save. Then tell Logan "saved".'
where key = 'APIFY_API_TOKEN';
