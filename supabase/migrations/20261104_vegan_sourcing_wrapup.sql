-- ve-vegan-sourcing-guide wrap-up (Logan, 2026-11-04). Applied through the Supabase connector.
-- Canon v2: stored in ve_suppliers, not listings; built on branch claude/ecstatic-galileo-lth5gz.
update knowledge_records set body = body || '{"built_2026_11_04":"Stored in its own table ve_suppliers (RLS on, no policies), not in listings, so the nightly outreach, logo, audit and essentials jobs cannot touch it; a supplier becomes a Directory listing only when it claims its page (listing_id). Served only by the ve-sourcing edge function to members who own the Guide or super admins. 134 PETA suppliers loaded (38 peta_approved, 96 offers_options). Sourcing tab built in the Vegan Restaurant Guide, members only, on branch claude/ecstatic-galileo-lth5gz."}'::jsonb,
  version = 2, change_summary = 'v2 2026-11-04: built the table, function and Restaurant Guide tab; storage is ve_suppliers, not listings', updated_by = 'logan', updated_at = now()
where slug = 'canon-ve-vegan-sourcing';
update ve_playbook_index set status='building', stage='Step 1 built on the branch (not on main); food suppliers next',
  next_action='Sean merges the branch and checks the Sourcing tab signed in. Logan: crawl food, drink, ingredient, packaging and co-packer suppliers (Google under the $50 cap, quote first), bios from their own sites.', owner='Logan', updated_at=now()
where slug='ve-vegan-sourcing-guide';
