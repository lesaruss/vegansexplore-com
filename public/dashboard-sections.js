/* Dashboard checklist (Sean, 2026-10-03: "Go ahead with the checklist").
 *
 * One list of every part of /dashboard/center-console, shared by the dashboard and by
 * the Depot checklist page (/admin/depot/dashboard-checklist). For each view (Member,
 * Community Manager, Superadmin) Sean marks each part Keep or Hide. The marks are saved
 * in ve_site_settings 'dashboard_sections' as { member: {key: false}, cm: {...},
 * superadmin: {...} }: only Hide is stored, so a part added later shows by default.
 *
 * `today` is who can see the part before any marks (some parts only appear with data,
 * e.g. the application card only after applying). A role missing from `today` is not
 * offered on the checklist: Hide cannot give a role a part the code never shows it, and
 * the admin previews (Recent Members, Leads) stay superadmin-only in code, whatever is
 * marked.
 *
 * VEDashSections.roleOf(member) reads the member AFTER View As, so a superadmin viewing
 * as a Member or Community Manager sees exactly that role's marks.
 */
(function () {
  var M = 'member', C = 'cm', S = 'superadmin';
  var ITEMS = [
    { key: 'points', group: 'Header', label: 'Points and level', note: 'Points balance, lifetime points and level progress, top right.', today: [M, C, S], sel: ['#dash-welcome-stats'] },
    { key: 'city-pill', group: 'Header', label: 'City picker', note: 'The "Choose a City" pill under the welcome.', today: [M, C, S], sel: ['#dash-city-pill'] },

    { key: 'cm-cert', group: 'Dashboard tab', label: 'Certification prompt', note: '"Start your Community Manager certification", with progress.', today: [C, S], sel: ['#dash-cm-cert-prompt'] },
    { key: 'cm-pulse', group: 'Dashboard tab', label: 'Pulse Desk prompt', note: 'Link to the Community Manager Pulse Desk.', today: [C, S], sel: ['#dash-cm-pulse-prompt'] },
    { key: 'cm-app', group: 'Dashboard tab', label: 'Community Manager application card', note: 'Only after someone applies: Received, On standby, Selected or Not right now.', today: [M, C], sel: ['#dash-cm-app-prompt'] },
    { key: 'tour', group: 'Dashboard tab', label: 'Take the tour', note: 'The guided tour prompt.', today: [M, C, S], sel: ['#dash-tour-prompt'] },
    { key: 'survey', group: 'Dashboard tab', label: 'Mission survey (250 points)', note: 'Shown until the member answers it.', today: [M, C, S], sel: ['#dash-survey-prompt'] },
    { key: 'membership', group: 'Dashboard tab', label: 'Membership and Challenge Badges', note: 'The two big tiles: membership level and badges earned.', today: [M, C, S], sel: ['#dash-stats-hero'] },
    { key: 'admin-previews', group: 'Dashboard tab', label: 'Admin previews', note: 'Recent Members, Event Submissions, Recent Leads, Guest Reviews. Superadmin only, always.', today: [S], sel: ['#dash-previews'] },
    { key: 'role-stats', group: 'Dashboard tab', label: 'Your Role: city and pending applications', note: 'The city they manage and the count of applications waiting.', today: [C, S], sel: ['#dash-role-label', '#dash-stats-row'] },
    { key: 'leaderboard', group: 'Dashboard tab', label: 'Leaderboard', note: 'This City and Global points ranking.', today: [M, C, S], sel: ['#dash-leaderboard-block'] },
    { key: 'home-pulse', group: 'Dashboard tab', label: 'Daily Pulse preview', note: 'The latest Pulse stories on the Dashboard tab.', today: [M, C, S], sel: ['#dash-home-pulse-block'] },

    { key: 'tab-directory', group: 'Tabs', label: 'Directory tab', note: 'Local Directory listings for their city.', today: [M, C, S], tab: 'directory', sel: ['#dash-directory-section'] },
    { key: 'tab-events', group: 'Tabs', label: 'Events tab', note: 'Upcoming events.', today: [M, C, S], tab: 'events', sel: ['#dash-events-section'] },
    { key: 'tab-shows', group: 'Tabs', label: 'Shows tab', note: 'Podcasts and shows.', today: [M, C, S], tab: 'shows', sel: ['#dash-shows-section'] },
    { key: 'tab-pulse', group: 'Tabs', label: 'Daily Pulse tab', note: 'The full Daily Pulse feed.', today: [M, C, S], tab: 'pulse', sel: ['#dash-pulse-section'] },
    { key: 'tab-communities', group: 'Tabs', label: 'Communities tab', note: 'Their communities and the city switcher.', today: [M, C, S], tab: 'communities', sel: ['#dash-community-section'] },
    { key: 'tab-tools', group: 'Tabs', label: 'Tools tab', note: 'Everything listed under "Tools tab" below.', today: [M, C, S], tab: 'tools', sel: ['#dash-tools-section'] },

    { key: 'tools-bounties', group: 'Tools tab', label: 'Bounties', note: 'Point bounties by topic.', today: [M, C, S], section: 'dash-bounties-section' },
    { key: 'tools-campaigns', group: 'Tools tab', label: 'Your Campaigns', note: 'Campaigns they joined or can join.', today: [M, C, S], section: 'dash-campaigns-section' },
    { key: 'tools-opportunities', group: 'Tools tab', label: 'Your Opportunities', note: 'Volunteer and paid opportunities.', today: [M, C, S], section: 'dash-opportunities-section' },
    { key: 'tools-guides', group: 'Tools tab', label: 'Guides', note: 'Step-by-step guide catalog.', today: [M, C, S], section: 'dash-guides-section' },
    { key: 'tile-my-list', group: 'Tools tab', label: 'My List tile', note: 'Saved Directory listings.', today: [M, C, S], tile: ['my-list'] },
    { key: 'tile-choose-guide', group: 'Tools tab', label: 'Choose Your Guide tile', note: 'Pick a Guide (a Founding Member perk).', today: [M, C, S], tile: ['choose-guide'] },
    { key: 'tile-community-board', group: 'Tools tab', label: 'Community Board tile', note: 'Requests and offers per city. Today only in the superadmin layout.', today: [S], tile: ['community-board'] },
    { key: 'tile-cm-cert', group: 'Tools tab', label: 'Certification tile', note: 'Community Manager course and certificate.', today: [C, S], tile: ['cm-handbook'] },
    { key: 'tile-cm-coming', group: 'Tools tab', label: 'Event Management and Directory Review (coming)', note: 'Greyed "coming" tiles for Community Managers.', today: [C], tile: ['cm-coming'] },
    { key: 'tile-cm-2027', group: 'Tools tab', label: 'Passport Challenge and Tours (2027)', note: 'Previews of the 2027 programs. Today only in the superadmin layout.', today: [S], tile: ['cm-passport-challenge', 'cm-tours'] },
    { key: 'tile-admin', group: 'Tools tab', label: 'Superadmin tiles', note: 'Members, Event Submissions, Leads, Guest Reviews, The Depot.', today: [S], tile: ['sa-members', 'sa-events', 'sa-leads', 'sa-guest-reviews', 'sa-media'] }
  ];
  var ROLES = [{ key: M, label: 'Member' }, { key: C, label: 'Community Manager' }, { key: S, label: 'Superadmin' }];
  var URL_ = 'https://fwbhwfxpncrsfhttimna.supabase.co/rest/v1/ve_site_settings?key=eq.dashboard_sections&select=value';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';

  function roleOf(member) {
    if (!member) return M;
    if (member.is_superadmin) return S;
    return member.ve_role === 'community_manager' ? C : M;
  }

  // Resolves to the saved marks, or {} when there are none or the read fails or is slow,
  // so the dashboard never waits more than 2.5 seconds on this.
  function load() {
    return new Promise(function (resolve) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; resolve({}); } }, 2500);
      fetch(URL_, { headers: { apikey: ANON, Authorization: 'Bearer ' + ANON }, cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) { if (!done) { done = true; clearTimeout(t); resolve((rows && rows[0] && rows[0].value) || {}); } })
        .catch(function () { if (!done) { done = true; clearTimeout(t); resolve({}); } });
    });
  }

  // The parts hidden for this role: only parts the role can see today, marked Hide.
  function hiddenFor(marks, role) {
    var m = (marks && marks[role]) || {};
    return ITEMS.filter(function (it) { return it.today.indexOf(role) !== -1 && m[it.key] === false; });
  }

  window.VEDashSections = { ITEMS: ITEMS, ROLES: ROLES, roleOf: roleOf, load: load, hiddenFor: hiddenFor };
})();
