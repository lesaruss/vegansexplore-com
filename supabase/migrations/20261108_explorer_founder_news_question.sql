-- ve-explorer-path: the Explorer survey's "How do you want to hear from us?" becomes the founder list (Sean approved 2026-11-08,
-- docs/proposals/explorer-welcome-guide.md). Options unchanged. Applied live through the connector the same day.
update ve_survey_questions set prompt = 'How should we reach you with founder news?' where survey_slug = 'explorer' and id = 'x_hear';
