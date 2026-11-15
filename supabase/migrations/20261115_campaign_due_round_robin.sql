-- 2026-11-15 (Logan, found while sizing the Holiday Launch pace for Sean): ve_outreach_campaign_due ordered every due person by step, then
-- campaign slug, and campaignTick reads only the first 200. On 2026-11-13 all 200 were holiday-launch-business (first by name); once its
-- daily pace of 50 was spent by 11:50 AM, every row in the batch was skipped and Everyone Else, Foodie Fest and Registered sent nothing all
-- afternoon. Now the rows take turns: each campaign's first due person, then each one's second, and so on (round robin), so a campaign whose
-- pace is spent for the day cannot starve the others. Same signature, same filters, only the order changes. Safe to run twice.
create or replace function public.ve_outreach_campaign_due(p_limit integer default 100)
 returns table(member_id uuid, campaign_slug text, listing_id uuid, email text, next_step integer)
 language sql stable security definer set search_path to 'public'
as $function$
  select u.id, u.campaign_slug, u.listing_id, u.email, u.next_step from (
  select m.id, m.campaign_slug, m.listing_id, coalesce(nullif(c.email, ''), nullif(l.email, '')) as email, m.step + 1 as next_step
  from ve_outreach_campaign_members m
  join ve_outreach_campaigns cp on cp.slug = m.campaign_slug
  join listings l on l.id = m.listing_id and l.status = 'approved'
  left join ve_outreach_contacts c on c.listing_id = m.listing_id
  where m.removed_at is null
    and cp.audience <> 'people'
    and cp.approved_at is not null and cp.paused_at is null and cp.status = 'active'
    and cp.start_on is not null and cp.start_on <= (now() at time zone 'America/New_York')::date
    and m.step < cp.email_count
    and (m.send_status = 'waiting' and m.step = 0 or m.send_status = 'in_sequence' and m.next_send_at <= now())
    and coalesce(nullif(c.email, ''), nullif(l.email, '')) is not null
    and not email_is_suppressed(coalesce(nullif(c.email, ''), nullif(l.email, '')), 'lesaruss')
    and not exists (select 1 from ve_do_not_contact d where d.released_at is null
                    and (d.listing_id = m.listing_id or d.email = lower(coalesce(nullif(c.email, ''), nullif(l.email, '')))))
    and coalesce(c.status, '') not in ('opted_out', 'bounced', 'joined', 'interested', 'not_interested')
    and exists (select 1 from ve_outreach_campaign_emails e where e.campaign_slug = m.campaign_slug and e.step = m.step + 1 and e.locked_at is not null)
    and (cardinality(cp.cities) = 0 or ve_chapter_of(l.address_city, l.address_state) = any(cp.cities))
    and case cp.audience
          when 'closed' then ve_listing_is_closed(l.business_status)
          else not ve_listing_is_closed(l.business_status) and l.owner_member_id is null
               and not exists (select 1 from ve_audit_open_flags() f where f.listing_id = l.id and f.closure_level = 'closed')
        end
  union all
  select m.id, m.campaign_slug, null::uuid, m.person_key, m.step + 1
  from ve_outreach_campaign_members m
  join ve_outreach_campaigns cp on cp.slug = m.campaign_slug and cp.audience = 'people'
  left join ve_outreach_contacts c on c.listing_id is null and c.community_slug = 'people-campaigns' and lower(c.email) = m.person_key
  where m.removed_at is null and m.listing_id is null and m.person_key like '%@%'
    and cp.approved_at is not null and cp.paused_at is null and cp.status = 'active'
    and cp.start_on is not null and cp.start_on <= (now() at time zone 'America/New_York')::date
    and m.step < cp.email_count
    and (m.send_status = 'waiting' and m.step = 0 or m.send_status = 'in_sequence' and m.next_send_at <= now())
    and not email_is_suppressed(m.person_key, coalesce(cp.sender_brand, 'lesaruss'))
    and not email_is_suppressed(m.person_key, 'lesaruss')
    and not exists (select 1 from ve_do_not_contact d where d.released_at is null and d.email = m.person_key)
    and coalesce(c.status, '') not in ('opted_out', 'bounced', 'not_interested')
    and exists (select 1 from ve_outreach_campaign_emails e where e.campaign_slug = m.campaign_slug and e.step = m.step + 1 and e.locked_at is not null)
  ) u
  order by row_number() over (partition by u.campaign_slug order by u.next_step desc, u.id), u.next_step desc, u.campaign_slug, u.id
  limit p_limit
$function$;
