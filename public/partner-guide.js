/* The Explore Season Partners Guide component.
 * One component, two homes: the public /partners page and the Opportunities
 * section inside the member platform (playbook explore-season-partners-guide,
 * locked 2026-09-24). Mount with <div data-ve-partner-guide data-source="..."></div>.
 * Offers, cities and spots come from the ve-partner-guide edge function, which
 * reads public.ve_partner_offers; every checkout or inquiry writes a sponsors row.
 */
(function () {
  var API = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-partner-guide';

  var CSS = [
    '.vpg{font-family:"Montserrat",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1a1a1a;}',
    '.vpg *{box-sizing:border-box;}',
    '.vpg-q{margin:0 0 22px;border:0;padding:0;min-width:0;}',
    '.vpg-q legend,.vpg-label{display:block;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#2d7d31;margin:0 0 10px;padding:0;}',
    '.vpg-chips{display:flex;flex-wrap:wrap;gap:8px;}',
    '.vpg-chip{appearance:none;font:inherit;font-size:14px;font-weight:700;color:#1a1a1a;background:#fff;border:1.5px solid rgba(0,0,0,0.18);border-radius:100px;padding:10px 16px;cursor:pointer;min-height:44px;transition:border-color .15s,background .15s;}',
    '.vpg-chip:hover{border-color:#2d7d31;}',
    '.vpg-chip[aria-pressed="true"]{background:#2d7d31;border-color:#2d7d31;color:#fff;}',
    '.vpg-chip:focus-visible,.vpg-btn:focus-visible,.vpg-input:focus-visible{outline:3px solid #F69820;outline-offset:2px;}',
    '.vpg-chip small{font-weight:600;opacity:.8;}',
    '.vpg-hint{font-size:13px;color:rgba(26,26,26,0.72);margin:10px 0 0;line-height:1.55;}',
    '.vpg-results-head{font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;margin:34px 0 6px;}',
    '.vpg-results-sub{font-size:14px;color:rgba(26,26,26,0.72);margin:0 0 18px;}',
    '.vpg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(300px,100%),1fr));gap:16px;}',
    '.vpg-card{min-width:0;background:#fff;border:1.5px solid rgba(0,0,0,0.12);border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:10px;}',
    '.vpg-card.featured{border-color:#2d7d31;box-shadow:0 6px 20px rgba(45,125,49,0.12);}',
    '.vpg-card h3{font-size:18px;font-weight:900;margin:0;line-height:1.25;}',
    '.vpg-price{font-size:28px;font-weight:900;line-height:1;margin:2px 0 0;}',
    '.vpg-price span{font-size:13px;font-weight:700;color:rgba(26,26,26,0.68);margin-left:6px;}',
    '.vpg-tagline{font-size:14px;line-height:1.55;color:rgba(26,26,26,0.78);margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vpg-inc{list-style:none;margin:4px 0 0;padding:0;}',
    '.vpg-inc li{font-size:13.5px;line-height:1.5;color:#1a1a1a;padding:4px 0 4px 22px;position:relative;}',
    '.vpg-inc li::before{content:"";position:absolute;left:2px;top:9px;width:11px;height:6px;border-left:2.5px solid #2d7d31;border-bottom:2.5px solid #2d7d31;transform:rotate(-45deg);}',
    '.vpg-badges{display:flex;flex-wrap:wrap;gap:6px;}',
    '.vpg-badge{font-size:10.5px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:4px 9px;border-radius:100px;background:#EAF7EA;color:#1f5f22;}',
    '.vpg-badge.warn{background:#fff3e0;color:#7d4a00;}',
    '.vpg-note{font-size:12.5px;line-height:1.5;color:#7d4a00;background:#fff8ec;border:1px solid rgba(246,152,32,0.35);border-radius:8px;padding:9px 11px;margin:2px 0 0;}',
    '.vpg-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:8px;}',
    '.vpg-btn{appearance:none;font:inherit;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;border-radius:6px;padding:13px 18px;min-height:44px;cursor:pointer;border:1.5px solid #2d7d31;background:#2d7d31;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;}',
    '.vpg-btn:hover{background:#1f5f22;border-color:#1f5f22;}',
    '.vpg-btn.ghost{background:#fff;color:#1f5f22;}',
    '.vpg-btn.ghost:hover{background:#EAF7EA;}',
    '.vpg-btn[disabled]{opacity:.6;cursor:wait;}',
    '.vpg-form{display:none;flex-direction:column;gap:10px;margin-top:10px;padding-top:14px;border-top:1px solid rgba(0,0,0,0.09);}',
    '.vpg-form.open{display:flex;}',
    '.vpg-form label{font-size:12px;font-weight:700;color:#1a1a1a;display:flex;flex-direction:column;gap:5px;}',
    '.vpg-input{font:inherit;font-size:15px;padding:11px 12px;border:1.5px solid rgba(0,0,0,0.2);border-radius:6px;background:#fff;color:#1a1a1a;width:100%;min-width:0;}',
    'textarea.vpg-input{min-height:96px;resize:vertical;}',
    '.vpg-hp{position:absolute !important;left:-9999px !important;width:1px;height:1px;overflow:hidden;}',
    '.vpg-msg{font-size:13.5px;line-height:1.55;border-radius:8px;padding:11px 13px;margin:0;}',
    '.vpg-msg.ok{background:#EAF7EA;color:#1f5f22;border:1px solid #b8ddb9;}',
    '.vpg-msg.err{background:#fdecea;color:#8a1c12;border:1px solid #f1b8b1;}',
    '.vpg-banner{font-size:15px;line-height:1.6;border-radius:10px;padding:16px 18px;margin:0 0 24px;}',
    '.vpg-ask{margin:40px 0 0;background:#fafafa;border:1px solid rgba(0,0,0,0.09);border-radius:12px;padding:24px;}',
    '.vpg-ask h3{font-size:18px;font-weight:900;margin:0 0 4px;}',
    '.vpg-ask .vpg-form{display:flex;border-top:0;padding-top:6px;}',
    '.vpg-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:10px;}',
    '.vpg-empty{font-size:14px;color:rgba(26,26,26,0.72);}',
    '@media (max-width:480px){.vpg-card{padding:18px;}.vpg-price{font-size:24px;}.vpg-actions .vpg-btn{flex:1 1 100%;}}'
  ].join('');

  var AUDIENCES = [
    ['attendee', 'I want to attend'],
    ['local_business', 'Local business'],
    ['national_brand', 'National brand'],
    ['chef', 'Chef'],
    ['nonprofit', 'Nonprofit']
  ];
  var GOALS = [['sampling', 'Sampling'], ['visibility', 'Visibility'], ['leads', 'Leads'], ['hosting', 'Hosting guests'], ['goodwill', 'Goodwill']];
  var BUDGETS = [['under_500', 'Under $500', 50000], ['500_2500', '$500 to $2,500', 250000], ['2500_8000', '$2,500 to $8,000', 799999], ['8k_plus', '$8,000 and up', Infinity]];
  var STARTS = [['before_oct_24', 'Before Oct 24'], ['november', 'November'], ['december', 'December'], ['q1_2027', 'Q1 2027']];

  var ERRORS = {
    name_required: 'Please add your name.',
    valid_email_required: 'Please add a valid email address.',
    audience_required: 'Tell us who you are at the top of the guide first.',
    message_required: 'Please write your question.',
    event_choice_required: 'Pick which Community Night you want.',
    sold_out: 'All five Activation Partner spots are taken. Ask a question below to talk through other options.',
    meeting_requires_8k_budget: 'Meetings with Sean start at $8,000. Choose that budget above, or pick a self-serve option.',
    already_holding: 'You already have a spot on hold. Check your email for the details.',
    too_many_requests: 'We received several requests from this email in the last hour. Please try again later.',
    city_not_live: 'Checkout opens when your city goes live. Leave your email and we will tell you first.'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function token() { try { return localStorage.getItem('ve_token') || ''; } catch (e) { return ''; } }
  function member() { try { return JSON.parse(localStorage.getItem('ve_member') || 'null') || {}; } catch (e) { return {}; } }

  function injectCss() {
    if (document.getElementById('vpg-css')) return;
    var s = document.createElement('style');
    s.id = 'vpg-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function Guide(root) {
    this.root = root;
    this.source = root.getAttribute('data-source') || 'partners_page';
    this.state = { audience: root.getAttribute('data-audience') || '', city: 'south-florida', goal: '', budget: '', start: '' };
    this.data = null;
    this.uid = 0;
    this.load();
  }

  Guide.prototype.load = function () {
    var self = this;
    self.root.innerHTML = '<p class="vpg-empty">Loading the season&hellip;</p>';
    fetch(API + '?action=catalog').then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.offers) throw new Error('no offers');
      self.data = d;
      self.render();
    }).catch(function () {
      self.root.innerHTML = '<p class="vpg-msg err">The partner menu did not load. Refresh the page, or email <a href="mailto:contact@vegansexplore.com">contact@vegansexplore.com</a>.</p>';
    });
  };

  Guide.prototype.chips = function (key, legend, options, hint) {
    var s = this.state;
    var html = '<fieldset class="vpg-q"><legend>' + legend + '</legend><div class="vpg-chips">';
    options.forEach(function (o) {
      html += '<button type="button" class="vpg-chip" data-key="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (s[key] === o[0]) + '">' + o[1] + (o[3] ? ' <small>' + o[3] + '</small>' : '') + '</button>';
    });
    return html + '</div>' + (hint ? '<p class="vpg-hint">' + hint + '</p>' : '') + '</fieldset>';
  };

  Guide.prototype.render = function () {
    var s = this.state, d = this.data;
    var cityOpts = d.cities.map(function (c) { return [c.slug, c.name, null, c.status === 'live' ? '' : '(coming soon)']; });
    var html = '<div class="vpg">' + this.banner();
    html += this.chips('audience', '1. Who are you?', AUDIENCES);
    html += this.chips('city', '2. Which city?', cityOpts, 'South Florida is live. Each new city opens as its Community Manager comes on.');
    if (s.audience && s.audience !== 'attendee') {
      html += this.chips('goal', '3. What do you want most?', GOALS);
      html += this.chips('budget', '4. Budget range', BUDGETS, 'Everything under $8,000 checks out right here, no meeting needed. $8,000 and up starts with a call with Sean.');
      html += this.chips('start', '5. When do you want to start?', STARTS);
    }
    html += '<div class="vpg-results" aria-live="polite">' + this.results() + '</div>';
    html += this.askForm();
    html += '</div>';
    this.root.innerHTML = html;
    this.bind();
  };

  Guide.prototype.banner = function () {
    var q = new URLSearchParams(location.search);
    if (q.get('checkout') === 'success') return '<p class="vpg-banner vpg-msg ok" role="status"><strong>You are in.</strong> Your payment went through. Check your email for your receipt and what happens next.</p>';
    if (q.get('checkout') === 'cancelled') return '<p class="vpg-banner vpg-msg err" role="status">Checkout was cancelled, so nothing was charged and your spot is not locked yet. Pick it up again below whenever you are ready.</p>';
    return '';
  };

  Guide.prototype.matches = function () {
    var s = this.state, d = this.data;
    var budget = BUDGETS.filter(function (b) { return b[0] === s.budget; })[0];
    var max = budget ? budget[2] : null;
    var list = d.offers.filter(function (o) {
      if (o.audiences.indexOf(s.audience) === -1) return false;
      if (o.exit === 'meeting') return s.budget === '8k_plus';
      if (max !== null && o.price_cents && o.price_cents > max) return false;
      return true;
    });
    list.sort(function (a, b) {
      var ga = s.goal && a.goals.indexOf(s.goal) !== -1 ? 0 : 1, gb = s.goal && b.goals.indexOf(s.goal) !== -1 ? 0 : 1;
      return ga - gb || a.sort - b.sort;
    });
    var hiddenMeeting = s.budget !== '8k_plus' && d.offers.some(function (o) { return o.exit === 'meeting' && o.audiences.indexOf(s.audience) !== -1; });
    return { list: list, hiddenMeeting: hiddenMeeting };
  };

  Guide.prototype.results = function () {
    var s = this.state, d = this.data, self = this;
    if (!s.audience) return '<p class="vpg-hint">Answer the first question to see what fits you.</p>';
    var city = d.cities.filter(function (c) { return c.slug === s.city; })[0];
    if (city && city.status !== 'live') {
      return '<h3 class="vpg-results-head">' + esc(city.name) + ' is coming</h3>' +
        '<p class="vpg-results-sub">A Community Manager is already lined up. The city opens when the numbers show it can support the season. Leave your email and the team will reach out when it opens.</p>' +
        '<div class="vpg-grid"><div class="vpg-card featured"><h3>Get on the list</h3><p class="vpg-tagline">Tell us you are interested in ' + esc(city.name) + ' and the team will be in touch when it opens.</p>' +
        '<div class="vpg-actions"><button type="button" class="vpg-btn" data-open="notify-city">Notify me</button></div>' +
        this.form('notify-city', 'notify', null, 'Notify me') + '</div></div>';
    }
    var m = this.matches();
    var head = s.audience === 'attendee' ? 'Your way in' : 'What fits you';
    var sub = s.audience === 'attendee'
      ? 'Founding Membership is the one ask for everyone: $11 one time, and you are in.'
      : (m.list.length ? 'Options under $8,000 check out right here. $8,000 and up starts with a call with Sean.' : '');
    var html = '<h3 class="vpg-results-head">' + head + '</h3>' + (sub ? '<p class="vpg-results-sub">' + sub + '</p>' : '');
    if (!m.list.length) {
      html += '<p class="vpg-empty">Nothing on the menu matches that budget yet. Try a different range, or ask a question below.</p>';
    } else {
      html += '<div class="vpg-grid">' + m.list.map(function (o, i) { return self.card(o, i === 0); }).join('') + '</div>';
    }
    if (m.hiddenMeeting) html += '<p class="vpg-hint">Planning $8,000 or more? Choose that budget to see Activation Partner and Season Partnership options.</p>';
    return html;
  };

  Guide.prototype.card = function (o, featured) {
    var s = this.state, d = this.data;
    var badges = '';
    if (o.includes_membership) badges += '<span class="vpg-badge">Membership included</span>';
    if (o.slug === 'activation-partner') {
      var left = d.activation_spots_left;
      badges += '<span class="vpg-badge warn">' + (left > 0 ? left + ' of ' + (o.capacity || 5) + ' spots left' : 'Sold out') + '</span>';
    }
    var note = '';
    if (o.early_sign_note) {
      note = s.start === 'before_oct_24'
        ? '<p class="vpg-note"><strong>Early sign advantage:</strong> sign before Oct 24 and you get every event in the quarter.</p>'
        : '<p class="vpg-note">' + esc(o.early_sign_note) + '</p>';
    }
    var price = '<p class="vpg-price">' + esc(o.price_label) + (o.price_note ? '<span>' + esc(o.price_note) + '</span>' : '') + '</p>';
    var actions = '', forms = '';
    if (o.exit === 'checkout') {
      actions = '<button type="button" class="vpg-btn" data-open="buy-' + o.slug + '">Lock it in</button>';
      forms = this.form('buy-' + o.slug, 'checkout', o, 'Continue to secure checkout');
    } else if (o.exit === 'meeting') {
      var soldOut = o.slug === 'activation-partner' && d.activation_spots_left <= 0;
      actions = '<button type="button" class="vpg-btn" data-open="meet-' + o.slug + '">Book a meeting with Sean</button>' +
        (soldOut ? '' : '<button type="button" class="vpg-btn ghost" data-open="hold-' + o.slug + '">Reserve, 7-day hold</button>');
      forms = this.form('meet-' + o.slug, 'meeting', o, 'Request my meeting') + (soldOut ? '' : this.form('hold-' + o.slug, 'reserve', o, 'Hold my spot for 7 days'));
    } else {
      actions = '<button type="button" class="vpg-btn ghost" data-open="notify-' + o.slug + '">Notify me</button>';
      forms = this.form('notify-' + o.slug, 'notify', o, 'Notify me');
    }
    return '<article class="vpg-card' + (featured ? ' featured' : '') + '"><h3>' + esc(o.name) + '</h3>' + price +
      (badges ? '<div class="vpg-badges">' + badges + '</div>' : '') +
      '<p class="vpg-tagline">' + esc(o.tagline) + '</p>' +
      '<ul class="vpg-inc">' + o.includes.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' +
      note + '<div class="vpg-actions">' + actions + '</div>' + forms + '</article>';
  };

  Guide.prototype.form = function (id, kind, offer, submitLabel) {
    var me = member(), n = ++this.uid, business = this.state.audience !== 'attendee';
    var f = '<form class="vpg-form" id="vpg-f-' + id + '" data-kind="' + kind + '" data-offer="' + (offer ? offer.slug : '') + '" novalidate>';
    if (kind === 'reserve') f += '<p class="vpg-hint" style="margin:0;">Your spot is held for 7 days while pricing is finalized with Sean. No payment today.</p>';
    if (kind === 'meeting') f += '<p class="vpg-hint" style="margin:0;">You will get Sean\'s calendar right after this, plus a copy by email.</p>';
    f += '<div class="vpg-row"><label>Name<input class="vpg-input" name="name" autocomplete="name" required value="' + esc(me.name || '') + '"></label>' +
      '<label>Email<input class="vpg-input" name="email" type="email" autocomplete="email" required value="' + esc(me.email || '') + '"></label></div>';
    if (business) f += '<div class="vpg-row"><label>Business or organization<input class="vpg-input" name="company" autocomplete="organization"></label>' +
      '<label>Phone (optional)<input class="vpg-input" name="phone" type="tel" autocomplete="tel"></label></div>';
    if (offer && offer.event_choices && offer.event_choices.length) {
      f += '<label>Which night?<select class="vpg-input" name="event" required><option value="">Choose a Community Night</option>' +
        offer.event_choices.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>';
    }
    f += '<label class="vpg-hp" aria-hidden="true">Leave empty<input name="hp_field" tabindex="-1" autocomplete="off" id="vpg-hp-' + n + '"></label>';
    f += '<div class="vpg-status" role="status"></div><button type="submit" class="vpg-btn">' + submitLabel + '</button></form>';
    return f;
  };

  Guide.prototype.askForm = function () {
    var s = this.state, d = this.data;
    var city = d.cities.filter(function (c) { return c.slug === s.city; })[0] || {};
    var who = s.audience === 'national_brand'
      ? 'National brand questions go straight to Sean.'
      : (city.status === 'live' && city.manager_name && city.manager_routed
        ? 'Your question goes to ' + esc(city.manager_name) + ', our ' + esc(city.name) + ' Community Manager, with Sean copied.'
        : 'Your question goes to the Vegans Explore team.');
    var me = member();
    return '<section class="vpg-ask" aria-labelledby="vpg-ask-h"><h3 id="vpg-ask-h">Ask a question</h3><p class="vpg-hint" style="margin:0 0 6px;">' + who + ' We reply by email.</p>' +
      '<form class="vpg-form" data-kind="question" data-offer="" novalidate>' +
      '<div class="vpg-row"><label>Name<input class="vpg-input" name="name" autocomplete="name" required value="' + esc(me.name || '') + '"></label>' +
      '<label>Email<input class="vpg-input" name="email" type="email" autocomplete="email" required value="' + esc(me.email || '') + '"></label></div>' +
      '<label>Business or organization (optional)<input class="vpg-input" name="company" autocomplete="organization"></label>' +
      '<label>Your question<textarea class="vpg-input" name="message" required></textarea></label>' +
      '<label class="vpg-hp" aria-hidden="true">Leave empty<input name="hp_field" tabindex="-1" autocomplete="off"></label>' +
      '<div class="vpg-status" role="status"></div><button type="submit" class="vpg-btn">Send my question</button></form></section>';
  };

  Guide.prototype.bind = function () {
    var self = this, root = this.root;
    root.querySelectorAll('.vpg-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-key'), v = b.getAttribute('data-val');
        self.state[k] = self.state[k] === v && k !== 'audience' && k !== 'city' ? '' : v;
        if (k === 'audience' && v === 'attendee') { self.state.goal = ''; self.state.budget = ''; self.state.start = ''; }
        var y = window.scrollY;
        self.render();
        window.scrollTo(0, y);
        var again = root.querySelector('.vpg-chip[data-key="' + k + '"][data-val="' + v + '"]');
        if (again) again.focus({ preventScroll: true });
      });
    });
    root.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = document.getElementById('vpg-f-' + b.getAttribute('data-open'));
        if (!f) return;
        var card = b.closest('.vpg-card');
        if (card) card.querySelectorAll('.vpg-form.open').forEach(function (o) { if (o !== f) o.classList.remove('open'); });
        f.classList.toggle('open');
        if (f.classList.contains('open')) { var first = f.querySelector('input:not([name=hp_field]),select'); if (first) first.focus(); }
      });
    });
    root.querySelectorAll('form.vpg-form').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); self.submit(f); });
    });
  };

  Guide.prototype.submit = function (f) {
    var s = this.state, kind = f.getAttribute('data-kind'), offer = f.getAttribute('data-offer');
    var status = f.querySelector('.vpg-status'), btn = f.querySelector('button[type=submit]');
    var val = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
    var show = function (cls, html) { status.innerHTML = '<p class="vpg-msg ' + cls + '">' + html + '</p>'; };
    if (!s.audience) { show('err', ERRORS.audience_required); return; }
    if (!val('name')) { show('err', ERRORS.name_required); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) { show('err', ERRORS.valid_email_required); return; }
    if (f.querySelector('[name=event]') && !val('event')) { show('err', ERRORS.event_choice_required); return; }
    if (kind === 'question' && !val('message')) { show('err', ERRORS.message_required); return; }

    var answers = {};
    if (s.goal) answers.goal = s.goal;
    if (s.budget) answers.budget = s.budget;
    if (s.start) answers.start = s.start;
    if (val('event')) answers.event = val('event');
    var body = {
      name: val('name'), email: val('email'), company: val('company'), phone: val('phone'), message: val('message'),
      hp_field: val('hp_field'), audience: s.audience, city: s.city, offer: offer || undefined, answers: answers,
      source: this.source, token: token() || undefined
    };
    var action = kind === 'checkout' ? 'checkout' : 'inquire';
    if (action === 'inquire') body.kind = kind;
    btn.disabled = true;
    show('ok', kind === 'checkout' ? 'Opening secure checkout&hellip;' : 'Sending&hellip;');
    fetch(API + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        var j = res.j || {};
        if (!res.ok || j.error) { btn.disabled = false; show('err', ERRORS[j.error] || 'Something went wrong. Please try again, or email contact@vegansexplore.com.'); return; }
        if (kind === 'checkout' && j.url) { window.location.href = j.url; return; }
        var msg = {
          question: 'Got it. Your question is on its way, and we emailed you a copy.',
          notify: 'You are on the list. The team will reach out when it opens.',
          meeting: 'Request received. <a href="' + esc(j.meeting_url) + '" target="_blank" rel="noopener">Pick a time on Sean\'s calendar</a>. The link is in your email too.',
          reserve: 'Your spot is held until ' + esc(new Date(j.hold_expires_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })) + '. <a href="' + esc(j.meeting_url) + '" target="_blank" rel="noopener">Book your call with Sean</a> to finalize pricing.'
        }[kind];
        f.innerHTML = '<p class="vpg-msg ok" role="status">' + msg + '</p>';
      })
      .catch(function () { btn.disabled = false; show('err', 'Could not reach the server. Check your connection and try again.'); });
  };

  function init() {
    injectCss();
    document.querySelectorAll('[data-ve-partner-guide]').forEach(function (el) {
      if (!el.__vpg) el.__vpg = new Guide(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
