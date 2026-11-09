-- ve-daily-pulse-discussion: features for the Nov 9 Pulse (applied live 2026-11-08 through the connector).
-- The Facebook bounty feature linked to an absolute URL, which the live ve-pulse-topics.js (v6) did not read as a bounty,
-- so it would have shown as a story. Relative link; the Pulse email makes it absolute (abs() in ve-pulse-subscribe).
update ve_pulse_features set story = jsonb_set(story, '{url}', '"/bounties?campaign=confirm-facebook"')
 where id = '0921f35b-b3df-4d6c-92af-47dfbce6fce6';
-- The greyhound feature (a draft from Depot > Ideas, not live) gets its topic, so if approved it files under For the animals.
update ve_pulse_features set story = story || '{"topic":"animals","national":true}'::jsonb
 where id = '54c8c359-714b-4be3-b3f4-5d7590f5963f';
