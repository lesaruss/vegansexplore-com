-- Venue Guides concept, locked by Sean 2026-10-28 (playbook ve-venue-guides, canon canon-ve-venue-guides).
-- The playbook row itself was inserted from the active playbook template the same day; this fills its narrators and
-- history, and records the decisions. Run through ve-once-venue-guides (the connector held the write). Safe to run twice.

-- step: playbook
update briefings set content =
  replace(replace(replace(replace(replace(replace(replace(content,
  $a$<li><strong>Narrators:</strong> Pascal (the Cultural Bridge, global palate) for the Airport Guide. Stadium &amp; Arena: River by default (Atlanta, fast-thinking, game-day energy), Sean's to change.</li>$a$,
  $a$<li><strong>Narrators:</strong> Nori for the Airport Guide (Nori becomes the traveler; Liz is now the business Guide). River for the Stadium &amp; Arena Guide, after a refreshed character design: still in his 20s, a new hairstyle and an updated look. Pascal stays culinary: the Vegan Meat Alternatives Guide.</li>$a$),
  $a$<summary>Sean <span class="grp-count">1</span></summary>$a$,
  $a$<summary>Characters <span class="grp-count">2</span></summary>$a$),
  $a$<li class="chk-item pending"><span class="chk-box"></span><span>Confirm River as the Stadium &amp; Arena Guide's narrator, or pick another.</span></li>$a$,
  $a$<li class="chk-item pending"><span class="chk-box"></span><span>River's new look: options made in Higgsfield from his current art (in his 20s, a new hairstyle), Sean picks one, then both shapes in VE_GUIDE_ART.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Nori's Guide record (character_agents, Guides' facts): from the Entrepreneur Guide to the traveler; Liz as the business Guide.</span></li>$a$),
  $a$Pending <span class="count">8</span>$a$, $a$Pending <span class="count">9</span>$a$),
  $a$Completed <span class="count">3</span>$a$, $a$Completed <span class="count">4</span>$a$),
  $a$<summary>Concept <span class="grp-count">3</span></summary>$a$, $a$<summary>Concept <span class="grp-count">4</span></summary>$a$),
  $a$<span>Points: 100 / 25 / 10 with a daily cap, locked by Sean (2026-10-28).</span></li>$a$,
  $a$<span>Points: 100 / 25 / 10 with a daily cap, locked by Sean (2026-10-28).</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Narrators: Nori for airports, River for stadiums and arenas (2026-10-28).</span></li>$a$),
  updated_at = now()
where slug = 've-venue-guides' and content not like '%Nori for the Airport Guide%';

update briefings set content = replace(content, '{{DECISION_HISTORY_HTML}}',
$h$      <h2>2026-10-28</h2>
      <p><strong>Decision (V).</strong> Narrators changed by Sean: Nori becomes the traveler and narrates the Airport Guide (Liz is now the business Guide); River narrates the Stadium &amp; Arena Guide after a refreshed design (still in his 20s, a new hairstyle); Pascal stays culinary, for the Vegan Meat Alternatives Guide.</p>
      <p><strong>Decision (V).</strong> Locked by Sean ("lock it, go with your defaults"). Two venue Guides on the Dairy Guide pattern: Stadium &amp; Arena (one Guide, a Stadiums / Arenas filter) and Airport (by terminal, before or after security). $11 or 1,100 points each, one venue free. Member corrections with a photo and a venue geofence, reviewed in the Depot: 100 first accepted, 25 agreeing, 10 still accurate, a daily cap of 5.</p>$h$),
  status_summary = $s$Locked by Sean 2026-10-28. Concept only: nothing is built yet. Two venue Guides on the Dairy Guide pattern (Stadium & Arena with River, Airport with Nori), kept fresh by members who confirm and correct menus for points.$s$,
  status_summary_updated_at = now()
where slug = 've-venue-guides' and content like '%{{DECISION_HISTORY_HTML}}%';

-- step: records
insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-venue-guides','vegans-explore','V','decision','text',
$b$Locked by Sean 2026-10-28 ("lock it, go with your defaults"). Two venue Guides on the Dairy Guide pattern: the Stadium & Arena Guide (one Guide, Stadiums / Arenas filter; not Game Day, since venues host concerts too) and the Airport Guide (by terminal, before or after security). $11 or 1,100 points each, one venue free. Members confirm and correct menus with a photo and a venue geofence, reviewed in the Depot: first accepted correction 100 points, later agreeing ones 25, still accurate 10, daily cap of 5. Items show last confirmed and age out at 35 days.$b$
where not exists (select 1 from playbook_records where slug='ve-venue-guides' and body like 'Locked by Sean 2026-10-28%');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-venue-guides','vegans-explore','V','decision','text',
$b$Narrators (Sean, 2026-10-28): Nori becomes the traveler and narrates the Airport Guide, since Liz has become the business Guide. River narrates the Stadium & Arena Guide after a character refresh: still in his 20s, a new hairstyle and an updated look. Pascal is culinary and belongs on the cooking and food Guides, such as the Vegan Meat Alternatives Guide.$b$
where not exists (select 1 from playbook_records where slug='ve-venue-guides' and body like 'Narrators (Sean, 2026-10-28)%');

insert into knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, body)
select 'canon-ve-venue-guides', 'Vegans Explore venue Guides: Stadium & Arena and Airport, kept accurate by members for points (LOCKED by Sean 2026-10-28)', 'decisions', 'guides', 'active', 'sar', false, 50,
 array['vegans-explore','guides','stadiums','arenas','airports','points','community-verification'], 1, 'v',
 jsonb_build_object(
  'rule','Two venue Guides on the Dairy Guide pattern: a venue mapped to the Vegan food inside it.',
  'guides','Stadium & Arena Guide (one Guide, stadiums and arenas together with a Stadiums / Arenas filter; amphitheaters and concert venues may join later) and Airport Guide (by terminal and by before or after security).',
  'naming','Not Game Day Guide: arenas and stadiums host concerts too. Not one Venues Guide: two are clearer to sell and search.',
  'start','Venues in our chapters first, Hard Rock Stadium first (Plant-Based Showcase), then expand; our chapters airports, then the world.',
  'price','$11 or 1,100 points each, one venue free as the example.',
  'narrators','Nori (now the traveler) for the Airport Guide; River for the Stadium & Arena Guide after a character refresh (in his 20s, a new hairstyle). Liz is the business Guide; Pascal is culinary (Vegan Meat Alternatives Guide).',
  'verification','Members confirm and correct items with a photo and a venue-wide geofence; every submission waits in a Depot review queue; points pay only on acceptance through ve_points_grant.',
  'points','First accepted correction 100; later submissions that agree 25 (they are told who was first); still accurate confirmation 10; daily cap of 5 paid submissions.',
  'freshness','Each item shows last confirmed and ages out at 35 days; a new season marks a stadium''s items stale until confirmed.',
  'playbook','ve-venue-guides')
where not exists (select 1 from knowledge_records where slug='canon-ve-venue-guides');

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'v','vegans-explore','VEGANS EXPLORE: venue Guides locked by Sean (Stadium & Arena Guide with River, Airport Guide with Nori; member corrections 100/25/10 points). Playbook ve-venue-guides, canon canon-ve-venue-guides.', array['vegans-explore','guides','playbook','decision'], 'completed', 've-venue-guides'
where not exists (select 1 from stream_events where context_link='ve-venue-guides');
