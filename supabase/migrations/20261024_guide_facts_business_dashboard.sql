-- What the Guides know about businesses (Sean, 2026-10-24, canon-ve-business-dashboard): the $11 Founding Membership opens a
-- business owner's dashboard; the Partner plan adds the front-row seat. ve-guide-platform-facts is what the AI Guides answer
-- from; it must agree with guide_kb_answers and the site. Runs once (skips when the line is already there).
update knowledge_records
set body = jsonb_set(body, '{facts}', to_jsonb(replace(body->>'facts',
  'Guides never cost points directly.',
  E'Guides never cost points directly.\n- Businesses: any Vegan business can claim its Directory page or apply to be listed. An owner who is a Founding Member ($11, one time) gets their business dashboard on their page: their numbers (views, visitors, calls, directions, orders), their menu and page to edit, ads, our campaigns, the restaurant audit and the Guides. The Partner plan, $111 a quarter, adds a front-row seat on every campaign and ads placed for them; join before January 1, 2027 and the rest of 2026 is free (Front Row Start).'))),
 version = version + 1, change_summary = 'Businesses: the $11 Founding Membership opens the business dashboard (Sean 2026-10-24).', updated_by = 'logan', updated_at = now()
where slug = 've-guide-platform-facts' and body->>'facts' like '%Guides never cost points directly.%' and body->>'facts' not like '%- Businesses:%';
