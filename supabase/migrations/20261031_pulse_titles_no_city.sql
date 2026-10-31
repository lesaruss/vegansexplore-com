-- Daily Pulse titles carry no "<City> Pulse:" prefix (Sean, 2026-10-31: "just have a pill that says Central Florida...
-- the titles will be a little cleaner"). Applied the same day; pulse.html and ve-pulse-topics.js show the city as a tag.
update lesaruss_dispatch_sources set instructions = replace(instructions,
 '- title: "<City> Pulse: " plus the two or three things in today''s briefing, under 90 characters.',
 '- title: the two or three things in today''s briefing in plain words, under 80 characters, with no city name, no "Pulse" and no colon in front (Sean, 2026-10-31: the page shows the city as a tag, so the title is the news itself). Example: "A 120 seat Vegan cafe is coming, and the Miyoko recall".'),
 notes = coalesce(notes,'') || E'\n2026-10-31: titles drop the "<City> Pulse:" prefix (Sean).'
where key='pulse_topic_write' and instructions like '%- title: "<City> Pulse: " plus%';
