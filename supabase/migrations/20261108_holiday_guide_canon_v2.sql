-- ve-holiday-guide: canon-ve-holiday-guide v2 (Sean's notes, 2026-11-08). Applied through the connector.
update knowledge_records set version = version + 1, updated_at = now(), body = body || jsonb_build_object('update_2026_11_08', jsonb_build_object(
 'holidays_as_they_come', 'Each holiday opens in the Guide as it gets close; the closest holidays sit at the top and the rest go in a menu. Never launch them all at once (Sean, 2026-11-08).',
 'no_friendsgiving', 'Never use the word Friendsgiving in our copy, lines or emails; say potlucks and Thanksgiving events (Sean, 2026-11-08).',
 'members_spot_menus', 'Members can tell us about a holiday menu they found (a place and a link); our team checks it before it shows, and we never copy it. The team can add menus it knows (Sean, 2026-11-08).',
 'own_thanksliving', 'Emails and spoken lines say ThanksLiving alone. The parenthetical ThanksLiving (Thanksgiving) is only for search on the Guide page (Sean, 2026-11-08).',
 'plain_words', 'Never list the five ThanksLiving ideas by name in a spoken line; the page cards explain each (Sean, 2026-11-08).'))
where slug = 'canon-ve-holiday-guide' and not (body ? 'update_2026_11_08');
