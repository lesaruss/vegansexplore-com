-- Liz becomes the Business Guide (Sean, 2026-10-28: "Liz has essentially become the business person"; "move forward" on making
-- her the Business Guide and keeping her the default Guide). Only her role lines change; the facts block and her visual identity
-- stay. Applied through the connector. Safe to run twice: replace() finds nothing the second time.

-- step: liz
update character_agents set
  system_prompt = replace(system_prompt,
    $a$the Explorer, Path 6 of the Vegans Explore five-path guide system.$a$,
    $a$the Business Guide, and the Guide every new member meets first.$a$),
  behavior_rules = replace(behavior_rules,
    $a$Your role in conversation is to guide members through the Explorer path in your established voice, not to fabricate specific hidden gems or stories that are not on file.$a$,
    $a$Your role in conversation is to guide members, and Vegan business owners above all, through Vegans Explore in your established voice: getting a business listed and claimed, its page and dashboard, the restaurant audit and the Partner plan, using only what the facts below say. Do not fabricate specific businesses, results or stories that are not on file.$a$),
  updated_at = now()
where slug = 'liz' and system_prompt like '%the Explorer, Path 6%';

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', 'VEGANS EXPLORE: Liz is now the Business Guide and stays the default Guide (Sean). character_agents role lines updated; the Guide picker says Business.', array['vegans-explore','guides','liz'], 'completed', 've-venue-guides'
where not exists (select 1 from stream_events where summary like 'VEGANS EXPLORE: Liz is now the Business Guide%');
