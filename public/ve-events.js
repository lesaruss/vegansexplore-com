/* ve-events.js: the events calendar, one component for /events and the dashboard's Events tab (Sean, 2026-10-26: "I want
   the events to look more like how it looks on the dashboard with just that tile, that horizontal tile, just to keep it
   simple... The goal is I want people to be able to sort by city... members to be able to submit events for
   consideration... make sure that whatever we do here applies to the dashboard as well").

   The tile is the dashboard's event row: the date on the left, the kind, the name, where and when, and one button to the
   official page. Above it: search, Where (every country an event is in, by continent), Sort by (soonest or city),
   Upcoming / Past, kinds of event, and Submit an event. Submitting is four steps, one per view (#submit/1 to #submit/4):
   a flyer to read (optional, ve-events flyer_read), the event, when and where, and the official link. Every event waits
   for the team in Depot > Events (/admin/depot/events). My events (#mine) shows what they sent and where it stands.

   Usage (after /public/ve-hubs.js and /public/ve-city-banner.js; /public/ve-auth.js for submitting):
     var cal = VEEvents.mount(el, { key: 'events', city: 'south-florida', urlState: true });
     cal.setCity('atlanta');   // the city banner's pick ('' is every city)
   Helpers the Depot shares: VEEvents.zonedToISO, VEEvents.isoToLocal, VEEvents.uploadFlyer, VEEvents.readFlyer,
   VEEvents.shrink, VEEvents.TZS, VEEvents.CATS, VEEvents.COUNTRIES, VEEvents.continentOf, VEEvents.api.
*/
(function () {
  if (window.VEEvents) return;
  var SUPABASE_URL = 'https://fwbhwfxpncrsfhttimna.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Ymh3ZnhwbmNyc2ZodHRpbW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NjAxMzksImV4cCI6MjA5MDIzNjEzOX0.9mxjK0bn5WATCbNLWrHPakD6yHUDtHFHrOaklPnWkOA';
  var FN = SUPABASE_URL + '/functions/v1/ve-events';

  var CATS = { festival: 'Festival', food: 'Food', social: 'Social', market: 'Market', meetup: 'Meetup', workshop: 'Workshop', health: 'Health', activism: 'Activism', fundraiser: 'Fundraiser', film: 'Film', general: 'General', other: 'Other' };
  // The countries people pick most, then every country an event is already in. Two-letter ISO codes; continents for Where.
  var COUNTRIES = { US: ['United States', 'North America'], CA: ['Canada', 'North America'], MX: ['Mexico', 'North America'], JM: ['Jamaica', 'North America'], BS: ['Bahamas', 'North America'], PR: ['Puerto Rico', 'North America'], CR: ['Costa Rica', 'North America'], GB: ['United Kingdom', 'Europe'], IE: ['Ireland', 'Europe'], FR: ['France', 'Europe'], DE: ['Germany', 'Europe'], ES: ['Spain', 'Europe'], IT: ['Italy', 'Europe'], NL: ['Netherlands', 'Europe'], PT: ['Portugal', 'Europe'], BE: ['Belgium', 'Europe'], CH: ['Switzerland', 'Europe'], AT: ['Austria', 'Europe'], SE: ['Sweden', 'Europe'], NO: ['Norway', 'Europe'], DK: ['Denmark', 'Europe'], PL: ['Poland', 'Europe'], GR: ['Greece', 'Europe'], AU: ['Australia', 'Oceania'], NZ: ['New Zealand', 'Oceania'], BR: ['Brazil', 'South America'], AR: ['Argentina', 'South America'], CO: ['Colombia', 'South America'], CL: ['Chile', 'South America'], IN: ['India', 'Asia'], JP: ['Japan', 'Asia'], TH: ['Thailand', 'Asia'], SG: ['Singapore', 'Asia'], KR: ['South Korea', 'Asia'], IL: ['Israel', 'Asia'], AE: ['United Arab Emirates', 'Asia'], ZA: ['South Africa', 'Africa'], NG: ['Nigeria', 'Africa'], KE: ['Kenya', 'Africa'], GH: ['Ghana', 'Africa'] };
  var CONTINENTS = ['North America', 'Europe', 'South America', 'Asia', 'Oceania', 'Africa', 'Online', 'Other'];
  var TZS = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver', 'America/Mexico_City', 'America/Jamaica', 'America/Puerto_Rico', 'America/Sao_Paulo', 'America/Bogota', 'Europe/London', 'Europe/Dublin', 'Europe/Lisbon', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Athens', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland'];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function norm(c) { c = String(c || '').toUpperCase(); return c === 'UK' ? 'GB' : c; }
  function countryName(c) { c = norm(c); return (COUNTRIES[c] && COUNTRIES[c][0]) || c; }
  function continentOf(e) {
    if (e.event_type === 'virtual' && !e.city) return 'Online';
    var c = norm(e.country);
    return e.continent || (COUNTRIES[c] && COUNTRIES[c][1]) || (c ? 'Other' : 'Online');
  }
  function catLabel(c) { return CATS[c || 'other'] || 'Event'; }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function token() { try { return localStorage.getItem('ve_token'); } catch (e) { return null; } }
  function signedIn() { return !!token() && !!(window.VEAuth ? VEAuth.isLoggedIn() : true); }
  function myTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch (e) { return 'America/New_York'; } }

  function api(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token() || '') }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { error: 'bad_response' }; }); });
  }

  // A wall-clock time in an event's time zone, to the moment it is. datetime-local gives "2026-11-07T10:00".
  function tzOffsetMs(tz, utcMs) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var p = {}; f.formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - utcMs;
  }
  function zonedToISO(local, tz) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local || '');
    if (!m) return '';
    var guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    try { var ms = guess - tzOffsetMs(tz, guess); ms = guess - tzOffsetMs(tz, ms); return new Date(ms).toISOString(); }
    catch (e) { return new Date(guess).toISOString(); }
  }
  function isoToLocal(iso, tz) {
    if (!iso) return '';
    var d = new Date(iso); if (isNaN(d)) return '';
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz || myTz(), hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day + 'T' + (p.hour === '24' ? '00' : p.hour) + ':' + p.minute;
    } catch (e) { return d.toISOString().slice(0, 16); }
  }

  // Pictures go up at 1600 px as JPEG (small enough to read, and it drops the phone's location data); a PDF goes as it is.
  function shrink(file) {
    if (file.type === 'application/pdf') return Promise.resolve(file);
    return new Promise(function (resolve) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { resolve(b ? new File([b], 'flyer.jpg', { type: 'image/jpeg' }) : file); }, 'image/jpeg', 0.88);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }
  function uploadFlyer(file) {
    return shrink(file).then(function (f) {
      if (f.size > 15 * 1024 * 1024) throw new Error('That file is over 15 MB.');
      return api({ action: 'flyer_start', type: f.type }).then(function (d) {
        if (!d.upload_url) throw new Error(d.message || 'That did not upload. Try again.');
        return fetch(d.upload_url, { method: 'PUT', headers: { 'Content-Type': f.type, 'x-upsert': 'true' }, body: f }).then(function (r) {
          if (!r.ok) throw new Error('That did not upload. Try again.');
          return d.path;
        });
      });
    });
  }
  function readFlyer(path) { return api({ action: 'flyer_read', path: path }); }

  /* ---------- styles: the dashboard's event row, and the tools above it ---------- */
  var CSS = [
    '.vev{font-family:Montserrat,sans-serif;color:#1a1a1a;}',
    '.vev-tools{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:14px;}',
    '.vev-search{position:relative;flex:1 1 260px;}',
    '.vev-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:15px;height:15px;pointer-events:none;}',
    '.vev input,.vev select,.vev textarea{font-family:inherit;font-size:14px;font-weight:600;color:#1a1a1a;border:1.5px solid rgba(0,0,0,.14);border-radius:6px;background:#fff;}',
    '.vev-search input{width:100%;padding:12px 14px 12px 40px;}',
    '.vev input:focus,.vev select:focus,.vev textarea:focus{border-color:#2d7d31;outline:none;}',
    // Dropdowns: our chevron, 16px from the edge (canon rule 15).
    ".vev select{appearance:none;-webkit-appearance:none;-moz-appearance:none;background:#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%231a1a1a' stroke-width='1.6' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 16px center;padding:12px 44px 12px 14px;cursor:pointer;}",
    '.vev select::-ms-expand{display:none;}',
    '.vev-tools select{min-width:170px;}',
    '.vev-seg{display:inline-flex;border:1.5px solid rgba(0,0,0,.14);border-radius:6px;overflow:hidden;}',
    '.vev-seg button{font-family:inherit;font-size:12px;font-weight:800;padding:12px 16px;border:0;background:#fff;color:rgba(26,26,26,.75);cursor:pointer;}',
    '.vev-seg button+button{border-left:1.5px solid rgba(0,0,0,.14);}',
    '.vev-seg button[aria-pressed="true"]{background:#2d7d31;color:#fff;}',
    '.vev-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:12px 18px;border-radius:6px;border:0;background:#F69820;color:#1a1a1a;cursor:pointer;text-decoration:none;white-space:nowrap;}',
    '.vev-btn:hover{background:#d4800f;}',
    '.vev-btn.ghost{background:#fff;color:#1f5f22;border:1.5px solid rgba(0,0,0,.18);}',
    '.vev-btn.ghost:hover{background:#f1f5f1;}',
    '.vev-btn.green{background:#2d7d31;color:#fff;}',
    '.vev-btn.green:hover{background:#1f5f22;}',
    '.vev-btn:disabled{opacity:.5;cursor:default;}',
    '.vev-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}',
    '.vev-pill{font-family:inherit;font-size:12px;font-weight:700;padding:8px 14px;border-radius:6px;border:1.5px solid rgba(0,0,0,.14);background:#fff;color:rgba(26,26,26,.75);cursor:pointer;}',
    '.vev-pill[aria-pressed="true"]{background:#2d7d31;border-color:#2d7d31;color:#fff;}',
    '.vev-count{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(26,26,26,.68);margin:0 0 12px;}',
    '.vev-group{font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#1f5f22;margin:18px 0 10px;}',
    '.vev-group:first-child{margin-top:0;}',
    // The dashboard's event row (center-console .event-row), one look everywhere.
    '.vev-row{display:flex;align-items:stretch;border:1.5px solid rgba(0,0,0,.09);border-radius:10px;overflow:hidden;margin-bottom:10px;background:#fff;transition:border-color .15s,box-shadow .15s;}',
    '.vev-row:hover{border-color:#2d7d31;box-shadow:0 3px 14px rgba(58,155,62,.07);}',
    '.vev-date{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px 20px;background:#e8f5e9;min-width:76px;text-align:center;flex-shrink:0;}',
    '.vev-day{font-size:26px;font-weight:900;letter-spacing:-.03em;line-height:1;color:#2d7d31;}',
    '.vev-mon{font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#1f5f22;margin-top:3px;}',
    '.vev-body{flex:1;min-width:0;padding:16px 22px;display:flex;flex-direction:column;justify-content:center;gap:3px;}',
    '.vev-kind{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1f5f22;margin-bottom:4px;}',
    '.vev-kind::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;}',
    '.vev-name{font-size:15px;font-weight:800;letter-spacing:-.01em;line-height:1.3;margin:0;}',
    '.vev-details{font-size:12px;font-weight:600;color:rgba(26,26,26,.75);display:flex;align-items:center;gap:4px 14px;flex-wrap:wrap;margin-top:2px;}',
    '.vev-cta{display:flex;align-items:center;padding:16px 20px;flex-shrink:0;}',
    '.vev-go{font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:11px 16px;border-radius:6px;background:#2d7d31;color:#fff;text-decoration:none;white-space:nowrap;display:inline-block;}',
    '.vev-go:hover{background:#1f5f22;}',
    '.vev-go.off{background:#eee;color:rgba(26,26,26,.6);pointer-events:none;}',
    '.vev-empty{border:1.5px dashed rgba(0,0,0,.14);border-radius:10px;padding:28px 22px;text-align:center;font-size:14px;line-height:1.6;color:rgba(26,26,26,.75);}',
    '.vev-empty a,.vev-link{color:#1f5f22;font-weight:800;}',
    '.vev-more{display:block;margin:14px auto 0;}',
    '@media (max-width:640px){.vev-row{flex-wrap:wrap;}.vev-date{min-width:64px;padding:12px 14px;}.vev-body{padding:12px 14px;}.vev-cta{width:100%;padding:0 14px 14px;}.vev-go{width:100%;text-align:center;}.vev-tools select{flex:1 1 140px;min-width:0;}.vev-seg{flex:1 1 100%;}.vev-seg button{flex:1;}}',
    // Submit an event: one step per view (Interface defaults).
    '.vev-crumb{font-size:12.5px;font-weight:700;color:rgba(26,26,26,.75);margin-bottom:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}',
    '.vev-crumb a{color:#1f5f22;font-weight:800;text-decoration:none;}',
    '.vev-steps{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;}',
    '.vev-steps span{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:7px 11px;border-radius:6px;background:#f1f3f1;color:rgba(26,26,26,.6);}',
    '.vev-steps span.on{background:#2d7d31;color:#fff;}',
    '.vev-steps span.done{background:#e8f5e9;color:#1f5f22;}',
    '.vev-form{border:1.5px solid rgba(0,0,0,.09);border-radius:12px;padding:22px;background:#fff;}',
    '.vev-form h2{font-size:20px;font-weight:900;margin:0 0 6px;}',
    '.vev-form .lead{font-size:14px;line-height:1.6;color:rgba(26,26,26,.75);margin:0 0 18px;max-width:760px;}',
    '.vev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:14px 16px;}',
    '.vev-f{display:flex;flex-direction:column;gap:6px;}',
    '.vev-f.wide{grid-column:1/-1;}',
    '.vev-f label{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1f5f22;}',
    '.vev-f input,.vev-f select,.vev-f textarea{width:100%;padding:12px 14px;}',
    '.vev-f select{padding-right:44px;}',
    '.vev-f textarea{min-height:110px;resize:vertical;line-height:1.5;}',
    '.vev-f small{font-size:12px;color:rgba(26,26,26,.68);line-height:1.45;}',
    '.vev-f.bad input,.vev-f.bad select,.vev-f.bad textarea{border-color:#b42318;}',
    '.vev-check{display:flex;gap:10px;align-items:center;font-size:14px;font-weight:600;}',
    '.vev-check input{width:18px;height:18px;}',
    '.vev-drop{border:2px dashed #9cc79e;border-radius:12px;padding:26px 18px;text-align:center;cursor:pointer;background:#fafdfa;}',
    '.vev-drop.over{background:#e8f5e9;border-color:#2d7d31;}',
    '.vev-drop b{display:block;font-size:16px;font-weight:800;margin-bottom:4px;}',
    '.vev-drop span{font-size:13px;color:rgba(26,26,26,.75);}',
    '.vev-flyer{display:flex;gap:14px;align-items:flex-start;margin-top:14px;}',
    '.vev-flyer img{width:120px;max-height:160px;object-fit:contain;border:1px solid rgba(0,0,0,.1);border-radius:8px;background:#fff;}',
    '.vev-note{font-size:13.5px;font-weight:700;color:#1f5f22;line-height:1.5;min-height:20px;}',
    '.vev-note.bad{color:#b42318;}',
    '.vev-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px;flex-wrap:wrap;}',
    '.vev-nav .of{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(26,26,26,.6);}',
    '.vev-review{display:grid;grid-template-columns:140px minmax(0,1fr);gap:8px 14px;font-size:14px;line-height:1.5;margin-top:16px;}',
    '.vev-review dt{font-weight:800;color:rgba(26,26,26,.68);font-size:12px;text-transform:uppercase;letter-spacing:.06em;padding-top:2px;}',
    '.vev-review dd{margin:0;word-break:break-word;}',
    '.vev-tag{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:6px;white-space:nowrap;}',
    '.vev-tag.pending{background:#fff4e2;color:#6b3f00;}',
    '.vev-tag.approved{background:#e8f5e9;color:#1f5f22;}',
    '.vev-tag.rejected{background:#fbeeec;color:#8a1c12;}',
    '.vev-mine{display:flex;flex-direction:column;gap:8px;}',
    '.vev-mine div{display:flex;gap:12px;align-items:center;justify-content:space-between;border:1.5px solid rgba(0,0,0,.09);border-radius:10px;padding:12px 14px;flex-wrap:wrap;}',
    '.vev-mine b{font-size:14px;}',
    '.vev-mine small{display:block;font-size:12px;color:rgba(26,26,26,.68);}'
  ].join('');
  function injectCss() {
    if (document.getElementById('vev-css')) return;
    var s = document.createElement('style'); s.id = 'vev-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------- the tile ---------- */
  // A time not announced yet (events.time_set false) shows the day only.
  function when(e) {
    var tz = e.timezone || undefined, d = new Date(e.starts_at), o = e.time_set === false ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
    var tba = e.time_set === false ? ' \u00b7 Time to be announced' : '';
    try { o.timeZone = tz; return d.toLocaleString('en-US', o) + tba; } catch (x) { delete o.timeZone; return d.toLocaleString('en-US', o) + tba; }
  }
  function dayMon(e) {
    var d = new Date(e.starts_at), tz = e.timezone || undefined;
    try { return [d.toLocaleString('en-US', { day: 'numeric', timeZone: tz }), d.toLocaleString('en-US', { month: 'short', timeZone: tz })]; }
    catch (x) { return [d.getDate(), d.toLocaleString('en-US', { month: 'short' })]; }
  }
  function place(e) {
    if (e.event_type === 'virtual' && !e.city) return 'Online';
    var cc = norm(e.country);
    return [e.location_name, [e.city, cc === 'US' ? e.state : (e.state && cc !== 'GB' ? e.state : '')].filter(Boolean).join(', '), cc && cc !== 'US' ? countryName(cc) : ''].filter(Boolean).join(' · ');
  }
  function tile(e, past) {
    var dm = dayMon(e), link = safeUrl(e.ticket_url) || safeUrl(e.virtual_url);
    var cta = past ? (safeUrl(e.recording_url) ? '<a class="vev-go" href="' + esc(e.recording_url) + '" target="_blank" rel="noopener noreferrer">Watch</a>' : '')
      : (link ? '<a class="vev-go" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" aria-label="Tickets and details for ' + esc(e.title) + '">Tickets &amp; info</a>' : '<span class="vev-go off">Details soon</span>');
    return '<article class="vev-row" aria-label="' + esc(e.title) + '">' +
      '<div class="vev-date" aria-hidden="true"><span class="vev-day">' + esc(dm[0]) + '</span><span class="vev-mon">' + esc(dm[1]) + '</span></div>' +
      '<div class="vev-body">' +
        '<p class="vev-kind">' + esc(catLabel(e.category)) + (e.is_featured && !past ? ' · Featured' : '') + '</p>' +
        '<h3 class="vev-name">' + esc(e.title) + '</h3>' +
        '<div class="vev-details"><span>' + esc(place(e)) + '</span><span>' + esc(when(e)) + '</span>' + (e.rsvp_count && !past ? '<span>' + e.rsvp_count + ' going</span>' : '') + '</div>' +
      '</div>' +
      (cta ? '<div class="vev-cta">' + cta + '</div>' : '') +
    '</article>';
  }

  /* ---------- the component ---------- */
  function mount(target, opts) {
    opts = opts || {};
    injectCss();
    var el = typeof target === 'string' ? document.getElementById(target) : target;
    el.classList.add('vev');
    var qs = new URLSearchParams(location.search);
    var useUrl = opts.urlState !== false;
    var st = {
      city: opts.city || '', q: useUrl ? qs.get('q') || '' : '', where: useUrl ? qs.get('where') || '' : '',
      cat: useUrl ? qs.get('cat') || '' : '', when: useUrl && qs.get('when') === 'past' ? 'past' : 'upcoming',
      sort: useUrl && qs.get('sort') === 'city' ? 'city' : 'date', shown: 40
    };
    var all = null, draft = null, flyer = null, mine = null;

    function syncUrl() {
      if (!useUrl) return;
      var q = new URLSearchParams(location.search);
      ['q', 'where', 'cat'].forEach(function (k) { if (st[k]) q.set(k, st[k]); else q.delete(k); });
      if (st.when === 'past') q.set('when', 'past'); else q.delete('when');
      if (st.sort === 'city') q.set('sort', 'city'); else q.delete('sort');
      var s = q.toString();
      history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash);
    }
    function inCity(e) {
      if (!st.city || !window.VECityBanner) return true;
      return VECityBanner.matches(VECityBanner.hubBySlug(st.city), { city: e.city, state: e.state });
    }
    function filtered(skipCat) {
      var now = Date.now(), words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      var list = (all || []).filter(function (e) {
        var t = new Date(e.ends_at || e.starts_at).getTime();
        if (st.when === 'past' ? t >= now : t < now) return false;
        if (!inCity(e)) return false;
        if (st.where) {
          if (st.where.indexOf('c:') === 0 ? continentOf(e) !== st.where.slice(2) : norm(e.country) !== st.where) return false;
        }
        if (!skipCat && st.cat && (e.category || 'other') !== st.cat) return false;
        if (words.length) {
          var hay = [e.title, e.description, e.location_name, e.city, e.state, countryName(e.country), catLabel(e.category)].join(' ').toLowerCase();
          for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
        }
        return true;
      });
      list.sort(function (a, b) {
        if (st.sort === 'city') {
          var c = String(a.city || 'zzz Online').localeCompare(String(b.city || 'zzz Online'));
          if (c) return c;
        }
        var d = new Date(a.starts_at) - new Date(b.starts_at);
        return st.when === 'past' ? -d : d;
      });
      return list;
    }

    function whereOptions() {
      var seen = {};
      (all || []).forEach(function (e) { var c = norm(e.country); if (c) seen[c] = continentOf(e); });
      var byCont = {};
      Object.keys(seen).forEach(function (c) { (byCont[seen[c]] = byCont[seen[c]] || []).push(c); });
      var html = '<option value="">Anywhere</option>';
      CONTINENTS.forEach(function (ct) {
        if (!byCont[ct] && !(ct === 'Online' && (all || []).some(function (e) { return continentOf(e) === 'Online'; }))) return;
        html += '<optgroup label="' + esc(ct) + '"><option value="c:' + esc(ct) + '">All of ' + esc(ct) + '</option>' +
          (byCont[ct] || []).sort(function (a, b) { return countryName(a).localeCompare(countryName(b)); }).map(function (c) { return '<option value="' + esc(c) + '">' + esc(countryName(c)) + '</option>'; }).join('') + '</optgroup>';
      });
      return html;
    }

    function drawList() {
      el.innerHTML =
        '<div class="vev-tools">' +
          '<label class="vev-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="#666" stroke-width="2"/><path d="M20 20l-4-4" stroke="#666" stroke-width="2" stroke-linecap="round"/></svg>' +
            '<input type="search" data-v="q" placeholder="Search events, places, cities" aria-label="Search events" autocomplete="off" value="' + esc(st.q) + '"></label>' +
          '<select data-v="where" aria-label="Where">' + whereOptions() + '</select>' +
          '<select data-v="sort" aria-label="Sort by"><option value="date">Sort: Soonest</option><option value="city">Sort: City, A to Z</option></select>' +
          '<div class="vev-seg" role="group" aria-label="When"><button type="button" data-when="upcoming" aria-pressed="' + (st.when === 'upcoming') + '">Upcoming</button><button type="button" data-when="past" aria-pressed="' + (st.when === 'past') + '">Past</button></div>' +
          // Submit an event is the city banner's green button only (Sean, 2026-10-27: "we only need one").
        '</div>' +
        '<div class="vev-pills" data-v="pills" role="group" aria-label="Kind of event"></div>' +
        '<p class="vev-count" data-v="count" aria-live="polite">' + (all ? '' : 'Loading events…') + '</p>' +
        '<div data-v="list"></div>';
      var sel = el.querySelector('[data-v="where"]'); sel.value = st.where; if (sel.value !== st.where) { st.where = ''; sel.value = ''; }
      el.querySelector('[data-v="sort"]').value = st.sort;
      var timer;
      el.querySelector('[data-v="q"]').addEventListener('input', function (ev) { clearTimeout(timer); timer = setTimeout(function () { st.q = ev.target.value.trim(); st.shown = 40; syncUrl(); drawRows(); }, 150); });
      sel.addEventListener('change', function () { st.where = sel.value; st.shown = 40; syncUrl(); drawRows(); });
      el.querySelector('[data-v="sort"]').addEventListener('change', function (ev) { st.sort = ev.target.value; syncUrl(); drawRows(); });
      el.querySelectorAll('[data-when]').forEach(function (b) {
        b.addEventListener('click', function () {
          st.when = b.getAttribute('data-when'); st.shown = 40;
          el.querySelectorAll('[data-when]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          syncUrl(); drawRows();
        });
      });
      el.querySelector('[data-v="pills"]').addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-cat]'); if (!b) return;
        st.cat = b.getAttribute('data-cat'); st.shown = 40; syncUrl(); drawRows();
      });
      el.querySelector('[data-go="submit"]').addEventListener('click', function () { go('#submit/1'); });
      drawRows();
    }

    function drawRows() {
      if (!all) return;
      var pills = el.querySelector('[data-v="pills"]'), cats = {};
      filtered(true).forEach(function (e) { cats[e.category || 'other'] = 1; });
      var keys = Object.keys(cats).sort(function (a, b) { return catLabel(a).localeCompare(catLabel(b)); });
      if (st.cat && keys.indexOf(st.cat) < 0) keys.push(st.cat);
      pills.innerHTML = keys.length < 2 && !st.cat ? '' : ['<button type="button" class="vev-pill" data-cat="" aria-pressed="' + (!st.cat) + '">All kinds</button>'].concat(keys.map(function (k) {
        return '<button type="button" class="vev-pill" data-cat="' + esc(k) + '" aria-pressed="' + (st.cat === k) + '">' + esc(catLabel(k)) + '</button>';
      })).join('');
      var list = filtered(false), past = st.when === 'past';
      var hub = st.city && window.VECityBanner ? VECityBanner.hubBySlug(st.city) : null;
      var wl = st.where ? (st.where.indexOf('c:') === 0 ? st.where.slice(2) : countryName(st.where)) : '';
      var whereTxt = hub ? ' in ' + hub.name : (wl ? ' in ' + wl : '');
      el.querySelector('[data-v="count"]').textContent = list.length + (past ? ' past' : ' upcoming') + (list.length === 1 ? ' event' : ' events') + whereTxt;
      var box = el.querySelector('[data-v="list"]');
      if (!list.length) {
        box.innerHTML = '<div class="vev-empty">' + (past ? 'No past events here yet.' : 'No upcoming events' + esc(whereTxt) + ' yet.') +
          ' Know of one? <a href="#submit/1" data-go="submit">Submit an event</a>' + (st.q || st.cat || st.where ? ', or <a href="#" data-go="clear">see every event</a>' : '') + '.</div>';
      } else {
        var html = '', lastGroup = null;
        list.slice(0, st.shown).forEach(function (e) {
          if (st.sort === 'city') {
            var g = e.city ? e.city + (norm(e.country) === 'US' && e.state ? ', ' + e.state : (norm(e.country) && norm(e.country) !== 'US' ? ', ' + countryName(e.country) : '')) : 'Online';
            if (g !== lastGroup) { html += '<p class="vev-group">' + esc(g) + '</p>'; lastGroup = g; }
          }
          html += tile(e, past);
        });
        if (list.length > st.shown) html += '<button type="button" class="vev-btn ghost vev-more" data-go="more">Show more (' + (list.length - st.shown) + ')</button>';
        box.innerHTML = html;
      }
      box.querySelectorAll('[data-go]').forEach(function (a) {
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var k = a.getAttribute('data-go');
          if (k === 'submit') go('#submit/1');
          else if (k === 'more') { st.shown += 40; drawRows(); }
          else { st.q = ''; st.cat = ''; st.where = ''; syncUrl(); drawList(); }
        });
      });
    }

    function load() {
      return fetch(SUPABASE_URL + '/rest/v1/events?select=id,title,description,starts_at,ends_at,timezone,location_name,city,state,country,continent,category,event_type,ticket_url,virtual_url,is_featured,rsvp_count,recording_url,time_set&status=eq.approved&order=starts_at.asc&limit=2000', {
        headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY }
      }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
        all = (rows || []).filter(function (e) { return e.starts_at; });
      }).catch(function () { all = []; });
    }

    /* ---------- Submit an event ---------- */
    var STEPS = ['A flyer', 'The event', 'When and where', 'The official link'];
    function go(hash) {
      if (location.hash !== hash) history.pushState(history.state, '', location.pathname + location.search + hash);
      route();
    }
    function blank() {
      var hub = st.city && window.VECityBanner ? VECityBanner.hubBySlug(st.city) : null;
      return { title: '', category: '', description: '', start: '', end: '', timezone: (hub && hub.tz) || myTz(), online: false, location_name: '', address: '', city: '', state: '', country: hub ? (hub.slug === 'london' ? 'GB' : 'US') : '', ticket_url: '' };
    }
    function field(id, label, input, hint, wide) {
      return '<div class="vev-f' + (wide ? ' wide' : '') + '" data-f="' + id + '"><label for="vev-' + id + '">' + label + '</label>' + input + (hint ? '<small>' + hint + '</small>' : '') + '</div>';
    }
    function inp(id, val, type, extra) { return '<input id="vev-' + id + '" type="' + (type || 'text') + '" value="' + esc(val) + '"' + (extra || '') + '>'; }
    function countrySelect(val) {
      var keys = Object.keys(COUNTRIES).sort(function (a, b) { return COUNTRIES[a][0].localeCompare(COUNTRIES[b][0]); });
      if (val && !COUNTRIES[val]) keys.unshift(val);
      return '<select id="vev-country"><option value="">Choose a country</option>' + keys.map(function (k) { return '<option value="' + k + '"' + (k === val ? ' selected' : '') + '>' + esc(countryName(k)) + '</option>'; }).join('') + '</select>';
    }
    function tzSelect(val) {
      var list = TZS.slice(); if (val && list.indexOf(val) < 0) list.unshift(val);
      return '<select id="vev-timezone">' + list.map(function (z) { return '<option value="' + esc(z) + '"' + (z === val ? ' selected' : '') + '>' + esc(z.replace(/_/g, ' ').replace('/', ': ')) + '</option>'; }).join('') + '</select>';
    }
    function collect() {
      var v = function (id) { var x = el.querySelector('#vev-' + id); return x ? (x.type === 'checkbox' ? x.checked : x.value.trim()) : undefined; };
      ['title', 'category', 'description', 'start', 'end', 'timezone', 'location_name', 'address', 'city', 'state', 'country', 'ticket_url'].forEach(function (k) { var x = v(k); if (x !== undefined) draft[k] = x; });
      var o = v('online'); if (o !== undefined) draft.online = o;
    }
    function check(step) {
      var bad = [];
      if (step === 2 && !draft.title) bad.push('title');
      if (step === 3) {
        if (!draft.start) bad.push('start');
        if (draft.start && zonedToISO(draft.start, draft.timezone) && new Date(zonedToISO(draft.start, draft.timezone)) < new Date(Date.now() - 864e5)) bad.push('start');
        if (draft.end && draft.start && draft.end < draft.start) bad.push('end');
        if (!draft.online && !draft.city) bad.push('city');
        if (!draft.online && !draft.country) bad.push('country');
      }
      if (step === 4 && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(draft.ticket_url || '')) bad.push('ticket_url');
      el.querySelectorAll('.vev-f').forEach(function (f) { f.classList.toggle('bad', bad.indexOf(f.getAttribute('data-f')) > -1); });
      return bad;
    }
    function drawSubmit(step) {
      if (!draft) draft = blank();
      var back = opts.listLabel || 'Events';
      var head = '<nav class="vev-crumb" aria-label="Breadcrumb"><a href="#" data-go="list">' + esc(back) + '</a><span>/</span><span>Submit an event</span>' +
        (signedIn() ? '<span>·</span><a href="#mine" data-go="mine">My events</a>' : '') + '</nav>' +
        '<div class="vev-steps">' + STEPS.map(function (s, i) { return '<span class="' + (i + 1 === step ? 'on' : i + 1 < step ? 'done' : '') + '">' + (i + 1) + '. ' + esc(s) + '</span>'; }).join('') + '</div>';
      var body = '';
      if (step === 1) {
        body = '<h2>Have a flyer?</h2><p class="lead">Drop the event\'s flyer or Instagram banner here (a picture or a PDF) and we will read it and fill in the next steps for you. No flyer? Press Next and type it in.</p>' +
          '<div class="vev-drop" tabindex="0" role="button" data-v="drop"><b>Drop the flyer here</b><span>or click to choose a picture or a PDF</span></div>' +
          '<input type="file" accept="image/*,application/pdf" data-v="file" hidden>' +
          '<div class="vev-flyer" data-v="flyer"' + (flyer ? '' : ' hidden') + '>' + (flyer && flyer.preview ? '<img src="' + esc(flyer.preview) + '" alt="Your flyer">' : '') + '<p class="vev-note" data-v="fnote">' + esc(flyer && flyer.note || '') + '</p></div>';
      } else if (step === 2) {
        body = '<h2>The event</h2><p class="lead">What it is, in a few words. We check every event before it goes on the calendar.</p><div class="vev-grid">' +
          field('title', 'Event name', inp('title', draft.title, 'text', ' maxlength="200" autocomplete="off"'), '', true) +
          field('category', 'Kind of event', '<select id="vev-category"><option value="">Choose one</option>' + Object.keys(CATS).map(function (k) { return '<option value="' + k + '"' + (k === draft.category ? ' selected' : '') + '>' + CATS[k] + '</option>'; }).join('') + '</select>') +
          field('description', 'About it', '<textarea id="vev-description" maxlength="2000">' + esc(draft.description) + '</textarea>', 'Two or three sentences: what happens there and who it is for.', true) +
          '</div>';
      } else if (step === 3) {
        body = '<h2>When and where</h2><p class="lead">The day and time it starts, in the event\'s own time zone, and where it is.</p><div class="vev-grid">' +
          field('start', 'Starts', inp('start', draft.start, 'datetime-local')) +
          field('end', 'Ends (if you know)', inp('end', draft.end, 'datetime-local')) +
          field('timezone', 'Time zone', tzSelect(draft.timezone)) +
          '<div class="vev-f wide"><label class="vev-check"><input type="checkbox" id="vev-online"' + (draft.online ? ' checked' : '') + '> It is online only</label></div>' +
          field('location_name', 'Venue', inp('location_name', draft.location_name, 'text', ' maxlength="200"')) +
          field('address', 'Street address', inp('address', draft.address, 'text', ' maxlength="300"')) +
          field('city', 'City', inp('city', draft.city, 'text', ' maxlength="120"')) +
          field('state', 'State or region', inp('state', draft.state, 'text', ' maxlength="60"'), 'Two letters in the US (FL, NY).') +
          field('country', 'Country', countrySelect(draft.country)) +
          '</div>';
      } else {
        body = '<h2>The official link</h2><p class="lead">Where to get tickets or read more: the organizer\'s own page or its ticket page. We need it to list the event.</p><div class="vev-grid">' +
          field('ticket_url', 'Official link', inp('ticket_url', draft.ticket_url, 'url', ' placeholder="https://" maxlength="1000"'), 'Starts with https://. An Eventbrite page, their website, or their Instagram post.', true) +
          '</div><dl class="vev-review">' +
          '<dt>Event</dt><dd>' + esc(draft.title || '') + (draft.category ? ' (' + esc(CATS[draft.category]) + ')' : '') + '</dd>' +
          '<dt>When</dt><dd>' + esc(draft.start ? when({ starts_at: zonedToISO(draft.start, draft.timezone), timezone: draft.timezone }) : '') + '</dd>' +
          '<dt>Where</dt><dd>' + esc(draft.online ? 'Online' : [draft.location_name, draft.city, draft.state, countryName(draft.country)].filter(Boolean).join(', ')) + '</dd>' +
          '</dl>' + (signedIn() ? '' : '<p class="lead" style="margin-top:16px">You will sign in (or make a free account) when you send it, so we can let you know when it is live.</p>');
      }
      el.innerHTML = head + '<div class="vev-form">' + body +
        '<p class="vev-note bad" data-v="err" role="alert"></p>' +
        '<div class="vev-nav">' + (step > 1 ? '<button type="button" class="vev-btn ghost" data-go="back">Back</button>' : '<button type="button" class="vev-btn ghost" data-go="list">Cancel</button>') +
        '<span class="of">Step ' + step + ' of 4</span>' +
        (step < 4 ? '<button type="button" class="vev-btn green" data-go="next">Next</button>' : '<button type="button" class="vev-btn" data-go="send">Send for approval</button>') + '</div></div>';

      el.querySelectorAll('[data-go]').forEach(function (b) {
        b.addEventListener('click', function (ev) {
          ev.preventDefault();
          var k = b.getAttribute('data-go');
          if (k === 'list') { go(''); return; }
          if (k === 'mine') { go('#mine'); return; }
          collect();
          if (k === 'back') { go('#submit/' + (step - 1)); return; }
          var bad = check(step);
          if (bad.length) { el.querySelector('[data-v="err"]').textContent = step === 4 ? 'Add the official link (starting with https://).' : 'Fill in the fields marked in red.'; return; }
          if (k === 'next') { go('#submit/' + (step + 1)); return; }
          send(b);
        });
      });
      var online = el.querySelector('#vev-online');
      if (online) {
        var tog = function () { ['location_name', 'address', 'city', 'state', 'country'].forEach(function (k) { var f = el.querySelector('[data-f="' + k + '"]'); if (f) f.hidden = online.checked; }); };
        online.addEventListener('change', tog); tog();
      }
      if (step === 1) wireDrop();
      var first = el.querySelector('.vev-form input, .vev-form select, .vev-form textarea');
      if (first && step > 1) try { first.focus({ preventScroll: true }); } catch (e) {}
    }

    function needSignIn(then) {
      if (signedIn()) { then(); return; }
      var back = location.pathname + location.search + location.hash;
      if (window.VEAuth && VEAuth.showAuthModal) VEAuth.showAuthModal('Sign in, or make a free account, to send an event.', function () { then(); });
      else location.href = '/login?next=' + encodeURIComponent(back);
    }

    function wireDrop() {
      var drop = el.querySelector('[data-v="drop"]'), file = el.querySelector('[data-v="file"]');
      var note = function (t, bad) { var box = el.querySelector('[data-v="flyer"]'); box.hidden = false; var n = el.querySelector('[data-v="fnote"]'); n.textContent = t; n.classList.toggle('bad', !!bad); };
      function take(f) {
        if (!f) return;
        if (!/^image\/|^application\/pdf$/.test(f.type)) { note('Send a picture or a PDF.', true); return; }
        needSignIn(function () {
          var preview = f.type === 'application/pdf' ? '' : URL.createObjectURL(f);
          flyer = { preview: preview, note: 'Reading your flyer…' };
          var box = el.querySelector('[data-v="flyer"]');
          box.innerHTML = (preview ? '<img src="' + esc(preview) + '" alt="Your flyer">' : '') + '<p class="vev-note" data-v="fnote">Reading your flyer…</p>'; box.hidden = false;
          uploadFlyer(f).then(function (path) {
            flyer.path = path;
            return readFlyer(path);
          }).then(function (d) {
            if (d.error) { flyer.note = d.message || 'We could not read that one. Press Next and type it in.'; note(flyer.note, true); return; }
            if (!d.event) { flyer.note = d.note || 'That does not look like an event flyer.'; note(flyer.note, true); return; }
            var x = d.event, tz = x.timezone || draft.timezone;
            Object.assign(draft, {
              title: x.title || draft.title, category: x.category || draft.category, description: x.description || draft.description,
              timezone: tz, start: x.starts_at ? isoToLocal(x.starts_at, tz) : draft.start, end: x.ends_at ? isoToLocal(x.ends_at, tz) : draft.end,
              online: x.event_type === 'virtual', location_name: x.location_name || draft.location_name, address: x.address || draft.address,
              city: x.city || draft.city, state: x.state || draft.state, country: x.country || draft.country, ticket_url: x.ticket_url || draft.ticket_url
            });
            flyer.note = 'Read it. Check each step and fix anything we got wrong.' + (d.note ? ' ' + d.note : '') + (d.links && !x.ticket_url ? ' Links on the flyer: ' + d.links + '.' : '');
            note(flyer.note);
          }).catch(function (e) { flyer.note = (e && e.message) || 'That did not upload. Try again.'; note(flyer.note, true); });
        });
      }
      drop.addEventListener('click', function () { file.click(); });
      drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
      file.addEventListener('change', function () { take(file.files[0]); file.value = ''; });
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); take(e.dataTransfer.files[0]); });
    }

    function send(btn) {
      needSignIn(function () {
        btn.disabled = true; btn.textContent = 'Sending…';
        var ev = {
          title: draft.title, category: draft.category, description: draft.description,
          starts_at: zonedToISO(draft.start, draft.timezone), ends_at: draft.end ? zonedToISO(draft.end, draft.timezone) : '',
          timezone: draft.timezone, event_type: draft.online ? 'virtual' : 'in_person', ticket_url: draft.ticket_url
        };
        if (!draft.online) Object.assign(ev, { location_name: draft.location_name, address: draft.address, city: draft.city, state: draft.state, country: draft.country, continent: (COUNTRIES[draft.country] || [])[1] || '' });
        api({ action: 'submit', event: ev, flyer_path: flyer && flyer.path }).then(function (d) {
          if (!d.ok) {
            btn.disabled = false; btn.textContent = 'Send for approval';
            el.querySelector('[data-v="err"]').textContent = d.message || 'That did not send. Try again.';
            return;
          }
          draft = null; flyer = null; mine = null;
          go('#mine/sent');
        }).catch(function () { btn.disabled = false; btn.textContent = 'Send for approval'; el.querySelector('[data-v="err"]').textContent = 'That did not send. Try again.'; });
      });
    }

    function drawMine(sent) {
      var head = '<nav class="vev-crumb" aria-label="Breadcrumb"><a href="#" data-go="list">' + esc(opts.listLabel || 'Events') + '</a><span>/</span><span>My events</span></nav>';
      if (!signedIn()) { el.innerHTML = head + '<div class="vev-form"><h2>My events</h2><p class="lead">Sign in to see the events you sent.</p><button type="button" class="vev-btn green" data-go="signin">Sign in</button></div>'; }
      else {
        el.innerHTML = head + '<div class="vev-form">' + (sent ? '<h2>Thanks, it is in</h2><p class="lead">We check every event before it goes on the calendar, usually within a day or two. We will email you when it is live.</p>' : '<h2>My events</h2><p class="lead">Every event you sent, and where it stands.</p>') +
          '<div class="vev-mine" data-v="mine"><p class="vev-count">Loading…</p></div>' +
          '<div class="vev-nav"><button type="button" class="vev-btn ghost" data-go="list">See the events</button><button type="button" class="vev-btn" data-go="submit">+ Submit another</button></div></div>';
        (mine ? Promise.resolve({ events: mine }) : api({ action: 'mine' })).then(function (d) {
          mine = d.events || [];
          var box = el.querySelector('[data-v="mine"]'); if (!box) return;
          var label = { pending: 'Waiting for approval', approved: 'Live', rejected: 'Not approved', cancelled: 'Cancelled' };
          box.innerHTML = mine.length ? mine.map(function (e) {
            return '<div><span><b>' + esc(e.title) + '</b><small>' + esc(when(e)) + (e.city ? ' · ' + esc(e.city) : '') + (e.status === 'rejected' && e.rejection_reason ? ' · ' + esc(e.rejection_reason) : '') + '</small></span><span class="vev-tag ' + esc(e.status) + '">' + esc(label[e.status] || e.status) + '</span></div>';
          }).join('') : '<p class="vev-count">Nothing yet.</p>';
        });
      }
      el.querySelectorAll('[data-go]').forEach(function (b) {
        b.addEventListener('click', function (ev) {
          ev.preventDefault();
          var k = b.getAttribute('data-go');
          if (k === 'list') go(''); else if (k === 'submit') go('#submit/1');
          else needSignIn(function () { drawMine(false); });
        });
      });
    }

    function route() {
      var h = location.hash || '', m = /^#submit\/([1-4])$/.exec(h);
      if (m) { var s = +m[1]; if (s > 1 && !draft) { go('#submit/1'); return; } drawSubmit(s); if (opts.onView) opts.onView('submit'); }
      else if (/^#mine/.test(h)) { drawMine(h === '#mine/sent'); if (opts.onView) opts.onView('mine'); }
      else { drawList(); if (opts.onView) opts.onView('list'); }
    }
    // The first click into the calendar folds the page's banner, as on the Directory.
    el.addEventListener('click', function (ev) { if (opts.onInteract && ev.target.closest('button, select, input')) opts.onInteract(); });
    window.addEventListener('popstate', route);
    window.addEventListener('hashchange', route);

    route();
    load().then(function () { if (!/^#(submit|mine)/.test(location.hash)) { drawList(); } });

    return {
      setCity: function (slug) { st.city = slug || ''; st.shown = 40; if (!/^#(submit|mine)/.test(location.hash)) drawRows(); },
      submit: function () { go('#submit/1'); }, // the city banner's Submit an event button (2026-10-26)
      reload: function () { return load().then(drawRows); }
    };
  }

  window.VEEvents = {
    mount: mount, api: api, zonedToISO: zonedToISO, isoToLocal: isoToLocal, uploadFlyer: uploadFlyer, readFlyer: readFlyer, shrink: shrink,
    TZS: TZS, CATS: CATS, COUNTRIES: COUNTRIES, continentOf: continentOf, countryName: countryName, tile: tile, injectCss: injectCss, esc: esc
  };
})();
