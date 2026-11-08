-- ve-outreach-buckets: a personal version of a campaign email per person, and holding someone out of one batch (Sean, 2026-11-08:
-- "a few people... not remove from emails, but not from this first batch"; "a button where I can provide notes, and based off the notes
-- you can rewrite it... and I can see it").
-- personal_emails: {"<step>": {"subject": "...", "body": "..."}} written from Sean's notes in BrandDesk (HQ, lib/campaignPersonal.ts)
-- and seen by him before it is saved. Placeholders ({first_name}, {link}) are still filled at send. Empty means the campaign's email.
-- Holding out: send_status 'stopped' with stop_reason 'held out of this batch'; Put back sets it waiting again. They stay in every other
-- campaign and every other email; nothing is removed.
alter table ve_outreach_campaign_members
  add column if not exists personal_note text,
  add column if not exists personal_emails jsonb,
  add column if not exists personal_at timestamptz,
  add column if not exists personal_by uuid;

CREATE OR REPLACE FUNCTION public.ve_outreach_campaign_render(p_member uuid, p_step integer)
 RETURNS TABLE(subject text, body text, to_email text, page_url text, guide_url text, listing_name text, contact_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare m record; cp record; e record; l record; c record; g record; first text; city text; page text; gurl text; gline text := ''; fc text;
  esub text; ebody text;
begin
  select * into m from ve_outreach_campaign_members where id = p_member;
  if not found then return; end if;
  select * into cp from ve_outreach_campaigns where slug = m.campaign_slug;
  select * into e from ve_outreach_campaign_emails where campaign_slug = m.campaign_slug and step = p_step;
  if e is null then return; end if;
  esub := e.subject; ebody := e.body;
  -- This person's own version, when Sean wrote one.
  if m.personal_emails ? p_step::text and coalesce(m.personal_emails->p_step::text->>'body', '') <> '' then
    esub := coalesce(nullif(m.personal_emails->p_step::text->>'subject', ''), esub);
    ebody := m.personal_emails->p_step::text->>'body';
  end if;
  if m.listing_id is null then
    if m.person_key is null or position('@' in m.person_key) = 0 then return; end if;
    select * into c from ve_outreach_contacts where listing_id is null and community_slug = 'people-campaigns' and lower(email) = m.person_key;
    first := nullif(split_part(trim(coalesce(m.person_name, c.contact_name, '')), ' ', 1), '');
    page := 'https://vegansexplore.com' || coalesce(cp.link_path, '/passport');
    subject := esub;
    if first is null then subject := regexp_replace(subject, ',?\s*\{first_name\}', '', 'g'); end if;
    subject := replace(replace(replace(replace(subject, '{first_name}', coalesce(first, '')), '{business}', ''), '{in_city}', ''), '{city}', '');
    body := replace(replace(replace(replace(replace(replace(replace(ebody,
      '{in_city}', ''), '{first_name}', coalesce(first, 'there')), '{business}', ''), '{city}', ''), '{link}', page),
      '{guide}', 'Liz'), '{guide_line}', '');
    body := btrim(regexp_replace(body, E'\\n{3,}', E'\n\n', 'g'), E'\n ');
    to_email := m.person_key; page_url := page; guide_url := null; listing_name := coalesce(m.person_name, m.person_key); contact_id := c.id;
    return next; return;
  end if;
  select * into l from listings where id = m.listing_id;
  select * into c from ve_outreach_contacts where listing_id = m.listing_id;
  first := nullif(split_part(trim(coalesce(c.contact_name, '')), ' ', 1), '');
  city := coalesce((select oc.name from ve_outreach_cities oc where oc.community_slug = ve_chapter_of(l.address_city, l.address_state) and oc.kind = 'city'), '');
  if c.segment = 'brand' then city := ''; end if;
  page := 'https://vegansexplore.com/directory/' || l.slug;
  select * into g from ve_outreach_guides(m.listing_id) limit 1;
  if g.guide_slug is not null then
    gurl := 'https://vegansexplore.com/guides/' || replace(g.guide_slug, '-site', '') || '#/listing/' || l.slug;
    gline := E'\n\n' || l.name || ' is also in ' || g.title || case when g.as_store
      then ', as a store where our members find the products it recommends.' else ', where our members choose what to buy.' end
      || ' See how you''re featured: ' || gurl;
  end if;
  subject := esub;
  if first is null then subject := regexp_replace(subject, ',?\s*\{first_name\}', '', 'g'); end if;
  subject := replace(replace(replace(replace(subject, '{first_name}', coalesce(first, '')), '{business}', l.name),
    '{in_city}', case when city = '' then '' else ' in ' || city end), '{city}', city);
  body := replace(replace(replace(replace(replace(replace(replace(ebody,
    '{in_city}', case when city = '' then '' else ' in ' || city end),
    '{first_name}', coalesce(first, 'there')),
    '{business}', l.name),
    '{city}', city),
    '{link}', page),
    '{guide}', case when c.segment = 'brand' and g.guide_slug like 'vegan-dairy-guide%' then 'Maya' else 'Liz' end),
    '{guide_line}', gline);
  if position('{free_check}' in body) > 0 then
    fc := coalesce(ve_outreach_free_check(m.listing_id), '');
    body := replace(body, '{free_check}', fc);
  end if;
  body := btrim(regexp_replace(body, E'\\n{3,}', E'\n\n', 'g'), E'\n ');
  to_email := coalesce(nullif(c.email, ''), nullif(l.email, ''));
  page_url := page; guide_url := gurl; listing_name := l.name; contact_id := c.id;
  return next;
end $function$;
