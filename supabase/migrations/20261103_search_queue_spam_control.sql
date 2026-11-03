-- Search queue spam control (Sean, 2026-11-03 canon-ve-search-questions: abusers are quarantined, a rate limit, an email on a submitted question).
alter table ve_search_questions drop constraint if exists ve_search_questions_status_check;
alter table ve_search_questions add constraint ve_search_questions_status_check
  check (status = any (array['open','working','answered','set_aside','quarantined']));

-- Junk: a link or address, mostly non-letters, one character repeated, or a keyboard mash with no vowel.
create or replace function ve_search_q_junk(p_q text) returns boolean language sql immutable as $$
  select p_q ~* '(https?:|www\.|\.com\b|\.ru\b|@)' or length(regexp_replace(p_q, '[^[:alpha:]]', '', 'g')) < 2
    or length(regexp_replace(p_q, '[^[:alpha:]]', '', 'g'))::numeric / greatest(length(p_q), 1) < 0.6
    or p_q ~ '(.)\1{5,}' or p_q !~* '[aeiouy]'
$$;

drop function if exists ve_search_ask(text, text, text, text);
create or replace function ve_search_ask(p_q text, p_email text default null, p_visitor text default null, p_brand text default 'vegans-explore', p_explicit boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_key text := ve_search_q_key(left(p_q,120)); v_id uuid; v_n int; v_status text;
  v_email text := nullif(lower(trim(coalesce(p_email,''))),''); v_vis text := nullif(left(p_visitor,40),''); v_hour int; v_day int;
begin
  if length(v_key) < 2 then return jsonb_build_object('ok', false); end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'error', 'bad_email'); end if;
  if p_explicit and v_email is null then return jsonb_build_object('ok', false, 'error', 'email_needed'); end if;
  -- Rate limits: a person asks a handful of new questions an hour, not hundreds (a visitor id or an email; neither means a script).
  if v_vis is not null or v_email is not null then
    select count(*) filter (where a.created_at > now() - interval '1 hour'), count(*) filter (where a.created_at > now() - interval '1 day')
      into v_hour, v_day from ve_search_question_askers a
      where (v_vis is not null and a.visitor = v_vis) or (v_email is not null and lower(a.email) = v_email);
    if v_hour >= 15 or v_day >= 40 then return jsonb_build_object('ok', false, 'error', 'rate_limited'); end if;
  end if;
  v_status := case when ve_search_q_junk(trim(p_q)) or (v_vis is null and v_email is null) then 'quarantined' else 'open' end;
  insert into ve_search_questions (brand, q_key, q, status) values (p_brand, v_key, left(trim(p_q),120), v_status)
    on conflict (brand, q_key) do update set last_asked_at = now() returning id into v_id;
  begin
    if v_email is not null then
      insert into ve_search_question_askers (question_id, email, visitor) values (v_id, v_email, v_vis)
        on conflict (question_id, lower(email)) where email is not null do nothing;
      delete from ve_search_question_askers where question_id = v_id and email is null and visitor = v_vis and v_vis is not null;
    elsif v_vis is not null then
      if not exists (select 1 from ve_search_question_askers where question_id = v_id and visitor = v_vis) then
        insert into ve_search_question_askers (question_id, visitor) values (v_id, v_vis) on conflict do nothing;
      end if;
    end if;
  exception when others then null; end;
  select count(*) into v_n from ve_search_question_askers where question_id = v_id;
  update ve_search_questions set asked_count = greatest(v_n,1) where id = v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'asked', greatest(v_n,1), 'quarantined', (select status = 'quarantined' from ve_search_questions where id = v_id));
end $$;
revoke all on function ve_search_ask(text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function ve_search_q_junk(text) from public, anon, authenticated;
