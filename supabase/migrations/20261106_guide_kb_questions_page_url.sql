-- ve-page-guide step 3 (2026-11-06): members ask a page's Guide from its panel; the page they asked from is kept with the question.
alter table public.guide_kb_questions add column if not exists page_url text;
