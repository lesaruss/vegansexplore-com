-- ve-outreach: Explorer v7 step 3 (canon-ve-door-guides v7 explorer_path_v7; Sean 2026-11-06: "build them" on defaults 1 and 2).
-- The explorer survey admits on finishing: no person check (ve_surveys.reviewed off), the abuse watch is the guard.
-- ve_survey_answer then calls ve_survey_door_admit on the answer that completes the required questions (Founding before 2027-01-01).
-- Nobody was waiting in review on the explorer survey when this ran. Safe to run twice.
update public.ve_surveys
set reviewed = false,
    intro = 'Eight quick questions about you and where you live, about two minutes. Finish it and you are a member, with up to 250 points.'
where slug = 'explorer';
