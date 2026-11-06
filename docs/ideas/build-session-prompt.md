ve-idea-intake: hourly build session for Sean's approved ideas (Logan, build mode).

Repository: lesaruss/vegansexplore-com (if it is not in this session, attach it with add_repo and clone it). Read CLAUDE.md first, then
the "Ideas: Sean's idea inbox" section. Supabase project: fwbhwfxpncrsfhttimna.

How to call ve-ideas: from SQL with the Supabase connector's execute_sql, so the admin token never leaves the database:

  select net.http_post(
    url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ideas',
    headers := jsonb_build_object('Content-Type','application/json','Authorization',
               'Bearer '||(select value from lesaruss_secrets where key='LESARUSS_ADMIN_TOKEN')),
    body := '<the JSON body>'::jsonb, timeout_milliseconds := 60000);

then read the answer with: select status_code, content from net._http_response where id = <the id it returned>;
(wait a few seconds and read again if it is not there yet). Never print the token.

Step 1, check (cheap): body {"action":"next"}. If "next" is null, or "busy" is not null, stop here and end the session with one line
("Nothing approved" or "Idea <id> is still building"). Do nothing else.

Step 2, claim: find this session's link with the get_session tool (session_id omitted): https://claude.ai/code/<the session id>.
Body {"action":"claim","session_url":"<that link>"}. If it answers busy or not_approved, stop. Otherwise it returns the idea, now Building.

Step 3, read it: body {"action":"get","id":"<id>"} gives the idea, Sean's words, the thread (his corrections), Logan's read (ask, plan,
questions), links and an hour-long link to each file (look at the pictures). Name its playbook first. Follow every rule in CLAUDE.md
(the template gate, Interface defaults, no em dashes, Vegan capitalized).

Step 4, build it on this session's own branch only. Commit as Sean A. Russell <contact@lesaruss.com> and push the branch.
Never merge to main, never push to main, never open a pull request. Do not deploy edge functions, apply migrations or change live data
unless the idea is only that and it can be undone; when it needs any of those, write the migration or function on the branch and say
in the note that it waits for Sean's go. Do not spend money (Google, Apify, Higgsfield, Stripe) without it being in the idea.
If the idea says [TEST], do exactly what it says and nothing else.
If the idea cannot be built as asked (a question only Sean can answer), do not guess: set it back with body
{"action":"set","id":"<id>","status":"read","note":"<the question, plain words>"} and stop.

Step 5, report: body {"action":"set","id":"<id>","status":"done","result_url":"<link>","note":"<two to four plain sentences: what
was built, the branch name, what to check, what waits on Sean>"}. result_url is the branch's Vercel preview if you can find it,
else https://github.com/lesaruss/vegansexplore-com/compare/main...<branch>. End the session with the same few sentences.
