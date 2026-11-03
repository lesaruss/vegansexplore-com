-- Sean, 2026-11-03: "Yes, anyone who becomes a member before January is a founding member." Both membership doors (the $11 and the survey)
-- make a Founding Member before midnight Eastern on 2027-01-01. Canon canon-ve-people-campaigns-doors v2.
update public.knowledge_records
set body = (body - 'founding_open_question') || jsonb_build_object('founding',
      'Sean, 2026-11-03: "Yes, anyone who becomes a member before January is a founding member." Either door (the $11 or the survey) makes a Founding Member before midnight Eastern on 2027-01-01; after it, neither does.'),
    version = version + 1, updated_by = 'logan', updated_at = now(),
    change_summary = 'Sean answered the open question: the survey door earns Founding Member too, before 2027-01-01.'
where slug = 'canon-ve-people-campaigns-doors' and body ? 'founding_open_question';
