-- ve-feedback: playbook consolidation (Sean, 2026-11-05). Helpers so every merge runs the same way. Nothing is deleted.
--   ve_pb_parts(content)      the overview, pending, done and links parts of a page built from the active playbook template (v3)
--   ve_pb_history(slugs)      Decision History read live from playbook_records for one or more slugs, newest first
--   ve_pb_merge(...)          rebuilds the kept playbook's page from the active template: its own parts, then each merged playbook's
--                             open and done items under its own label (with a note when Sean called them out of date), its links,
--                             and Decision History from every slug. Then: a "Merged into" record on each merged playbook, its
--                             briefings row archived, its index row done, the highest rating carried, Guide links pointed at the kept one.

create or replace function public.ve_pb_parts(c text) returns jsonb language plpgsql immutable as $$
declare
  cb int; ov_s int; wq int; ps int; pe int; ds int; hs int; dl text; h2 int;
  ov text := ''; pend text := ''; done text := ''; links text := '';
begin
  if c is null or strpos(c, 'id="panel-pending"') = 0 then
    return jsonb_build_object('overview','', 'pending','', 'done','', 'links','');
  end if;
  cb := strpos(c, 'class="context-banner"');
  ov_s := cb + strpos(substr(c, cb), '</div>') - 1 + 6;
  wq := strpos(c, '<h2>Work Queue</h2>');
  if cb > 0 and wq > ov_s then ov := substr(c, ov_s, wq - ov_s); end if;
  ps := strpos(c, 'id="panel-pending" role="tabpanel">') + length('id="panel-pending" role="tabpanel">');
  pe := strpos(c, '<div class="tabpanel" id="panel-done"');
  pend := regexp_replace(substr(c, ps, pe - ps), '\s*</div>\s*$', '');
  ds := strpos(c, 'id="panel-done" hidden role="tabpanel">') + length('id="panel-done" hidden role="tabpanel">');
  hs := strpos(c, '<details class="history">');
  dl := substr(c, ds, hs - ds);
  h2 := strpos(dl, '<h2');
  if h2 > 0 then
    done := regexp_replace(left(dl, h2 - 1), '\s*</div>\s*$', '');
    links := substr(dl, h2);
  else
    done := regexp_replace(dl, '\s*</div>\s*$', '');
  end if;
  return jsonb_build_object('overview', btrim(ov), 'pending', btrim(pend), 'done', btrim(done), 'links', btrim(links));
end $$;

create or replace function public.ve_pb_history(slugs text[]) returns text language sql stable as $$
  select coalesce(string_agg(
    format('<h3>%s, %s%s</h3><p>%s</p>',
      to_char(created_at at time zone 'America/New_York', 'YYYY-MM-DD'), kind,
      case when cardinality(slugs) > 1 then ' · ' || slug else '' end,
      replace(replace(replace(replace(body, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), E'\n', '<br>')),
    E'\n' order by created_at desc), '<p class="empty-state">No records yet.</p>')
  from public.playbook_records where slug = any(slugs)
$$;

create or replace function public.ve_pb_merge(
  p_keep text, p_merged text[], p_title text, p_stage text, p_status text,
  p_lead_html text default '', p_note text default '', p_stale jsonb default '{}'::jsonb
) returns jsonb language plpgsql as $$
declare
  shell text; kc text; kp jsonb; m text; mc text; mt text; mp jsonb; mlast text;
  ov text; pend text; done text; links text; html text; npend int; ndone int;
  best text; lv int;
begin
  select parameters->>'html_shell' into shell from public.templates where subtype = 'playbook' and status = 'active';
  if shell is null then raise exception 'no active playbook template'; end if;
  select content into kc from public.briefings where slug = p_keep and type = 'playbook';
  if kc is null then raise exception 'kept playbook % has no page', p_keep; end if;
  kp := public.ve_pb_parts(kc);
  ov := coalesce(p_lead_html, '') || E'\n' || (kp->>'overview');
  pend := kp->>'pending'; done := kp->>'done'; links := kp->>'links';

  foreach m in array coalesce(p_merged, '{}') loop
    select content, title into mc, mt from public.briefings where slug = m and type = 'playbook';
    select to_char(max(created_at) at time zone 'America/New_York', 'Mon D, YYYY') into mlast from public.playbook_records where slug = m;
    mp := public.ve_pb_parts(mc);
    if strpos(mp->>'pending', 'chk-item') > 0 then
      pend := pend || E'\n    <span class="cluster-label">From ' || coalesce(mt, m) || ' (' || m || ')</span>'
        || '<p class="empty-state">Carried over as written' || coalesce(', last touched ' || mlast, '') || '. Check before acting.'
        || coalesce(' ' || (p_stale->>m), '') || '</p>' || E'\n' || (mp->>'pending');
    end if;
    if strpos(mp->>'done', 'chk-item') > 0 then
      done := done || E'\n    <span class="cluster-label">From ' || coalesce(mt, m) || ' (' || m || ')</span>' || E'\n' || (mp->>'done');
    end if;
    if length(mp->>'links') > 0 then
      links := links || E'\n' || replace(mp->>'links', '<h2>Links</h2>', '');
    end if;
  end loop;
  if links <> '' and strpos(links, '<h2>Links</h2>') = 0 then links := '<h2>Links</h2>' || E'\n' || links; end if;

  npend := (length(pend) - length(replace(pend, 'chk-item pending', ''))) / length('chk-item pending');
  ndone := (length(done) - length(replace(done, 'chk-item done', ''))) / length('chk-item done');

  html := shell;
  html := replace(html, '{{TITLE}}', p_title);
  html := replace(html, '{{TYPE_LABEL}}', 'Playbook');
  html := replace(html, '{{BRAND}}', 'Vegans Explore');
  html := replace(html, '{{DATE}}', to_char(now() at time zone 'America/New_York', 'FMMonth FMDD, YYYY'));
  html := replace(html, '{{PREPARED_BY}}', 'Logan Russell');
  html := replace(html, '{{STAGE}}', p_stage);
  html := replace(html, '{{STATUS_SUMMARY}}', p_status);
  html := replace(html, '{{OVERVIEW_SECTIONS_HTML}}', ov);
  html := replace(html, '{{PENDING_COUNT}}', npend::text);
  html := replace(html, '{{DONE_COUNT}}', ndone::text);
  html := replace(html, '{{PENDING_HTML}}', case when npend = 0 then '<p class="empty-state">Nothing pending.</p>' else pend end);
  html := replace(html, '{{DONE_HTML}}', case when ndone = 0 then '<p class="empty-state">Nothing completed yet.</p>' else done end);
  html := replace(html, '{{LINKS_HTML}}', links);
  html := replace(html, '{{DECISION_HISTORY_HTML}}', public.ve_pb_history(array[p_keep] || coalesce(p_merged, '{}')));

  update public.briefings set content = html, title = p_title, status_summary = p_status, updated_at = now()
   where slug = p_keep and type = 'playbook';

  -- the highest rating any part had
  select level into best from public.blueprint_playbook_focus
   where brand_slug = 'vegans-explore' and playbook_slug = any(array[p_keep] || coalesce(p_merged, '{}'))
   order by case level when 'high' then 3 when 'medium' then 2 else 1 end desc limit 1;
  if best is not null then
    insert into public.blueprint_playbook_focus (brand_slug, playbook_slug, level, set_by, set_at)
    values ('vegans-explore', p_keep, best, 'logan (merge)', now())
    on conflict (brand_slug, playbook_slug) do update set level = excluded.level, set_by = excluded.set_by, set_at = now();
  end if;

  update public.guide_playbooks set playbook_slug = p_keep where brand_slug = 'vegans-explore' and playbook_slug = any(coalesce(p_merged, '{}'));

  insert into public.ve_playbook_index (slug, brand_slug, title, status, owner, updated_at)
  values (p_keep, 'vegans-explore', p_title, 'building', 'Logan', now())
  on conflict (slug) do update set title = excluded.title, updated_at = now();

  foreach m in array coalesce(p_merged, '{}') loop
    insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
    values (m, 'vegans-explore', 'Logan',
      'Merged into ' || p_keep || ' (' || to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD') || ', ve-feedback: playbook consolidation, Sean''s go). '
      || 'Its open and done items and its links are on the ' || p_keep || ' page under their own label, and its records show in that page''s Decision History. Nothing was deleted.',
      'text', 'decision');
    update public.briefings set status = 'archived', updated_at = now() where slug = m and type = 'playbook';
    insert into public.ve_playbook_index (slug, brand_slug, title, status, next_action, owner, updated_at)
    values (m, 'vegans-explore', coalesce((select title from public.briefings where slug = m and type = 'playbook'), m), 'done', 'Merged into ' || p_keep, 'Logan', now())
    on conflict (slug) do update set status = 'done', next_action = 'Merged into ' || p_keep, updated_at = now();
  end loop;

  if coalesce(p_note, '') <> '' then
    insert into public.playbook_records (slug, brand_slug, author, body, source, kind)
    values (p_keep, 'vegans-explore', 'Logan', p_note, 'text', 'decision');
    -- the page's history now carries this note too
    update public.briefings set content = replace(content,
      substring(content from position('Decision History</summary>' in content)),
      'Decision History</summary>' || E'\n    <div class="body">\n' || public.ve_pb_history(array[p_keep] || coalesce(p_merged, '{}')) || E'\n    </div>\n  </details>\n</main>' || substring(content from position('<script>' in content) - 1))
     where slug = p_keep and type = 'playbook';
  end if;

  insert into public.stream_events (timestamp, owner, station, summary, status, keywords)
  values (now(), 'logan', 'vegans-explore', 've-feedback: playbook consolidation: ' || array_to_string(p_merged, ', ') || ' merged into ' || p_keep, 'completed',
          array['ve-feedback', 'playbook-consolidation', p_keep]);

  return jsonb_build_object('keep', p_keep, 'merged', p_merged, 'pending', npend, 'done', ndone, 'focus', best, 'length', length(html));
end $$;

revoke all on function public.ve_pb_merge(text, text[], text, text, text, text, text, jsonb) from public, anon, authenticated;

-- ve_playbook_index.goal is not null; merged rows have none, so it defaults to ''.
alter table public.ve_playbook_index alter column goal set default '';
