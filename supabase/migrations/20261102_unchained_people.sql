-- Jane Velez-Mitchell, Paige Parsons Roache and Sherri Johnson on each other's pages (Sean, 2026-11-02: "add Jane Velez Mitchell to Sherry
-- and Paige's people section, and then vice versa, since they're all part of the same organization", UnchainedTV). A People group in
-- details.linked on each page, after Affiliations; the family's own People section skips anyone already listed. Idempotent.
update listings l set details = jsonb_set(coalesce(l.details, '{}'::jsonb), '{linked}',
    coalesce((select jsonb_agg(g) from jsonb_array_elements(l.details->'linked') g where g->>'title' <> 'People'), '[]'::jsonb)
    || jsonb_build_array(jsonb_build_object('title', 'People', 'items', x.items::jsonb))),
  updated_at = now()
from (values
  ('paige-parsons-roache', '[{"slug":"sherri-johnson"},{"slug":"jane-velez-mitchell"}]'),
  ('sherri-johnson', '[{"slug":"paige-parsons-roache"},{"slug":"jane-velez-mitchell"}]'),
  ('jane-velez-mitchell', '[{"slug":"paige-parsons-roache"},{"slug":"sherri-johnson"}]')
) x(slug, items)
where l.slug = x.slug and l.status = 'approved';
