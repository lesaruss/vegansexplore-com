-- Nonprofit Guide concept, locked by Sean 2026-10-29 (playbook ve-nonprofit-guide, canon canon-ve-nonprofit-guide).
-- The playbook is filled from the one active playbook template (templates subtype 'playbook'). Concept only: nothing is built.
-- Run through a one-time function (the connector holds writes). Safe to run twice.

insert into briefings (tenant_id, title, content, type, author, status, metadata, slug, briefing_date, brand_slug, status_summary, status_summary_updated_at, featured)
select '00000000-0000-4000-a000-000000000002'::uuid, $v$Vegans Explore: Nonprofit Guide$v$,
       replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(parameters->>'html_shell', '{{TITLE}}', $v$Vegans Explore: Nonprofit Guide$v$), '{{TYPE_LABEL}}', $v$Playbook$v$), '{{BRAND}}', $v$VEGANS EXPLORE$v$), '{{DATE}}', $v$2026-10-29$v$), '{{PREPARED_BY}}', $v$V$v$), '{{STAGE}}', $v$Locked, ready to build$v$), '{{STATUS_SUMMARY}}', $v$Locked by Sean 2026-10-29. Concept only: nothing is built yet. A Guide for Vegan nonprofits, rescues and sanctuaries on the Dairy Guide pattern: Sean's Canva Vegan Nonprofit Survival Guide as its 10 tips, our nonprofit episodes and interviews played in place, the Directory built in, ending on Become a Nonprofit Partner. Susan Hargreaves' invitation waits for it.$v$), '{{OVERVIEW_SECTIONS_HTML}}', $v$  <h2>The idea</h2>
  <div class="section-block">
    <p>The <strong>Nonprofit Guide</strong> is a Vegans Explore Guide for the people who run Vegan nonprofits, rescues and sanctuaries, built like the Vegan Dairy Guide: a mini app with a Guide on the right of every tab, the knowledge on the left, and our Directory, podcasts and Pulse built in. Its knowledge is Sean's <strong>Vegan Nonprofit Survival Guide</strong> (Canva, "Top 10 Ways to Fundraise and Stay Relevant in Today's Economy"). It is what we hand an organization before we invite it to be a Nonprofit Partner, and it ends on that offer.</p>
    <p>Sean, 2026-10-29: "similar to the dairy guide in the sense that it's going to be pulling from the Canva document we created to provide them with knowledge, insights, but also have the directory baked into it... any nonprofit we featured, we could feature their interviews on our platform."</p>
  </div>

  <h2>Locked decisions</h2>
  <div class="section-block">
    <h3>What is in it (the tabs are the tour)</h3>
    <ul>
      <li><strong>Overview</strong>: what the Guide is and what each tab holds.</li>
      <li><strong>The 10 tips</strong>, one per view: the Canva lesson, its case example or pro tip, a short checklist to do this week, and the episode or moment that backs it up (storytelling, diversify revenue, digital presence, peer-to-peer, keep your donors, business partnerships, virtual and hybrid, data, younger generations, equity and trust). Tip 1 is free, the example.</li>
      <li><strong>Pulse</strong>: our nonprofit series (Vegans Explore Podcast episode 111, The Nonprofit Survival Guide, and episodes 123 to 127: burnout, marketing without a big budget, fundraising systems, volunteers to leaders, infrastructure that lasts) and the nonprofit leaders on our shows (Susan Hargreaves, Ingrid Newkirk, Rachel Black, Renee and Tommy Sonnen, Richard "Kudo" Couto, Jordan David, Liz Jones, Earthling Ed, Honey LaBronx and more), played in place like the People pages, plus the content index's moments on activism, animal rights, sanctuaries and community.</li>
      <li><strong>Directory</strong>: Nonprofits, Rescues and Sanctuaries with the Directory's own card, pills, search and chapter picker; opening one stays in the Guide.</li>
      <li><strong>Get found</strong>: claim and fill out the listing, members' votes, the chapters it serves, points given to it.</li>
      <li><strong>Business partners</strong> (tip 6 made real): Vegan brands and restaurants in their chapter from our Directory that fit a cause-marketing tie-in, with a ready-to-send pitch.</li>
      <li><strong>Events</strong>: submit their event to our calendar, find vendors (Markets &amp; events), Promote your event.</li>
      <li><strong>Peer-to-peer kit</strong> (inside the tips or Events): ready-to-post messages for World Vegan Day, Giving Tuesday and Earth Day.</li>
      <li><strong>Burnout and support</strong>: episode 123 and Rachel Black on burnout (the Canva contents page names this section; the doc never wrote it).</li>
      <li><strong>My list</strong> (owners), <strong>Become a Nonprofit Partner</strong> (the offer, the bridge to ve-nonprofit-partners), <strong>Get access</strong> (visitors).</li>
    </ul>
    <h3>Defaults</h3>
    <ul>
      <li><strong>Price</strong>: $11 or 1,100 points, like every Guide; Tip 1 free; included for every Nonprofit Partner's lead.</li>
      <li><strong>Guide</strong>: Dani (community and warmth). Liz stays the business, Restaurant and default Guide.</li>
      <li><strong>Card</strong>: replaces the Nonprofit Guide (Coming soon) card in the Guide catalog.</li>
      <li><strong>The Canva doc's last page</strong> (a one-week Passport trial and VegansExplore.com/Surveys) is out of date; in the Guide it becomes a short survey about their organization, paid in points like the profile questions.</li>
      <li><strong>Susan Hargreaves' invitation waits</strong> until the Guide is live.</li>
    </ul>
  </div>

  <h2>Why it matters</h2>
  <div class="section-block">
    <ul>
      <li>It gives the organizations behind the animals something of real value before we ask anything of them, and it does the selling for Nonprofit Partners.</li>
      <li>It puts our own interviews with nonprofit leaders to work, and features every nonprofit we have had on our shows.</li>
      <li>It fills the Community side of the Directory with organizations that claim and keep their listings.</li>
    </ul>
  </div>
$v$), '{{PENDING_COUNT}}', $v$10$v$), '{{DONE_COUNT}}', $v$3$v$), '{{PENDING_HTML}}', $v$  <details class="held">
    <summary>Build (Logan) <span class="grp-count">8</span></summary>
    <div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>Page and script on the Dairy Guide's files (docs/guides/BUILD-A-GUIDE.md): guides/nonprofit-guide.html and guide-scripts/nonprofit-guide.js, Dani on the right, ve-guide-min.js.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>The 10 tips from the Canva doc, word for word where it is right, each with its checklist and its episode or moment; members-only text in the ve_guides row.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Pulse: PULSE_PICKS for episode 111 and 123 to 127 and the nonprofit leaders' episodes, played with VEEpisodes like the People pages; moments by topic.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Directory tab (Nonprofits, Rescues, Sanctuaries, chapter picker), Get found, Business partners (brands and restaurants by chapter, a ready pitch), Events.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Peer-to-peer kit and the organization survey (points).</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Become a Nonprofit Partner (links to the invitation path) and Get access; the ve_guides row at $11 or 1,100 points; included for Nonprofit Partner leads.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Banner (Dani, the locked banner style) and the catalog card replacing Coming soon; the Guides' facts and a saved answer.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Proven at desktop and phone width, signed out and as an owner.</span></li>
    </ul></div>
  </details>
  <details class="held">
    <summary>Sean <span class="grp-count">2</span></summary>
    <div class="body"><ul class="chk-list">
      <li class="chk-item pending"><span class="chk-box"></span><span>Review the Guide before Susan Hargreaves is invited.</span></li>
      <li class="chk-item pending"><span class="chk-box"></span><span>Dani's lines (text first; voice only if wanted, per the tours rule).</span></li>
    </ul></div>
  </details>
$v$), '{{DONE_HTML}}', $v$  <details class="done">
    <summary>Concept <span class="grp-count">3</span></summary>
    <div class="body"><ul class="chk-list">
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Read the Canva Vegan Nonprofit Survival Guide and took stock of our nonprofit episodes, people and Directory (2026-10-29).</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Value ideas and tabs proposed by V (2026-10-29).</span></li>
      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Locked by Sean ("lock it", 2026-10-29).</span></li>
    </ul></div>
  </details>
$v$), '{{LINKS_HTML}}', $v$  <h2>Links</h2>
  <div class="link-block"><div class="link-label">The Canva source</div><div class="link-url">https://www.canva.com/d/hCrNPjd5CP7i6OI</div><div class="link-note">Vegan Nonprofit Survival Guide, 14 pages, by Sean A. Russell</div></div>
  <div class="link-block"><div class="link-label">The pattern it follows</div><div class="link-url">https://vegansexplore.com/guides/vegan-dairy-guide</div><div class="link-note">docs/guides/BUILD-A-GUIDE.md (canon canon-ve-guide-build-playbook)</div></div>
  <div class="link-block"><div class="link-label">The offer it ends on</div><div class="link-url">https://vegansexplore.com/admin/depot/nonprofit-partners</div><div class="link-note">playbook ve-nonprofit-partners</div></div>
  <div class="link-block"><div class="link-label">The series at its heart</div><div class="link-url">https://vegansexplore.com/pulse/the-nonprofit-survival-guide-marketing-and-communication</div></div>
$v$), '{{DECISION_HISTORY_HTML}}', $v$      <h2>2026-10-29</h2>
      <p><strong>Decision (V).</strong> Locked by Sean ("lock it"). The Nonprofit Guide: the Dairy Guide's layout, built from Sean's Canva Vegan Nonprofit Survival Guide (the 10 tips, one per view, Tip 1 free), with the Pulse (episode 111 and 123 to 127, the nonprofit leaders on our shows, played in place), the Directory's Nonprofits, Rescues and Sanctuaries, Get found, Business partners, Events, a peer-to-peer kit, burnout and support, My list, and Become a Nonprofit Partner at the end. $11 or 1,100 points, included for Nonprofit Partner leads; Dani narrates; it replaces the Coming soon card. Susan Hargreaves' invitation waits until it is live.</p>
      <p><strong>Decision (V).</strong> Sean, the same day: "I want to create a nonprofit guide in the same way that we're doing all these things... pulling from the Canva document we created to provide them with knowledge, insights, but also have the directory baked into it... any nonprofit we featured, we could feature their interviews on our platform."</p>
$v$),
       'playbook', 'V', 'published', jsonb_build_object('template_id', id, 'template_version', version), 've-nonprofit-guide', date '2026-10-29',
       'vegans-explore', $v$Locked by Sean 2026-10-29. Concept only: nothing is built yet. A Guide for Vegan nonprofits, rescues and sanctuaries on the Dairy Guide pattern: Sean's Canva Vegan Nonprofit Survival Guide as its 10 tips, our nonprofit episodes and interviews played in place, the Directory built in, ending on Become a Nonprofit Partner. Susan Hargreaves' invitation waits for it.$v$, now(), false
  from templates where subtype = 'playbook' and status = 'active'
   and not exists (select 1 from briefings where slug = 've-nonprofit-guide');

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-guide','vegans-explore','V','decision','text',$v$Locked by Sean 2026-10-29 ("lock it"). The Nonprofit Guide: the Dairy Guide's layout, built from Sean's Canva Vegan Nonprofit Survival Guide (10 tips, one per view, Tip 1 free), with the Pulse (Vegans Explore Podcast 111 and 123 to 127, the nonprofit leaders on our shows, played in place), the Directory's Nonprofits, Rescues and Sanctuaries, Get found, Business partners, Events, a peer-to-peer kit, burnout and support, My list and Become a Nonprofit Partner. $11 or 1,100 points, included for Nonprofit Partner leads; Dani narrates; it replaces the Coming soon card. Susan Hargreaves' invitation waits until it is live.$v$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-guide' and body = $v$Locked by Sean 2026-10-29 ("lock it"). The Nonprofit Guide: the Dairy Guide's layout, built from Sean's Canva Vegan Nonprofit Survival Guide (10 tips, one per view, Tip 1 free), with the Pulse (Vegans Explore Podcast 111 and 123 to 127, the nonprofit leaders on our shows, played in place), the Directory's Nonprofits, Rescues and Sanctuaries, Get found, Business partners, Events, a peer-to-peer kit, burnout and support, My list and Become a Nonprofit Partner. $11 or 1,100 points, included for Nonprofit Partner leads; Dani narrates; it replaces the Coming soon card. Susan Hargreaves' invitation waits until it is live.$v$);

insert into playbook_records (slug, brand_slug, author, kind, source, body)
select 've-nonprofit-guide','vegans-explore','V','decision','text',$v$Sean, 2026-10-29: "I want to create a nonprofit guide in the same way that we're doing all these things... similar to the dairy guide in the sense that it's going to be pulling from the Canva document we created to provide them with knowledge, insights, but also have the directory baked into it... any nonprofit we featured, we could feature their interviews on our platform."$v$
where not exists (select 1 from playbook_records where slug='ve-nonprofit-guide' and body = $v$Sean, 2026-10-29: "I want to create a nonprofit guide in the same way that we're doing all these things... similar to the dairy guide in the sense that it's going to be pulling from the Canva document we created to provide them with knowledge, insights, but also have the directory baked into it... any nonprofit we featured, we could feature their interviews on our platform."$v$);

insert into knowledge_records (slug, title, category, subcategory, status, owner, always_load, load_priority, tags, version, created_by, body)
select 'canon-ve-nonprofit-guide', 'Vegans Explore Nonprofit Guide: the Survival Guide as a mini app, ending on Nonprofit Partners (LOCKED by Sean 2026-10-29)', 'decisions', 'guides', 'active', 'sar', false, 50,
 array['vegans-explore','nonprofits','guides','partners'], 1, 'v',
 jsonb_build_object(
  'rule','The Nonprofit Guide is a Vegans Explore Guide for people who run Vegan nonprofits, rescues and sanctuaries, built on the Dairy Guide pattern (docs/guides/BUILD-A-GUIDE.md): tabs are the tour, the Guide on the right, the Directory built in.',
  'source','Sean''s Canva Vegan Nonprofit Survival Guide (design DAGx8V9AvKE): the 10 tips, one per view, each with its case example or pro tip, a checklist and the episode or moment behind it. Tip 1 free.',
  'tabs','Overview, The 10 tips, Pulse (Vegans Explore Podcast 111 and 123 to 127, the nonprofit leaders on our shows, content index moments), Directory (Nonprofits, Rescues, Sanctuaries), Get found, Business partners, Events, peer-to-peer kit, burnout and support, My list, Become a Nonprofit Partner, Get access.',
  'price','$11 or 1,100 points, like every Guide; included for every Nonprofit Partner lead.',
  'guide','Dani narrates (Liz stays the business, Restaurant and default Guide). Lines as text first; voice only if wanted.',
  'catalog','Replaces the Nonprofit Guide (Coming soon) card in public/ve-guide-catalog.js.',
  'canva_fixes','The Canva contents page lists Burnout and Lack of Support but the doc never wrote it (the Guide does); its last page (a one-week Passport trial, VegansExplore.com/Surveys) is out of date and becomes an organization survey paid in points.',
  'order','Susan Hargreaves (Animal Hero Kids) is invited as a Nonprofit Partner only after this Guide is live.',
  'playbook','ve-nonprofit-guide')
where not exists (select 1 from knowledge_records where slug='canon-ve-nonprofit-guide');

insert into stream_events (owner, station, summary, keywords, status, context_link)
select 'v','vegans-explore','VEGANS EXPLORE: Nonprofit Guide locked by Sean (the Canva Vegan Nonprofit Survival Guide as a Dairy Guide style mini app: 10 tips, our nonprofit episodes and interviews, the Directory built in, ending on Become a Nonprofit Partner; $11 or 1,100 points, Dani narrates). Playbook ve-nonprofit-guide, canon canon-ve-nonprofit-guide.', array['vegans-explore','nonprofits','guides','playbook','decision'], 'completed', 've-nonprofit-guide'
where not exists (select 1 from stream_events where context_link='ve-nonprofit-guide');
