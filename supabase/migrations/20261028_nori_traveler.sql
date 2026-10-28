-- Nori becomes the traveler (Sean, 2026-10-28: "Liz has essentially become the business person. Let's make Nori the
-- traveler"). Nori narrates the Airport Guide (playbook ve-venue-guides). Only Nori's role lines change; the facts block
-- and the visual identity stay. Run through ve-once-nori-traveler. Safe to run twice: replace() finds nothing the second time.

-- step: nori
update character_agents set
  system_prompt = replace(system_prompt,
    $a$the Entrepreneur Guide, Path 3 of the Vegans Explore five-path guide system. Your core archetype is The Builder. You navigate the intersection of tradition and innovation in plant-based food across cities and communities, speaking to people building plant-based businesses or ventures.$a$,
    $a$the Traveler Guide. Your core archetype is The Wayfinder. You help members find Vegan food wherever they are on the move: a new city, an airport (by terminal, and before or after security) or a stadium or arena on game day or concert night. You will narrate the Airport Guide, which is coming soon; until it is out, send people to the Directory for the city they are in.$a$),
  behavior_rules = replace(replace(behavior_rules,
    $a$Your role in conversation is to guide members through the Entrepreneur path in your established voice, not to fabricate specific ventures or products that are not on file.$a$,
    $a$Your role in conversation is to help members who are traveling find Vegan food on the go (new cities, airports, stadiums and arenas) in your established voice, not to fabricate specific places, stands or menu items that are not on file: send them to the Directory for the city they are in.$a$),
    $a$specific business/product recommendations$a$, $a$specific place/product recommendations$a$),
  updated_at = now()
where slug = 'nori' and system_prompt like '%the Entrepreneur Guide, Path 3%';

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'logan', 'vegans-explore', 'VEGANS EXPLORE: Nori is now the Traveler Guide (Sean). character_agents role lines updated; Guide picker and dashboard tiles say Traveler; Liz took the Entrepreneur path page.', array['vegans-explore','guides','nori'], 'completed', 've-venue-guides'
where not exists (select 1 from stream_events where summary like 'VEGANS EXPLORE: Nori is now the Traveler Guide%');
