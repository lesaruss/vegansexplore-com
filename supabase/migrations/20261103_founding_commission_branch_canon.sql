-- Sean, 2026-11-03: Founding Members can reach 50% commission by levelling up; everyone who joins after the founding period tops out at 30%.
-- Canon note only; the ladder rows and functions are not changed yet (rates and thresholds are Logan's recommendation, Sean's to change).
update public.knowledge_records
set body = body || jsonb_build_object('founding_commission',
      'Sean, 2026-11-03: Founding Members can earn up to 50% but still have to level up to get there; anyone after the founding period can earn a maximum of 30%. The 30% (Level 4) is where a second, Founding-only branch begins, equated to the levels we have. Not built. Logan recommends Levels 5 to 8 at 35, 40, 45 and 50% from 50,000, 100,000, 200,000 and 400,000 lifetime points; Sean to confirm or change.'),
    version = version + 1, updated_by = 'logan', updated_at = now(),
    change_summary = 'Added the Founding commission branch (up to 50%) as Sean described it; thresholds are a recommendation.'
where slug = 'canon-ve-people-campaigns-doors' and not (body ? 'founding_commission');
