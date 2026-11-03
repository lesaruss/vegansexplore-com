-- The answer bank's 0.42 match floor (guide_kb_match, used by the Guides' quick answers) lets near-miss questions through. First panel,
-- 2026-11-03: "vegan restaurants in miami" matched "How do I eat Vegan at a non-Vegan restaurant?" (0.56), "meat substitute" matched "Are eggs
-- Vegan?" (0.53), "vegan bakery in philadelphia" matched "Is bread Vegan?" (0.48), "vegan doctor near me" matched "How do I find Vegan
-- groceries near me?" (0.51). Every right match in that panel scored 0.67 or more except one ("how do i convince my family to go vegan",
-- 0.57, which the content lane answers with episodes). So the new research code (the search box's answer, "Send it to our team", the queue's
-- sync and the panel's scoring) uses 0.65. The Guides' own 0.42 in ve-auth is NOT changed here: it is Sean's call, with this evidence.
-- Patches the three functions in place, so the rest of each stays as it was.
do $$
declare f text; def text;
begin
  foreach f in array array['public.ve_research_capture(text,text,text,text)', 'public.ve_research_sync()', 'public.ve_panel_run(uuid,integer,integer)'] loop
    def := pg_get_functiondef(f::regprocedure);
    if def not like '%0.42%' then continue; end if;   -- already patched
    execute replace(def, '0.42', '0.65');
  end loop;
end $$;
