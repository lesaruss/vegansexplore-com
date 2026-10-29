-- Tampa's gates from the airport's own gate map (Sean's upload, TPA "Hardstand Gates & Parking", May 2024): Airside A 1 to 18,
-- C 20 to 45 (we had 30 to 45), E 62 to 75 (we had none), F 78 to 90. Panda Express pinned at E69, as its source says.
update ve_venues set layout = jsonb_set(jsonb_set(layout, '{terminals,1,concourses,1,gates}', '"C20-C45"'),
  '{terminals,1,concourses,2,gates}', '"E62-E75"'), updated_at = now()
where slug = 'tpa' and layout->'terminals'->1->'concourses'->2->>'id' = 'E';
update ve_venue_spots s set map_sections = array['E69']
from ve_venues v where v.id = s.venue_id and v.slug = 'tpa' and s.name = 'Panda Express' and s.map_sections = '{}';
