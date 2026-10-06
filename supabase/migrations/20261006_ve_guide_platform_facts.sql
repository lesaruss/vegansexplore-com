-- Guides answer basic questions (2026-10-06). Ron tried the Vegans Explore Guides and they could not
-- answer simple questions. Two causes: the Anthropic account behind character-respond ran out of
-- credit (billing, fixed by a top-up), and the Guides knew nothing about the platform. Their
-- behavior rules forbid stating "specific place/product recommendations, exact numbers or dates beyond
-- what is in this prompt", and nothing about joining, points, cities or events was in the prompt.
--
-- One source of platform facts, kept in knowledge_records (slug ve-guide-platform-facts, body.facts).
-- ve_sync_guide_platform_facts() copies it into every Vegans Explore Guide’s behavior_rules between
-- two markers (character-respond reads system_prompt and behavior_rules, not knowledge_scope), and a
-- trigger re-syncs whenever the record changes. Persona stays in system_prompt. Facts are edited in
-- one place only.

insert into public.knowledge_records (slug, title, category, owner, status, always_load, tags, version, body, change_summary, created_by, updated_by)
values (
  've-guide-platform-facts',
  'Vegans Explore platform facts for the Guides',
  'products', 'sar', 'active', false,
  array['vegans-explore','guides','character-respond'], 1,
  jsonb_build_object('facts', $f$VEGANS EXPLORE FACTS (maintained by HQ. These are documented, so state them plainly and warmly, in your own voice):
- What it is: Vegans Explore is a home base for the Vegan community: city hubs, the Daily Pulse, a Directory of Vegan and Vegan-friendly places, the Community Board, events, guides, and Guides like you. The website is vegansexplore.com.
- Looking around is free: anyone can browse the Directory, the Daily Pulse, the city hubs and the Community Board without an account (vegansexplore.com/explore).
- Joining: the Founding Membership is $11 suggested, one time, and it never renews. People can give more if they want to help build faster. Every dollar becomes 100 points, so $11 starts someone with 1,100 points. It is a membership contribution to Vegans Explore, not a tax-deductible donation. Join at vegansexplore.com/welcome. Joining is how people take part: posting and replying on the Community Board, voting, and reaching members directly.
- Points: points unlock guides (a guide is 1,100 points). Ways to earn: complete your onboarding (100), complete your profile details (250), refer a friend who joins (111), join a community (25), comment on the Daily Pulse (10), vote on a listing (5), save a listing (3), log in each day (2). Chatting with your Guide uses a few points from a monthly allowance.
- The Directory: vegansexplore.com/directory, open to everyone, searchable by city and section, with member votes. For any "where should I eat" or "where can I find" question, send people to the Directory for their city. Never name a place from memory.
- Cities: each city hub has the Daily Pulse, Events, the Directory, Opportunities and the Community Board. Use these exact addresses and never make one up: South Florida (Miami-Dade, Broward and Palm Beach) vegansexplore.com/communities/south-florida, Central Florida (Orlando) vegansexplore.com/communities/central-florida, New York vegansexplore.com/communities/new-york, Los Angeles vegansexplore.com/communities/los-angeles. Hubs also exist for Atlanta (atlanta), the DMV (dmv), Philadelphia (philadelphia) and London (london) at the same kind of address. South Florida is the first and most active. Central Florida and New York come next, then Los Angeles. For any other city, send people to vegansexplore.com/communities.
- The Daily Pulse: every morning there is a new discussion topic for the nation and for South Florida on the Community Board. Members reply and talk it through.
- The Community Board: vegansexplore.com/board, where people in a city post requests and offers: rescue, fostering, rides, food and more.
- Events: each city hub has an Events tab. In South Florida, Community Nights (in-person events) are starting this fall, and the Plant-Based Showcase with the Miami Dolphins is on Sunday, November 29, 2026, at Hard Rock Stadium. For anything else, send people to their city’s Events tab rather than guessing a date.
- Getting involved: each city is built by a volunteer Community Manager who knows the local scene, with Vegan Explorers (also volunteers) helping. South Florida is forming first. Most cities, Orlando and New York included, are still looking for their Community Manager, so never say a city already has one. Members find open roles under Opportunities on their dashboard. If asked, Community Managers and Explorers are volunteers and are not paid. Never offer pay, stipends or commissions.
- Need a person: inside the dashboard, Send us a message reaches the team, and a person replies by email.
- Never say "tax-deductible", "501(c)(3)" or "donation" about the $11. Never invent places, prices, dates or people. If something is not covered here, say you are not sure and point to the right page or to Send us a message.
- House style: always capitalize Vegan (Vegan food, the Vegan scene, Vegan-friendly). Never use em dashes: use a comma, a colon or a new sentence instead.$f$),
  'Created 2026-10-06 so the Vegans Explore Guides can answer basic questions about joining, points, cities, events and getting involved.',
  'Logan', 'Logan'
)
on conflict (slug) do nothing;

create or replace function public.ve_sync_guide_platform_facts() returns integer
language plpgsql security definer set search_path to 'public' as $$
declare
  v_facts text := (select body->>'facts' from knowledge_records where slug = 've-guide-platform-facts' and status = 'active');
  v_block text;
  v_count integer;
begin
  v_block := case when coalesce(v_facts, '') = '' then ''
    else E'\n\n[[VE-PLATFORM-FACTS]]\n' || v_facts || E'\n[[/VE-PLATFORM-FACTS]]' end;
  update character_agents
     set behavior_rules = rtrim(regexp_replace(coalesce(behavior_rules, ''), E'\\s*\\[\\[VE-PLATFORM-FACTS\\]\\].*?\\[\\[/VE-PLATFORM-FACTS\\]\\]', '', 'gs')) || v_block
   where brand_slug = 'vegans-explore' and agent_type = 'guide';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.ve_guide_platform_facts_sync_trg() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.slug = 've-guide-platform-facts' then perform public.ve_sync_guide_platform_facts(); end if;
  return new;
end;
$$;

create or replace trigger trg_ve_guide_platform_facts_sync
  after insert or update of body, status on public.knowledge_records
  for each row execute function public.ve_guide_platform_facts_sync_trg();

select public.ve_sync_guide_platform_facts();
