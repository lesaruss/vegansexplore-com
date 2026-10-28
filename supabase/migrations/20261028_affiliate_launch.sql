-- The affiliate program goes live for members (Sean, 2026-10-28: "launch the affiliate program"). Members now see what their link
-- earns on Points and levels; the terms are on /policies#membership. The Guides learn it too. Safe to run twice.

update public.ve_site_settings
set value = value || jsonb_build_object('live', true, 'launched_at', coalesce(value->>'launched_at', now()::text)), updated_at = now()
where key = 'affiliate_program';

update public.knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb(replace(body->>'facts',
      'Never offer pay, stipends or commissions beyond that.',
      'Never offer pay, stipends or commissions beyond that. Member links: every member has a personal link to the Passport. A friend who joins with it and becomes a member earns them 111 points, and from Level 2 the link earns a commission: 20% of the Passport at Level 2, 25% at Level 3 (Guides bought with money count too), 30% at Level 4, the most, on the $11 price only, for purchases in the 12 months after the friend joins, paid once $25 is ready after a 30-day hold. A member can send all of it to a nonprofit, rescue or sanctuary in the Directory, given in their name; never call that tax-deductible. Anyone sharing their link must say they earn from it. Members see it all on Points and levels in their dashboard; the terms are at vegansexplore.com/policies#membership.'))),
    updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' not like '%Member links: every member has a personal link%';

insert into public.guide_kb_answers (topic, question, also_asked, answer, link_url, link_label, status, source, question_key, created_by)
select 'points', 'Can I earn money from my link?',
  array['How do commissions work?', 'Do I get paid for referrals?', 'What is the affiliate program?', 'How much do I earn when someone joins with my link?'],
  'Yes, from Level 2. Every member has a link to the Passport: a friend who becomes a member earns you 111 points, and from Level 2 you also earn 20% of the Passport they buy, 25% at Level 3 (Guides too) and 30% at Level 4. You can keep it or give it to a rescue, sanctuary or nonprofit in your name. Points and levels in your dashboard shows it all.',
  '/dashboard/levels', 'Points and levels', 'live', 'logan', 'earn-from-my-link', 'logan'
where not exists (select 1 from public.guide_kb_answers where question_key = 'earn-from-my-link');
