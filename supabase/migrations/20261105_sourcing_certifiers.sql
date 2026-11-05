-- ve-vegan-sourcing-guide: the first certification suppliers (Logan, 2026-11-05). No Google calls. Bios from web search results
-- (the certifiers' own pages as returned by search; this build session cannot open company sites). Safe to run twice.
-- Labels: Vegan Action and The Vegan Society certify Vegan only and are Vegan organizations (fully_vegan). The V-Label also certifies
-- vegetarian products, so it is offers_options. BeVeg is held for Sean (a for-profit certifier; which label fits a service is his call).
insert into ve_suppliers (slug, name, website, domain, kinds, label, bio, bio_source, source, country, checked_at)
values
 ('vegan-action-certified-vegan', 'Vegan Action (Certified Vegan)', 'https://vegan.org/certification', 'certification', '{vegan certification}', 'fully_vegan',
  'Vegan Action, the Vegan Awareness Foundation, is a US nonprofit that runs the Certified Vegan logo. A business applies to have its products checked against the program''s standards and then licenses the logo for its packaging.',
  'web search 2026-11-05 (company site unreachable from our build session): vegan.org certification pages as returned by search', 'web-search-2026-11', 'US', now()),
 ('the-vegan-society-vegan-trademark', 'The Vegan Society (Vegan Trademark)', 'https://www.vegansociety.com/your-business/vegan-trademark', 'certification', '{vegan certification}', 'fully_vegan',
  'The Vegan Society is the UK charity that coined the word vegan. Its Vegan Trademark is registered on products worldwide after the society checks that they contain no animal ingredients and are not tested on animals.',
  'web search 2026-11-05 (company site unreachable from our build session): vegansociety.com, chem-map.com, utopia.org', 'web-search-2026-11', 'GB', now()),
 ('v-label', 'V-Label (European Vegetarian Union)', 'https://www.v-label.com', 'certification', '{vegan certification,vegetarian certification}', 'offers_options',
  'The V-Label is licensed by the European Vegetarian Union and marks products and services as Vegan or vegetarian, with audits run by partners such as SGS. Check that a product carries the Vegan version of the label, not the vegetarian one.',
  'web search 2026-11-05 (company site unreachable from our build session): sgs.com webinar page, utopia.org', 'web-search-2026-11', null, now())
on conflict (slug) do nothing;
