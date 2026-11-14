/* Your profile (Sean, 2026-10-28: "Maybe we treat it like a dating profile where it asks different questions about themselves that
 * will be added to their profile. They can get a combined 250 points for every question they answer with some questions being worth
 * more than others"). It began as the Mission Survey (Sean, 2026-09-22), and its questions live here, once.
 *
 * Every question has its own points, 250 in all, and the ones in their own words (In your words, p_*) are worth the most. The points
 * live in the database (ve_profile_questions, migration 20261028_member_profile_points.sql); PTS below only draws them until the
 * server answers. An answer is saved the moment it is given and pays its points once (ve-mission-survey answer, ve_profile_answer),
 * so changing it later never pays again. Answers fill the profile (members.mission_survey_answers and the columns they map to) and
 * set the dashboard version (ve_dashboard_version). Questions marked team are for us (market research), not the profile, and say so.
 *
 *   VEMissionSurvey.profile(host, { preview, onChange })   the profile: every question a card, any order, one question per view
 *                                                          (#q/<id>); /dashboard/survey (survey.html)
 *   VEMissionSurvey.mount(host, { theme, onQuestion, onDone, preview })   one question after another, Back and Next, as the
 *                                                          Guide's setup asks it (/guide.html); every Next saves that answer
 *
 * Who sees what (phase 1 of the playbook ve-member-profiles-partner-windows, Sean 2026-10-28: "we should be able to decide what's
 * seen only by us and what's seen by the public... the member can hide and select what they want the public to see, but we, by
 * default, see the full profile"). Every answer about the member has a switch, Can be shown or Just for Vegans Explore (ve-mission-survey
 * shown, members.profile_shown; SHOWN is the default, the server's ve_profile_switchable the rule). The team's questions and the
 * Instagram handle have none and are never shown. Nobody browses profiles: a shown answer appears only where the member takes part.
 *
 * One question at a time (Sean, 2026-10-05): the question large, its answer under it. A tap only marks an answer; Next or Save moves
 * on. Question 7 is a Month and a Year list, sent as YYYY-MM.
 */
(function () {
  var FN_BASE = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-mission-survey?action=';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var CITY_NAMES = {'atlanta':'ATL Vegans','central-florida':'Central Florida Vegans','north-florida':'North Florida Vegans','washington-dc':'DC Vegans','delaware':'Delaware Vegans','maryland':'Maryland Vegans','virginia':'Virginia Vegans','west-virginia':'West Virginia Vegans','london':'London Vegans','los-angeles':'LA Vegans','seattle':'Seattle Vegans','portland':'Portland Vegans','san-francisco':'SF Vegans','austin':'Austin Vegans','denver':'Denver Vegans','boston':'Boston Vegans','new-york':'NYC Vegans','philadelphia':'Philly Vegans','south-florida':'South Florida Vegans'};
  var STEPS = [
    { title: 'About you', qs: [
      { id: 'q1_city', label: 'Which community are you part of?', type: 'city' },
      { id: 'q2_zip', team: true, label: 'ZIP or neighborhood', hint: 'optional', type: 'text', placeholder: 'e.g. 33139 or Wynwood' },
      { id: 'q3_roles', label: 'Which best describes you?', hint: 'select all that apply', type: 'multi', options: ['Eater / diner', 'Business owner', 'Creator / influencer', 'Activist', 'Nonprofit / organizer', 'Service provider', 'Investor', 'Just exploring'] },
      { id: 'q4_website', team: true, label: 'Website or business link', hint: 'optional', type: 'text', placeholder: 'https://' },
      { id: 'q5_instagram', label: 'Instagram or main social handle', hint: 'optional', type: 'text', placeholder: '@yourhandle' }
    ] },
    { title: 'In your words', qs: [
      { id: 'p_meal', label: 'My go-to Vegan meal is...', type: 'prompt', placeholder: 'The dish, and where you get it or how you make it' },
      { id: 'p_why', label: 'I went Vegan, or started exploring it, because...', type: 'prompt', placeholder: 'Your story, in a few lines' },
      { id: 'p_day', label: 'A perfect day in my city looks like...', type: 'prompt', placeholder: 'Where you eat, where you go, who you are with' },
      { id: 'p_meet', label: 'I would love to meet people who...', type: 'prompt', placeholder: 'Cook, train, volunteer, build a business...' },
      { id: 'p_fact', label: 'Something people are surprised to learn about me...', type: 'prompt', placeholder: 'Anything you like' }
    ] },
    { title: 'Your Vegan journey', qs: [
      { id: 'q6_stage', label: 'Where are you on your journey?', type: 'single', options: ['Curious / pre-Vegan', 'Flexitarian', 'Vegetarian', 'New Vegan (under 1 year)', 'Established (1-5 years)', 'Longtime (5+ years)'] },
      { id: 'q7_vegan_since', label: 'Roughly when did you go (or start going) Vegan?', hint: 'optional', type: 'month' },
      { id: 'q8_drivers', none: true, label: 'What first drew you to it?', hint: 'select all that apply', type: 'multi', options: ['Animals / ethics', 'Health', 'Environment', 'Faith / spirituality', 'Cost', 'Taste / curiosity', 'Family / friends'] },
      { id: 'q9_challenges', none: true, team: true, label: 'Biggest challenge staying Vegan?', hint: 'select all that apply', type: 'multi', options: ['Dining out', 'Social pressure', 'Cost', 'Convenience', 'Recipes / knowledge', 'Family', 'Travel'] }
    ] },
    { title: 'What matters to you', qs: [
      { id: 'q23_matters', none: true, label: 'What matters most to you?', hint: 'select all that apply', type: 'multi', options: ['The animals', 'My health and fitness', 'Building community', 'Supporting local Vegan businesses', 'Supporting nonprofits and rescues', 'Creating content', 'Earning extra income'] },
      { id: 'q24_diet', none: true, label: 'Any of these for how you eat?', hint: 'select all that apply', type: 'multi', options: ['Gluten-free', 'Nut allergy', 'Soy-free', 'Oil-free', 'Whole-food plant-based', 'Raw', 'High protein'] },
      { id: 'q25_household', team: true, label: 'Who do you cook and eat with at home?', hint: 'optional', type: 'single', options: ['Just me', 'A partner', 'Kids', 'People who are not Vegan', 'Roommates or family'] },
      { id: 'q26_work', team: true, label: 'Do you work in any of these?', hint: 'optional', type: 'single', options: ['Health or medicine', 'Coaching or fitness', 'Food: a chef, a restaurant or a brand', 'Content or media', 'A nonprofit or rescue', 'None of these'] }
    ] },
    { title: 'Your community & region', qs: [
      { id: 'q10_options_rating', team: true, label: 'How would you rate Vegan options in your area today?', hint: '1 = poor, 5 = excellent', type: 'scale', scale: [1, 2, 3, 4, 5] },
      { id: 'q11_missing', none: true, team: true, label: "What's missing most where you live?", hint: 'select all that apply', type: 'multi', options: ['Restaurants', 'Grocery / products', 'Events', 'Social groups', 'Health / wellness services', 'Education', 'Kid / family options'] },
      { id: 'q12_business_types', team: true, label: 'Which kinds of Vegan business do you support?', hint: 'select all that apply', type: 'multi', none: true, options: ['100% Vegan', 'Vegan options', 'Vegan friendly'] },
      { id: 'q13_eatout_freq', team: true, label: 'How often do you eat out or order Vegan?', type: 'single', options: ['Daily', 'A few times a week', 'Weekly', 'Occasionally', 'Rarely'] },
      { id: 'q14_spend', team: true, label: 'Roughly what do you spend on Vegan food & products a month?', type: 'single', options: ['Under $50', '$50-$150', '$150-$300', '$300-$600', '$600+'] },
      { id: 'q15_local_spots', team: true, label: 'Any local Vegan spots or businesses we should add to the directory?', hint: 'optional', type: 'places', placeholder: 'Start typing a name' }
    ] },
    { title: 'How we can serve you', qs: [
      { id: 'q16_wants', none: true, team: true, label: 'What do you most want from Vegans Explore?', hint: 'select all that apply', type: 'multi', options: ['Directory', 'Community / meetups', 'Deals / rewards', 'Events', 'Guides / education', 'Activism', 'Business growth'] },
      { id: 'q17_connect', team: true, label: 'How do you like to connect?', hint: 'select all that apply', type: 'multi', options: ['In-person events', 'Online groups', '1:1', 'Social media', 'Not looking to connect'] },
      { id: 'q18_events', team: true, label: 'Would you attend local Vegan events if we hosted them?', type: 'single', options: ['Definitely', 'Maybe', 'No'] },
      { id: 'q19_nps', team: true, label: 'How likely are you to recommend this community to a friend?', hint: '0 = not likely, 10 = extremely', type: 'scale', scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { id: 'q20_contribute', team: true, label: 'Interested in contributing?', hint: 'select all that apply', type: 'multi', options: ['Volunteer', 'Lead my city', 'List my business', 'Sponsor', 'Create content', 'Not now'] }
    ] },
    { title: 'Last bit', qs: [
      { id: 'q21_open', team: true, label: 'Anything else you want us to know? What would make this worth your time?', type: 'longtext', placeholder: 'Your words help us most.' },
      { id: 'q22_goal', team: true, label: 'Your top goal in this lifestyle for the next year?', hint: 'optional', type: 'text', placeholder: 'e.g. cook more at home, find community' }
    ] }
  ];

  // Shown until the server's points arrive (ve_profile_questions holds the real ones).
  var PTS = { p_meal: 15, p_why: 15, p_day: 15, p_meet: 15, p_fact: 15, q1_city: 10, q2_zip: 5, q3_roles: 10, q4_website: 5, q5_instagram: 5,
    q6_stage: 10, q7_vegan_since: 5, q8_drivers: 5, q9_challenges: 5, q23_matters: 10, q24_diet: 5, q25_household: 5, q26_work: 5,
    q10_options_rating: 5, q11_missing: 5, q12_business_types: 5, q13_eatout_freq: 5, q14_spend: 5, q15_local_spots: 10,
    q16_wants: 10, q17_connect: 5, q18_events: 5, q19_nps: 5, q20_contribute: 5, q21_open: 15, q22_goal: 10 };
  var PROMPT_MAX = 300;
  // The answers with a switch, and whether each starts as Can be shown (ve_profile_switchable holds the rule).
  var SHOWN = { p_meal: true, p_why: true, p_day: true, p_meet: true, p_fact: true, q1_city: true, q6_stage: true, q7_vegan_since: true,
    q3_roles: false, q8_drivers: false, q23_matters: false, q24_diet: false };

  var CSS = ''
    + '.vms{font-family:Montserrat,sans-serif;color:#1a1a1a}'
    + '.vms-meta{font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#2d7d31;margin-bottom:12px}'
    + '.vms-bar{height:4px;background:rgba(0,0,0,.1);border-radius:99px;overflow:hidden;margin-bottom:18px;max-width:560px}'
    + '.vms-bar i{display:block;height:100%;background:#3A9B3E;transition:width .25s}'
    + '.vms-qh{display:block;font-size:clamp(22px,2.4vw,30px);font-weight:900;line-height:1.2;letter-spacing:-.01em;margin:0 0 6px;max-width:640px}'
    + '.vms-hint{display:block;font-size:13px;font-weight:600;color:rgba(26,26,26,.6);margin-bottom:16px}'
    + '.vms-ans{margin-top:16px;max-width:620px}'
    + '.vms-opts{display:flex;flex-wrap:wrap;gap:10px}'
    + '.vms-opt{border:1.5px solid rgba(0,0,0,.15);border-radius:6px;padding:11px 18px;font:inherit;font-size:14px;font-weight:700;color:#1a1a1a;cursor:pointer;background:#fff}'
    + '.vms-opt:hover{border-color:#3A9B3E}.vms-opt[aria-pressed="true"]{background:#22C55E;border-color:#22C55E;color:#03170a}'
    + '.vms-scale .vms-opt{min-width:48px;padding:11px 0;text-align:center}'
    + '.vms-input{width:100%;padding:14px 16px;border:1.5px solid rgba(0,0,0,.15);border-radius:10px;font:inherit;font-size:15px;box-sizing:border-box;background:#fff;color:#1a1a1a}'
    + 'select.vms-input{appearance:none;-webkit-appearance:none;padding-right:46px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 fill=%27none%27 stroke=%27%231a1a1a%27 stroke-width=%272%27/%3E%3C/svg%3E") no-repeat right 16px center}'
    + '.vms-saved{background:#e8f5e9;border:1px solid #b8ddb9;border-radius:6px;padding:10px 12px;font-size:13px;font-weight:700;color:#1f5f22;margin:0 0 16px;max-width:620px}'
    + '.vms.dark .vms-saved{background:rgba(34,197,94,.15);border-color:rgba(134,239,172,.5);color:#bbf7d0}'
    + '.vms-input:focus{outline:none;border-color:#22C55E}textarea.vms-input{min-height:130px;resize:vertical}'
    + '.vms-nav{display:flex;align-items:center;gap:14px;margin-top:22px;flex-wrap:wrap}'
    + '.vms-btn{min-height:46px;padding:13px 26px;border-radius:6px;border:none;font:inherit;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;background:#22C55E;color:#03170a}'
    + '.vms-btn:hover{background:#16A34A}.vms-btn:disabled{background:#9CA3AF;cursor:not-allowed}'
    + '.vms-link{background:none;border:none;font:inherit;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;text-decoration:underline;text-underline-offset:3px;cursor:pointer;color:inherit;padding:8px 4px}'
    + '.vms-link[hidden]{display:none}'
    + '.vms-my{display:grid;grid-template-columns:1.4fr 1fr;gap:10px;max-width:420px}'
    + '.vms-err{display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:10px 12px;font-size:13px;color:#b91c1c;font-weight:600;margin-top:14px;max-width:620px}'
    // Dark stage: white words, glass answers (the Community Manager application look).
    + '.vms.dark{color:#fff}.vms.dark .vms-meta{color:#86efac}.vms.dark .vms-hint{color:rgba(255,255,255,.75)}'
    + '.vms.dark .vms-bar{background:rgba(255,255,255,.2)}.vms.dark .vms-bar i{background:#22C55E}'
    + '.vms.dark .vms-opt{background:rgba(0,0,0,.45);border-color:rgba(255,255,255,.4);color:#fff}'
    + '.vms.dark .vms-opt:hover{border-color:#22C55E}.vms.dark .vms-opt[aria-pressed="true"]{background:#22C55E;border-color:#22C55E;color:#03170a}'
    + '.vms.dark .vms-input{background:rgba(0,0,0,.5);border-color:rgba(255,255,255,.45);color:#fff}'
    + '.vms.dark .vms-input::placeholder{color:rgba(255,255,255,.55)}.vms.dark .vms-input:focus{border-color:#F69820}'
    + '.vms.dark select.vms-input option{color:#1a1a1a}'
    + '.vms-pts{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:4px;background:#FFF4E5;color:#7d4a00;letter-spacing:.06em}'
    + '.vms-pts.paid{background:#e8f5e9;color:#1f5f22}'
    + '.vms-count{display:block;text-align:right;font-size:12px;font-weight:700;color:rgba(26,26,26,.55);margin-top:6px;max-width:620px}'
    + '.vms-flash{display:inline-block;background:#22C55E;color:#03170a;border-radius:6px;padding:6px 12px;font-size:13px;font-weight:800;margin:0 0 14px}'
    // The profile: every question a card (Sean, 2026-10-28: "treat it like a dating profile").
    + '.vmp-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:end;margin:0 0 6px}'
    + '.vmp-top b{display:block;font-size:30px;font-weight:900;line-height:1}.vmp-top b small{font-size:14px;font-weight:800;color:rgba(26,26,26,.55)}'
    + '.vmp-top span{display:block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2d7d31;margin-top:6px}'
    + '.vmp-top b small{white-space:nowrap}@media (max-width:600px){.vmp-top{grid-template-columns:1fr}.vmp-top .vms-btn{width:100%}}'
    + '.vmp-bar{height:10px;border-radius:6px;background:#e3e7e3;overflow:hidden;margin:10px 0 22px}.vmp-bar i{display:block;height:100%;background:#22C55E}'
    + '.vmp-sec{font-size:13px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;margin:26px 0 4px}'
    + '.vmp-secnote{font-size:13px;color:rgba(26,26,26,.6);margin:0 0 12px}'
    + '.vmp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:12px}'
    + '.vmp-card{display:flex;flex-direction:column;gap:8px;text-align:left;font:inherit;color:inherit;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:16px 18px;cursor:pointer;min-height:132px}'
    + '.vmp-card:hover{border-color:#3A9B3E;box-shadow:0 0 0 2px #e8f5e9}'
    + '.vmp-card .vmp-q{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(26,26,26,.6);line-height:1.4}'
    + '.vmp-card .vmp-a{font-size:16px;font-weight:700;line-height:1.45;flex:1;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}'
    + '.vmp-card.prompt .vmp-a{font-size:19px;font-weight:800}'
    + '.vmp-card.empty .vmp-a{color:rgba(26,26,26,.45);font-weight:600;font-size:15px}'
    + '.vmp-card .vmp-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}'
    + '.vmp-card .vmp-foot .vms-pts{margin:0}.vmp-card .vmp-foot em{font-style:normal;color:#2d7d31}'
    + '.vmp-crumb{font-size:13px;font-weight:700;margin:0 0 14px}.vmp-crumb a{color:#1f5f22}'
    + '.vmp-vis{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:none;border-radius:4px;padding:2px 8px;background:#eef1ee;color:#4a4f4a}'
    + '.vmp-vis.on{background:#e8f5e9;color:#1f5f22}'
    + '.vmp-who{margin-top:22px;max-width:620px;border-top:1px solid rgba(0,0,0,.1);padding-top:16px}'
    + '.vmp-who b{display:block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px}'
    + '.vmp-who .vms-opts{margin-bottom:8px}.vmp-who p{font-size:13px;line-height:1.55;color:rgba(26,26,26,.65);margin:0}'
    + '.vmp-who em{font-style:normal;font-weight:700;color:#1f5f22;margin-left:8px}'
    + '.vmp-note{font-size:13.5px;line-height:1.6;color:rgba(26,26,26,.7);max-width:860px;margin:0 0 6px}'
    + '.vms{max-width:100%;overflow-x:hidden}.vms-input{max-width:100%}'
    + '.vmp-prog{margin:0 0 20px;max-width:620px}.vmp-prog-t{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#2d7d31}.vmp-prog-t span{color:rgba(26,26,26,.6)}'
    + '.vmp-prog .vmp-bar{margin:8px 0 0;height:8px}'
    + '.vmp-pl{max-width:620px}.vmp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}'
    + '.vmp-chip{display:inline-flex;align-items:center;gap:8px;background:#e8f5e9;color:#1f5f22;border-radius:6px;padding:7px 8px 7px 12px;font-size:14px;font-weight:700}.vmp-chip.new{background:#fff4e5;color:#7d4a00}'
    + '.vmp-chip button{background:none;border:0;font:inherit;font-size:16px;line-height:1;cursor:pointer;color:inherit;padding:0 4px}'
    + '.vmp-dd{border:1.5px solid rgba(0,0,0,.15);border-radius:10px;margin-top:6px;background:#fff;overflow:hidden}.vmp-dd[hidden]{display:none}'
    + '.vmp-dd button{display:block;width:100%;text-align:left;background:#fff;border:0;border-bottom:1px solid rgba(0,0,0,.07);font:inherit;font-size:14px;font-weight:700;padding:11px 14px;cursor:pointer;color:#1a1a1a}.vmp-dd button:last-child{border-bottom:0}.vmp-dd button:hover,.vmp-dd button:focus{background:#f1f8f1}.vmp-dd small{color:rgba(26,26,26,.6);font-weight:600;margin-left:6px}.vmp-dd .add{color:#7d4a00}'
    + '.vmr-box{background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:22px;max-width:860px;margin:0 0 16px}.vmr-box h3{margin:0 0 8px;font-size:18px;font-weight:900}.vmr-box p{font-size:15px;line-height:1.6;color:rgba(26,26,26,.78);margin:0 0 10px}'
    + '.vmr-video{aspect-ratio:16/9;width:100%;border-radius:10px;background:#0f1f14;display:block;margin:0 0 14px}'
    + '.vmr-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px;margin:0 0 4px}.vmr-steps div{background:#f4f8f4;border-radius:10px;padding:14px;font-size:14px;line-height:1.5}.vmr-steps b{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#2d7d31;margin-bottom:4px}'
    + '.vmr-list{display:grid;gap:0;margin:0}.vmr-row{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr) auto;gap:14px;padding:11px 0;border-bottom:1px solid rgba(0,0,0,.08);font-size:14px;align-items:start}.vmr-row:last-child{border-bottom:0}.vmr-row span{color:rgba(26,26,26,.65);font-weight:700}.vmr-row b{font-weight:700;overflow-wrap:anywhere}.vmr-row a{color:#1f5f22;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase}'
    + '@media (max-width:600px){.vmr-row{grid-template-columns:1fr;gap:4px}}'
    + '.vmr-sendback{background:#fff4e5;border:1px solid #f3c98b;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.55;margin:0 0 14px;max-width:860px}'
    + '.vmr-check{display:flex;gap:10px;align-items:flex-start;font-size:14px;font-weight:700;margin:12px 0}.vmr-check input{margin-top:3px;width:18px;height:18px}'
    + '.vmp-done{background:#e8f5e9;border:1px solid #b8ddb9;border-radius:10px;padding:14px 16px;font-size:14px;font-weight:700;color:#1f5f22;margin:0 0 8px}';
  function injectCss() {
    if (document.getElementById('vms-css')) return;
    var st = document.createElement('style'); st.id = 'vms-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function token() { try { return localStorage.getItem('ve_token'); } catch (e) { return null; } }
  function api(action, body) {
    return fetch(FN_BASE + action, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
      body: JSON.stringify(Object.assign({ token: token() }, body || {})) })
      .then(function (r) { return r.json().then(function (d) { return Object.assign({ _status: r.status }, d || {}); }); });
  }
  function empty(a) { return a === undefined || a === null || (typeof a === 'string' && !a.trim()) || (Array.isArray(a) && !a.length); }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Every question in order, with the part it belongs to.
  var QUESTIONS = [];
  STEPS.forEach(function (s, si) { s.qs.forEach(function (q) { QUESTIONS.push({ q: q, stepIndex: si, step: s }); }); });
  function find(id) { return QUESTIONS.filter(function (x) { return x.q.id === id; })[0] || null; }

  // An answer in words, for a card.
  function said(q, v) {
    if (empty(v)) return '';
    if (Array.isArray(v)) return v.join(', ');
    if (q.type === 'city') return CITY_NAMES[v] || (v === 'other' ? 'Somewhere else' : v);
    if (q.type === 'month') { var m = /^(\d{4})-(\d{2})$/.exec(v); return m ? (m[2] === '01' ? m[1] : MONTHS[+m[2] - 1] + ' ' + m[1]) : v; }
    if (q.type === 'scale') return v + ' of ' + q.scale[q.scale.length - 1];
    return String(v);
  }

  // The answer control for one question. set(v) records it; next() is Enter in a one-line box.
  function control(q, answers, set, next) {
    if (q.type === 'month') return monthYear(q, answers, set);
    if (q.type === 'text' || q.type === 'longtext' || q.type === 'prompt') {
      var long = q.type !== 'text';
      var wrap = document.createElement('div');
      var el = document.createElement(long ? 'textarea' : 'input');
      if (!long) el.type = 'text';
      el.className = 'vms-input'; el.id = 'vms-' + q.id;
      if (q.type === 'prompt') el.maxLength = PROMPT_MAX;
      if (q.placeholder) el.placeholder = q.placeholder;
      if (answers[q.id]) el.value = answers[q.id];
      wrap.appendChild(el);
      var count = null;
      if (q.type === 'prompt') { count = document.createElement('span'); count.className = 'vms-count'; wrap.appendChild(count); }
      var upd = function () { set(el.value); if (count) count.textContent = el.value.length + ' of ' + PROMPT_MAX; };
      el.addEventListener('input', upd); if (count) count.textContent = (el.value || '').length + ' of ' + PROMPT_MAX;
      if (!long) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); next(); } });
      wrap.focusable = el;
      return wrap;
    }
    if (q.type === 'city') {
      var sel = document.createElement('select'); sel.className = 'vms-input'; sel.id = 'vms-' + q.id;
      sel.innerHTML = '<option value="">Select your community&hellip;</option>' +
        Object.keys(CITY_NAMES).map(function (k) { return '<option value="' + k + '">' + esc(CITY_NAMES[k]) + '</option>'; }).join('') +
        '<option value="other">Somewhere else</option>';
      if (answers[q.id]) sel.value = answers[q.id];
      sel.addEventListener('change', function () { set(sel.value); });
      return sel;
    }
    if (q.type === 'places') return places(q, answers, set, next);
    var box = document.createElement('div');
    box.className = 'vms-opts' + (q.type === 'scale' ? ' vms-scale' : '');
    box.setAttribute('role', 'group'); box.setAttribute('aria-labelledby', 'vms-qh');
    var opts = q.type === 'scale' ? q.scale.map(String) : q.options.slice();
    // A question you can pick several answers for always has a way out (Sean, 2026-11-03: "if none of it applies to them, they don't get
    // a chance to get the points for it"): None apply clears the others, and picking any other answer clears it.
    var NONE = null, cur = q.type === 'multi' ? (answers[q.id] || []).slice() : answers[q.id];
    if (q.type === 'multi') { NONE = opts.filter(function (o) { return /^none\b/i.test(o); })[0] || (q.none ? 'None apply' : null); if (NONE && opts.indexOf(NONE) < 0) opts.push(NONE); }
    function sync() { Array.prototype.forEach.call(box.children, function (c) {
      var v = c.textContent, on = q.type === 'multi' ? cur.indexOf(v) >= 0 : String(cur) === v;
      c.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
    opts.forEach(function (v) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'vms-opt'; b.textContent = v;
      b.addEventListener('click', function () {
        if (q.type === 'multi') {
          var arr = cur.slice(), i = arr.indexOf(v);
          if (i >= 0) arr.splice(i, 1);
          else if (NONE && v === NONE) arr = [NONE];
          else { if (NONE) arr = arr.filter(function (x) { return x !== NONE; }); arr.push(v); }
          cur = arr; set(arr); sync();
          return;
        }
        cur = v; set(v); sync();
      });
      box.appendChild(b);
    });
    sync();
    return box;
  }

  // The local-spots question: type a name, see the Directory's matches; a name it does not have is kept for us to add.
  function places(q, answers, set, next) {
    var names = String(answers[q.id] || '').split(/;\s*/).filter(function (x) { return x.trim(); });
    var fresh = {};
    var wrap = document.createElement('div'); wrap.className = 'vmp-pl';
    wrap.innerHTML = '<div class="vmp-chips"></div><input type="text" class="vms-input" id="vms-' + q.id + '" autocomplete="off" data-dictate="off" placeholder="' + esc(q.placeholder || '') + '" aria-label="Search the Directory"><div class="vmp-dd" hidden></div>' +
      '<span class="vms-hint" style="margin:8px 0 0">Pick a match, or add a name we do not have yet. We will look into every one.</span>';
    var chips = wrap.children[0], input = wrap.children[1], dd = wrap.children[2], t = null, seq = 0;
    function draw() {
      chips.innerHTML = names.map(function (n, i) { return '<span class="vmp-chip' + (fresh[n] ? ' new' : '') + '">' + esc(n) + '<button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(n) + '">&times;</button></span>'; }).join('');
      Array.prototype.forEach.call(chips.querySelectorAll('[data-rm]'), function (b) { b.onclick = function () { names.splice(+b.getAttribute('data-rm'), 1); commit(); draw(); }; });
    }
    function commit() { set(names.join('; ')); }
    function add(n, isNew) {
      n = n.replace(/[;\s]+/g, ' ').trim().slice(0, 140); if (n.length < 2) return;
      if (names.some(function (x) { return x.toLowerCase() === n.toLowerCase(); })) { input.value = ''; dd.hidden = true; return; }
      if (names.length >= 15) return;
      names.push(n); if (isNew) { fresh[n] = true; if (token()) api('place_lead', { name: n }); }
      input.value = ''; dd.hidden = true; commit(); draw(); input.focus();
    }
    function show(list, typed) {
      var exact = list.some(function (x) { return x.name.toLowerCase() === typed.toLowerCase(); });
      dd.innerHTML = list.map(function (x, i) { return '<button type="button" data-i="' + i + '">' + esc(x.name) + '<small>' + esc([x.city, x.category].filter(Boolean).join(' · ')) + '</small></button>'; }).join('') +
        (exact ? '' : '<button type="button" class="add" data-add="1">Add &ldquo;' + esc(typed) + '&rdquo; (not in the Directory yet)</button>');
      dd.hidden = false;
      Array.prototype.forEach.call(dd.querySelectorAll('[data-i]'), function (b) { b.onclick = function () { add(list[+b.getAttribute('data-i')].name, false); }; });
      var ab = dd.querySelector('[data-add]'); if (ab) ab.onclick = function () { add(typed, true); };
    }
    input.addEventListener('input', function () {
      var typed = input.value.trim(); clearTimeout(t);
      if (typed.length < 2) { dd.hidden = true; return; }
      var mine = ++seq;
      t = setTimeout(function () {
        if (!token()) return show([], typed);
        api('place_search', { q: typed }).then(function (d) { if (mine === seq) show((d && d.places) || [], typed); }, function () { if (mine === seq) show([], typed); });
      }, 220);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var first = dd.querySelector('[data-i]'), typed = input.value.trim();
        if (!typed) return next(); if (first && first.textContent.toLowerCase().indexOf(typed.toLowerCase()) === 0) first.click(); else add(typed, true); }
    });
    draw(); wrap.focusable = input;
    return wrap;
  }

  // Month and Year lists for a rough date. The year alone is enough (sent as January of that year).
  function monthYear(q, answers, set) {
    var now = new Date().getFullYear(), years = [];
    for (var y = now; y >= now - 70; y--) years.push(y);
    var cur = /^(\d{4})-(\d{2})$/.exec(answers[q.id] || '') || [];
    var box = document.createElement('div'); box.className = 'vms-my';
    box.innerHTML =
      '<select class="vms-input" id="vms-' + q.id + '" aria-label="Month"><option value="">Month</option>' +
      MONTHS.map(function (m, i) { var v = (i < 9 ? '0' : '') + (i + 1); return '<option value="' + v + '"' + (cur[2] === v && cur[2] !== '01' ? ' selected' : '') + '>' + m + '</option>'; }).join('') +
      '</select><select class="vms-input" aria-label="Year"><option value="">Year</option>' +
      years.map(function (y) { return '<option value="' + y + '"' + (cur[1] === String(y) ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select>';
    var sm = box.children[0], sy = box.children[1];
    function upd() { set(sy.value ? sy.value + '-' + (sm.value || '01') : ''); }
    sm.addEventListener('change', upd); sy.addEventListener('change', upd);
    return box;
  }

  function hintFor(q) {
    if (q.type === 'scale' && q.hint) return q.hint.replace(/^(\d+) = /, '$1 is ').replace(/, (\d+) = /, ', $1 is ') + '.';
    if (q.type === 'multi') return 'Pick all that apply.';
    if (q.type === 'prompt') return 'In your own words, up to ' + PROMPT_MAX + ' characters. It goes on your profile.';
    return '';
  }
  function ptsTag(q, S) {
    var n = (S.points && S.points[q.id]) || PTS[q.id] || 0, paid = S.paid.indexOf(q.id) >= 0;
    return '<span class="vms-pts' + (paid ? ' paid' : '') + '">' + (paid ? 'Earned ' + n : '+' + n + ' points') + '</span>';
  }
  function newState(d) {
    d = d || {};
    return { answers: d.answers && typeof d.answers === 'object' ? d.answers : {}, points: d.points || PTS, paid: d.paid || [],
      earned: Number(d.earned) || 0, total: Number(d.total) || 250, at: Number(d.at) || 0, completed: !!d.completed,
      door: !!d.door, held: !!d.held, ready: !!d.ready, review: d.review || null, reviewNote: d.review_note || '',
      shown: Object.assign({}, SHOWN, d.shown || {}) };
  }
  // Save one answer; the server pays its points once.
  function saveAnswer(S, id, value, opts, extra) {
    S.answers[id] = value;
    if (empty(value)) delete S.answers[id];
    if (opts.preview || !token()) {
      var pay = !empty(value) && S.paid.indexOf(id) < 0;
      if (pay) { S.paid.push(id); S.earned += (S.points[id] || PTS[id] || 0); }
      return Promise.resolve({ ok: true, paid_now: pay, points: S.points[id] || PTS[id], earned: S.earned, total: S.total });
    }
    return api('answer', Object.assign({ id: id, value: empty(value) ? null : value }, extra || {})).then(function (d) {
      if (!d.ok) return d;
      if (d.paid_now && S.paid.indexOf(id) < 0) S.paid.push(id);
      S.earned = Number(d.earned) || S.earned; S.total = Number(d.total) || S.total;
      if (d.held !== undefined) { S.held = !!d.held; S.ready = !!d.ready; }
      return d;
    });
  }
  function load(opts) {
    if (opts.preview || !token()) return Promise.resolve(newState({}));
    return api('profile').then(function (d) { return newState(d); }).catch(function () { return newState({}); });
  }

  // ---- The profile: every question a card, answered in any order ----
  function profile(host, opts) {
    opts = opts || {};
    injectCss();
    var S = null, flash = '';
    host.innerHTML = '<div class="vms"><span class="vms-hint">Loading your profile...</span></div>';
    load(opts).then(function (st) { S = st; window.addEventListener('hashchange', draw); draw(); });

    function changed() { if (opts.onChange) opts.onChange({ earned: S.earned, total: S.total, answered: Object.keys(S.answers).length }); }
    function nextOpen(after) {
      // The next unanswered question after this one, else the first unanswered anywhere.
      var i = after ? QUESTIONS.indexOf(find(after)) : -1;
      var rest = QUESTIONS.slice(i + 1).concat(QUESTIONS.slice(0, Math.max(0, i)));
      var hit = rest.filter(function (x) { return empty(S.answers[x.q.id]); })[0];
      return hit ? hit.q.id : null;
    }
    function draw() {
      try { window.scrollTo(0, 0); document.documentElement.scrollLeft = 0; } catch (e) {}
      var m = /^#q\/([a-z0-9_]+)/.exec(location.hash || '');
      if (m && find(m[1])) return drawQuestion(find(m[1]));
      drawCards();
    }
    // The survey door and its team review were retired when Explorer became the way in (ve-explorer-path step 7, 2026-11-09).
    function visTag(q) {
      if (q.team) return '';
      var on = q.id in SHOWN && S.shown[q.id];
      return '<span class="vmp-vis' + (on ? ' on' : '') + '">' + (on ? 'Can be shown' : 'Just for Vegans Explore') + '</span>';
    }
    function card(x) {
      var q = x.q, v = S.answers[q.id], has = !empty(v);
      return '<button type="button" class="vmp-card' + (q.type === 'prompt' ? ' prompt' : '') + (has ? '' : ' empty') + '" data-q="' + q.id + '">' +
        '<span class="vmp-q">' + esc(q.label) + '</span>' +
        '<span class="vmp-a">' + (has ? esc(said(q, v)) : 'Not answered yet') + '</span>' +
        '<span class="vmp-foot">' + ptsTag(q, S) + visTag(q) + '<em>' + (has ? 'Edit' : 'Answer') + '</em></span></button>';
    }
    function drawCards() {
      var answered = QUESTIONS.filter(function (x) { return !empty(S.answers[x.q.id]); }).length;
      var open = nextOpen(null), mine = [], team = [];
      STEPS.forEach(function (st) {
        var cards = st.qs.map(function (q) { return find(q.id); });
        var pub = cards.filter(function (x) { return !x.q.team; }), tm = cards.filter(function (x) { return x.q.team; });
        if (pub.length) mine.push('<h3 class="vmp-sec">' + esc(st.title) + '</h3><div class="vmp-grid">' + pub.map(card).join('') + '</div>');
        if (tm.length) team = team.concat(tm);
      });
      host.innerHTML = '<div class="vms">' +
        '<div class="vmp-top"><div><b>' + S.earned + ' <small>of ' + S.total + ' points</small></b><span>' + answered + ' of ' + QUESTIONS.length + ' answered</span></div>' +
        (open ? '<button type="button" class="vms-btn" data-q="' + open + '">Answer the next one</button>' : '') + '</div>' +
        '<div class="vmp-bar" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(S.earned / S.total * 100)) + '%"></i></div>' +
        (open ? '' : '<div class="vmp-done">Your profile is complete. Change any answer whenever you like.</div>') +
        '<p class="vmp-note">You choose who sees each answer. <b>Can be shown</b> means it may appear where you take part, like the guest list of an event you join. <b>Just for Vegans Explore</b> means only our team sees it, to make your experience better. Nobody browses profiles, and we never sell your information.</p>' +
        mine.join('') +
        '<h3 class="vmp-sec">Help us build your city</h3><p class="vmp-secnote">These are for the team, not your profile: they tell us what to build next where you live.</p>' +
        '<div class="vmp-grid">' + team.map(card).join('') + '</div></div>';
      Array.prototype.forEach.call(host.querySelectorAll('[data-q]'), function (b) { b.onclick = function () { location.hash = '#q/' + b.getAttribute('data-q'); }; });
      changed();
    }
    function whoBox(q) {
      if (q.team) return '';
      if (!(q.id in SHOWN)) return '<div class="vmp-who"><b>Who can see this answer</b><p>Just for Vegans Explore. Contact details are never shown to anyone outside our team.</p></div>';
      var on = !!S.shown[q.id];
      return '<div class="vmp-who" data-who role="group" aria-label="Who can see this answer"><b>Who can see this answer</b><div class="vms-opts">' +
        '<button type="button" class="vms-opt" data-v="1" aria-pressed="' + on + '">Can be shown</button>' +
        '<button type="button" class="vms-opt" data-v="0" aria-pressed="' + !on + '">Just for Vegans Explore</button><em role="status"></em></div>' +
        '<p>Can be shown: it may appear only where you take part, like the guest list of an event you join. Nobody browses profiles. Our team always sees your full profile, only to make your experience better.</p></div>';
    }
    function drawQuestion(x) {
      var q = x.q, value = S.answers[q.id], open = nextOpen(q.id), hint = hintFor(q);
      var pos = QUESTIONS.indexOf(x) + 1, done = QUESTIONS.filter(function (y) { return !empty(S.answers[y.q.id]); }).length;
      host.innerHTML = '<div class="vms">' +
        '<div class="vmp-prog"><div class="vmp-prog-t"><b>Question ' + pos + ' of ' + QUESTIONS.length + '</b><span>' + done + ' answered</span></div>' +
        '<div class="vmp-bar" aria-hidden="true"><i style="width:' + Math.round(done / QUESTIONS.length * 100) + '%"></i></div></div>' +
        '<p class="vmp-crumb"><a href="#">Your profile</a> / ' + esc(x.step.title) + '</p>' +
        (flash ? '<div class="vms-flash" role="status">' + esc(flash) + '</div>' : '') +
        '<div class="vms-meta">' + esc(x.step.title) + ptsTag(q, S) + '</div>' +
        '<label class="vms-qh" id="vms-qh" for="vms-' + q.id + '">' + esc(q.label) + '</label>' +
        (q.team ? '<span class="vms-hint">Only the team sees this.</span>' : '') +
        (hint ? '<span class="vms-hint">' + esc(hint) + '</span>' : '') +
        '<div class="vms-ans"></div><div class="vms-err" role="alert"></div>' + whoBox(q) +
        '<div class="vms-nav">' + (open && open !== q.id ? '<button type="button" class="vms-btn" data-save-next>Save and next</button>' : '') +
        '<button type="button" class="' + (open && open !== q.id ? 'vms-link' : 'vms-btn') + '" data-save>Save</button>' +
        '<button type="button" class="vms-link" data-exit>Save and exit</button><button type="button" class="vms-link" data-back>' + 'Back to your profile' + '</button></div></div>';
      flash = '';
      var err = host.querySelector('.vms-err');
      var ctl = control(q, S.answers, function (v) { value = v; }, function () { save(true); });
      host.querySelector('.vms-ans').appendChild(ctl);
      var f = ctl.focusable;
      if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
      function save(goNext, exit) {
        var btns = host.querySelectorAll('.vms-nav button'); Array.prototype.forEach.call(btns, function (b) { b.disabled = true; });
        saveAnswer(S, q.id, value, opts).then(function (d) {
          if (!d.ok) { Array.prototype.forEach.call(btns, function (b) { b.disabled = false; }); err.style.display = 'block';
            err.textContent = d.error === 'not_eligible' ? 'Your profile opens once you are a member. Join free with the Explorer survey at vegansexplore.com/survey?s=explorer.' : 'Could not save right now. Please try again.'; return; }
          if (d.paid_now) flash = '+' + d.points + ' points';
          if (d.admitted && opts.onAdmitted) { opts.onAdmitted(d); return; }
          if (exit) { if (opts.onExit) return opts.onExit(S); location.hash = '#'; return; }
          var to = goNext ? nextOpen(q.id) : null;
          location.hash = to ? '#q/' + to : '#';
          if (!to && flash) { var t = flash; setTimeout(function () { var el = host.querySelector('.vmp-top span'); if (el) el.textContent = t + ' earned. ' + el.textContent; }, 0); flash = ''; }
        }).catch(function () { Array.prototype.forEach.call(btns, function (b) { b.disabled = false; }); err.style.display = 'block'; err.textContent = 'Could not reach the server. Please try again.'; });
      }
      var who = host.querySelector('[data-who]');
      if (who) Array.prototype.forEach.call(who.querySelectorAll('button'), function (b) {
        b.onclick = function () {
          var want = b.getAttribute('data-v') === '1', note = who.querySelector('em');
          Array.prototype.forEach.call(who.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          S.shown[q.id] = want; note.textContent = 'Saving...';
          var done = function (d) { note.textContent = d && d.ok ? 'Saved' : 'Could not save. Try again.'; };
          if (opts.preview || !token()) return done({ ok: true });
          api('shown', { id: q.id, shown: want }).then(done, function () { done(null); });
        };
      });
      var sn = host.querySelector('[data-save-next]'); if (sn) sn.onclick = function () { save(true); };
      host.querySelector('[data-save]').onclick = function () { save(false); };
      host.querySelector('[data-exit]').onclick = function () { save(false, true); };
      host.querySelector('[data-back]').onclick = function () { location.hash = backHash(); };
      host.querySelector('.vmp-crumb a').onclick = function (e) { e.preventDefault(); location.hash = '#'; };
      if (opts.onQuestion) opts.onQuestion({ id: q.id });
      changed();
    }
  }

  // ---- One question after another (the Guide's setup) ----
  function mount(host, opts) {
    opts = opts || {};
    injectCss();
    var S = null, at = 0, sending = false, resumed = false, saved = {}, flash = '';

    function render() {
      var item = QUESTIONS[at], q = item.q, last = at === QUESTIONS.length - 1, value = S.answers[q.id];
      host.innerHTML = '';
      var root = document.createElement('div'); root.className = 'vms' + (opts.theme === 'dark' ? ' dark' : '');
      var hint = hintFor(q) || 'Optional. Press Next to skip.';
      root.innerHTML =
        '<div class="vms-meta">Question ' + (at + 1) + ' of ' + QUESTIONS.length + ' &middot; ' + esc(item.step.title) + ptsTag(q, S) + '</div>' +
        (resumed ? '<div class="vms-saved">Welcome back. Your answers were saved, so you are picking up where you left off.</div>' : '') +
        (flash ? '<div class="vms-flash" role="status">' + esc(flash) + '</div>' : '') +
        '<div class="vms-bar" aria-hidden="true"><i style="width:' + Math.round((at + 1) / QUESTIONS.length * 100) + '%"></i></div>' +
        '<label class="vms-qh" id="vms-qh" for="vms-' + q.id + '">' + esc(q.label) + '</label>' +
        '<span class="vms-hint">' + esc(hint) + (q.team ? ' Only the team sees this.' : '') + '</span>' +
        '<div class="vms-ans"></div><div class="vms-err" role="alert"></div>' +
        '<div class="vms-nav"><button type="button" class="vms-link" data-back' + (at ? '' : ' hidden') + '>Back</button>' +
        '<button type="button" class="vms-btn" data-next>' + (last ? 'Finish' : 'Next') + '</button>' +
        (opts.preview ? '' : '<button type="button" class="vms-link" data-later>Save and finish later</button>') + '</div>';
      host.appendChild(root);
      resumed = false; flash = '';
      var err = root.querySelector('.vms-err');
      function fail(t) { err.textContent = t; err.style.display = 'block'; }
      // Save this one when it changed; its points come back with it.
      function keep(nextAt) {
        var key = JSON.stringify(value === undefined ? null : value);
        if (saved[q.id] === key) return Promise.resolve({ ok: true });
        saved[q.id] = key;
        return saveAnswer(S, q.id, value, opts, { at: nextAt }).then(function (d) { if (d && d.paid_now) flash = '+' + d.points + ' points'; return d; });
      }
      function next() {
        if (sending) return;
        if (!last) { var p = keep(at + 1); at++; if (opts.preview) render(); else p.then(render, render); return; }
        sending = true; var btn = root.querySelector('[data-next]'); btn.disabled = true; btn.textContent = 'Saving...';
        keep(at).then(function () { sending = false; if (opts.onDone) opts.onDone({ ok: true, earned: S.earned, total: S.total }); })
          .catch(function () { sending = false; btn.disabled = false; btn.textContent = 'Finish'; fail('Could not reach the server. Please try again.'); });
      }
      var ctl = control(q, S.answers, function (v) { value = v; }, next);
      root.querySelector('.vms-ans').appendChild(ctl);
      root.querySelector('[data-next]').onclick = next;
      root.querySelector('[data-back]').onclick = function () { if (at) { keep(at - 1); at--; render(); } };
      var later = root.querySelector('[data-later]');
      if (later) later.onclick = function () {
        later.disabled = true; later.textContent = 'Saving...';
        keep(at).then(function (d) {
          if (d && d.error) { later.disabled = false; later.textContent = 'Save and finish later'; return fail('Could not save right now. Please try again.'); }
          if (opts.onLater) return opts.onLater({ index: at, total: QUESTIONS.length });
          host.innerHTML = '<div class="vms' + (opts.theme === 'dark' ? ' dark' : '') + '"><div class="vms-meta">Saved</div><p class="vms-qh">Your answers are saved.</p>' +
            '<span class="vms-hint">You have ' + S.earned + ' of ' + S.total + ' points. Come back any time from your dashboard.</span></div>';
        });
      };
      if (opts.onQuestion) opts.onQuestion({ index: at, total: QUESTIONS.length, stepIndex: item.stepIndex, step: item.step });
      var f = ctl.focusable || ((ctl.tagName === 'INPUT' || ctl.tagName === 'TEXTAREA') ? ctl : null);
      if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
    }

    host.innerHTML = '<div class="vms' + (opts.theme === 'dark' ? ' dark' : '') + '"><span class="vms-hint">Loading...</span></div>';
    load(opts).then(function (st) {
      S = st;
      if (S.completed && !opts.preview) return opts.onDone && opts.onDone({ ok: true, already_completed: true });
      Object.keys(S.answers).forEach(function (k) { saved[k] = JSON.stringify(S.answers[k]); });
      at = Math.max(0, Math.min(QUESTIONS.length - 1, S.at || 0));
      resumed = at > 0;
      render();
    });
  }

  window.VEMissionSurvey = { mount: mount, profile: profile, steps: STEPS, count: QUESTIONS.length, points: PTS, shown: SHOWN, said: said, doorStart: function () { return api('door_start'); } };
})();
