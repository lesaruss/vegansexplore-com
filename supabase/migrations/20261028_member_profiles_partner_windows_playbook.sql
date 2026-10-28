-- Member profiles and partner windows, LOCKED by Sean 2026-10-28 ("lock it"), concept session with V. Safe to run twice.
-- The playbook (briefings ve-member-profiles-partner-windows) is filled from the one active playbook template, never hand-written;
-- the decision is also canon (canon-ve-member-profiles-partner-windows) and a playbook_records decision row.

-- 1. The decision record, which the playbook's Decision History reads.
insert into public.playbook_records (slug, brand_slug, author, kind, source, body)
select 've-member-profiles-partner-windows', 'vegans-explore', 'V', 'decision', 'text',
  'Locked by Sean 2026-10-28 ("lock it"). We choose when a profile is seen; the member chooses what is in it. The team sees the full profile, used only to improve the member''s experience, never sold or handed over. Each answer is "Can be shown" or "Just for Vegans Explore" (prompts, city and journey shareable by default; market research never). No open browsing: a profile shows only inside a window we open (an event''s guest list, a campaign, a sponsor invite). Partner windows: an event organizer can message RSVPs from the RSVP to 7 days after the event; a brand can message members who opted in for the length of its campaign; a one-time message to past guests is phase 4. Every message goes through us, logged, capped, with mute and report. Consent is an explicit, rewarded opt-in at RSVP and at save (a save alone is never consent). Policies page updated before any of it goes live. Build order: 1 show and hide switches plus the team view, 2 event window, 3 campaign window, 4 past guests.'
where not exists (select 1 from public.playbook_records where slug = 've-member-profiles-partner-windows' and kind = 'decision');

-- 2. Canon.
insert into public.knowledge_records (slug, title, category, subcategory, body, status, owner, always_load, load_priority, tags, version, change_summary, created_by, updated_by)
select 'canon-ve-member-profiles-partner-windows',
  'Vegans Explore member profiles and partner windows: we choose when a profile is seen, the member chooses what is in it (LOCKED by Sean 2026-10-28)',
  'decisions', 'members',
  jsonb_build_object(
    'rule', 'We choose when a profile is seen; the member chooses what is in it.',
    'team_view', 'The team sees every answer, always, used only to improve the member''s experience (what they see, which events and offers reach them, who we invite). Never sold, never handed to a partner.',
    'member_control', 'Each profile answer is "Can be shown" or "Just for Vegans Explore", set by the member. Default shareable: the In your words prompts, city, journey. Market research questions are never shareable and have no switch.',
    'no_browsing', 'There is no open browsing of profiles. A profile appears only inside a window we open: an event''s guest list, a campaign, a sponsor invite, and only its shareable parts.',
    'event_window', 'An event we feature: its organizer can message the members who RSVP and opted in, from the RSVP until 7 days after the event. Then access closes.',
    'campaign_window', 'A brand or organization running a campaign with us can message members who opted in to hear from them, for the campaign''s run dates only. Then access closes.',
    'past_guests', 'A one-time message to past attendees of an organizer''s events: phase 4, after the first windows have run.',
    'guardrails', 'Every message goes through Vegans Explore; partners never see an email, phone or handle. Every message is logged (who sent what to whom). A cap on messages per window. Members can mute a sender and report a message; reports pause a partner''s access. Our name is on every message.',
    'consent', 'Consent is an explicit opt-in at the moment of action (RSVP, save), worded plainly ("Let <organizer or brand> message me about this"), rewarded (points, early access or a perk), and managed in one place. A save alone is a bookmark, never consent. UK members (London) need an unticked, deliberate opt-in by law.',
    'sponsor_value', 'Partners reach people who raised their hand. Without consent we report counts and segments only, never names (for example: 212 members in Maryland saved you; 64 opted in).',
    'policy', 'The Policies page says it before anything goes live: we never sell your information; partners can only message you through us, during a window you agreed to.',
    'build_order', '1. Show and hide switches on each answer, and the full team view of a profile in the Depot. 2. The event RSVP window. 3. The campaign window. 4. One-time messages to past guests.',
    'playbook', 've-member-profiles-partner-windows'),
  'active', 'sar', false, 50,
  array['vegans-explore', 'profiles', 'privacy', 'consent', 'sponsors', 'events', 'campaigns', 'messaging'],
  1, 'Locked by Sean 2026-10-28 in a concept session with V.', 'v', 'v'
where not exists (select 1 from public.knowledge_records where slug = 'canon-ve-member-profiles-partner-windows');

-- 3. The playbook, filled from the active template.
with t as (select parameters->>'html_shell' as shell from public.templates where subtype = 'playbook' and status = 'active'),
hist as (
  select coalesce(string_agg('<p><strong>' || to_char(created_at at time zone 'America/New_York', 'Mon DD, YYYY') || ', ' || author || ' (' || kind || ').</strong> '
    || replace(replace(body, '<', '&lt;'), '>', '&gt;') || '</p>', E'\n' order by created_at desc), '<p class="empty-state">No entries yet.</p>') as h
  from public.playbook_records where slug = 've-member-profiles-partner-windows'
),
filled as (
  select replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(t.shell,
    '{{TITLE}}', 'Vegans Explore: Member Profiles and Partner Windows'),
    '{{TYPE_LABEL}}', 'Playbook'),
    '{{BRAND}}', 'Vegans Explore'),
    '{{DATE}}', 'October 28, 2026'),
    '{{PREPARED_BY}}', 'V, with Sean'),
    '{{STAGE}}', 'Locked, ready to build'),
    '{{STATUS_SUMMARY}}', 'Locked by Sean on October 28, 2026. The profile with points is live; phase 1 (show and hide switches and the team view) is next for Logan.'),
    '{{OVERVIEW_SECTIONS_HTML}}', $h$
  <h2>The rule</h2>
  <div class="section-block">
    <p><strong>We choose when a profile is seen. The member chooses what is in it.</strong> Everything we gather is there to make the member's experience better: what they see first, which events and offers reach them, who we invite. It also gives our sponsors and partners a respectful way to reach the people who raised their hand.</p>
  </div>

  <h2>Three views of every profile</h2>
  <div class="section-block">
    <h3>The team sees everything, always</h3>
    <p>Every answer, used only to improve their experience. We never sell it and never hand it over.</p>
    <h3>The member decides what can be shown</h3>
    <p>Each answer has a switch: <strong>Can be shown</strong> or <strong>Just for Vegans Explore</strong>. The five In your words prompts, city and journey start as shareable. The market research questions (spending, likely to recommend, gaps where they live) are never shareable and have no switch.</p>
    <h3>No open browsing</h3>
    <p>A profile appears only where we open a window: an event's guest list, a campaign, a sponsor invite. Even then, only the parts the member marked shareable show.</p>
  </div>

  <h2>Partner windows</h2>
  <div class="section-block">
    <h3>Events</h3>
    <p>When someone RSVPs to an event we feature and opts in, the organizer can message them from the RSVP until 7 days after the event. Then the window closes.</p>
    <h3>Campaigns</h3>
    <p>When a brand or organization runs a campaign with us, it can reach the members who opted in to hear from it, for the campaign's run dates only. When the campaign ends, access ends.</p>
    <h3>Past guests</h3>
    <p>A one-time message to people who attended an organizer's past events. Phase 4, after the first windows have run and we have seen how they behave.</p>
  </div>

  <h2>Guardrails</h2>
  <div class="section-block">
    <ul>
      <li>Every message goes through Vegans Explore. Partners never see an email, phone or handle.</li>
      <li>Every message is logged: who sent what, to whom, when.</li>
      <li>A cap on messages per window.</li>
      <li>Members can mute a sender or report a message; reports pause that partner's access.</li>
      <li>Our name is on every message, so we control the tone.</li>
    </ul>
  </div>

  <h2>Consent</h2>
  <div class="section-block">
    <p>Saving a listing is a bookmark, never permission to be marketed to. Consent is a clear opt-in at the moment of action: <strong>"Let [organizer or brand] message me about this."</strong> It is rewarded (points, early access or a perk) and managed in one place. In the UK (the London chapter) it must be an unticked, deliberate choice by law.</p>
    <p>Partners still get value from members who do not opt in: we report counts and segments, never names. For example: 212 members in Maryland saved you; 64 opted in.</p>
  </div>

  <h2>Locked decisions</h2>
  <div class="section-block">
    <ol>
      <li>Opt-in at the moment of action, rewarded, never buried.</li>
      <li>Event window: from the RSVP until 7 days after the event.</li>
      <li>Campaign window: the campaign's run dates; access ends the day it ends.</li>
      <li>One-time message to past guests: phase 4.</li>
      <li>The Policies page says it, in plain words, before anything goes live: we never sell your information; partners can only message you through us, during a window you agreed to.</li>
    </ol>
  </div>
$h$),
    '{{PENDING_COUNT}}', '4'),
    '{{DONE_COUNT}}', '2'),
    '{{PENDING_HTML}}', $h$
    <details class="held" open><summary>Phase 1: the member's switches and the team view <span class="grp-count">3</span></summary><div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>Can be shown / Just for Vegans Explore on each profile answer, with the defaults above; research questions with no switch</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The full profile for the team in the Depot (People), every answer, with who can see what</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The Policies page: what we gather, why, and that partners only reach members through us in a window they agreed to</span></li>
    </ul></div></details>
    <details class="held"><summary>Phase 2: the event window <span class="grp-count">4</span></summary><div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>RSVP on events we feature, with the rewarded opt-in to hear from the organizer</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The organizer's guest list: shareable profile parts of guests who opted in</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Messages through us, logged and capped, open from the RSVP until 7 days after the event</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Mute and Report for members; reports pause the organizer's access</span></li>
    </ul></div></details>
    <details class="held"><summary>Phase 3: the campaign window <span class="grp-count">3</span></summary><div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>The opt-in at save: "Let [brand] message me during their campaigns"</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The brand's audience during its campaign: members who opted in, messaged through us, for the run dates only</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Counts and segments for everyone else, never names</span></li>
    </ul></div></details>
    <details class="held"><summary>Phase 4: past guests <span class="grp-count">1</span></summary><div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>One message to an organizer's past attendees who opted in, once the first windows have run</span></li>
    </ul></div></details>
$h$),
    '{{DONE_HTML}}', $h$
    <details class="done"><summary>Done <span class="grp-count">2</span></summary><div class="body"><ul class="chk-list">
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Your profile live (October 28, 2026): 31 questions as cards, any order, each answer paid its own points, 250 in all</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Concept locked by Sean (October 28, 2026)</span></li>
    </ul></div></details>
$h$),
    '{{LINKS_HTML}}', $h$
  <h2>Links</h2>
  <div class="link-block"><div class="link-label">Your profile (members)</div><div class="link-url">vegansexplore.com/dashboard/survey</div><div class="link-note">The profile with points; the switches land here in phase 1.</div></div>
  <div class="link-block"><div class="link-label">Canon</div><div class="link-url">canon-ve-member-profiles-partner-windows</div></div>
  <div class="link-block"><div class="link-label">Related playbooks</div><div class="link-url">ve-events-platform, ve-pricing-points-passport</div><div class="link-note">Event promotions and the RSVP window build on the events platform.</div></div>
$h$) as html
  from t
)
insert into public.briefings (tenant_id, title, content, type, author, status, metadata, slug, briefing_date, brand_slug, status_summary, status_summary_updated_at, featured)
select '00000000-0000-4000-a000-000000000002', 'Vegans Explore: Member Profiles and Partner Windows',
  replace(filled.html, '{{DECISION_HISTORY_HTML}}', hist.h), 'playbook', 'V', 'published', '{}'::jsonb,
  've-member-profiles-partner-windows', date '2026-10-28', 'vegans-explore',
  'Locked by Sean on October 28, 2026. Phase 1 (show and hide switches and the team view) is next.', now(), false
from filled, hist
on conflict (tenant_id, brand_slug, slug) where slug is not null do update set content = excluded.content, title = excluded.title,
  status_summary = excluded.status_summary, status_summary_updated_at = now(), updated_at = now();

-- 4. The log.
insert into public.stream_events (owner, station, summary, keywords, status, context_link)
select 'v', 'vegans-explore', 'Locked: member profiles and partner windows (Sean, 2026-10-28). Playbook ve-member-profiles-partner-windows and canon-ve-member-profiles-partner-windows written; phase 1 next for Logan.',
  array['vegans-explore', 'playbook', 'profiles', 'partner-windows'], 'completed', 've-member-profiles-partner-windows'
where not exists (select 1 from public.stream_events where context_link = 've-member-profiles-partner-windows' and owner = 'v');
