/* The Vegan Events Guide (2026-11-01, Sean: "Logan, build the Events Guide"; canon canon-ve-events-guide, playbook ve-events-guide).
 * Built on the Nutrition Guide's files, which follow docs/guides/BUILD-A-GUIDE.md.
 *
 * For anyone hosting a Vegan event: potlucks, social clubs, festival promoters, pop-ups, a restaurant's community night, a fundraiser.
 * The top of the organizer funnel: it leads into Submit an event, Promote your event, Group Partners, an event sponsorship from us, and
 * the Group Partner Guide. The tabs are the tour; River stays on the right of every tab (his lines show as text, no recordings). The
 * address bar carries the view (#/kinds/market, #/plan, #/work/apply/2, #/hosts/tell/2).
 *
 *   Overview      what the Guide is and what each tab holds
 *   Kinds         eight kinds of events, one per view: what it costs, how big, what goes wrong, what helps (members)
 *   The plan      the countdown checklist from 12 weeks out to the day after, kept in the browser (ev_checks), Copy it and Print it
 *   Money         the budget lines and pricing (members), the break-even worksheet and our ticketing (open)
 *   Venue         Services > Event Venues and every place tagged ve-hosts-events, by chapter (open); what to ask a venue and the red flags (members)
 *   Vendors       Vendors, Food Trucks, Catering and brands that vend, by chapter (open); recruiting, the agreement, labels (members)
 *   Gear          the shop: every item a tracked /go/ link to Amazon with our tag (open)
 *   The word      the timeline and channels (members); Submit an event and Promote your event (open)
 *   Day of        What to do when it rains, the free example (open); the run of show, roles, the door, safety (members)
 *   After         the thank yous, the recap, the numbers, the survey (members)
 *   Elephants     the questions nobody asks out loud, each with what to do (members)
 *   Hosts         our episodes with event hosts, approved host stories, and Tell us your story (six questions by voice; ve-events-guide)
 *   Work with us  why us, what a sponsorship gives and asks, who qualifies, and the application (four steps; ve-events-guide)
 *   My list       members: saved sections, listings and episodes (ve_guide_saves through ve-cookbook: fix, listing, episode)
 *   Get access    visitors: $11 or 1,100 points (included for Group Partner leads)
 *
 * Access is every Guide's: ve-guide-unlock for this slug decides. The members-only text is ve_guides.content_html (<script id="ev-data">),
 * handed out only to its owners. Never add it to this repo.
 */
(function () {
  var SLUG = 'vegan-events-guide';
  var SB = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var UNLOCK_URL = SB + '/functions/v1/ve-guide-unlock';
  var COOK_URL = SB + '/functions/v1/ve-cookbook';
  var PODCAST_FN = SB + '/functions/v1/ve-podcast';
  var EV_FN = SB + '/functions/v1/ve-events-guide';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var FIELDS = window.VERegionDirectory ? VERegionDirectory.FIELDS : 'id,slug,name,category,logo_url,vote_count,address_city,address_state,color,vegan_status,communities,tags,extra_categories';
  function catUrl(cats, limit) {
    return SB + '/rest/v1/listings?select=' + FIELDS + '&status=eq.approved&business_status=not.eq.CLOSED_PERMANENTLY&or=(category.in.(' + cats.map(encodeURIComponent).join(',') + '),extra_categories.ov.{' + cats.map(function (c) { return '"' + encodeURIComponent(c) + '"'; }).join(',') + '})&order=vote_count.desc.nullslast,name.asc&limit=' + (limit || 1000);
  }
  // Event Venues, and every listing where a Vegan event was held in the last year (tag ve-hosts-events, kept by ve_event_venues_sync;
  // Sean, 2026-11-01: where Vegans already hold their events).
  var VENUES_URL = catUrl(['Event Venues']).replace('&or=(', '&or=(tags.cs.%7Bve-hosts-events%7D,');
  var VENDORS_URL = catUrl(['Vendors', 'Food Trucks', 'Catering']);
  // LESARUSS.ai's own listings share the table; they never show here.
  var LR_TAGS = ['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'];
  function ours(list) { return (Array.isArray(list) ? list : []).filter(function (l) { return !(l.tags || []).some(function (t) { return LR_TAGS.indexOf(t) >= 0; }); }); }

  // Our episodes with people who host events, as their podcast episodes: [ve_pulse_content slug, the show's Directory slug, the feed guid,
  // group]. From ve_pulse_episode_map, 2026-11-01.
  var PULSE_PICKS = [
    ['vegfest-expos-health-focused-vegan-festivals-helene', 'vegans-explore-podcast', 'ebd4369e-9a6b-4af2-be13-452bbabf4936', 'hosts'],
    ['vgan-corner-jacobo-garcia-wynwood', 'vegans-explore-podcast', '6ae7aa25-d450-40e2-8a7c-65e8923d9ba2', 'hosts'],
    ['vegan-kween-keya-philly-guide', 'vegans-explore-podcast', '6b69fb7d-da34-43ce-8837-adcb40da4a39', 'hosts'],
    ['virginia-vegan-scene-the-southern-vegan-richmond', 'vegans-explore-podcast', '417c1b16-aead-48f0-9c4a-8ac3529b0898', 'hosts'],
    ['marketing-that-converts-without-a-big-budget', 'vegans-explore-podcast', '84d3d5b9-f90b-47d0-9f55-1d49f0c3b2a4', 'word'],
    ['sandra-nomoto-making-a-social-impact-through-marketing-soflo-vegans-podcast', 'soflo-vegans-podcast', 'eaf8b519-dc62-4f6f-b571-d4e51d18b49b', 'word']
  ];
  var SHOW_SLUGS = PULSE_PICKS.map(function (x) { return x[1]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var SHOWS_URL = SB + '/rest/v1/listings?select=id,slug,name,logo_url&status=eq.approved&slug=in.(' + SHOW_SLUGS.join(',') + ')';
  var PULSE_URL = SB + '/rest/v1/ve_pulse_content?select=slug,title,podcast_show,summary,published_at&status=eq.published&slug=in.(' + PULSE_PICKS.map(function (x) { return x[0]; }).join(',') + ')';

  // The gear shop: [group, [code, name, why]]. Every link is a tracked /go/ link (ve_links, initiative vegan-events-guide; ve-links
  // adds our Amazon tag). A new item is a row here and a ve_links row.
  var GEAR = [
    ['Shelter and weather', [['ev-gear-canopy', '10x10 canopy', 'The standard vendor and welcome tent.'], ['ev-gear-weights', 'Canopy weights', 'Every leg, every time.'],
      ['ev-gear-sidewalls', 'Canopy sidewalls', 'For wind and rain on one side.'], ['ev-gear-tarp', 'Tarps', 'Under tables, over boxes.'], ['ev-gear-tubs', 'Lidded tubs', 'Paper goods stay dry.'],
      ['ev-gear-fan', 'Battery fan', 'For the hot table.'], ['ev-gear-cooler', 'Rolling cooler', 'Ice and drinks.'], ['ev-gear-water', 'Water dispenser', 'Free water for everyone.']]],
    ['Power and light', [['ev-gear-power-station', 'Portable power station', 'Quiet power, no fumes.'], ['ev-gear-cords', 'Outdoor extension cords', 'Rated for outdoors.'],
      ['ev-gear-cord-cover', 'Cord cover', 'Nobody trips.'], ['ev-gear-lights', 'String lights', 'An evening event looks right.'], ['ev-gear-lantern', 'Battery lanterns', 'When the power goes.'],
      ['ev-gear-power-bank', 'Power banks', 'For phones and card readers.']]],
    ['Tables and display', [['ev-gear-table', '6 ft folding tables', 'The standard vendor table.'], ['ev-gear-tablecloth', 'Fitted tablecloths', 'Hides the boxes underneath.'],
      ['ev-gear-risers', 'Display risers', 'Height sells.'], ['ev-gear-chairs', 'Folding chairs', 'For vendors and anyone who needs a seat.']]],
    ['Moving it', [['ev-gear-wagon', 'Folding wagon', 'Car to booth in one trip.'], ['ev-gear-hand-truck', 'Hand truck', 'For coolers and boxes.'], ['ev-gear-bungees', 'Bungees and zip ties', 'Fix anything.']]],
    ['Money and the door', [['ev-gear-card-reader', 'Card reader', 'Most guests pay by card.'], ['ev-gear-cash-box', 'Cash box', 'For the rest.'], ['ev-gear-clicker', 'Tally counter', 'Know how many came.'],
      ['ev-gear-wristbands', 'Wristbands', 'Who has paid, at a glance.'], ['ev-gear-name-tags', 'Name tags', 'Strangers become friends faster.']]],
    ['Safety and clean-up', [['ev-gear-first-aid', 'First aid kit', 'Know where it is.'], ['ev-gear-extinguisher', 'Fire extinguisher', 'Where anything cooks.'],
      ['ev-gear-sanitizer', 'Hand sanitizer station', 'By the food.'], ['ev-gear-trash', 'Trash and recycling bins', 'Empty them all day.']]],
    ['Signs and sound', [['ev-gear-sign-stand', 'A-frame sign', 'Point people in.'], ['ev-gear-banner', 'Banner with grommets', 'Your name, big.'],
      ['ev-gear-qr-stand', 'Sign holder', 'For the QR code to your next event.'], ['ev-gear-megaphone', 'Speaker with a microphone', 'For the welcome and the ask.']]]
  ];

  // The six questions a host answers by voice (Hosts > Tell us your story). Keep in step with QUESTIONS in ve-events-guide.
  var STORY_QS = [
    ['q1', 'Tell us about your first event.'], ['q2', 'What went wrong, and what did you do?'], ['q3', 'Your rain story, or your worst-weather story.'],
    ['q4', 'How did you get people to come back?'], ['q5', 'What would you tell someone hosting their first event?'], ['q6', 'Your proudest moment as a host.']
  ];
  var CHAPTERS = [['south-florida', 'South Florida'], ['central-florida', 'Central Florida'], ['north-florida', 'North Florida'], ['atlanta', 'Atlanta'],
    ['washington-dc', 'Washington, D.C.'], ['delaware', 'Delaware'], ['maryland', 'Maryland'], ['virginia', 'Virginia'], ['west-virginia', 'West Virginia'],
    ['new-york', 'New York'], ['philadelphia', 'Philadelphia'], ['los-angeles', 'Los Angeles'], ['london', 'London'], ['other', 'Somewhere else']];

  // The tabs, in tour order, and what River says on each (text drafts for Sean; no recordings yet). `say` is for visitors (why get it),
  // `sayMember` walks an owner through what they have.
  var TABS = [
    { k: 'overview', label: 'Overview', say: 'I\'m River. I\'ve been to a lot of Vegan events, and the great ones have one thing in common: somebody planned for what could go wrong.',
      sayMember: 'Welcome in. Start with the plan, work through each tab as your date gets closer, and come back before every event.' },
    { k: 'kinds', label: 'Kinds', lock: 1, say: 'A potluck, a market, a festival, a dinner: each one costs different, grows different and goes wrong in its own way.',
      sayMember: 'Pick the kind you are planning. Each one tells you what it costs, how big it gets and what usually goes wrong.' },
    { k: 'plan', label: 'The plan', lock: 1, say: 'A countdown from twelve weeks out to the day after, so nothing important gets left to the last minute.',
      sayMember: 'Tick things off as you go. It saves on this device, and you can copy or print it for your team.' },
    { k: 'money', label: 'Money', say: 'Work out where your event breaks even before you set a price. The worksheet is open for you to try.',
      sayMember: 'Your costs, your income and how to price it. Run the worksheet before you set a ticket price.' },
    { k: 'venue', label: 'Venue', say: 'Venues in your chapter from our Directory, and in the full Guide, what to ask before you sign anything.',
      sayMember: 'Find a venue near you, then take the questions with you when you visit. Watch for the red flags.' },
    { k: 'vendors', label: 'Vendors', say: 'Vegan vendors, food trucks and caterers in your chapter. The full Guide covers how to pick them and what to agree.',
      sayMember: 'Find vendors here, use the application questions, and put the agreement in writing.' },
    { k: 'gear', label: 'Gear', say: 'Everything you need to pack, from canopy weights to the card reader. Tap any item to shop for it.',
      sayMember: 'Your packing list. Tap any item to shop for it, and check it off when it is in the car.' },
    { k: 'word', label: 'The word', lock: 1, say: 'When to post, where, and what to say, so people actually show up.',
      sayMember: 'Follow the timeline, use every channel on the list, and put your event on our calendar first.' },
    { k: 'dayof', label: 'Day of', say: 'What to do when it rains is open for you. The full Guide adds the run of show, your helpers\' jobs and the door.',
      sayMember: 'The run of show, who does what, the door and safety. And what to do when it rains.' },
    { k: 'after', label: 'After', lock: 1, say: 'The day after is when the next event is made: the thank yous, the recap and the numbers.',
      sayMember: 'Thank everyone, post the recap, write down the numbers and set the next date.' },
    { k: 'elephants', label: 'Elephants', lock: 1, say: 'No-shows, vendors losing money, venues that are not Vegan. The things hosts worry about and rarely say out loud.',
      sayMember: 'Every one of these has happened to someone. Read them before your next event, not after.' },
    { k: 'hosts', label: 'Hosts', say: 'Hosts who have done it, on our shows. Hosted an event? Tell us your story by voice and you could be on the podcast.',
      sayMember: 'Hear from hosts who have done it, and tell us your own story. Approved stories earn you points.' },
    { k: 'claim', label: 'Claim', lock: 1, say: 'Your event, your group and your own profile, claimed, so people find you and we can work together.',
      sayMember: 'Claim what is yours: the event on our calendar, your group or venue in the Directory, and your own profile. Then apply for a sponsorship.' },
    { k: 'work', label: 'Work with us', say: 'We can sponsor your event with marketing: our calendar, the Daily Pulse, our socials and someone to cover it.',
      sayMember: 'Here is what a sponsorship from us looks like. If your event qualifies, apply right here.' },
    { k: 'mylist', label: 'My list', mine: 1, say: 'Everything you saved is here: sections, venues, vendors and episodes.' },
    { k: 'join', label: 'Get access', guest: 1, say: 'The Vegan Events Guide is eleven dollars, or 1,100 points, and it\'s yours to keep. Buying it makes you a member of Vegans Explore.' }
  ];
  var S = 'stroke="#1f5f22" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  function ic(path, size) { return '<svg width="' + (size || 26) + '" height="' + (size || 26) + '" viewBox="0 0 24 24" fill="none" ' + S + ' aria-hidden="true">' + path + '</svg>'; }
  var ICON = {
    kinds: '<rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    plan: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14l2 2 4-4"/>',
    money: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.9 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5v1.5M12 16v1.5"/>',
    venue: '<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M10 21v-5h4v5"/>',
    vendors: '<path d="M4 10h16l-1.5-5h-13z"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/>',
    gear: '<path d="M3 20l9-15 9 15z"/><path d="M12 5v15"/>',
    word: '<path d="M4 10v4l11 5V5z"/><path d="M15 9a3 3 0 010 6M4 14l2 5"/>',
    dayof: '<path d="M4 15a8 8 0 0116 0z"/><path d="M12 15v5a2 2 0 01-4 0"/>',
    after: '<path d="M4 12l5 5 11-11"/>',
    elephants: '<path d="M6 18v-5a6 6 0 0112 0v2a3 3 0 01-3 3h-1M14 18v2M9 18v2"/><path d="M18 13c2 0 3 1.5 3 4"/><circle cx="10" cy="11" r=".6"/>',
    hosts: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
    work: '<path d="M8 11l3 3 6-6"/><path d="M12 21c5-2 8-6 8-11V5l-8-3-8 3v5c0 5 3 9 8 11z"/>',
    rain: '<path d="M7 15a4 4 0 010-8 5 5 0 019.6-1A4 4 0 0117 15z"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>'
  };
  var KIND_ICON = {
    potluck: '<path d="M4 11h16a8 8 0 01-16 0z"/><path d="M12 4v3M9 5l1 2M15 5l-1 2"/>', social: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20c0-3 2-5 5-5s5 2 5 5M11 20c0-3 2-5 5-5s5 2 5 5"/>',
    dinner: '<path d="M7 3v8M5 3v4a2 2 0 004 0V3M7 11v10M17 3c-2 2-2 6 0 8v10"/>', market: ICON.vendors, festival: '<path d="M4 20V8l8-5 8 5v12"/><path d="M4 8h16M9 20v-6h6v6"/>',
    fundraiser: '<path d="M12 21s-7-4.5-9-9c-1.4-3.2.6-7 4-7 2 0 3.3 1 4 2.2.7-1.2 2-2.2 4-2.2 3.4 0 5.4 3.8 4 7-2 4.5-9 9-9 9z"/>', workshop: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M7 9v5c0 1.5 2.5 3 5 3s5-1.5 5-3V9"/>',
    'watch-party': '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>'
  };
  var LOCK_SVG = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
  var HEART = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
  var BOOKMARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/></svg>';

  var main = document.getElementById('dgMain');
  var menuEl = document.getElementById('dgMenu'), menuSel = document.getElementById('dgMenuSelect');
  var qEl = document.getElementById('dgQ');
  var PUB = JSON.parse(document.getElementById('ev-public').textContent);

  var access = 'checking';       // checking | guest | pending | member  (a door Guide opens for an active member: the $11, or the Guide's survey, canon-ve-door-guides)
  var MEM = null;                // members-only payload
  var ST = { rule: 'points', cost: 1100, balance: 0, active: false, via: null };
  var PODS = null, VENUES = null, VENDORS = null, STORIES = null;
  var curTab = 'overview';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function auth() { return window.VEAuth || null; }
  function token() { var a = auth(); return a && a.isLoggedIn && a.isLoggedIn() ? a.getToken() : null; }
  // member() = can read every screen (an active member: the $11, or the Guide's survey); signedIn() = the same, for saves (saves, votes, My list).
  function member() { return access === 'member'; }
  function signedIn() { return access === 'member'; }
  // The event survey (ve_surveys 'vegan-events-guide'): free, earns points, opens the Guide and a membership, and is step one of a sponsorship application.
  var SURVEY = { done: false, known: false };
  var SURVEY_URL = '/survey?s=' + SLUG;
  function surveyGo() { try { sessionStorage.setItem('ve_survey_for', SLUG); } catch (e) {} location.href = SURVEY_URL; }
  function loadSurvey() {
    var tok = token(); if (!tok) { SURVEY.known = true; return; }
    fetch(SB + '/functions/v1/ve-mission-survey?action=survey_get', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }, body: JSON.stringify({ token: tok, survey: SLUG }) })
      .then(function (r) { return r.json(); }).then(function (d) { SURVEY.done = !!(d && d.survey && d.survey.completed); SURVEY.known = true; if (/^#\/(work|claim)/.test(location.hash)) route(); }).catch(function () { SURVEY.known = true; });
  }
  function sources(list) { return list && list.length ? '<span class="dg-src">' + list.map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a>'; }).join('') + '</span>' : ''; }
  function tabs() { return TABS.filter(function (t) { return !(t.guest && signedIn()) && !(t.mine && !signedIn()); }); }
  function tab(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i].k === k) return TABS[i]; return TABS[0]; }
  function href(k) { return '#/' + (k === 'overview' ? '' : k); }
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function recall(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function pts(n) { return Number(n || 0).toLocaleString('en-US'); }
  function money(n) { return '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function rest(url) { return fetch(url, { headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY } }).then(function (r) { return r.json(); }); }
  function evApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json', apikey: ANON_KEY };
    if (tok) h.Authorization = 'Bearer ' + tok;
    return fetch(EV_FN, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function list(items) { return '<ul class="ev-list">' + (items || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }

  // ---------- tabs ----------
  function drawMenu(cur) {
    var locked = !member();
    menuEl.innerHTML = tabs().map(function (t) {
      return '<a href="' + href(t.k) + '"' + (t.k === cur ? ' aria-current="page"' : '') + (t.guest ? ' class="dg-join-tab"' : '') + '>' + esc(t.label) +
        (locked && t.lock ? ' <span class="dg-lk" aria-label="locked">' + LOCK_SVG + '</span>' : '') + '</a>';
    }).join('');
    menuSel.innerHTML = tabs().map(function (t) { return '<option value="' + t.k + '"' + (t.k === cur ? ' selected' : '') + '>' + esc(t.label) + (locked && t.lock ? ' (locked)' : '') + '</option>'; }).join('') +
      (cur === 'search' ? '<option value="search" selected>Search results</option>' : '');
  }
  menuSel.addEventListener('change', function () { location.hash = href(menuSel.value); });

  // ---------- pieces ----------
  function crumb(parts) {
    return '<div class="dg-crumb"><a href="#/">Events Guide</a>' + parts.map(function (p) { return ' &rsaquo; ' + (p[1] ? '<a href="' + p[1] + '">' + esc(p[0]) + '</a>' : esc(p[0])); }).join('') + '</div>';
  }
  function head(k, h, lede, right) {
    return '<div class="dg-head"><div><div class="dg-k">' + esc(k) + '</div><h2 class="dg-h1">' + h + '</h2></div>' + (right || '') + '</div>' + (lede ? '<p class="dg-lede">' + lede + '</p>' : '');
  }
  function toggles(items, cur) {
    return '<div class="dg-toggles" role="group">' + items.map(function (x) { return '<a href="' + x[1] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[0]) + '</a>'; }).join('') + '</div>';
  }
  function skel(title, lines) { var h = '<div class="dg-skel">' + (title ? '<h3>' + esc(title) + '</h3>' : '<i></i>'); for (var i = 0; i < (lines || 3); i++) h += '<i style="width:' + (92 - i * 9) + '%"></i>'; return h + '</div>'; }
  function gated(inner, title, text) {
    return '<div class="dg-gated"><div class="dg-blur" aria-hidden="true">' + inner + '</div><div class="dg-gate"><span class="dg-lockic">' + LOCK_SVG.replace(/width="11" height="11"/, 'width="16" height="16"').replace('currentColor', '#1f5f22') + '</span>' +
      '<b>' + esc(title) + '</b><p>' + esc(text) + ' Take the free event survey to open the rest of the Guide, or ' + esc(offerLine().replace(/^It is /, 'it is ')) + '</p>' + surveyBtns() + '</div></div>';
  }
  // Free with the Guide's survey (Sean, 2026-11-03): about ten minutes, earns points, opens the Guide and a membership. The $11 is the other way through.
  function surveyBtns() {
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-survey>Take the event survey, free</button>' +
      '<button type="button" class="dg-btn dg-ghost" data-join>' + esc(ctaLabel()) + '</button>' + (mode() === 'join' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') + '</div>';
  }
  function row(o) {
    return '<div class="dg-srow"' + (o.href ? ' data-href="' + o.href + '"' : '') + '>' + (o.icon ? '<span class="dg-th rg-th" aria-hidden="true">' + o.icon + '</span>' : '') +
      '<div class="dg-srow-b">' + (o.pre || '') + '<h3>' + (o.href ? '<a href="' + o.href + '">' + esc(o.title) + '</a>' : esc(o.title)) + '</h3>' + (o.body || '') + '</div>' +
      (o.acts ? '<div class="dg-acts">' + o.acts + '</div>' : '') + '</div>';
  }
  function box(title, inner) { return '<div class="ev-box"><h3>' + esc(title) + '</h3>' + inner + '</div>'; }

  // ---------- the offer: $11 or 1,100 points ----------
  function mode() {
    if (access === 'guest' || access === 'checking') return 'join';
    return ST.balance >= ST.cost ? 'points' : 'buy';
  }
  function ctaLabel() { return { join: 'Get it for $11', points: 'Unlock with ' + pts(ST.cost) + ' points', buy: 'Get it for $11' }[mode()]; }
  function offerLine() {
    if (mode() === 'points') return 'Unlock it with ' + pts(ST.cost) + ' points: you have ' + pts(ST.balance) + '. Or get it for $11.';
    return 'It is $11, or ' + pts(ST.cost) + ' points, and yours to keep. Buying it makes you a member of Vegans Explore.';
  }
  function ctaBtns() {
    var m = mode();
    return '<div class="dg-btns"><button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' +
      (m === 'join' ? '<a href="#" data-signin>Already a member? Sign in</a>' : '') +
      (m === 'points' ? '<a href="#" data-buy>Or get it for $11</a>' : '') +
      (m === 'buy' ? '<a href="/passport">Or get your Passport: $11 with 1,100 points</a>' : '') + '</div>';
  }
  function take(d) {
    if (!d || d.error) return;
    if (d.access_rule) ST.rule = d.access_rule;
    if (d.cost) ST.cost = d.cost;
    ST.balance = d.balance || 0; ST.active = d.membership_status === 'active'; ST.via = d.via || null;
  }
  function drawJoinbox() {
    var b = document.querySelector('.dg-joinbox'); if (!b || signedIn()) return;
    var jb = b.querySelector('[data-survey]') || b.querySelector('[data-join]');
    jb.textContent = 'Take the survey, free'; jb.setAttribute('data-survey', '1'); jb.removeAttribute('data-join');
    b.querySelector('.dg-jb-in').style.display = mode() === 'join' ? '' : 'none';
  }

  // ---------- saves and votes (ve-cookbook, the Guide's own lists) ----------
  function cookApi(body) {
    var tok = token(), h = { 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    body.guide = SLUG;
    return fetch(COOK_URL, { method: 'POST', headers: h, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  // Saves: a section of the Guide is kind fix (a kind of event, an elephant, the rain plan), a Directory listing, an episode.
  var SV = { fix: {}, episode: {}, listing: {} }, SV_ORDER = [], svState = '', svWait = [];
  function loadSaves(then) {
    if (then) svWait.push(then);
    if (svState === 'loading') return;
    if (!signedIn() || svState === 'loaded') { var w0 = svWait; svWait = []; w0.forEach(function (f) { f(); }); return; }
    svState = 'loading';
    var finish = function () { paintSaves(); var w = svWait; svWait = []; w.forEach(function (f) { f(); }); };
    cookApi({ action: 'saves' }).then(function (d) {
      if (d && d.saves) { SV_ORDER = d.saves; d.saves.forEach(function (x) { if (SV[x.kind]) SV[x.kind][x.key] = 1; }); svState = 'loaded'; } else svState = '';
      finish();
    }).catch(function () { svState = ''; finish(); });
  }
  function saveBtn(kind, key) {
    var on = !!SV[kind][key];
    return '<button type="button" class="dg-save' + (on ? ' on' : '') + '" data-save="' + kind + ':' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'Saved to My list' : 'Save to My list') + '">' + BOOKMARK + '<span>' + (on ? 'Saved' : 'Save') + '</span></button>';
  }
  function paintSaves() {
    [].forEach.call(document.querySelectorAll('[data-save]'), function (b) {
      var kk = b.getAttribute('data-save'), i = kk.indexOf(':'), on = !!(SV[kk.slice(0, i)] || {})[kk.slice(i + 1)];
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Saved to My list' : 'Save to My list';
      b.querySelector('span').textContent = on ? 'Saved' : 'Save';
    });
  }
  var GV = { counts: { episode: {} }, mine: { episode: {} } }, gvLoaded = false;
  function loadGVotes(then) {
    cookApi({ action: 'gvotes' }).then(function (d) {
      if (d && d.counts) { GV.counts = d.counts; GV.mine = { episode: {} }; (d.mine.episode || []).forEach(function (x) { GV.mine.episode[x] = 1; }); }
      gvLoaded = true; if (then) then();
    }).catch(function () { gvLoaded = true; if (then) then(); });
  }
  function gvCount(key) { return (GV.counts.episode || {})[key] || 0; }
  function gvoteBtn(key) {
    var on = !!GV.mine.episode[key];
    return '<button type="button" class="dg-vote dg-vote-s' + (on ? ' on' : '') + '" data-gvote="episode:' + esc(key) + '" aria-pressed="' + on + '" title="' + (on ? 'You voted for this' : 'Vote for this') + '">' + HEART + '<b>' + gvCount(key) + '</b></button>';
  }

  // ---------- chapters (VE_HUBS), for venues and vendors near you ----------
  function chapters() { return window.VE_HUBS || []; }
  function chapter() {
    var c = recall('ev_chapter');
    if (c && (c === 'all' || chapters().some(function (h) { return h.slug === c; }))) return c;
    var a = auth(), m = a && a.getMember ? a.getMember() : null, home = m && m.home_community;
    return home && chapters().some(function (h) { return h.slug === home; }) ? home : 'all';
  }
  function inChapter(l, slug) {
    if (slug === 'all') return true;
    var c = l.communities || [];
    if (c.indexOf('all') >= 0 || c.indexOf(slug) >= 0) return true;
    if (!l.address_city && !l.address_state) return c.indexOf('none') < 0 && !c.length;
    var h = chapters().filter(function (x) { return x.slug === slug; })[0];
    if (!h || (!h.match.cities && !h.match.states)) return false;
    if (h.match.cities && h.match.cities.indexOf(l.address_city) < 0) return false;
    if (h.match.states && h.match.states.indexOf(l.address_state) < 0) return false;
    return true;
  }
  function chapterPick(id, cur) {
    return '<select class="dg-sort ng-pick" id="' + id + '" aria-label="Chapter"><option value="all"' + (cur === 'all' ? ' selected' : '') + '>All chapters</option>' +
      chapters().map(function (h) { return '<option value="' + h.slug + '"' + (h.slug === cur ? ' selected' : '') + '>' + esc(h.name) + '</option>'; }).join('') + '</select>';
  }
  function cards(items, gridId) {
    return '<div class="vrd-root"><div class="rank-grid" id="' + gridId + '">' + items.map(function (l, i) { return window.VERegionDirectory ? VERegionDirectory.card(l, i) : ''; }).join('') + '</div></div>';
  }
  function wireCards(gridId, back) {
    var g = document.getElementById(gridId);
    if (!g || !window.VERegionDirectory) return;
    VERegionDirectory.wire(g, function (slug) { location.hash = back + '/listing/' + encodeURIComponent(slug); });
    if (signedIn()) [].forEach.call(g.querySelectorAll('.rank-card[data-slug]'), function (card) {
      var right = card.querySelector('.rank-right'); if (!right || right.querySelector('[data-save]')) return;
      right.insertAdjacentHTML('beforeend', saveBtn('listing', card.getAttribute('data-slug')));
    });
  }
  function viewListing(slug, back) {
    main.innerHTML = crumb([[back[0], back[1]], ['Directory page']]) +
      '<div class="dg-btns" style="margin-bottom:12px"><a class="dg-btn dg-ghost" href="/directory/' + encodeURIComponent(slug) + '">Open the page</a></div>' +
      '<div class="dg-lframe"><iframe id="dgListingFrame" title="Directory page" src="/directory/' + encodeURIComponent(slug) + '"></iframe></div>';
    var f = document.getElementById('dgListingFrame');
    f.addEventListener('load', function () {
      var d; try { d = f.contentDocument; } catch (e) { return; }
      if (!d || !d.body) return;
      var last = 0;
      function fit() { var h = d.body.scrollHeight; if (Math.abs(h - last) < 2) return; last = h; f.style.height = Math.max(600, Math.min(20000, h)) + 'px'; f.setAttribute('scrolling', 'no'); }
      fit();
      if (window.ResizeObserver) new ResizeObserver(fit).observe(d.body);
    });
  }
  // A Directory list by chapter, the same pattern for venues and vendors.
  var shown = 24;
  function dirList(all, gridId, back, pickId, empty) {
    var ch = chapter(), items = all ? all.filter(function (l) { return inChapter(l, ch); }) : null;
    return '<div class="dg-tools">' + chapterPick(pickId, ch) + '<span class="dg-count">' + (items ? items.length + ' shown' : '') + '</span></div>' +
      (items ? (items.length ? cards(items.slice(0, shown), gridId) + (items.length > shown ? '<div class="dg-btns" style="margin-top:14px"><button type="button" class="dg-btn dg-ghost" data-more>Show more</button></div>' : '')
        : '<p class="dg-empty">' + empty + '</p>') : '<div class="dg-loading">Loading...</div>');
  }
  function wirePick(pickId, redraw) {
    var sel = document.getElementById(pickId);
    if (sel) sel.addEventListener('change', function () { store('ev_chapter', sel.value); shown = 24; redraw(); });
  }

  // ---------- checks (kept on this device) ----------
  function checks() { try { return JSON.parse(recall('ev_checks') || '{}'); } catch (e) { return {}; } }
  function checkList(prefix, items) {
    var c = checks();
    return '<div class="ng-week">' + items.map(function (w, k) {
      var key = prefix + ':' + k;
      return '<label><input type="checkbox" data-check="' + esc(key) + '"' + (c[key] ? ' checked' : '') + '><span>' + esc(w) + '</span></label>';
    }).join('') + '</div>';
  }

  // ---------- Kinds of events ----------
  function allKinds() {
    var byId = {}; (MEM ? MEM.kinds : []).forEach(function (k) { byId[k.id] = k; });
    return PUB.kinds.map(function (k) { return byId[k[0]] || { id: k[0], title: k[1], short: k[2], locked: 1 }; });
  }
  function viewKinds(id) {
    if (id) return viewKind(id);
    var tiles = allKinds().map(function (k) {
      return row({ icon: ic(KIND_ICON[k.id] || ICON.kinds, 30), title: k.title, href: member() ? '#/kinds/' + k.id : '',
        body: '<p class="dg-srow-p">' + esc(k.short) + '</p>' + (member() ? '' : '<p class="dg-srow-p">' + LOCK_SVG + ' In the full Guide</p>'),
        acts: signedIn() ? saveBtn('fix', 'kind-' + k.id) : '' });
    }).join('');
    main.innerHTML = head('Kinds of events', 'Pick the kind of event you are hosting', 'Each kind costs different, grows different and goes wrong in its own way. Know which one you are planning before you plan it.') +
      '<div class="dg-srows">' + tiles + '</div>' +
      (member() ? '' : '<div style="margin-top:16px">' + gated(skel('What it costs, how big it gets, what goes wrong', 4), 'Every kind of event, in full', 'What each one costs, how big it gets, what usually goes wrong, and which of our tools help.') + '</div>');
  }
  function viewKind(id) {
    var ks = allKinds(), i = -1; ks.forEach(function (k, n) { if (k.id === id) i = n; });
    var k = ks[i];
    if (!k || k.locked) { main.innerHTML = crumb([['Kinds', '#/kinds'], [k ? k.title : 'Kind']]) + gated(skel(k ? k.title : '', 6), k ? k.title : 'This kind of event', 'It opens with the full Guide.'); return; }
    var next = ks[i + 1];
    main.innerHTML = crumb([['Kinds', '#/kinds'], [k.title]]) +
      '<div class="rg-fix"><div class="dg-head"><div><div class="dg-k">' + (i + 1) + ' of ' + ks.length + '</div><h2 class="dg-h1">' + esc(k.title) + '</h2></div><div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', 'kind-' + k.id) + '</div></div>' +
      '<p class="rg-problem">' + esc(k.what) + '</p>' +
      '<div class="ev-cols" style="margin-top:16px">' + box('What it costs', '<p class="dg-srow-p">' + esc(k.cost) + '</p>') + box('How big', '<p class="dg-srow-p">' + esc(k.size) + '</p>') + '</div>' +
      '<h3>What usually goes wrong</h3>' + list(k.wrong) +
      '<div class="ng-ours"><b>On Vegans Explore</b>' + esc(k.tools) + '</div>' +
      '<div class="rg-fixnav"><a class="dg-tnav" href="#/kinds">All kinds</a>' + (next ? '<a class="dg-tnav next" href="#/kinds/' + next.id + '">Next: ' + esc(next.title) + ' &rsaquo;</a>' : '<a class="dg-tnav next" href="#/plan">The plan &rsaquo;</a>') + '</div></div>';
  }

  // ---------- The plan ----------
  function planText() {
    var c = checks();
    return 'Event plan, from the Vegan Events Guide\n\n' + MEM.plan.map(function (p) {
      return p.title.toUpperCase() + '\n' + p.items.map(function (x, k) { return (c['plan-' + p.id + ':' + k] ? '[x] ' : '[ ] ') + x; }).join('\n');
    }).join('\n\n') + '\n';
  }
  function viewPlan() {
    var lede = 'From twelve weeks out to the day after. Tick things off as you go: it saves on this device. Copy it for your team, or print it.';
    if (!member()) {
      main.innerHTML = head('The plan', 'Your countdown to the day', lede) +
        gated(PUB.plan.map(function (p) { return '<div class="ev-phase"><h3>' + esc(p[1]) + '</h3>' + skel('', 3) + '</div>'; }).join(''), 'The whole countdown', 'Every step from twelve weeks out to the day after, as a checklist you can copy and print.');
      return;
    }
    var c = checks(), total = 0, done = 0;
    MEM.plan.forEach(function (p) { p.items.forEach(function (x, k) { total++; if (c['plan-' + p.id + ':' + k]) done++; }); });
    main.innerHTML = head('The plan', 'Your countdown to the day', lede,
      '<div class="dg-btns"><button type="button" class="dg-btn dg-ghost" data-copy-plan>Copy it</button><button type="button" class="dg-btn dg-ghost" onclick="window.print()">Print it</button><button type="button" class="dg-btn dg-ghost" data-clear-plan>Start a new event</button></div>') +
      '<div class="ev-bar" aria-label="' + done + ' of ' + total + ' done"><i style="width:' + (total ? Math.round(done * 100 / total) : 0) + '%"></i></div>' +
      MEM.plan.map(function (p) {
        var d = p.items.filter(function (x, k) { return c['plan-' + p.id + ':' + k]; }).length;
        return '<div class="ev-phase"><h3>' + esc(p.title) + '<span>' + d + ' of ' + p.items.length + '</span></h3>' + checkList('plan-' + p.id, p.items) + '</div>';
      }).join('');
  }

  // ---------- Money ----------
  function calcHtml() {
    var v = {}; try { v = JSON.parse(recall('ev_calc') || '{}'); } catch (e) {}
    function f(k, label, def) { return '<label>' + label + '<input type="number" min="0" step="any" inputmode="decimal" data-calc="' + k + '" value="' + esc(v[k] != null ? v[k] : def) + '"></label>'; }
    return '<div class="ev-calc">' + f('fixed', 'Costs that do not change ($)', 800) + f('per', 'Cost per guest ($)', 6) + f('price', 'Ticket price ($)', 20) + f('vendors', 'Vendor fees and sponsors ($)', 0) + f('expect', 'Guests you expect', 60) + '</div>' +
      '<div class="ev-out" id="evCalcOut"></div>';
  }
  function calcRun() {
    var out = document.getElementById('evCalcOut'); if (!out) return;
    var v = {}; [].forEach.call(document.querySelectorAll('[data-calc]'), function (el) { v[el.getAttribute('data-calc')] = Math.max(0, parseFloat(el.value) || 0); });
    store('ev_calc', JSON.stringify(v));
    var margin = v.price - v.per, need = v.fixed - v.vendors;
    var be = need <= 0 ? 0 : margin > 0 ? Math.ceil(need / margin) : null;
    var result = v.expect * margin - need;
    out.innerHTML = (be === null ? 'At this price every guest costs you money. Raise the price or lower the cost per guest.'
      : be === 0 ? 'Your vendor fees and sponsors already cover the costs that do not change.'
      : 'You break even at <b>' + be + '</b> paying guests.') +
      '<br>With ' + v.expect + ' paying guests you ' + (result >= 0 ? 'come out ' + money(result) + ' ahead.' : 'are ' + money(-result) + ' short.') +
      ' Plan for some who said yes to stay home.';
  }
  function viewMoney() {
    var top = head('Money', 'Know where it breaks even before you set a price', 'Work it out with the worksheet. The numbers stay on this device.') +
      '<h3 class="dg-k" style="margin:0 0 8px">The break-even worksheet</h3>' + calcHtml() +
      '<div class="ng-ours"><b>Tickets on Vegans Explore</b>A Group Partner sells tickets on its own page with a 5% fee on paid tickets, nothing on free events, and card processing passed to the buyer. <a href="/groups/welcome">The Group Partner Guide</a></div>';
    if (!member()) {
      main.innerHTML = top + '<div style="margin-top:18px">' + gated('<div class="ev-cols">' + box('Costs that do not change', skel('', 4)) + box('Costs per guest', skel('', 4)) + box('Where money comes in', skel('', 4)) + '</div>', 'The budget and pricing', 'Every cost to plan for, where money comes in, and how to set a price that fills the room.') + '</div>';
      calcRun(); return;
    }
    var m = MEM.money;
    main.innerHTML = top + '<p class="dg-lede" style="margin-top:18px">' + esc(m.intro) + '</p>' +
      '<div class="ev-cols">' + box('Costs that do not change', list(m.fixed)) + box('Costs per guest', list(m.variable)) + box('Where money comes in', list(m.income)) + '</div>' +
      '<h3 class="dg-k" style="margin:6px 0 8px">Setting the price</h3>' + list(m.pricing);
    calcRun();
  }

  // ---------- Venue ----------
  function viewVenue(sub) {
    if (sub && sub.indexOf('listing/') >= 0) return viewListing(decodeURIComponent(sub.split('listing/')[1]), ['Venue', '#/venue']);
    var know = member() && MEM.venue
      ? '<div class="ev-cols">' + box('What to ask before you sign', list(MEM.venue.ask)) + box('Red flags in a venue contract', list(MEM.venue.flags)) + '</div>'
      : gated('<div class="ev-cols">' + box('What to ask before you sign', skel('', 5)) + box('Red flags', skel('', 4)) + '</div>', 'What to ask a venue', 'The questions to take with you on a visit, and the red flags in a venue contract.');
    main.innerHTML = head('Venue', 'Find the room, then ask the right questions', 'Event venues in our Directory, and the restaurants and spaces where Vegan events were held this year. Members vote for the ones they love working with.') +
      dirList(VENUES, 'evVenues', '#/venue', 'evVenueCh', 'No venues listed in this chapter yet. Know one? Add it, and it helps every host after you.') +
      '<div class="dg-btns" style="margin:14px 0 22px"><a class="dg-btn dg-ghost" href="/directory?tab=services&sub=event-venues">See them in the Directory</a><a class="dg-btn dg-ghost" href="/claim?add=1">Add a venue</a></div>' + know;
    wireCards('evVenues', '#/venue'); wirePick('evVenueCh', function () { viewVenue(''); });
  }

  // ---------- Vendors and food ----------
  function viewVendors(sub) {
    if (sub && sub.indexOf('listing/') >= 0) return viewListing(decodeURIComponent(sub.split('listing/')[1]), ['Vendors', '#/vendors']);
    var v = member() && MEM.vendors;
    var know = v
      ? '<div class="ev-cols">' + box('Finding them', list(v.recruit)) + box('Ask on the application', list(v.application)) + box('Put in the agreement', list(v.agreement)) + '</div>' +
        '<div class="ng-extra"><b>Labels and allergens</b>' + esc(v.labels) + sources(v.labels_refs) + '</div>' +
        '<div class="ng-extra"><b>At a venue that is not Vegan</b>' + esc(v.shared) + '</div>' +
        '<div class="ng-extra"><b>Permits</b>' + esc(v.permits) + '</div>'
      : gated('<div class="ev-cols">' + box('Finding them', skel('', 4)) + box('The application', skel('', 4)) + box('The agreement', skel('', 4)) + '</div>', 'Vendors, done right', 'How to pick the mix, what to ask on the application, what to put in writing, labels and allergens, and permits.');
    main.innerHTML = head('Vendors and food', 'Vegan vendors near you', 'Vendors, food trucks and caterers in our Directory, and the brands that sell at markets and events.') +
      dirList(VENDORS, 'evVendors', '#/vendors', 'evVendorCh', 'No vendors listed in this chapter yet.') +
      '<div class="dg-btns" style="margin:14px 0 22px"><a class="dg-btn dg-ghost" href="/directory?tab=food&sub=vendors">See them in the Directory</a><a class="dg-btn dg-ghost" href="/claim?add=1">Add a vendor</a></div>' + know;
    wireCards('evVendors', '#/vendors'); wirePick('evVendorCh', function () { viewVendors(''); });
  }

  // ---------- Gear ----------
  function viewGear() {
    main.innerHTML = head('Gear', 'Everything to pack', 'Tap any item to shop for it. Tick it off when it is in the car: the list saves on this device.') +
      GEAR.map(function (g, gi) {
        var c = checks();
        return '<h3 class="dg-k" style="margin:18px 0 8px">' + esc(g[0]) + '</h3><div class="ev-gear">' + g[1].map(function (x) {
          var key = 'gear:' + x[0];
          return '<a href="/go/' + x[0] + '" target="_blank" rel="noopener sponsored"><i>' + ic(ICON.gear, 20) + '</i><div><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></div></a>';
        }).join('') + '</div>';
      }).join('') +
      '<h3 class="dg-k" style="margin:22px 0 8px">Packing list</h3>' + checkList('pack', GEAR.reduce(function (a, g) { return a.concat(g[1].map(function (x) { return x[1]; })); }, [])) +
      '<p class="rg-fine">As an Amazon Associate, Vegans Explore earns from qualifying purchases. Buy local first when you can: many of these are sold by Vegan vendors in our Directory.</p>';
  }

  // ---------- Getting the word out ----------
  function viewWord() {
    var open = '<div class="ev-give">' +
      box('Put it on our calendar', '<p class="dg-srow-p">Every Vegan event with its official link, read by every city hub. Drop in your flyer and we read it for you.</p><div class="dg-btns" style="margin-top:10px"><a class="dg-btn" href="/events#submit/1">Submit an event</a></div>') +
      box('Promote your event', '<p class="dg-srow-p">Hosting or promoting it? Tell us you are interested in a feature, ads, a social push or coverage.</p><div class="dg-btns" style="margin-top:10px"><a class="dg-btn dg-ghost" href="/events#mine">Your events</a></div>') +
      box('Suggest it for the Daily Pulse', '<p class="dg-srow-p">Tell your chapter\'s Daily Pulse what is coming.</p><div class="dg-btns" style="margin-top:10px"><a class="dg-btn dg-ghost" href="/pulse/suggest">Suggest a topic</a></div>') + '</div>';
    var w = member() && MEM.word;
    var body = w
      ? '<h3 class="dg-k" style="margin:6px 0 8px">The timeline</h3><div class="rg-steps">' + w.timeline.map(function (t, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(t[0]) + '</b><p>' + esc(t[1]) + '</p></div>'; }).join('') + '</div>' +
        '<div class="ev-cols">' + box('Where to post', list(w.channels)) + box('The rules', list(w.rules)) + '</div>'
      : gated('<div class="rg-steps">' + [1, 2, 3, 4].map(function (i) { return '<div class="rg-step"><em>' + i + '</em>' + skel('', 2) + '</div>'; }).join('') + '</div>', 'When to post, where, and what to say', 'The six-week timeline, every channel worth using, and the rules that keep you out of trouble.');
    main.innerHTML = head('The word', 'Get people to show up', 'Start with our calendar, then follow the timeline.') + open + body +
      '<h3 class="dg-k" style="margin:22px 0 8px">Listen</h3>' + podList('word');
  }

  // ---------- Day of, with What to do when it rains (the free example) ----------
  function rainHtml() {
    var r = PUB.rain;
    return '<div class="dg-head"><div><div class="dg-k">' + (member() ? '' : '<span class="dg-free" style="margin:0 8px 0 0">Free to read</span>') + 'Plan B</div><h2 class="dg-h1">' + esc(r.title) + '</h2></div>' + (member() ? '<div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', 'rain') + '</div>' : '') + '</div>' +
      '<p class="dg-lede">' + esc(r.lede) + '</p><div class="ev-rain">' + r.parts.map(function (p) {
        return '<div class="ev-box"><h3>' + esc(p.title) + '</h3>' + list(p.items) + sources(p.refs) + '</div>';
      }).join('') + '</div>';
  }
  function viewDayof(sub) {
    var part = String(sub || '').split('/')[0] === 'rain' ? 'rain' : 'day';
    var t = toggles([['The day', '#/dayof'], ['When it rains', '#/dayof/rain']], part === 'rain' ? 'When it rains' : 'The day');
    if (part === 'rain') { main.innerHTML = crumb([['Day of', '#/dayof'], ['When it rains']]) + t + rainHtml(); return; }
    var d = member() && MEM.dayof;
    var body = d
      ? '<h3 class="dg-k" style="margin:0 0 8px">Run of show</h3><div class="rg-steps">' + d.run.map(function (r, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(r[0]) + '</b><p>' + esc(r[1]) + '</p></div>'; }).join('') + '</div>' +
        '<div class="ev-cols">' + box('Your helpers\' jobs', list(d.roles)) + box('Safety', list(d.safety)) + '</div>' +
        '<div class="ng-ours"><b>The door</b>' + esc(d.door) + '</div>'
      : gated('<div class="rg-steps">' + [1, 2, 3, 4].map(function (i) { return '<div class="rg-step"><em>' + i + '</em>' + skel('', 2) + '</div>'; }).join('') + '</div>', 'The day, hour by hour', 'The run of show, a job for every helper, the door and safety.');
    main.innerHTML = head('Day of', 'The day itself', 'The run of show, your helpers, the door, and what to do when the weather or anything else turns.', t) + body +
      '<div style="margin-top:22px">' + rainHtml() + '</div>';
  }

  // ---------- After ----------
  function viewAfter() {
    var a = member() && MEM.after;
    main.innerHTML = head('After', 'The next event starts the day after this one', 'Thank everyone, tell the story, and write down what happened while you still remember it.') +
      (a ? checkList('after', a.steps) + '<h3 class="dg-k" style="margin:22px 0 8px">Five survey questions</h3>' + list(a.survey) +
        '<div class="ng-ours"><b>Tell us how it went</b>Hosted it? Tell us your story by voice, and send us your best photos. <a href="#/hosts/tell/1">Tell your story</a></div>'
        : gated(skel('The day after', 6), 'The day after', 'The thank yous, the recap, the numbers to write down, and the five survey questions.'));
  }

  // ---------- The elephants in the room ----------
  function allElephants() {
    var byId = {}; (MEM ? MEM.elephants : []).forEach(function (e) { byId[e.id] = e; });
    return PUB.elephants.map(function (e) { return byId[e[0]] || { id: e[0], title: e[1], locked: 1 }; });
  }
  function viewElephants(id) {
    var all = allElephants();
    if (id) {
      var i = -1; all.forEach(function (e, n) { if (e.id === id) i = n; });
      var e = all[i];
      if (!e || e.locked) { main.innerHTML = crumb([['Elephants', '#/elephants'], [e ? e.title : '']]) + gated(skel(e ? e.title : '', 5), e ? e.title : 'This one', 'It opens with the full Guide.'); return; }
      var next = all[i + 1];
      main.innerHTML = crumb([['Elephants', '#/elephants'], [e.title]]) + '<div class="rg-fix"><div class="dg-head"><div><div class="dg-k">' + (i + 1) + ' of ' + all.length + '</div><h2 class="dg-h1">' + esc(e.title) + '</h2></div><div class="dg-acts" style="flex-direction:row">' + saveBtn('fix', 'elephant-' + e.id) + '</div></div>' +
        '<p class="rg-problem">' + esc(e.body) + '</p><h3>What to do</h3>' + list(e['do']) +
        '<div class="rg-fixnav"><a class="dg-tnav" href="#/elephants">All of them</a>' + (next ? '<a class="dg-tnav next" href="#/elephants/' + next.id + '">Next: ' + esc(next.title) + ' &rsaquo;</a>' : '<a class="dg-tnav next" href="#/hosts">Hosts who have done it &rsaquo;</a>') + '</div></div>';
      return;
    }
    main.innerHTML = head('The elephants in the room', 'What hosts worry about and rarely say out loud', 'Every one of these has happened to someone. Each comes with what to do about it.') +
      '<div class="dg-srows">' + all.map(function (e) {
        return row({ icon: ic(ICON.elephants, 28), title: e.title, href: member() ? '#/elephants/' + e.id : '', body: member() ? '<p class="dg-srow-p">' + esc(e.body) + '</p>' : '<p class="dg-srow-p">' + LOCK_SVG + ' In the full Guide</p>', acts: member() ? saveBtn('fix', 'elephant-' + e.id) : '' });
      }).join('') + '</div>' +
      (member() ? '' : '<div style="margin-top:16px">' + gated(skel('', 4), 'Every elephant, and what to do', 'No-shows, the same forty people, vendors losing money, venues and sponsors that are not Vegan, clashes, burnout and more.') + '</div>');
  }

  // ---------- episodes ----------
  function pod(slug) { return (PODS || []).filter(function (p) { return p.slug === slug; })[0] || null; }
  function podCard(p) {
    var ep = p.ep;
    if (!ep || !window.VEEpisodes) return '';
    var show = { name: p.show.name, slug: p.show.slug, image: p.show.logo_url || '' };
    return VEEpisodes.row(Object.assign({}, ep, { summary: '', image: show.image || ep.image || '' }), show, { showName: true, acts: signedIn() ? gvoteBtn(p.slug) + saveBtn('episode', p.slug) : '' });
  }
  function podKey(p) { return '|' + p.ep.guid; }
  function playPod(slug) {
    var p = pod(slug);
    if (p && p.ep && window.VEEpisodes) VEEpisodes.play(Object.assign({}, p.ep, { image: p.show.logo_url || p.ep.image || '' }), { name: p.show.name, image: p.show.logo_url || '' });
  }
  function keepPlayer(bar) {
    if (!bar) return;
    var dock = main.querySelector('.vep-dock[data-vep-always]');
    if (dock) { bar.classList.add('docked'); document.body.classList.remove('vep-on'); dock.appendChild(bar); }
    else { bar.classList.remove('docked'); document.body.classList.add('vep-on'); document.body.appendChild(bar); }
  }
  function podList(group) {
    var pods = PODS ? PODS.filter(function (p) { return p.group === group; }) : null;
    if (signedIn() && !gvLoaded) loadGVotes(function () { if (curTab === 'hosts' || curTab === 'word') route(); });
    return '<div class="vep-dock" data-vep-always></div><div class="rg-eps">' +
      (pods ? (pods.length ? '<div class="vep-list">' + pods.map(podCard).join('') + '</div>' : '<p class="dg-empty">No episodes yet.</p>') : '<div class="dg-loading">Loading...</div>') + '</div>';
  }

  // ---------- Hosts who have done it, and Tell us your story ----------
  function storiesHtml() {
    if (!STORIES || !STORIES.length) return '';
    return '<h3 class="dg-k" style="margin:22px 0 8px">Host stories</h3><div class="ev-give">' + STORIES.map(function (s) {
      return '<div class="ev-box"><h3>' + esc(s.name) + (s.event_name ? ' &middot; ' + esc(s.event_name) : '') + '</h3>' + (s.answers || []).map(function (a) {
        return '<p class="dg-srow-p" style="margin:8px 0 4px"><b>' + esc(a.question) + '</b></p><audio controls preload="none" src="' + esc(a.url) + '"></audio>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function viewHosts(sub) {
    var parts = String(sub || '').split('/');
    if (parts[0] === 'tell') return viewTell(parseInt(parts[1], 10) || 1);
    if (parts[0] === 'listen' && parts[1]) { viewHosts(''); playPod(decodeURIComponent(parts[1])); return; }
    main.innerHTML = head('Hosts who have done it', 'Learn from the people who did it first', 'Festival organizers, market builders and community hosts on our shows. Hosted an event yourself? Tell us your story.',
      '<div class="dg-btns"><a class="dg-btn" href="#/hosts/tell/1">Tell us your story</a></div>') +
      podList('hosts') + storiesHtml() +
      '<div class="ng-ours" style="margin-top:18px"><b>Tell us your story</b>Answer six questions by voice, right here. The best become Host Notes on the Vegans Explore Podcast, and approved stories earn a member 100 points. <a href="#/hosts/tell/1">Start</a></div>';
    if (STORIES === null) evApi({ action: 'stories' }).then(function (d) { STORIES = (d && d.stories) || []; if (curTab === 'hosts' && !/tell/.test(location.hash) && STORIES.length) viewHosts(''); }).catch(function () { STORIES = []; });
  }

  // The recorder: six answers by voice, each up to 90 seconds, then sent with a release. The audio stays in the browser until Send.
  var TELL = { name: '', email: '', event_name: '', chapter: '', note: '', release: false, adult: false, rec: {} };
  try { var t0 = JSON.parse(sessionStorage.getItem('ev_tell') || 'null'); if (t0) { for (var k0 in t0) if (k0 !== 'rec') TELL[k0] = t0[k0]; } } catch (e) {}
  function keepTell() { try { var c = {}; for (var k in TELL) if (k !== 'rec') c[k] = TELL[k]; sessionStorage.setItem('ev_tell', JSON.stringify(c)); } catch (e) {} }
  var recorder = null, recQ = null, recChunks = [], recStart = 0, recTimer = null;
  var TELL_STEPS = ['You', 'Your answers', 'Send it'];
  function steps(names, n) { return '<div class="ev-steps">' + names.map(function (s, i) { return '<span' + (i + 1 === n ? ' class="on"' : '') + '>' + (i + 1) + '. ' + esc(s) + '</span>'; }).join('') + '</div>'; }
  function viewTell(n) {
    var a = auth(), m = a && a.getMember ? a.getMember() : null;
    if (m && !TELL.name) TELL.name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.name || '';
    if (m && !TELL.email) TELL.email = m.email || '';
    var body = '';
    if (n === 1) {
      body = '<div class="ng-ours" style="margin-bottom:14px"><b>Before you record</b>You must be 18 or over. Each answer is up to 90 seconds. Find a quiet room and hold the phone a hand away from your mouth. Tell your own story, and never name another business in a bad light. Our team listens before anything airs, and you can ask us to take a recording down at any time.</div><div class="ev-form"><label>Your name</label><input data-tell="name" value="' + esc(TELL.name) + '" autocomplete="name">' +
        '<label>Your email <i>(only for us to reach you)</i></label><input type="email" data-tell="email" value="' + esc(TELL.email) + '" autocomplete="email">' +
        '<label>The event you host <i>(its name)</i></label><input data-tell="event_name" value="' + esc(TELL.event_name) + '">' +
        '<label>Where</label><select data-tell="chapter"><option value="">Pick one</option>' + CHAPTERS.map(function (c) { return '<option value="' + c[0] + '"' + (TELL.chapter === c[0] ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select></div>';
    } else if (n === 2) {
      var canRec = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      body = '<p class="dg-lede">Answer as many as you like, at least two. Talk like you are telling a friend, up to 90 seconds each. ' + (canRec ? 'Tap Record, then Stop.' : 'Your browser cannot record here, so attach a voice memo for each answer instead.') + '</p>' +
        STORY_QS.map(function (q) {
          var r = TELL.rec[q[0]];
          return '<div class="ev-rec' + (r ? ' done' : '') + '" data-q="' + q[0] + '"><b>' + esc(q[1]) + '</b><div class="ev-recbar">' +
            (canRec ? '<button type="button" class="dg-btn' + (r ? ' dg-ghost' : '') + '" data-rec="' + q[0] + '">' + (recQ === q[0] ? 'Stop' : r ? 'Record again' : 'Record') + '</button>' : '') +
            '<label class="dg-btn dg-ghost" style="cursor:pointer">' + (canRec ? 'Or attach a file' : 'Attach a voice memo') + '<input type="file" accept="audio/*" data-recfile="' + q[0] + '" hidden></label>' +
            (recQ === q[0] ? '<span class="ev-live" id="evLive">Recording 0:00</span>' : '') +
            (r ? '<audio controls src="' + r.url + '"></audio><span class="dg-count">' + fmtSec(r.seconds) + '</span>' : '') + '</div></div>';
        }).join('');
    } else {
      var got = Object.keys(TELL.rec).length;
      body = '<div class="ev-form"><p class="dg-lede">' + got + ' of ' + STORY_QS.length + ' answers recorded.</p>' +
        '<label>Anything else? <i>(optional)</i></label><textarea data-tell="note">' + esc(TELL.note) + '</textarea>' +
        '<label class="ev-check"><input type="checkbox" data-tell="adult"' + (TELL.adult ? ' checked' : '') + '><span>I am 18 or over.</span></label>' +
        '<label class="ev-check"><input type="checkbox" data-tell="release"' + (TELL.release ? ' checked' : '') + '><span>Vegans Explore may use my recordings on its shows and its website, with my name credited. I can ask for them to be taken down at any time by emailing contact@lesaruss.com.</span></label>' +
        '<p class="rg-fine">' + (token() ? 'Once our team approves your story, you get 100 points.' : 'Sign in first and an approved story earns you 100 points.') + '</p></div>';
    }
    main.innerHTML = crumb([['Hosts', '#/hosts'], ['Tell us your story']]) + head('Tell us your story', 'Six questions, answered by voice', '') + steps(TELL_STEPS, n) + body +
      '<p class="ev-err" id="evErr" role="alert"></p><div class="ev-formnav">' + (n > 1 ? '<a class="dg-tnav" href="#/hosts/tell/' + (n - 1) + '">Back</a>' : '<a class="dg-tnav" href="#/hosts">Back</a>') +
      '<span class="dg-count">Step ' + n + ' of 3</span>' + (n < 3 ? '<button type="button" class="dg-tnav next" data-tell-next="' + n + '">Next</button>' : '<button type="button" class="dg-btn" data-tell-send>Send my story</button>') + '</div>';
  }
  function fmtSec(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function tellErr(msg) { var e = document.getElementById('evErr'); if (e) e.textContent = msg || ''; }
  function tellCheck(n) {
    if (n === 1) {
      if (!TELL.name.trim()) return 'Your name, please.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(TELL.email.trim())) return 'An email we can reach you at.';
      if (!TELL.event_name.trim()) return 'The name of the event you host.';
    }
    if (n === 2 && Object.keys(TELL.rec).length < 2) return 'Record at least two answers.';
    return '';
  }
  function startRec(q) {
    if (recorder) { stopRec(); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].filter(function (t) { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t); })[0];
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined); recQ = q; recChunks = []; recStart = Date.now();
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) recChunks.push(e.data); };
      recorder.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(recChunks, { type: recorder.mimeType || 'audio/webm' });
        var secs = (Date.now() - recStart) / 1000;
        if (TELL.rec[q]) URL.revokeObjectURL(TELL.rec[q].url);
        TELL.rec[q] = { blob: blob, url: URL.createObjectURL(blob), seconds: secs, type: blob.type };
        recorder = null; recQ = null; clearInterval(recTimer); viewTell(2);
      };
      recorder.start(1000); viewTell(2);
      recTimer = setInterval(function () {
        var s = (Date.now() - recStart) / 1000, el = document.getElementById('evLive');
        if (el) el.textContent = 'Recording ' + fmtSec(s);
        if (s >= 90) stopRec();
      }, 500);
    }).catch(function () { tellErr('We could not use your microphone. Allow it in your browser, or attach a voice memo instead.'); });
  }
  function stopRec() { if (recorder && recorder.state !== 'inactive') recorder.stop(); }
  function sendStory(btn) {
    if (!TELL.adult) { tellErr('Tick the box to say you are 18 or over.'); return; }
    if (!TELL.release) { tellErr('Tick the box to let us use your recordings.'); return; }
    var qs = Object.keys(TELL.rec);
    btn.disabled = true; btn.textContent = 'Sending...'; tellErr('');
    evApi({ action: 'story_start', adult: true, name: TELL.name, email: TELL.email, answers: qs.map(function (q) { return { q: q, type: TELL.rec[q].type || 'audio/webm', size: TELL.rec[q].blob.size }; }) })
      .then(function (d) {
        if (!d || !d.ok) throw d || {};
        return Promise.all(d.uploads.map(function (u) {
          var r = TELL.rec[u.q];
          return fetch(u.url, { method: 'PUT', headers: { 'Content-Type': r.type || 'audio/webm', 'x-upsert': 'true' }, body: r.blob }).then(function (res) { if (!res.ok) throw { message: 'An answer did not upload.' }; });
        })).then(function () {
          var answers = {}; d.uploads.forEach(function (u) { answers[u.q] = { path: u.path, seconds: Math.round(TELL.rec[u.q].seconds) }; });
          return evApi({ action: 'story_submit', adult: true, id: d.id, upload_key: d.upload_key, name: TELL.name, email: TELL.email, event_name: TELL.event_name, chapter: TELL.chapter, note: TELL.note, release: true, answers: answers });
        });
      })
      .then(function (r) {
        if (!r || !r.ok) throw r || {};
        try { sessionStorage.removeItem('ev_tell'); } catch (e) {}
        TELL.rec = {}; TELL.note = ''; TELL.release = false;
        main.innerHTML = crumb([['Hosts', '#/hosts'], ['Sent']]) + head('Thank you', 'Your story is with our team', 'We listen to every one. We will email you if it goes on the podcast' + (token() ? ', and the 100 points land once it is approved.' : '.')) +
          '<div class="dg-btns"><a class="dg-btn" href="#/hosts">Back to the hosts</a><a class="dg-btn dg-ghost" href="#/work">Work with us</a></div>';
      })
      .catch(function (e) { btn.disabled = false; btn.textContent = 'Send my story'; tellErr((e && e.message) || 'That did not send. Try again in a minute.'); if (e && e.error === 'passport_needed') { var er = document.getElementById('evErr'); if (er) er.innerHTML = esc(e.message) + ' <a href="/passport">Get your Passport</a>'; } });
  }

  // ---------- Work with us: why us, the sponsorship, and the application ----------
  var APPLY = { step: 1, a: {} };
  try { APPLY.a = JSON.parse(recall('ev_apply') || '{}'); } catch (e) {}
  // The application, one step per view (#/work/apply/N). Keep the keys in step with APPLY_FIELDS in ve-events-guide.
  var FORM = [
    ['Your event', [['event_name', 'The event\'s name', 'text', 1], ['event_date', 'The date', 'date', 1], ['chapter', 'Where', 'chapter', 1], ['city', 'The city', 'text', 1],
      ['venue', 'The venue', 'text', 0], ['link', 'Its official page or ticket link', 'url', 0], ['kind', 'What kind of event', 'kind', 1]]],
    ['Your crowd', [['crowd', 'How many people do you expect?', 'text', 1], ['past', 'Have you hosted it before? How many came?', 'textarea', 1],
      ['vegan', 'Is everything served and sold at the event Vegan?', 'yesno', 1], ['venue_vegan', 'Is the venue itself Vegan?', 'yesno', 1], ['why', 'Who is it for, and why will they come?', 'textarea', 1]]],
    ['The trade', [['ask', 'What would help most from us?', 'textarea', 1], ['booth', 'Can you give us a 10x10 booth?', 'yesno', 1], ['meals', 'Two comped meals or tickets for the member who staffs it?', 'yesno', 1],
      ['logo', 'Our logo on your flyer and page?', 'yesno', 1], ['stage', 'A mention from the stage or the mic?', 'yesno', 0], ['offer', 'Anything else you can offer?', 'textarea', 0]]],
    ['You', [['host_name', 'Your name', 'text', 1], ['host_email', 'Your email', 'email', 1], ['host_org', 'Your group or business', 'text', 0], ['phone', 'Phone', 'tel', 0], ['note', 'Anything else we should know?', 'textarea', 0]]]
  ];
  var KINDS_OPTS = ['Potluck', 'Social or meetup', 'Dinner or supper club', 'Market or pop-up', 'Festival', 'Fundraiser', 'Workshop or talk', 'Watch party', 'Something else'];
  function field(f) {
    var k = f[0], v = APPLY.a[k] == null ? '' : APPLY.a[k], req = f[3] ? '' : ' <i>(optional)</i>';
    var lab = '<label for="ap_' + k + '">' + esc(f[1]) + req + '</label>';
    if (f[2] === 'textarea') return lab + '<textarea id="ap_' + k + '" data-ap="' + k + '">' + esc(v) + '</textarea>';
    if (f[2] === 'chapter') return lab + '<select id="ap_' + k + '" data-ap="' + k + '"><option value="">Pick one</option>' + CHAPTERS.map(function (c) { return '<option value="' + c[0] + '"' + (v === c[0] ? ' selected' : '') + '>' + esc(c[1]) + '</option>'; }).join('') + '</select>';
    if (f[2] === 'kind') return lab + '<select id="ap_' + k + '" data-ap="' + k + '"><option value="">Pick one</option>' + KINDS_OPTS.map(function (c) { return '<option' + (v === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>';
    if (f[2] === 'yesno') return lab + '<select id="ap_' + k + '" data-ap="' + k + '"><option value="">Pick one</option>' + ['Yes', 'No', 'Not sure yet'].map(function (c) { return '<option' + (v === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>';
    return lab + '<input id="ap_' + k + '" type="' + f[2] + '" data-ap="' + k + '" value="' + esc(v) + '"' + (f[2] === 'email' ? ' autocomplete="email"' : f[2] === 'tel' ? ' autocomplete="tel"' : '') + '>';
  }
  function viewApply(n) {
    n = Math.min(Math.max(1, n || 1), FORM.length);
    var a = auth(), m = a && a.getMember ? a.getMember() : null;
    if (m && !APPLY.a.host_name) APPLY.a.host_name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.name || '';
    if (m && !APPLY.a.host_email) APPLY.a.host_email = m.email || '';
    var s = FORM[n - 1];
    main.innerHTML = crumb([['Work with us', '#/work'], ['Apply for a sponsorship']]) + head('Apply for a sponsorship', esc(s[0]), '') + steps(FORM.map(function (x) { return x[0]; }), n) +
      '<div class="ev-form">' + s[1].map(field).join('') + '</div><p class="ev-err" id="evErr" role="alert"></p>' +
      '<div class="ev-formnav">' + (n > 1 ? '<a class="dg-tnav" href="#/work/apply/' + (n - 1) + '">Back</a>' : '<a class="dg-tnav" href="#/work">Back</a>') + '<span class="dg-count">Step ' + n + ' of ' + FORM.length + '</span>' +
      (n < FORM.length ? '<button type="button" class="dg-tnav next" data-ap-next="' + n + '">Next</button>' : '<button type="button" class="dg-btn" data-ap-send>Send my application</button>') + '</div>';
  }
  function applyCheck(n) {
    var miss = FORM[n - 1][1].filter(function (f) { return f[3] && !String(APPLY.a[f[0]] || '').trim(); })[0];
    if (miss) return 'Please answer: ' + miss[1];
    if (n === 1 && APPLY.a.event_date && APPLY.a.event_date < new Date().toISOString().slice(0, 10)) return 'The date has passed. Apply for an event coming up.';
    if (n === 4 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(APPLY.a.host_email || '').trim())) return 'An email we can reach you at.';
    return '';
  }
  function sendApply(btn) {
    btn.disabled = true; btn.textContent = 'Sending...';
    evApi({ action: 'sponsor_apply', answers: APPLY.a }).then(function (d) {
      if (!d || !d.ok) throw d || {};
      store('ev_apply', null); APPLY.a = {};
      main.innerHTML = crumb([['Work with us', '#/work'], ['Sent']]) + head('Sent', 'Your application is with our team', 'Your chapter\'s Community Manager, or our team, reads every one and answers by email. We take two sponsorships a chapter a month, so apply early.') +
        '<div class="dg-btns"><a class="dg-btn" href="/events#submit/1">Put it on our calendar</a><a class="dg-btn dg-ghost" href="#/">Back to the Guide</a></div>';
    }).catch(function (e) { btn.disabled = false; btn.textContent = 'Send my application'; var el = document.getElementById('evErr'); if (el) el.textContent = (e && e.message) || 'That did not send. Try again in a minute.'; });
  }
  // Claim your profile (Sean, 2026-11-03: the Guide "will walk them through claiming their profile"). Three claims that already exist, in order.
  function viewClaim() {
    var m = member();
    var cards = [
      ['1. Claim your event', 'Find your event on our calendar and tap Are you running this event? Tell us if you host it, promote it or it is at your venue. Not on the calendar yet? Submit it first.',
        '<a class="dg-btn" href="/events">Find your event</a><a class="dg-btn dg-ghost" href="/events#submit/1">Submit an event</a>'],
      ['2. Claim your group, venue or business', 'Find it in the Directory and claim it, or add it. A claimed page is yours to keep up to date, with its own numbers.',
        '<a class="dg-btn" href="/claim">Find your listing</a><a class="dg-btn dg-ghost" href="/claim?add=1">Add it to the Directory</a>'],
      ['3. Claim your own profile', 'Hosts, promoters and people with a story have profiles in our People section. Find yours and tap Is this you? If you are not there yet, ask us to add you.',
        '<a class="dg-btn" href="/directory?tab=people">Find your profile</a>']];
    main.innerHTML = head('Claim', 'Claim what is yours', 'Three short steps. Do the ones that fit, in any order.') +
      '<div class="ev-give">' + cards.map(function (c) { return box(c[0], '<p class="dg-srow-p">' + esc(c[1]) + '</p>' + (m ? '<div class="dg-btns" style="margin-top:10px">' + c[2] + '</div>' : '')); }).join('') + '</div>' +
      (m ? '<div class="dg-btns" style="margin-top:16px"><a class="dg-btn" href="#/work">Then, apply for a sponsorship</a></div>' : '<div style="margin-top:16px">' + gated(skel('', 3), 'Claim your event, group and profile', 'The links, in order.') + '</div>');
  }

  function viewWork(sub) {
    var parts = String(sub || '').split('/');
    if (parts[0] === 'apply' && SURVEY.known && !SURVEY.done) { location.hash = '#/work'; return; }
    if (parts[0] === 'apply') return viewApply(parseInt(parts[1], 10) || 1);
    main.innerHTML = head('Work with us', 'We can sponsor your event, with marketing', 'We sponsor events in marketing, never cash. You give us a little space at your event; we put our community and our channels behind it.',
      (SURVEY.done ? '<div class="dg-btns"><a class="dg-btn" href="#/work/apply/1">Apply for a sponsorship</a></div>'
        : '<div class="dg-btns"><button type="button" class="dg-btn" data-survey>Step 1: take the event survey</button></div><p class="dg-srow-p" style="margin-top:8px">Every application starts with the free event survey. We review all applications against each other, so a sponsorship is never automatic.</p>')) +
      '<div class="ev-give">' +
      box('What we give', list(['A feature on the Vegans Explore calendar and in your chapter\'s Daily Pulse', 'Two posts and a story on our socials', 'An ad on your chapter\'s pages for two weeks', 'A creator or member covering it', 'A recap feature after'])) +
      box('What we ask', list(['A 10x10 booth', 'Two comped meals or tickets for the member who staffs it', 'Our logo on your flyer and event page', 'A mention from the stage', 'Our QR cards at the door'])) +
      box('Who qualifies', list(['Vegan events, where everything served and sold is Vegan', 'Plant-forward events at a venue that is not Vegan, when the host is a Group Partner', 'We take two a chapter a month, so apply early'])) + '</div>' +
      '<h3 class="dg-k" style="margin:6px 0 8px">Why work with us</h3><div class="rg-steps">' + [
        ['Thirteen chapters', 'From South Florida to London, each with its own hub, Daily Pulse and calendar.'],
        ['A Directory of Vegan businesses', 'More than a thousand places, vendors, groups and venues, voted on by members.'],
        ['Every Vegan event, in one calendar', 'We gather Vegan events from everywhere, and every city hub reads it.'],
        ['Tickets at 5%', 'A Group Partner sells tickets on its own page; free events are free.'],
        ['The guest pass', 'A first-timer comes to one free event, and joins after.'],
        ['Real people', 'A team that knows the vendors and venues in your chapter, and members who staff the booth.']
      ].map(function (x, i) { return '<div class="rg-step"><em>' + (i + 1) + '</em><b>' + esc(x[0]) + '</b><p>' + esc(x[1]) + '</p></div>'; }).join('') + '</div>' +
      '<p class="rg-fine">What we are building next, more chapters, a bigger creator network and a campaign every period, is a plan, and we say it as one. We never promise reach we cannot show you.</p>' +
      '<div class="ng-ours"><b>Host a group?</b>A Group Partner hosts its community and events on Vegans Explore, sells tickets and earns from every member it brings in. <a href="/groups/welcome">The Group Partner Guide</a></div>';
  }

  // ---------- My list ----------
  var LIST_SECS = [['Sections', 'sections', 'fix', '#/kinds'], ['Venues and vendors', 'listings', 'listing', '#/venue'], ['Episodes', 'episodes', 'episode', '#/hosts']];
  function fixItem(key) {
    if (key === 'rain') return { title: PUB.rain.title, href: '#/dayof/rain', icon: ICON.rain, short: PUB.rain.short };
    var m = /^kind-(.+)$/.exec(key), e = /^elephant-(.+)$/.exec(key);
    if (m) { var k = allKinds().filter(function (x) { return x.id === m[1]; })[0]; return k ? { title: k.title, href: '#/kinds/' + k.id, icon: KIND_ICON[k.id] || ICON.kinds, short: k.short } : null; }
    if (e) { var el = allElephants().filter(function (x) { return x.id === e[1]; })[0]; return el ? { title: el.title, href: '#/elephants/' + el.id, icon: ICON.elephants, short: el.body } : null; }
    return null;
  }
  function viewMyList(sub) {
    var sec = LIST_SECS.filter(function (x) { return x[1] === String(sub || '').split('/')[0]; })[0] || LIST_SECS[0];
    main.innerHTML = head('My list', 'My list', 'Everything you save in the Guide, in one place.', toggles(LIST_SECS.map(function (x) { return [x[0], '#/mylist/' + x[1]]; }), sec[0])) +
      '<div id="dgML"><div class="dg-loading">Loading your list...</div></div>';
    var draw = function () {
      var el = document.getElementById('dgML'); if (!el) return;
      var keys = SV_ORDER.filter(function (x) { return x.kind === sec[2]; }).map(function (x) { return x.key; }), html = '', items = [];
      if (sec[2] === 'fix') { items = keys.map(function (k) { var it = fixItem(k); return it ? [k, it] : null; }).filter(Boolean);
        html = '<div class="dg-srows">' + items.map(function (x) { return row({ icon: ic(x[1].icon, 28), title: x[1].title, href: x[1].href, body: '<p class="dg-srow-p">' + esc(x[1].short || '') + '</p>', acts: saveBtn('fix', x[0]) }); }).join('') + '</div>'; }
      else if (sec[2] === 'episode') { items = keys.map(pod).filter(Boolean); html = '<div class="vep-dock" data-vep-always></div><div class="rg-eps"><div class="vep-list">' + items.map(podCard).join('') + '</div></div>'; }
      else { items = keys.map(function (k) { return (VENUES || []).concat(VENDORS || []).filter(function (l) { return l.slug === k; })[0]; }).filter(Boolean); html = cards(items, 'evML'); }
      el.innerHTML = items.length ? html : '<p class="dg-empty">Nothing saved here yet. Tap Save on any of the <a href="' + sec[3] + '">' + esc(sec[0].toLowerCase()) + '</a> and it shows up here.</p>';
      if (sec[2] === 'listing') wireCards('evML', '#/venue');
    };
    var waits = 0, done = function () { if (--waits <= 0) draw(); };
    if (svState !== 'loaded') { waits++; loadSaves(done); }
    if (sec[2] === 'episode' && !gvLoaded) { waits++; loadGVotes(done); }
    if (!waits) draw();
  }

  // ---------- Get access ----------
  function viewJoin() {
    if (signedIn()) { main.innerHTML = head('Your Guide', 'The whole Guide is yours', 'It is yours to keep.') + '<a class="dg-btn" href="#/">Back to the overview</a>'; return; }
    var m = mode(), status = '<span class="dg-status" role="status" style="display:block;margin-top:10px;color:#8a5a00"></span>';
    var lst = '<div class="dg-access"><ul>' +
      '<li><b>Every kind of event</b>, what it costs, how big it gets and what goes wrong.</li>' +
      '<li><b>The countdown plan</b> from twelve weeks out to the day after, to tick off, copy and print.</li>' +
      '<li><b>Money, venues and vendors:</b> the budget, what to ask a venue, the red flags, the vendor agreement, labels and permits.</li>' +
      '<li><b>The word, the day and after:</b> the timeline, the run of show, your helpers\' jobs, the door and the recap.</li>' +
      '<li><b>The elephants in the room</b>, each with what to do, and My list to keep your place.</li></ul></div>';
    var bx = m === 'points'
      ? '<div class="dg-big">' + pts(ST.cost) + '<small>points</small></div><p>You have ' + pts(ST.balance) + ' points. Unlock the Guide with ' + pts(ST.cost) + ' of them and it is yours to keep.</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button><button type="button" class="dg-btn dg-ghost" data-buy style="margin-top:8px">Or get it for $11</button>' + status
      : '<div class="dg-big">$11<small>yours to keep</small></div><p>' + (m === 'join' ? 'Create your account and get the Guide for $11, one time. Buying it makes you a member of Vegans Explore. Already a member? <a href="#" data-signin>Sign in</a>.'
          : 'Get the Guide for $11, one time, and it is yours to keep' + (ST.active ? '.' : '. Buying it also makes you a member of Vegans Explore.')) + '</p>' +
        '<button type="button" class="dg-btn" data-join>' + esc(ctaLabel()) + '</button>' + status +
        '<p class="dg-pp">Or get your <a href="/passport">Passport</a>: $11, one time, with 1,100 welcome points, enough for this Guide. Group Partner leads have it included.</p>';
    main.innerHTML = head('Get access', 'Open the whole Vegan Events Guide', 'There are two ways through, and both make you a Vegans Explore member. Take the free event survey (about ten minutes, with points for every answer), or get the $11 Passport. Either way you can claim your profile, apply for a sponsorship and record your story for the podcast. What to do when it rains stays open to everyone.') + lst;
    if (!signedIn()) main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox" style="margin-bottom:14px"><div class="dg-big">Free<small>with the event survey</small></div><p>About ten minutes, up to 100 points, and your membership opens when you finish.</p><button type="button" class="dg-btn" data-survey>Take the event survey, free</button></div>');
    main.querySelector('.dg-access').insertAdjacentHTML('beforeend', '<div class="dg-pricebox">' + bx + '</div>');
  }

  // ---------- Overview ----------
  function viewOverview() {
    var tiles = [
      ['kinds', 'Kinds', 'Potlucks to festivals: what each costs, how big, and what goes wrong.'],
      ['plan', 'The plan', 'A countdown from twelve weeks out to the day after.'],
      ['money', 'Money', 'The budget, pricing and the break-even worksheet.', 1],
      ['venue', 'Venue', 'Venues in our Directory, and what to ask before you sign.', 1],
      ['vendors', 'Vendors', 'Vegan vendors near you, and what to agree with them.', 1],
      ['gear', 'Gear', 'Everything to pack, one tap to shop.', 1],
      ['word', 'The word', 'When to post, where, and what to say.'],
      ['dayof', 'Day of', 'The run of show, and what to do when it rains.', 1],
      ['elephants', 'Elephants', 'The questions hosts rarely ask out loud.'],
      ['hosts', 'Hosts', 'Hosts who have done it, and your own story.', 1],
      ['work', 'Work with us', 'A sponsorship from us, paid in marketing.', 1]
    ];
    main.innerHTML = head('Vegans Explore Guides for hosts', 'Host a Vegan event people come back to', esc(PUB.intro)) +
      '<div class="dg-tiles">' + tiles.map(function (t) {
        return '<a class="dg-tile" href="' + href(t[0]) + '"><div class="dg-ic">' + ic(ICON[t[0]]) + '</div><div><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span>' +
          (!member() && !t[3] ? '<span class="dg-mlock">' + LOCK_SVG + ' In the full Guide</span>' : !member() && t[3] ? '<span class="dg-mlock" style="color:#1f5f22 !important">Open to everyone</span>' : '') + '</div></a>';
      }).join('') + '</div>' +
      '<div class="dg-start"><a class="dg-btn" href="' + (member() ? '#/plan' : '#/dayof/rain') + '">' + (member() ? 'Start your plan' : 'Read: what to do when it rains') + '</a><a class="dg-btn dg-ghost" href="#/work">Work with us</a>' +
      (member() ? '<p>The whole Guide is yours. Pick a tab, or follow River with Next.</p>' : '<p>The full Guide is free with the event survey, or $11. <a href="#/join" style="color:var(--g);font-weight:800">How to get access</a></p>') + '</div>';
  }

  // ---------- search (members) ----------
  function index() {
    var out = [];
    if (!MEM) return out;
    allKinds().forEach(function (k) { out.push({ t: 'Kinds', title: k.title, text: [k.short, k.what, k.cost, k.size].concat(k.wrong || []).join(' '), href: '#/kinds/' + k.id }); });
    MEM.plan.forEach(function (p) { out.push({ t: 'The plan', title: p.title, text: p.items.join(' '), href: '#/plan' }); });
    out.push({ t: 'Money', title: 'Money', text: [MEM.money.intro].concat(MEM.money.fixed, MEM.money.variable, MEM.money.income, MEM.money.pricing).join(' '), href: '#/money' });
    out.push({ t: 'Venue', title: 'What to ask a venue', text: MEM.venue.ask.concat(MEM.venue.flags).join(' '), href: '#/venue' });
    out.push({ t: 'Vendors', title: 'Vendors', text: [].concat(MEM.vendors.recruit, MEM.vendors.application, MEM.vendors.agreement, [MEM.vendors.labels, MEM.vendors.shared, MEM.vendors.permits]).join(' '), href: '#/vendors' });
    GEAR.forEach(function (g) { g[1].forEach(function (x) { out.push({ t: 'Gear', title: x[1], text: g[0] + '. ' + x[2], href: '#/gear' }); }); });
    PUB.rain.parts.forEach(function (p) { out.push({ t: 'Day of', title: p.title, text: p.items.join(' '), href: '#/dayof/rain' }); });
    allElephants().forEach(function (e) { out.push({ t: 'Elephants', title: e.title, text: [e.body].concat(e['do'] || []).join(' '), href: '#/elephants/' + e.id }); });
    (VENUES || []).concat(VENDORS || []).forEach(function (l) { out.push({ t: 'Directory', title: l.name, text: [l.category, l.address_city, l.address_state].filter(Boolean).join(', '), href: '#/venue/listing/' + encodeURIComponent(l.slug) }); });
    (PODS || []).forEach(function (p) { out.push({ t: 'Episodes', title: p.title, text: (p.summary || ''), href: '#/hosts/listen/' + encodeURIComponent(p.slug) }); });
    return out;
  }
  function viewSearch(q) {
    if (qEl.value !== q) qEl.value = q;
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = index().filter(function (h) { var hay = (h.title + ' ' + h.text).toLowerCase(); return words.every(function (w) { return hay.indexOf(w) >= 0; }); });
    var groups = {}; hits.forEach(function (h) { (groups[h.t] = groups[h.t] || []).push(h); });
    var html = crumb([['Search']]) + '<h2 class="dg-h1">' + hits.length + (hits.length === 1 ? ' result' : ' results') + ' for &ldquo;' + esc(q) + '&rdquo;</h2><div class="dg-res">';
    ['Kinds', 'The plan', 'Money', 'Venue', 'Vendors', 'Gear', 'Day of', 'Elephants', 'Directory', 'Episodes'].forEach(function (g) {
      if (!groups[g]) return;
      html += '<h2>' + esc(g) + ' (' + groups[g].length + ')</h2><div class="dg-grid">' + groups[g].slice(0, 24).map(function (h) {
        return '<a class="dg-card dg-hit" href="' + h.href + '"><h3>' + esc(h.title) + '</h3><p>' + esc(h.text.length > 160 ? h.text.slice(0, 157) + '...' : h.text) + '</p></a>';
      }).join('') + '</div>';
    });
    if (!hits.length) html += '<p class="dg-empty">Nothing matched. Try rain, permits, vendors, budget or canopy.</p>';
    main.innerHTML = html + '</div>';
  }
  var tSearch;
  qEl.addEventListener('input', function () {
    clearTimeout(tSearch);
    tSearch = setTimeout(function () {
      var q = qEl.value.trim(), h = q ? '#/search/' + encodeURIComponent(q) : '#/';
      if (/^#\/search\//.test(location.hash) && q) { history.replaceState(null, '', location.pathname + location.search + h); route(); } else location.hash = h;
    }, 180);
  });
  document.getElementById('dgSearchForm').addEventListener('submit', function (e) { e.preventDefault(); var q = qEl.value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });

  // ---------- River, on the right of every tab (his words as text; no recordings yet) ----------
  var tourM = document.getElementById('dgTourM'), foldBtn = document.getElementById('dgFold'), railEl = document.getElementById('dgRail');
  function setFold(folded) {
    railEl.classList.toggle('dg-folded', folded);
    foldBtn.textContent = folded ? 'Show River' : 'Hide River'; foldBtn.setAttribute('aria-expanded', String(!folded));
    try { sessionStorage.setItem('ev_river_folded', folded ? '1' : ''); } catch (e) {}
  }
  foldBtn.addEventListener('click', function () { setFold(!railEl.classList.contains('dg-folded')); });
  try { if (sessionStorage.getItem('ev_river_folded')) setFold(true); } catch (e) {}
  var bubble = document.getElementById('dgBubble'), tourEl = document.getElementById('dgTour');
  function drawRiver() {
    var t = tab(curTab), lst = tabs(), i = 0;
    lst.forEach(function (x, n) { if (x.k === curTab) i = n; });
    bubble.textContent = member() && t.sayMember ? t.sayMember : t.say;
    tourEl.innerHTML = tourM.innerHTML = '<a class="dg-tnav" href="' + href(lst[Math.max(0, i - 1)].k) + '"' + (i ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Back</a><span>' + (i + 1) + ' of ' + lst.length + '</span>' +
      '<a class="dg-tnav next" href="' + href(lst[Math.min(lst.length - 1, i + 1)].k) + '"' + (i < lst.length - 1 ? '' : ' aria-disabled="true" style="opacity:.35;pointer-events:none"') + '>Next</a>';
  }

  // ---------- router ----------
  var VIEWS = { overview: 1, kinds: 1, plan: 1, money: 1, venue: 1, vendors: 1, gear: 1, word: 1, dayof: 1, after: 1, elephants: 1, hosts: 1, claim: 1, work: 1, mylist: 1, join: 1, search: 1 };
  function route() {
    if (recorder && !/^#\/hosts\/tell\/2/.test(location.hash)) stopRec();
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var view = parts[0] || 'overview', sub = parts.slice(1).join('/');
    if (view === 'search' && (!sub || !member())) view = 'overview';
    if (!VIEWS[view]) view = 'overview';
    document.body.classList.toggle('dg-member', signedIn());
    drawJoinbox();
    var key = view;
    if (view === 'search') key = curTab;
    if (view === 'join' && signedIn()) key = 'overview';
    if (view === 'mylist' && !signedIn()) { view = 'overview'; key = 'overview'; }
    if (signedIn() && !svState) loadSaves();
    drawMenu(view === 'search' ? 'search' : key);
    if (view !== 'search' && qEl.value && document.activeElement !== qEl) qEl.value = '';
    var bar = document.getElementById('vep-player');
    ({ overview: viewOverview, kinds: function () { viewKinds(sub); }, plan: viewPlan, money: viewMoney, venue: function () { viewVenue(sub); },
       vendors: function () { viewVendors(sub); }, gear: viewGear, word: viewWord, dayof: function () { viewDayof(sub); }, after: viewAfter,
       elephants: function () { viewElephants(sub); }, hosts: function () { viewHosts(sub); }, claim: viewClaim, work: function () { viewWork(sub); },
       mylist: function () { viewMyList(sub); }, join: viewJoin, search: function () { viewSearch(decodeURIComponent(sub)); } })[view]();
    keepPlayer(bar);
    curTab = key;
    drawRiver();
    if (view !== 'search') { main.scrollTop = 0; if (!document.documentElement.classList.contains('dg-fit') || window.innerWidth <= 900) window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', function () { shown = 24; route(); });

  // ---------- access ----------
  function api(action, tok) {
    return fetch(UNLOCK_URL + '?action=' + action, { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: SLUG, token: tok || undefined }) })
      .then(function (r) { return r.json(); });
  }
  function becomeMember(html) {
    var t = document.createElement('template'); t.innerHTML = html;
    var el = t.content.getElementById('ev-data');
    MEM = el ? JSON.parse(el.textContent) : null;
    access = MEM ? 'member' : 'pending';
    route();
    if (MEM) loadSurvey();
  }
  function feedEp(show, guid) {
    return fetch(PODCAST_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'episode', slug: show, guid: guid }) })
      .then(function (r) { return r.json(); }).then(function (d) { return d && d.episode; }).catch(function () { return null; });
  }
  function loadPublic() {
    if (window.VEEpisodes) VEEpisodes.css();
    var again = function (re) { return function () { if (re.test(curTab) || /^#\/search/.test(location.hash)) route(); }; };
    rest(VENUES_URL).then(function (d) { VENUES = ours(d); }).catch(function () { VENUES = []; }).then(again(/^(venue|mylist)$/));
    rest(VENDORS_URL).then(function (d) { VENDORS = ours(d); }).catch(function () { VENDORS = []; }).then(again(/^(vendors|mylist)$/));
    var eps = Promise.all(PULSE_PICKS.map(function (x) { return feedEp(x[1], x[2]); }));
    Promise.all([rest(PULSE_URL).catch(function () { return []; }), rest(SHOWS_URL).catch(function () { return []; }), eps]).then(function (r) {
      var pods = Array.isArray(r[0]) ? r[0] : [], shows = Array.isArray(r[1]) ? r[1] : [];
      PODS = PULSE_PICKS.map(function (x, i) {
        var p = pods.filter(function (y) { return y.slug === x[0]; })[0], show = shows.filter(function (y) { return y.slug === x[1]; })[0], ep = r[2][i];
        return p && show && ep && ep.audio ? Object.assign({}, p, { show: show, ep: ep, group: x[3] }) : null;
      }).filter(Boolean);
      if (/^(hosts|word|mylist)$/.test(curTab) && !/tell|apply/.test(location.hash)) route();
    });
  }
  function setStatus(msg) { [].forEach.call(document.querySelectorAll('.dg-status'), function (e) { e.textContent = msg; }); }

  document.addEventListener('click', function (e) {
    var a = auth(), el;
    if ((el = e.target.closest('[data-vep-play]'))) {
      var pp = (PODS || []).filter(function (x) { return x.ep && podKey(x) === el.getAttribute('data-vep-play'); })[0];
      if (pp) playPod(pp.slug); return;
    }
    if (e.target.closest('[data-more]')) { shown += 24; route(); return; }
    if (e.target.closest('[data-clear-plan]')) {
      if (!confirm('Clear every tick in the plan, to start a new event?')) return;
      var cc = checks(); Object.keys(cc).forEach(function (k) { if (k.indexOf('plan-') === 0) delete cc[k]; });
      store('ev_checks', JSON.stringify(cc)); viewPlan(); return;
    }
    if ((el = e.target.closest('[data-copy-plan]'))) {
      var txt = planText();
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { el.textContent = 'Copied'; setTimeout(function () { el.textContent = 'Copy it'; }, 1800); })
        .catch(function () { prompt('Copy your plan:', txt); });
      return;
    }
    if ((el = e.target.closest('[data-rec]'))) { startRec(el.getAttribute('data-rec')); return; }
    if ((el = e.target.closest('[data-tell-next]'))) {
      var n = parseInt(el.getAttribute('data-tell-next'), 10), msg = tellCheck(n);
      if (msg) { tellErr(msg); return; }
      keepTell(); location.hash = '#/hosts/tell/' + (n + 1); return;
    }
    if ((el = e.target.closest('[data-tell-send]'))) { sendStory(el); return; }
    if ((el = e.target.closest('[data-ap-next]'))) {
      var n2 = parseInt(el.getAttribute('data-ap-next'), 10), msg2 = applyCheck(n2);
      if (msg2) { document.getElementById('evErr').textContent = msg2; return; }
      location.hash = '#/work/apply/' + (n2 + 1); return;
    }
    if ((el = e.target.closest('[data-ap-send]'))) {
      var bad = 0; for (var s = 1; s <= FORM.length; s++) { if (applyCheck(s)) { bad = s; break; } }
      if (bad) { if (bad === FORM.length) document.getElementById('evErr').textContent = applyCheck(bad); else location.hash = '#/work/apply/' + bad; return; }
      sendApply(el); return;
    }
    if ((el = e.target.closest('[data-save]'))) {
      e.preventDefault(); e.stopPropagation();
      var kk = el.getAttribute('data-save'), i = kk.indexOf(':'), kind = kk.slice(0, i), key = kk.slice(i + 1), on = !SV[kind][key];
      if (on) { SV[kind][key] = 1; SV_ORDER.unshift({ kind: kind, key: key }); } else { delete SV[kind][key]; SV_ORDER = SV_ORDER.filter(function (x) { return !(x.kind === kind && x.key === key); }); }
      paintSaves();
      cookApi({ action: 'save', kind: kind, key: key, on: on }).then(function (r) { if (!r || !r.ok) throw r; }).catch(function () { if (on) delete SV[kind][key]; else SV[kind][key] = 1; paintSaves(); });
      return;
    }
    if ((el = e.target.closest('[data-gvote]'))) {
      e.preventDefault(); e.stopPropagation();
      var key2 = el.getAttribute('data-gvote').split(':')[1], on2 = !GV.mine.episode[key2];
      cookApi({ action: 'gvote', kind: 'episode', key: key2, on: on2 }).then(function (r) {
        if (!r || !r.ok) return;
        if (on2) GV.mine.episode[key2] = 1; else delete GV.mine.episode[key2];
        GV.counts.episode[key2] = r.count;
        el.classList.toggle('on', on2); el.setAttribute('aria-pressed', String(on2)); el.querySelector('b').textContent = r.count;
      });
      return;
    }
    if ((el = e.target.closest('.dg-srow[data-href]')) && !e.target.closest('a,button')) { location.hash = el.getAttribute('data-href'); return; }
    if (e.target.closest('[data-signin]')) {
      e.preventDefault();
      if (a) a.showAuthModal('Sign in and the Vegan Events Guide opens if it is yours.', function () { location.reload(); }, 'login');
      return;
    }
    if ((el = e.target.closest('[data-buy]'))) { e.preventDefault(); if (token()) buyNow(el); return; }
    var jb = e.target.closest('[data-join]');
    if ((el = e.target.closest('[data-survey]'))) { e.preventDefault(); surveyGo(); return; }
    if (jb) {
      if (!a || access === 'checking' || jb.disabled) return;
      var m = mode();
      if (m === 'join') {
        var go = function () { delete window.VE_ACTIVATE_HANDLER; buyNow(jb); };
        window.VE_ACTIVATE_HANDLER = go;
        a.showAuthModal('Create your account, then get the Vegan Events Guide for $11. Buying it makes you a member.', go, 'signup');
        return;
      }
      if (m === 'points') unlockPoints(jb); else buyNow(jb);
    }
  });
  document.addEventListener('change', function (e) {
    var el;
    if ((el = e.target.closest && e.target.closest('[data-check]'))) {
      var c = checks(), k = el.getAttribute('data-check');
      if (el.checked) c[k] = 1; else delete c[k];
      store('ev_checks', JSON.stringify(c));
      if (k.indexOf('plan-') === 0 && curTab === 'plan') { var y = window.scrollY, mt = main.scrollTop; viewPlan(); window.scrollTo(0, y); main.scrollTop = mt; }
      return;
    }
    if ((el = e.target.closest && e.target.closest('[data-recfile]'))) {
      var f = el.files && el.files[0], q = el.getAttribute('data-recfile');
      if (!f) return;
      if (f.size > 25 * 1024 * 1024) { tellErr('That file is over 25 MB. Try a shorter answer.'); return; }
      var au = new Audio(), url = URL.createObjectURL(f);
      au.preload = 'metadata'; au.src = url;
      au.onloadedmetadata = function () { TELL.rec[q] = { blob: f, url: url, seconds: isFinite(au.duration) ? au.duration : 0, type: f.type || 'audio/mpeg' }; viewTell(2); };
      au.onerror = function () { tellErr('We could not read that file. Try an audio file or a voice memo.'); };
      return;
    }
    if ((el = e.target.closest && e.target.closest('[data-tell]'))) {
      var tk = el.getAttribute('data-tell'); TELL[tk] = el.type === 'checkbox' ? el.checked : el.value; keepTell(); return;
    }
  });
  document.addEventListener('input', function (e) {
    var el;
    if ((el = e.target.closest && e.target.closest('[data-calc]'))) { calcRun(); return; }
    if ((el = e.target.closest && e.target.closest('[data-ap]'))) { APPLY.a[el.getAttribute('data-ap')] = el.value; store('ev_apply', JSON.stringify(APPLY.a)); return; }
    if ((el = e.target.closest && e.target.closest('[data-tell]')) && el.type !== 'checkbox') { TELL[el.getAttribute('data-tell')] = el.value; keepTell(); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('select[data-ap]');
    if (el) { APPLY.a[el.getAttribute('data-ap')] = el.value; store('ev_apply', JSON.stringify(APPLY.a)); }
  });
  function unlockPoints(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Unlocking...';
    api('unlock', tok).then(function (d) {
      if (d && d.unlocked) return api('open', tok).then(function (o) { take(o); if (o && o.unlocked && o.html) becomeMember(o.html); else throw 0; });
      if (d && d.error === 'insufficient_points') { ST.balance = d.balance || 0; route(); return; }
      throw 0;
    }).catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('That did not go through, and no points were spent. Try again in a minute.'); });
  }
  function buyNow(btn) {
    var tok = token(); if (!tok) return;
    btn.disabled = true; btn.textContent = 'Opening checkout...';
    fetch(UNLOCK_URL + '?action=checkout', { method: 'POST', headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, token: tok, return_url: location.origin + location.pathname }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.url) { (window.top || window).location.href = d.url; return; } if (d && d.already) { location.reload(); return; } throw 0; })
      .catch(function () { btn.disabled = false; btn.textContent = ctaLabel(); setStatus('Checkout did not open. Try again in a minute.'); });
  }
  function confirmAfterCheckout(tok, tries) {
    setStatus('Opening your Guide...');
    access = 'pending';
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) { setStatus(''); becomeMember(d.html); return; }
      if (tries > 0) { setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); return; }
      route(); setStatus('Your payment went through. It can take a minute to show here: refresh this page shortly.');
    }).catch(function () { if (tries > 0) setTimeout(function () { confirmAfterCheckout(tok, tries - 1); }, 2500); else route(); });
  }

  function init() {
    if (window.VERegionDirectory) VERegionDirectory.css();
    document.documentElement.classList.add('dg-fit');
    var bx = document.getElementById('dgMaya');
    if (window.VEGuideArt) { var art = VEGuideArt('river', 'square'); if (art) bx.style.backgroundImage = "url('" + art + "')"; }
    var params = new URLSearchParams(location.search);
    route();
    loadPublic();
    var a = auth(), viewAs = a && a.getViewAs ? a.getViewAs() : null;
    var tok = a && a.isLoggedIn() && !viewAs ? a.getToken() : null;
    if (!tok) {
      access = viewAs && viewAs.mode !== 'public' ? 'pending' : 'guest'; route(); api('status').then(function (d) { take(d); route(); }).catch(function () {});
      return;
    }
    var val = params.get('guide');
    if (val) { params.delete('guide'); history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }
    if (val === 'success' || val === 'bought') { confirmAfterCheckout(tok, 8); return; }
    if (val === 'cancelled') setTimeout(function () { setStatus('Checkout was cancelled. Nothing was charged.'); }, 1500);
    api('open', tok).then(function (d) {
      take(d);
      if (d && d.unlocked && d.html) becomeMember(d.html);
      else { access = d && d.loggedIn ? 'pending' : 'guest'; route(); }
    }).catch(function () { access = 'pending'; route(); setStatus('We could not check your access just now. Refresh to try again.'); });
  }

  if (window.VEAuth) init(); else window.addEventListener('load', init);
})();
