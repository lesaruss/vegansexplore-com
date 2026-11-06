-- ve-signature-dishes H: what the Guides know and one free saved answer (canon canon-ve-signature-dishes). Applied through the Supabase connector.
update knowledge_records set body = jsonb_set(body, '{facts}', to_jsonb((body->>'facts') || E'\n- Signature dishes: once a food place''s claim is approved, its owner can feature up to 3 dishes on its Overview for free (a real photo and one line each), in the order the owner picks, from the business dashboard (Signature dishes). Two more spots are 50 points each for 30 days and never renew on their own. Members vote once per dish and can take it back; the counts show but never change the order; owners cannot vote on their own. It never replaces the menu.')),
  updated_at = now(), change_summary = 'Signature dishes (Sean, 2026-11-06, canon-ve-signature-dishes)'
where slug = 've-guide-platform-facts' and position('Signature dishes:' in body->>'facts') = 0;
insert into guide_kb_answers (brand_slug, topic, question, also_asked, answer, link_url, link_label, status, source, notes)
select 'vegans-explore', 'business', 'How do I feature my signature dishes?',
  array['Can I show my best dishes on my page?', 'What are signature dishes?', 'How many dishes can I feature?', 'Can members vote on my dishes?'],
  'Once we approve your claim, open your business dashboard and choose Signature dishes. You can feature up to 3 dishes for free, each with a photo and a line about it, in the order you choose. Two more spots are 50 points each for 30 days. Members vote on them and the counts show, but your order stays yours. Your menu is not changed.',
  'https://vegansexplore.com/business', 'For businesses', 'live', 'logan', 'Sean, 2026-11-06: canon-ve-signature-dishes'
where not exists (select 1 from guide_kb_answers where question ilike 'How do I feature my signature dishes?');
