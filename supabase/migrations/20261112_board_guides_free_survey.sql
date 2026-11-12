-- Board "How to use" guide posts: membership is free with a short survey, not the $11
-- (canon-ve-door-guides v12, playbook ve-explorer-path, 2026-11-12). 78 pinned guide posts
-- across every city's Jobs, Classifieds, Fosters, Rescues, Requests & Offers and Suggest a Topic
-- boards said "(the $11 Founding Membership)". Safe to run twice.
update public.ve_board_posts
   set body = replace(body, '(the $11 Founding Membership)', '(joining is free with a short survey)')
 where body like '%(the $11 Founding Membership)%';
