-- Guide answers starter set (2026-10-06): 97 live answers and 16 questions for Sean, loaded from
-- supabase/seed/guide_kb_answers_v1.json (fetched by commit and checked by md5 before the insert).
-- Then paraphrases added from the live tuning run, so these phrasings answer:
update public.guide_kb_answers a set also_asked = a.also_asked || v.extra, updated_at = now(), updated_by = 'Logan'
from (values
 ('What do I get as a member?', array['what does the $11 get me', 'what do i get for $11', 'what comes with membership', 'member benefits']),
 ('Where can I find events?', array['are there any events coming up', 'what events are coming up in my city', 'what vegan events are coming up', 'events near me', 'things to do this weekend']),
 ('Where can I find Vegan food near me?', array['where should i eat', 'where can i get vegan brunch', 'best vegan pizza', 'good vegan restaurants in my city', 'places to eat', 'where to eat this weekend']),
 ('What is in the Directory?', array['where can i find vegan catering', 'find a vegan service', 'vegan products', 'find a vegan business']),
 ('How do I reach a real person?', array['how do i talk to someone', 'talk to a human', 'contact you', 'customer service', 'speak to a person'])
) v(q, extra)
where a.brand_slug = 'vegans-explore' and a.question = v.q;

-- Ask a person (2026-10-06): the answer about reaching a person points to it.
update public.guide_kb_answers set answer = 'Tap Ask a person under any answer, and your question goes to the team. You’ll get an answer by email as soon as we can. You can also use Send us a message in your dashboard.', updated_at = now(), updated_by = 'Logan'
where brand_slug = 'vegans-explore' and question = 'How do I reach a real person?';
