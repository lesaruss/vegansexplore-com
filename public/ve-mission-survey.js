/* The Mission Survey (Sean, 2026-09-22; moved here 2026-10-04). About 20 questions that complete a
 * member's profile and give each community its market research. Profile answers (q1/q2/q3/q4/q5/q7)
 * land in real member columns server-side, the full set in members.mission_survey_answers; q21 (open
 * text) is required. Finishing it earns 250 points (ve-mission-survey). Since 2026-10-04 the member's
 * Guide asks it, as the first part of setting up their Guide (/guide.html), so the questions live here,
 * once, instead of in a dashboard pop-up.
 *
 *   VEMissionSurvey.mount(host, {
 *     stepIntro: function (i, step) { return 'html above step i' },   optional, the Guide's line
 *     onDone:    function (result) { ... },                            after a saved submit
 *     preview:   true                                                  nothing is sent
 *   })
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-mission-survey?action=submit';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var CITY_NAMES = {'atlanta':'ATL Vegans','central-florida':'Central Florida Vegans','dmv':'DMV Vegans','london':'London Vegans','los-angeles':'LA Vegans','new-york':'NYC Vegans','philadelphia':'Philly Vegans','south-florida':'South Florida Vegans'};
  var STEPS = [
    { title: 'About you', qs: [
      { id: 'q1_city', label: 'Which community are you part of?', type: 'city', required: true },
      { id: 'q2_zip', label: 'ZIP or neighborhood', hint: 'optional', type: 'text', placeholder: 'e.g. 33139 or Wynwood' },
      { id: 'q3_roles', label: 'Which best describes you?', hint: 'select all that apply', type: 'multi', required: true, options: ['Eater / diner', 'Business owner', 'Creator / influencer', 'Activist', 'Nonprofit / organizer', 'Service provider', 'Investor', 'Just exploring'] },
      { id: 'q4_website', label: 'Website or business link', hint: 'optional', type: 'text', placeholder: 'https://' },
      { id: 'q5_instagram', label: 'Instagram or main social handle', hint: 'optional', type: 'text', placeholder: '@yourhandle' }
    ] },
    { title: 'Your vegan journey', qs: [
      { id: 'q6_stage', label: 'Where are you on your journey?', type: 'single', required: true, options: ['Curious / pre-vegan', 'Flexitarian', 'Vegetarian', 'New vegan (under 1 year)', 'Established (1-5 years)', 'Longtime (5+ years)'] },
      { id: 'q7_vegan_since', label: 'Roughly when did you go (or start going) vegan?', hint: 'optional', type: 'month' },
      { id: 'q8_drivers', label: 'What first drew you to it?', hint: 'select all that apply', type: 'multi', options: ['Animals / ethics', 'Health', 'Environment', 'Faith / spirituality', 'Cost', 'Taste / curiosity', 'Family / friends'] },
      { id: 'q9_challenges', label: 'Biggest challenge staying vegan?', hint: 'select all that apply', type: 'multi', options: ['Dining out', 'Social pressure', 'Cost', 'Convenience', 'Recipes / knowledge', 'Family', 'Travel'] }
    ] },
    { title: 'Your community & region', qs: [
      { id: 'q10_options_rating', label: 'How would you rate vegan options in your area today?', hint: '1 = poor, 5 = excellent', type: 'scale', scale: [1, 2, 3, 4, 5] },
      { id: 'q11_missing', label: "What's missing most where you live?", hint: 'select all that apply', type: 'multi', options: ['Restaurants', 'Grocery / products', 'Events', 'Social groups', 'Health / wellness services', 'Education', 'Kid / family options'] },
      { id: 'q12_business_types', label: 'Which vegan businesses would you support if they opened here?', hint: 'select all that apply', type: 'multi', options: ['Restaurant / cafe', 'Bakery', 'Grocer', 'Food truck', 'Meal prep', 'Wellness', 'Clothing / goods'] },
      { id: 'q13_eatout_freq', label: 'How often do you eat out or order vegan?', type: 'single', options: ['Daily', 'A few times a week', 'Weekly', 'Occasionally', 'Rarely'] },
      { id: 'q14_spend', label: 'Roughly what do you spend on vegan food & products a month?', type: 'single', options: ['Under $50', '$50-$150', '$150-$300', '$300-$600', '$600+'] },
      { id: 'q15_local_spots', label: 'Any local vegan spots or businesses we should add to the directory?', hint: 'optional', type: 'text', placeholder: 'Names, links, anything' }
    ] },
    { title: 'How we can serve you', qs: [
      { id: 'q16_wants', label: 'What do you most want from Vegans Explore?', hint: 'select all that apply', type: 'multi', options: ['Directory', 'Community / meetups', 'Deals / rewards', 'Events', 'Guides / education', 'Activism', 'Business growth'] },
      { id: 'q17_connect', label: 'How do you like to connect?', hint: 'select all that apply', type: 'multi', options: ['In-person events', 'Online groups', '1:1', 'Social media', 'Not looking to connect'] },
      { id: 'q18_events', label: 'Would you attend local vegan events if we hosted them?', type: 'single', options: ['Definitely', 'Maybe', 'No'] },
      { id: 'q19_nps', label: 'How likely are you to recommend this community to a friend?', hint: '0 = not likely, 10 = extremely', type: 'scale', scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { id: 'q20_contribute', label: 'Interested in contributing?', hint: 'select all that apply', type: 'multi', options: ['Volunteer', 'Lead my city', 'List my business', 'Sponsor', 'Create content', 'Not now'] }
    ] },
    { title: 'Last bit', qs: [
      { id: 'q21_open', label: 'Anything else you want us to know -- what would make this worth your time?', type: 'longtext', required: true, placeholder: 'Your words help us most.' },
      { id: 'q22_goal', label: 'Your top goal in this lifestyle for the next year?', hint: 'optional', type: 'text', placeholder: 'e.g. cook more at home, find community' }
    ] }
  ];

  var CSS = ''
    + '.vms{font-family:Montserrat,sans-serif;color:#1a1a1a}'
    + '.vms-progress{height:6px;background:rgba(0,0,0,.09);border-radius:100px;overflow:hidden;margin-bottom:8px}'
    + '.vms-bar{height:100%;background:#3A9B3E;width:0;transition:width .25s}'
    + '.vms-meta{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(26,26,26,.55);margin-bottom:14px}'
    + '.vms-intro{margin-bottom:16px}'
    + '.vms-q{margin-bottom:18px}'
    + '.vms-label{display:block;font-size:14px;font-weight:800;line-height:1.35;margin-bottom:9px}'
    + '.vms-req{color:#2d7d31}.vms-hint{font-size:11px;font-weight:600;color:rgba(26,26,26,.55)}'
    + '.vms-opts{display:flex;flex-wrap:wrap;gap:8px}'
    + '.vms-opt{border:1.5px solid rgba(0,0,0,.12);border-radius:100px;padding:8px 15px;font:inherit;font-size:12.5px;font-weight:700;color:rgba(26,26,26,.8);cursor:pointer;background:#fff}'
    + '.vms-opt:hover{border-color:#3A9B3E}.vms-opt[aria-pressed="true"]{background:#3A9B3E;border-color:#3A9B3E;color:#fff}'
    + '.vms-scale .vms-opt{min-width:40px;padding:9px 0;text-align:center}'
    + '.vms-input{width:100%;padding:11px 14px;border:1.5px solid rgba(0,0,0,.12);border-radius:8px;font:inherit;font-size:13.5px;box-sizing:border-box;background:#fff}'
    + '.vms-input:focus{outline:none;border-color:#3A9B3E}textarea.vms-input{min-height:96px;resize:vertical}'
    + '.vms-nav{display:flex;justify-content:space-between;gap:10px;margin-top:6px}'
    + '.vms-btn{padding:12px 22px;border-radius:8px;border:none;font:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;background:#3A9B3E;color:#fff}'
    + '.vms-btn:hover{background:#2d7d31}.vms-btn:disabled{background:#9CA3AF;cursor:not-allowed}'
    + '.vms-btn.ghost{background:#fff;color:#2d7d31;border:1.5px solid #3A9B3E}'
    + '.vms-err{display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;padding:10px 12px;font-size:12px;color:#b91c1c;font-weight:600;margin-bottom:12px}';
  function injectCss() {
    if (document.getElementById('vms-css')) return;
    var st = document.createElement('style'); st.id = 'vms-css'; st.textContent = CSS; document.head.appendChild(st);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function token() { try { return localStorage.getItem('ve_token'); } catch (e) { return null; } }

  function mount(host, opts) {
    opts = opts || {};
    injectCss();
    var answers = {}, step = 0;

    function question(q) {
      var wrap = document.createElement('div'); wrap.className = 'vms-q';
      var lab = document.createElement('label'); lab.className = 'vms-label';
      lab.innerHTML = esc(q.label) + (q.required ? ' <span class="vms-req">*</span>' : '') + (q.hint ? ' <span class="vms-hint">(' + esc(q.hint) + ')</span>' : '');
      wrap.appendChild(lab);
      var set = function (v) { answers[q.id] = v; };
      if (q.type === 'text' || q.type === 'longtext' || q.type === 'month') {
        var el = document.createElement(q.type === 'longtext' ? 'textarea' : 'input');
        if (q.type !== 'longtext') el.type = q.type === 'month' ? 'month' : 'text';
        el.className = 'vms-input'; if (q.placeholder) el.placeholder = q.placeholder;
        if (answers[q.id]) el.value = answers[q.id];
        el.addEventListener('input', function () { set(el.value); });
        lab.htmlFor = el.id = 'vms-' + q.id;
        wrap.appendChild(el);
      } else if (q.type === 'city') {
        var sel = document.createElement('select'); sel.className = 'vms-input';
        sel.innerHTML = '<option value="">Select your community&hellip;</option>' +
          Object.keys(CITY_NAMES).map(function (k) { return '<option value="' + k + '">' + esc(CITY_NAMES[k]) + '</option>'; }).join('') +
          '<option value="other">Somewhere else</option>';
        if (answers[q.id]) sel.value = answers[q.id];
        sel.addEventListener('change', function () { set(sel.value); });
        lab.htmlFor = sel.id = 'vms-' + q.id;
        wrap.appendChild(sel);
      } else {
        var box = document.createElement('div');
        box.className = 'vms-opts' + (q.type === 'scale' ? ' vms-scale' : '');
        box.setAttribute('role', 'group'); box.setAttribute('aria-label', q.label);
        (q.type === 'scale' ? q.scale.map(String) : q.options).forEach(function (v) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'vms-opt'; b.textContent = v;
          var on = q.type === 'multi' ? (answers[q.id] || []).indexOf(v) >= 0 : String(answers[q.id]) === v;
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          b.addEventListener('click', function () {
            if (q.type === 'multi') {
              var arr = (answers[q.id] || []).slice(), i = arr.indexOf(v);
              if (i < 0) arr.push(v); else arr.splice(i, 1);
              set(arr); b.setAttribute('aria-pressed', i < 0 ? 'true' : 'false');
            } else {
              set(v);
              Array.prototype.forEach.call(box.children, function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
            }
          });
          box.appendChild(b);
        });
        wrap.appendChild(box);
      }
      return wrap;
    }

    function missing(i) {
      return STEPS[i].qs.filter(function (q) {
        var a = answers[q.id];
        return q.required && (a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length));
      }).map(function (q) { return q.label; });
    }

    function render() {
      var s = STEPS[step], last = step === STEPS.length - 1;
      host.innerHTML = '';
      var root = document.createElement('div'); root.className = 'vms';
      var intro = opts.stepIntro ? opts.stepIntro(step, s) : '';
      root.innerHTML = (intro ? '<div class="vms-intro">' + intro + '</div>' : '') +
        '<div class="vms-progress"><div class="vms-bar" style="width:' + Math.round((step + 1) / STEPS.length * 100) + '%"></div></div>' +
        '<div class="vms-meta">Step ' + (step + 1) + ' of ' + STEPS.length + ' &middot; ' + esc(s.title) + '</div>' +
        '<div class="vms-err" role="alert"></div><div class="vms-qs"></div>' +
        '<div class="vms-nav"><button type="button" class="vms-btn ghost" data-back' + (step ? '' : ' style="visibility:hidden"') + '>Back</button>' +
        '<button type="button" class="vms-btn" data-next>' + (last ? 'Send my answers' : 'Next') + '</button></div>';
      var qs = root.querySelector('.vms-qs');
      s.qs.forEach(function (q) { qs.appendChild(question(q)); });
      host.appendChild(root);
      var err = root.querySelector('.vms-err');
      function fail(t) { err.textContent = t; err.style.display = 'block'; }
      root.querySelector('[data-back]').onclick = function () { if (step) { step--; render(); } };
      root.querySelector('[data-next]').onclick = function () {
        var miss = missing(step);
        if (miss.length) return fail('Please answer: ' + miss.join(', '));
        if (!last) { step++; render(); try { host.scrollIntoView({ block: 'start' }); } catch (e) {} return; }
        var btn = this;
        if (opts.preview) return opts.onDone && opts.onDone({ ok: true, preview: true });
        btn.disabled = true; btn.textContent = 'Sending...';
        fetch(FN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ANON_KEY },
          body: JSON.stringify({ token: token(), response_text: String(answers.q21_open || '').trim(), answers: answers })
        }).then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d || {} }; }); }).then(function (res) {
          if ((res.status < 300 && res.d.ok) || res.d.error === 'already_completed') return opts.onDone && opts.onDone(res.d);
          btn.disabled = false; btn.textContent = 'Send my answers';
          fail(res.d.error === 'not_eligible' ? 'This survey is for active members.' : (res.d.error || 'Something went wrong. Please try again.'));
        }).catch(function () { btn.disabled = false; btn.textContent = 'Send my answers'; fail('Could not reach the server. Please try again.'); });
      };
    }
    render();
  }

  window.VEMissionSurvey = { mount: mount, steps: STEPS };
})();
