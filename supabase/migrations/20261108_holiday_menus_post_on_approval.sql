-- ve-holiday-guide (Sean, 2026-11-08): "Most places cut their orders off early... They'll be posted after a quick review. They will be
-- posted immediately to the guide." A menu already goes live the moment it is approved (ve-holiday `live` has no date filter);
-- promo_from said the Guide's promotion began the day submissions closed, which was never true. It now starts the day menus opened.
-- Applied 2026-11-08 through the connector.
update ve_holidays set promo_from = '2026-11-07'
 where slug in ('thanksliving', 'hanukkah', 'christmas', 'kwanzaa') and promo_from > '2026-11-07';
