-- Nonprofit Partners concept, locked by Sean 2026-10-29 (playbook ve-nonprofit-partners, canon canon-ve-nonprofit-partners).
-- The playbook is filled from the one active playbook template (templates subtype 'playbook'). Concept only: nothing is built.
-- Run through a one-time function (the connector holds writes). Safe to run twice.

insert into briefings (tenant_id, title, content, type, author, status, metadata, slug, briefing_date, brand_slug, status_summary, status_summary_updated_at, featured)
select '00000000-0000-4000-a000-000000000002'::uuid, 'Vegans Explore: Nonprofit Partners',
       replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(parameters->>'html_shell', '{{TITLE}}', $v$Vegans Explore: Nonprofit Partners$v$), '{{TYPE_LABEL}}', $v$Playbook$v$), '{{BRAND}}', $v$VEGANS EXPLORE$v$), '{{DATE}}', $v$2026-10-29$v$), '{{PREPARED_BY}}', $v$V$v$), '{{STAGE}}', $v$Locked, ready to build$v$), '{{STATUS_SUMMARY}}', $v$Locked by Sean 2026-10-29. Concept only: nothing is built yet. Organizations invited as Nonprofit Partners earn through their own link, hold points and get a marketing kit; the lead on the account gets a complimentary Founding Membership. First: Animal Hero Kids.$v$), '{{OVERVIEW_SECTIONS_HTML}}', $v$  <h2>The idea</h2>
  <div class="section-block">
    <p>A <strong>Nonprofit Partner</strong> is an organization we invite to share Vegans Explore with its people. The <strong>organization is the partner</strong>: it gets its own link, earns when people join through it, holds points for our services, and gets a marketing kit to post and put on its website. It becomes a passive income stream for the organization and gives it something to market with. One person is assigned as the <strong>lead on the account</strong>; the partnership is the opportunity, never a change to that person's own standing.</p>
    <p>First invitation: Susan Hargreaves, founder of Animal Hero Kids (in the Directory as Be An Animal Hero, Nonprofits).</p>
  </div>

  <h2>Locked decisions</h2>
  <div class="section-block">
    <h3>The organization</h3>
    <ul>
      <li><strong>The partner is the organization's Directory listing</strong> (Nonprofits, Rescues or Sanctuaries), not a person. If the lead changes, the link, the earnings, the points and the history stay with the organization.</li>
      <li><strong>Its own link</strong>, separate from the lead's personal link.</li>
      <li><strong>Earnings at the rate the opportunity sets, not a member level:</strong> a flat 20% (Level 2's rate) of the $11 Passport and of Guides bought through the organization's link. A higher rate for growth (past a set number of signups) can be added later.</li>
      <li><strong>Points held by the organization</strong>, in the amount Sean sets on the invitation, spent by the lead on our services (promoting its events and the like). Members can also give it points through the Give box on its listing.</li>
      <li><strong>A marketing kit:</strong> ready-to-post messages, a Join us on Vegans Explore button and banner for its website, and an email blurb, all carrying its link.</li>
      <li><strong>A Nonprofit Partner badge</strong> on its Directory listing, and <strong>its own Guide</strong> on the Ambassador Guide's pattern, written for an organization (why it matters for the animals, its link, its kit, its numbers).</li>
      <li><strong>Payouts go to the organization</strong> once $25 is ready, after its W-9, held 30 days for refunds, counted for 12 months from each person's join: the affiliate program's defaults.</li>
      <li><strong>Wording:</strong> referral earnings paid to the organization. Never a donation from us and never tax-deductible (LESARUSS Inc. is a for-profit company). Its posts say the organization earns when you join (the FTC rule).</li>
    </ul>
    <h3>The lead</h3>
    <ul>
      <li><strong>A complimentary Founding Membership</strong> for the lead, given when the organization says yes. The comp and the partnership start together.</li>
      <li><strong>Their own standing is unchanged:</strong> Level 1 by default, their own personal link and their own points, like any member. Nothing the organization earns moves their level.</li>
      <li>The lead is the one who sees the organization's numbers, uses its kit and spends its points.</li>
    </ul>
    <h3>Who gets it</h3>
    <ul>
      <li><strong>Invitation only</strong>, chosen by Sean, like Ambassadors. No public application yet.</li>
      <li>Invited from where Sean is already looking: on Depot &gt; People &gt; Founding Members, each person picked can be invited as a Founding Member, an Ambassador or a Nonprofit Partner.</li>
    </ul>
  </div>

  <h2>Why it matters</h2>
  <div class="section-block">
    <ul>
      <li>It puts the animals first in the community, the way the Community section of the Directory already does, and gives the organizations behind them a reason to bring their people in.</li>
      <li>Each organization's supporters are exactly the members we want, and each partner brings them through its own link.</li>
      <li>It turns our nonprofit listings into relationships: a partner with its own numbers, kit and Guide.</li>
    </ul>
  </div>$v$), '{{PENDING_COUNT}}', $v$13$v$), '{{DONE_COUNT}}', $v$3$v$), '{{PENDING_HTML}}', $v$  <details class="held">
    <summary>Build (Logan) <span class="grp-count">10</span></summary>
    <div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>Nonprofit Partner records: the organization (its listing), the lead, its link code, its rate (20%), its points, status (invited, active, paused).</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The organization's link (vegansexplore.com/r/&lt;code&gt;), with visits and signups counted for the organization, not the lead.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Commissions credited to the organization at its rate on Passports and Guides, through the existing affiliate engine; the organization as the payee, W-9 and $25 minimum.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The organization's points: given on accepting, spent by the lead, plus points members give through the Give box.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The invitation: a Nonprofit Partner kind on Founding Members (and Invites), with the organization picked from the Directory and the points Sean sets; the email and /invite page worded for an organization; accepting comps the lead and starts the partnership.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>A Nonprofit Partner badge on the listing and its Directory card.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The Nonprofit Partner Guide: Overview, Why it matters, Your link, Your kit (messages with Copy message / Copy link, the button and banner, the email blurb), Your numbers, Where the money goes.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Depot: a Nonprofit Partners view (each partner, its lead, visitors, signups, earned, paid) and its commissions in Ambassadors &gt; Commissions.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Policies: Nonprofit Partners in /policies#membership; the Guides' facts and a saved answer.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Proven end to end with an internal test organization, then removed.</span></li>
    </ul></div>
  </details>
  <details class="held">
    <summary>Sean <span class="grp-count">3</span></summary>
    <div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>Which of Susan's four emails gets the invitation (default susanh@animalherokids.org, the organization's own domain).</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The points Animal Hero Kids starts with (set on the invitation).</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Later: a higher rate for growth, and whether events or campaigns an organization runs with us count toward its earnings.</span></li>
    </ul></div>
  </details>$v$), '{{DONE_HTML}}', $v$  <details class="done">
    <summary>Concept <span class="grp-count">3</span></summary>
    <div class="body"><ul class="chk-list">
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Nonprofit Partners shaped with V (2026-10-29).</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Organization is the partner, the lead is assigned and comped, the lead's own standing unchanged (Sean, 2026-10-29).</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Locked by Sean ("lock it", 2026-10-29).</span></li>
    </ul></div>
  </details>$v$), '{{LINKS_HTML}}', $v$  <h2>Links</h2>
  <div class="link-block"><div class="link-label">Animal Hero Kids in the Directory</div><div class="link-url">https://vegansexplore.com/directory/be-an-animal-hero</div></div>
  <div class="link-block"><div class="link-label">Where Sean will invite from</div><div class="link-url">https://vegansexplore.com/admin/depot/founding</div><div class="link-note">Depot &gt; People &gt; Founding Members</div></div>
  <div class="link-block"><div class="link-label">The pattern it follows</div><div class="link-url">https://vegansexplore.com/admin/depot/ambassadors</div><div class="link-note">Ambassadors and the affiliate ladder (canon canon-ve-pricing-points-passport, playbook ve-pricing-points-passport)</div></div>$v$), '{{DECISION_HISTORY_HTML}}', $v$      <h2>2026-10-29</h2>
      <p><strong>Decision (V).</strong> Locked by Sean ("lock it"). Nonprofit Partners: the organization is the partner, with its own link, a flat 20% of Passports and Guides bought through it, its own points, a marketing kit, a badge and its own Guide; payouts to the organization as referral earnings, never a donation. The lead on the account gets a complimentary Founding Membership when the organization says yes and keeps their own standing (Level 1, their own link and points). Invitation only, from Founding Members. First: Susan Hargreaves, Animal Hero Kids.</p>
      <p><strong>Decision (V).</strong> Sean, the same day: the organization does not start at a level and the lead's status is not touched: "It would be the organization, it's just what the opportunity is... they just happen to be the person assigned as the lead on the account... it would give that person a comped account if they decide to go with it."</p>$v$),
       'playbook', 'V', 'published', jsonb_build_object('template_id', id, 'template_version', version), 've-nonprofit-partners', date '2026-10-29',
       'vegans-explore', $v$Locked by Sean 2026-10-29. Concept only: nothing is built yet. Organizations invited as Nonprofit Partners earn through their own link, hold points and get a marketing kit; the lead on the account gets a complimentary Founding Membership. First: Animal Hero Kids.$v$, now(), false
  from templates where subtype = 'playbook' and status = 'active'
   and not exists (select 1 from briefings where slug = 've-nonprofit-partners');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-partners','vegans-explore','V','decision','text',$v$Locked by Sean 2026-10-29 ("lock it"). Nonprofit Partners: the organization (its Directory listing) is the partner, with its own link, a flat 20% of the $11 Passport and Guides bought through it, points it holds for our services (the amount Sean sets), a marketing kit (messages, a website button and banner, an email blurb), a Nonprofit Partner badge and its own Guide. Payouts to the organization after its W-9 at $25, as referral earnings, never a donation or tax-deductible. The lead on the account gets a complimentary Founding Membership when the organization says yes; their own standing (Level 1, their own link and points) is unchanged. Invitation only, from Depot > People > Founding Members. First: Susan Hargreaves, Animal Hero Kids (Be An Animal Hero).$v$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-partners' and body = $v$Locked by Sean 2026-10-29 ("lock it"). Nonprofit Partners: the organization (its Directory listing) is the partner, with its own link, a flat 20% of the $11 Passport and Guides bought through it, points it holds for our services (the amount Sean sets), a marketing kit (messages, a website button and banner, an email blurb), a Nonprofit Partner badge and its own Guide. Payouts to the organization after its W-9 at $25, as referral earnings, never a donation or tax-deductible. The lead on the account gets a complimentary Founding Membership when the organization says yes; their own standing (Level 1, their own link and points) is unchanged. Invitation only, from Depot > People > Founding Members. First: Susan Hargreaves, Animal Hero Kids (Be An Animal Hero).$v$);

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-partners','vegans-explore','V','decision','text',$v$Sean, 2026-10-29, correcting the first shape (Level 2 for the organization's lead): "they wouldn't actually, the organization wouldn't start at level two. It would be the organization, it's just what the opportunity is. So it doesn't impact the person's individual status. They just happen to be the person assigned as the lead on the account... if we offer this opportunity, then it would give that person a comped account if they decide to go with it."$v$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-partners' and body = $v$Sean, 2026-10-29, correcting the first shape (Level 2 for the organization's lead): "they wouldn't actually, the organization wouldn't start at level two. It would be the organization, it's just what the opportunity is. So it doesn't impact the person's individual status. They just happen to be the person assigned as the lead on the account... if we offer this opportunity, then it would give that person a comped account if they decide to go with it."$v$);

insert into knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, body)
select 'canon-ve-nonprofit-partners', 'Vegans Explore Nonprofit Partners: the organization is the partner, the lead is comped (LOCKED by Sean 2026-10-29)', 'decisions', 'partners', 'active', 'sar', false, 50,
 array['vegans-explore','nonprofits','partners','affiliate','points','invites'], 1, 'v',
 jsonb_build_object(
  'rule','A Nonprofit Partner is an organization (its Directory listing: Nonprofits, Rescues or Sanctuaries) invited to share Vegans Explore. The organization is the partner; one person is the lead on the account.',
  'organization','Its own link, separate from the lead''s; a flat 20% (Level 2''s rate, not a member level) of the $11 Passport and Guides bought through it; points it holds for our services (amount set by Sean on the invitation), spent by the lead, plus points members give it; a marketing kit (ready-to-post messages, a website button and banner, an email blurb); a Nonprofit Partner badge on its listing; its own Guide on the Ambassador Guide pattern. If the lead changes, everything stays with the organization.',
  'lead','A complimentary Founding Membership when the organization says yes (the comp and the partnership start together). Their own standing is unchanged: Level 1 by default, their own personal link and points. The organization''s earnings never move their level.',
  'payouts','Paid to the organization after its W-9 once $25 is ready, held 30 days for refunds, counted for 12 months from each join (the affiliate program defaults).',
  'wording','Referral earnings paid to the organization. Never a donation from us, never tax-deductible (LESARUSS Inc. is for-profit). Shared posts say the organization earns when you join (FTC).',
  'who','Invitation only, chosen by Sean, from Depot > People > Founding Members (Founding Member, Ambassador or Nonprofit Partner). No public application yet.',
  'later','A higher rate for growth; events or campaigns an organization runs with us counting toward its earnings.',
  'first','Susan Hargreaves, Animal Hero Kids (listing be-an-animal-hero).',
  'playbook','ve-nonprofit-partners')
where not exists (select 1 from knowledge_records where slug='canon-ve-nonprofit-partners');

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'v','vegans-explore','VEGANS EXPLORE: Nonprofit Partners locked by Sean (the organization is the partner with its own link, 20% of Passports and Guides, points, a kit, a badge and a Guide; the lead gets a comped Founding Membership, their own standing unchanged). Playbook ve-nonprofit-partners, canon canon-ve-nonprofit-partners.', array['vegans-explore','nonprofits','playbook','decision'], 'completed', 've-nonprofit-partners'
where not exists (select 1 from stream_events where context_link='ve-nonprofit-partners');
