-- Search questions: Liz answers a dead end, the queue, and search as an editorial tool (LOCKED by Sean 2026-11-03: "Love this... Lock it in").
-- Canon canon-ve-search-questions. Build record: the queue and Liz's card are built (20261103_search_questions_queue.sql, ve-search `ask`).
insert into public.knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, updated_by, change_summary, body)
select 'canon-ve-search-questions',
  'Vegans Explore: a search with no answer is a question for our team, Liz explains it, and what people ask feeds the Guides (LOCKED by Sean 2026-11-03)',
  'decisions', 'product', 'active', 'sar', false, 50,
  array['vegans-explore','search','guides','editorial','knowledge-base'], 1, 'logan', 'logan',
  'Locked by Sean: "Let''s move forward and do whatever we have to do. Lock it in."',
  jsonb_build_object(
    'why', 'Sean typed "vegan suit" into the header search and got "nothing matches yet". "When we don''t have a result for the specific question, I want there to be a page or a pop-up that explains... every question that you ask helps us make this knowledge base better... our team is going to work on getting the answers for you... we will send you a notification... anyone else that asked that question, we will have that answer ready for them... Liz be the one who delivers that message... sleek, clean." And: "we can use this as an editorial tool... if somebody''s asking for a suit... maybe we should write an article on vegan suits... any content that we create, we can add to these guides as added value... Our guides are these tools, these enrollment tools, but it''s also where we''re putting this content."',
    'rule', jsonb_build_array(
      'A search with nothing back is a question. It is queued once (ve_search_questions, by its words), every asker is kept (ve_search_question_askers), and each is told when it is answered. A duplicate adds an asker, never a row.',
      'Liz delivers it: the first time a visitor meets a dead end she opens as a card (her picture, four short lines, an optional email "to send you this answer", used for nothing else); after that, a one-line note with How this works. Her lines are text until Sean approves a recording.',
      'We promise no turnaround time, only that the team works the queue every day. The email is not a subscription.',
      'Answers go back in as search rows (vocabulary, listings, a Guide piece), so the next person finds them.',
      'Search is an editorial tool: the queue shows what people ask for, most asked first, each tagged with the Guide it belongs in (guide_slug). Content made to answer a question goes in that Guide as added value. The Guides are the site''s blog: tools and enrollment doors that also hold the content, and search reaches it.'),
    'built', 'The queue and both tables, ve_search_ask, ve-search action ask (and every zero-result logged search is queued), Liz''s card in the header search and on /search (public/ve-search.js, search.html).',
    'not_built', jsonb_build_array('The Depot queue view (most asked first, tag a Guide, answer, set aside)', 'Emailing askers when a question is answered, and the Inbox notice for a signed-in member', 'Guide articles inside the Guides, found by search', 'Filing the first vegan suit brands in Clothing and Fashion (its Suits & formal type is empty)'),
    'open', 'Who works the queue each day (Sean and Logan, or a Community Manager per chapter); whether a signed-out email also joins the Daily Pulse list (default no, until Pulse subscribe exists).'
  )
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-search-questions');
