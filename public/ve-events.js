/* ve-events.js: the events calendar, one component for /events and the dashboard's Events tab (Sean, 2026-10-26: "I want
   the events to look more like how it looks on the dashboard with just that tile, that horizontal tile, just to keep it
   simple... The goal is I want people to be able to sort by city... members to be able to submit events for
   consideration... make sure that whatever we do here applies to the dashboard as well").

   The tile is the dashboard's event row: the date on the left, the kind, the name, where and when, and one button to the
   official page. Above it: search, Where (every country an event is in, by continent), Sort by (soonest or city),
   Upcoming / Past, kinds of event, and Submit an event. Submitting is four steps, one per view (#submit/1 to #submit/4;
   Sean, 2026-10-28: "I would just like to be able to choose how I want to input the event... then once you pull the
   information, you can ask clarifying questions... or... I'm just confirming it"): How to add it (drop in a flyer, paste a
   link, or type it in; ve-events flyer_read and link_read), the event, when and where, and Check and send: what we found,
   a question for anything missing, the official link and their role (host, promoter or going). A read flyer or link goes
   straight to Check and send. Every event waits for the team in Depot > Events (/admin/depot/events). A host or promoter
   then lands on Promote your event (#promote/<id>): three packages and six options, each I'm interested (ve-events
   promote_interest), no prices. My events (#mine) shows what they sent and where it stands.

   The event window (Sean, 2026-10-28: "go ahead with phase 2"; playbook ve-member-profiles-partner-windows). Every event has
   its own view (#event/<id>, the tile's name): the details and, for a Passport holder, I'm going, with an unticked "Let
   <organizer> message me about this event" when it has an organizer (25 points the first time). Its organizer opens Guests
   and messages (#guests/<id>): how many are going, the shown profile parts of those who said yes, and messages through us
   (3 per event a day apart, until 7 days after). A guest's email link opens the message (#message/<token>) with Stop messages
   from <organizer> and Report this message. My events adds the events they organize, the ones they are going to (with the
   yes to turn off) and the organizers they stopped. Server: ve-events (event, rsvp, guests, message_send, msg_*).

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
    '.vev-mine small{display:block;font-size:12px;color:rgba(26,26,26,.68);}',
    // How to add it, the role and Promote your event: choice cards (Sean, 2026-10-28).
    '.vev-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(230px,100%),1fr));gap:12px;margin:4px 0 16px;}',
    '.vev-card{display:flex;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;font-family:inherit;border:1.5px solid rgba(0,0,0,.14);border-radius:10px;padding:16px;background:#fff;color:#1a1a1a;cursor:pointer;}',
    '.vev-card:hover{border-color:#2d7d31;}',
    '.vev-card[aria-pressed="true"]{border-color:#2d7d31;background:#e8f5e9;box-shadow:inset 0 0 0 1px #2d7d31;}',
    '.vev-card b{font-size:15px;font-weight:800;}',
    '.vev-card span{font-size:13px;line-height:1.5;color:rgba(26,26,26,.75);}',
    '.vev-card ul{margin:2px 0 0 18px;padding:0;font-size:13px;line-height:1.55;color:rgba(26,26,26,.75);}',
    '.vev-card svg{width:26px;height:26px;color:#2d7d31;}',
    '.vev-sub{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#1f5f22;margin:20px 0 10px;}',
    '.vev-ask{border:1.5px solid #f3c27a;background:#fff8ec;border-radius:10px;padding:16px;margin-bottom:16px;}',
    '.vev-ask h3{font-size:15px;font-weight:800;margin:0 0 4px;}',
    '.vev-ask p{font-size:13px;margin:0 0 12px;color:rgba(26,26,26,.75);}',
    '.vev-review dd button{font-family:inherit;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f5f22;background:none;border:0;padding:0 0 0 8px;cursor:pointer;}',
    '.vev-banner{border-radius:10px;background:#e8f5e9;color:#1f5f22;font-size:14px;font-weight:700;line-height:1.55;padding:14px 16px;margin-bottom:18px;}',
    '.vev-mine .vev-promote{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1f5f22;text-decoration:none;margin-right:10px;}',
    // The event window (2026-10-28): an event's own view, Guests and messages, a guest's message.
    '.vev-name a{color:inherit;text-decoration:none;}',
    '.vev-name a:hover{text-decoration:underline;}',
    '.vev-ev{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:18px;align-items:start;}',
    '@media (max-width:900px){.vev-ev{grid-template-columns:1fr;}}',
    '.vev-ev .vev-desc{font-size:14.5px;line-height:1.65;color:rgba(26,26,26,.85);white-space:pre-line;margin:0 0 16px;}',
    '.vev-facts{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600;margin:0 0 16px;}',
    '.vev-facts span{color:rgba(26,26,26,.75);}',
    '.vev-rsvp h3{font-size:13px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#1f5f22;margin:0 0 8px;}',
    '.vev-rsvp p{font-size:13.5px;line-height:1.55;color:rgba(26,26,26,.75);margin:0 0 12px;}',
    '.vev-optin{display:flex;gap:10px;align-items:flex-start;border:1.5px solid rgba(0,0,0,.12);border-radius:10px;padding:12px 14px;margin:0 0 12px;cursor:pointer;}',
    '.vev-optin input{width:20px;height:20px;flex-shrink:0;margin-top:1px;accent-color:#2d7d31;}',
    '.vev-optin b{display:block;font-size:14px;}',
    '.vev-optin small{display:block;font-size:12.5px;line-height:1.5;color:rgba(26,26,26,.7);margin-top:2px;}',
    '.vev-going{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:800;color:#1f5f22;margin:0 0 12px;}',
    '.vev-going::before{content:"";width:10px;height:10px;border-radius:50%;background:#2d7d31;}',
    '.vev-plain{font-family:inherit;font-size:12px;font-weight:800;color:#1f5f22;background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;}',
    '.vev-host{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:10px 14px;border:1px solid rgba(26,26,26,.12);border-radius:8px;text-decoration:none;color:inherit;background:#fff;}',
    '.vev-host:hover{border-color:#2d7d31;}',
    '.vev-host img,.vev-host i{width:40px;height:40px;border-radius:8px;object-fit:cover;flex:none;}',
    '.vev-host i{display:flex;align-items:center;justify-content:center;background:#2d7d31;color:#fff;font-style:normal;font-weight:900;}',
    '.vev-host span{display:flex;flex-direction:column;min-width:0;flex:1;}',
    '.vev-host small{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(26,26,26,.68);}',
    '.vev-host b{font-size:15px;font-weight:800;}',
    '.vev-host em{font-style:normal;font-size:12px;font-weight:700;color:#1f5f22;white-space:nowrap;}',
    '.vev-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(170px,100%),1fr));gap:10px;margin:0 0 18px;}',
    '.vev-tiles div{background:#f7f8f7;border-radius:8px;padding:12px 14px;}',
    '.vev-tiles b{display:block;font-size:24px;font-weight:900;line-height:1.1;}',
    '.vev-tiles span{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(26,26,26,.68);}',
    '.vev-guests{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr));gap:10px;}',
    '.vev-guest{border:1.5px solid rgba(0,0,0,.09);border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5;}',
    '.vev-guest b{display:block;font-size:15px;}',
    '.vev-guest .meta{color:rgba(26,26,26,.68);font-size:12px;font-weight:700;margin-bottom:6px;}',
    '.vev-guest dl{margin:0;}',
    '.vev-guest dt{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1f5f22;margin-top:6px;}',
    '.vev-guest dd{margin:0;}',
    '.vev-sent{display:flex;flex-direction:column;gap:8px;}',
    '.vev-sent div{border:1.5px solid rgba(0,0,0,.09);border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.5;}',
    '.vev-sent small{display:block;font-size:12px;font-weight:700;color:rgba(26,26,26,.68);margin-bottom:4px;}',
    '.vev-sent p{margin:0;white-space:pre-line;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.vev-warn{border-radius:10px;background:#fff4e2;color:#6b3f00;font-size:14px;font-weight:700;line-height:1.55;padding:14px 16px;margin-bottom:18px;}',
    '.vev-msgbox{border-left:3px solid #2d7d31;background:#f7f8f7;border-radius:6px;padding:14px 16px;font-size:15px;line-height:1.65;white-space:pre-line;margin:0 0 18px;}',
    '.vev-left{font-size:12.5px;font-weight:700;color:rgba(26,26,26,.7);}'
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
  // An event whose tickets are members-only points its ticket_url at our own page, /events#event/<id>/tickets (Sean, 2026-10-28,
  // the Dolphins game): the tile opens that view in place, which takes a member straight to the tickets.
  function memberTix(u) { var m = /^https:\/\/(www\.)?vegansexplore\.com\/events(#event\/[0-9a-f-]{36}\/tickets)$/i.exec(u || ''); return m ? m[2] : ''; }
  function tile(e, past) {
    var dm = dayMon(e), link = safeUrl(e.ticket_url) || safeUrl(e.virtual_url), own = memberTix(e.ticket_url);
    var cta = past ? (safeUrl(e.recording_url) ? '<a class="vev-go" href="' + esc(e.recording_url) + '" target="_blank" rel="noopener noreferrer">Watch</a>' : '')
      : own ? '<a class="vev-go" href="' + esc(own) + '" aria-label="Get tickets for ' + esc(e.title) + '">Get tickets</a>'
      : (link ? '<a class="vev-go" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" aria-label="Tickets and details for ' + esc(e.title) + '">Tickets &amp; info</a>' : '<span class="vev-go off">Details soon</span>');
    return '<article class="vev-row" aria-label="' + esc(e.title) + '">' +
      '<div class="vev-date" aria-hidden="true"><span class="vev-day">' + esc(dm[0]) + '</span><span class="vev-mon">' + esc(dm[1]) + '</span></div>' +
      '<div class="vev-body">' +
        '<p class="vev-kind">' + esc(catLabel(e.category)) + (e.is_featured && !past ? ' · Featured' : '') + '</p>' +
        '<h3 class="vev-name"><a href="#event/' + esc(e.id) + '">' + esc(e.title) + '</a></h3>' +
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
    var all = null, draft = null, flyer = null, mine = null, how = '';

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
    var STEPS = ['How to add it', 'The event', 'When and where', 'Check and send'];
    var ROLES = [['host', 'I\'m hosting or organizing it', 'It is our event.'], ['promoter', 'I\'m promoting it', 'I help get the word out.'], ['attending', 'I\'m going', 'I want it on the calendar.']];
    var ICON = {
      flyer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M20 16l-5-5-9 9"/></svg>',
      link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
      type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13 7l4 4"/></svg>'
    };
    function go(hash) {
      if (location.hash !== hash) history.pushState(history.state, '', location.pathname + location.search + hash);
      route();
      // A new step starts at its top, under the sticky menu, when the page was scrolled past it.
      var top = el.getBoundingClientRect().top, nav = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ve-nav-h'), 10) || 70;
      if (top < nav) window.scrollTo({ top: window.pageYOffset + top - nav - 12 });
    }
    function blank() {
      var hub = st.city && window.VECityBanner ? VECityBanner.hubBySlug(st.city) : null;
      return { title: '', category: '', description: '', start: '', end: '', timezone: (hub && hub.tz) || myTz(), online: false, location_name: '', address: '', city: '', state: '', country: hub ? (hub.slug === 'london' ? 'GB' : 'US') : '', ticket_url: '', role: '', read: '', readNote: '' };
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
      var r = el.querySelector('[data-role][aria-pressed="true"]'); if (r) draft.role = r.getAttribute('data-role');
    }
    // What the event still needs, asked as questions on Check and send.
    function gaps() {
      var g = [];
      if (!draft.title) g.push('title');
      var iso = draft.start ? zonedToISO(draft.start, draft.timezone) : '';
      if (!iso || new Date(iso) < new Date(Date.now() - 864e5)) g.push('start');
      if (!draft.online && (!draft.city || !draft.country)) g.push('place');
      return g;
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
      if (step === 4) {
        gaps().forEach(function (k) { if (k === 'place') { if (!draft.city) bad.push('city'); if (!draft.country) bad.push('country'); } else bad.push(k); });
        if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(draft.ticket_url || '')) bad.push('ticket_url');
        if (!draft.role) bad.push('role');
      }
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
        var card = function (k, t, d) { return '<button type="button" class="vev-card" data-how="' + k + '" aria-pressed="' + (how === k) + '">' + ICON[k] + '<b>' + t + '</b><span>' + d + '</span></button>'; };
        body = '<h2>How do you want to add it?</h2><p class="lead">Pick whichever is easiest. We read a flyer or a link and fill in the rest for you, then ask about anything we could not find.</p>' +
          '<div class="vev-cards" role="group" aria-label="How to add it">' +
            card('flyer', 'Drop in a flyer', 'A picture, an Instagram banner or a PDF.') +
            card('link', 'Paste a link', 'Its Eventbrite, Meetup or ticket page, its website, or an Instagram post.') +
            card('type', 'Type it in', 'Fill in the details yourself, step by step.') +
          '</div>' +
          '<div data-v="pane-flyer"' + (how === 'flyer' ? '' : ' hidden') + '>' +
            '<div class="vev-drop" tabindex="0" role="button" data-v="drop"><b>Drop the flyer here</b><span>or click to choose a picture or a PDF</span></div>' +
            '<input type="file" accept="image/*,application/pdf" data-v="file" hidden>' +
            '<div class="vev-flyer" data-v="flyer"' + (flyer ? '' : ' hidden') + '>' + (flyer && flyer.preview ? '<img src="' + esc(flyer.preview) + '" alt="Your flyer">' : '') + '<p class="vev-note" data-v="fnote">' + esc(flyer && flyer.note || '') + '</p></div>' +
          '</div>' +
          '<div data-v="pane-link"' + (how === 'link' ? '' : ' hidden') + '><div class="vev-grid">' +
            field('link', 'The event\'s link', inp('link', draft.read === 'link' ? draft.ticket_url : '', 'url', ' placeholder="https://" maxlength="1000"'), 'We open it and read the event from it. An Instagram post is read like a flyer.', true) +
            '</div><div class="vev-nav" style="justify-content:flex-start"><button type="button" class="vev-btn green" data-v="readlink">Read it</button><p class="vev-note" data-v="lnote"></p></div>' +
          '</div>';
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
        var g = gaps(), from = draft.read === 'flyer' ? 'your flyer' : draft.read === 'link' ? 'your link' : '';
        var ask = '';
        if (g.length) {
          ask = '<div class="vev-ask"><h3>' + (from ? 'A few things we could not find' : 'A few things we still need') + '</h3><p>Answer these and it is ready to send.</p><div class="vev-grid">' +
            (g.indexOf('title') > -1 ? field('title', 'What is the event called?', inp('title', draft.title, 'text', ' maxlength="200" autocomplete="off"'), '', true) : '') +
            (g.indexOf('start') > -1 ? field('start', 'When does it start?', inp('start', draft.start, 'datetime-local'), draft.start ? 'That day has passed. Check the date.' : '') + field('timezone', 'In what time zone?', tzSelect(draft.timezone)) : '') +
            (g.indexOf('place') > -1 ? field('city', 'What city is it in?', inp('city', draft.city, 'text', ' maxlength="120"')) + field('state', 'State or region', inp('state', draft.state, 'text', ' maxlength="60"')) + field('country', 'Country', countrySelect(draft.country)) +
              '<div class="vev-f wide"><label class="vev-check"><input type="checkbox" id="vev-online"' + (draft.online ? ' checked' : '') + '> It is online only</label></div>' : '') +
            '</div></div>';
        }
        var chg = function (n) { return ' <button type="button" data-go="edit' + n + '">Change</button>'; };
        body = '<h2>' + (from ? 'What we found' : 'Check and send') + '</h2>' +
          '<p class="lead">' + (from ? 'Here is what we read from ' + from + '. Check it, change anything we got wrong, and send it.' + (draft.readNote ? ' ' + esc(draft.readNote) : '') : 'Check it over, then send it. We check every event before it goes on the calendar.') + '</p>' +
          ask +
          '<dl class="vev-review">' +
            '<dt>Event</dt><dd>' + esc(draft.title || 'Not given yet') + (draft.category ? ' (' + esc(CATS[draft.category]) + ')' : '') + chg(2) + '</dd>' +
            (draft.description ? '<dt>About it</dt><dd>' + esc(draft.description) + chg(2) + '</dd>' : '') +
            '<dt>When</dt><dd>' + esc(draft.start ? when({ starts_at: zonedToISO(draft.start, draft.timezone), timezone: draft.timezone }) : 'Not given yet') + chg(3) + '</dd>' +
            '<dt>Where</dt><dd>' + esc(draft.online ? 'Online' : [draft.location_name, draft.address, draft.city, draft.state, countryName(draft.country)].filter(Boolean).join(', ') || 'Not given yet') + chg(3) + '</dd>' +
          '</dl>' +
          '<p class="vev-sub">The official link</p><div class="vev-grid">' +
            field('ticket_url', 'Where to get tickets or read more', inp('ticket_url', draft.ticket_url, 'url', ' placeholder="https://" maxlength="1000"'), 'Starts with https://. The organizer\'s page, its ticket page, or their Instagram post. We need it to list the event.', true) +
          '</div>' +
          '<p class="vev-sub">You and this event</p><div class="vev-f" data-f="role"><div class="vev-cards" role="group" aria-label="You and this event">' +
            ROLES.map(function (r) { return '<button type="button" class="vev-card" data-role="' + r[0] + '" aria-pressed="' + (draft.role === r[0]) + '"><b>' + r[1] + '</b><span>' + r[2] + '</span></button>'; }).join('') +
          '</div><small>Hosting or promoting it? After you send it, we show you how we can help it fill up.</small></div>' +
          (signedIn() ? '' : '<p class="lead" style="margin-top:16px">You will sign in (or get your Passport) when you send it, so we can let you know when it is live.</p>');
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
          if (k === 'edit2' || k === 'edit3') { go('#submit/' + k.slice(4)); return; }
          if (k === 'next' && step === 1) {
            if (!how) { el.querySelector('[data-v="err"]').textContent = 'Pick how you want to add it.'; return; }
            go(how === 'type' || !draft.read ? '#submit/2' : '#submit/4'); return;
          }
          var bad = check(step);
          if (bad.length) {
            el.querySelector('[data-v="err"]').textContent = step < 4 ? 'Fill in the fields marked in red.' : bad.indexOf('role') > -1 && bad.length === 1 ? 'Tell us how you are connected to the event.' : bad.indexOf('ticket_url') > -1 && bad.length <= 2 && !gaps().length ? 'Add the official link (starting with https://).' : 'Answer the questions marked in red.';
            return;
          }
          if (k === 'next') { go('#submit/' + (step + 1)); return; }
          send(b);
        });
      });
      var online = el.querySelector('#vev-online');
      if (online) {
        var tog = function () { ['location_name', 'address', 'city', 'state', 'country'].forEach(function (k) { var f = el.querySelector('[data-f="' + k + '"]'); if (f) f.hidden = online.checked; }); };
        online.addEventListener('change', tog); tog();
      }
      if (step === 1) {
        wireDrop();
        el.querySelectorAll('[data-how]').forEach(function (c) {
          c.addEventListener('click', function () {
            how = c.getAttribute('data-how');
            // Typing it in starts from what is there, no longer "what we found".
            if (how === 'type') { draft.read = ''; draft.readNote = ''; go('#submit/2'); return; }
            el.querySelectorAll('[data-how]').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
            el.querySelector('[data-v="pane-flyer"]').hidden = how !== 'flyer';
            el.querySelector('[data-v="pane-link"]').hidden = how !== 'link';
            if (how === 'link') { var li = el.querySelector('#vev-link'); if (li) li.focus(); }
          });
        });
        var rl = el.querySelector('[data-v="readlink"]'), li = el.querySelector('#vev-link');
        li.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); rl.click(); } });
        rl.addEventListener('click', function () {
          var url = li.value.trim(), ln = el.querySelector('[data-v="lnote"]');
          if (!/^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(url)) { ln.textContent = 'Paste the full link.'; ln.classList.add('bad'); return; }
          needSignIn(function () {
            rl.disabled = true; ln.classList.remove('bad'); ln.textContent = 'Reading it… this can take up to a minute.';
            api({ action: 'link_read', url: url }).then(function (d) {
              rl.disabled = false;
              if (d.error || !d.event) { ln.classList.add('bad'); ln.textContent = d.message || d.note || 'We could not read that one. Try another, drop in the flyer, or type it in.'; return; }
              fill(d.event, d.note, d.links);
              draft.read = 'link';
              go('#submit/4');
            }).catch(function () { rl.disabled = false; ln.classList.add('bad'); ln.textContent = 'That did not go through. Try again.'; });
          });
        });
      }
      el.querySelectorAll('[data-role]').forEach(function (c) {
        c.addEventListener('click', function () {
          draft.role = c.getAttribute('data-role');
          el.querySelectorAll('[data-role]').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
          var f = el.querySelector('[data-f="role"]'); if (f) f.classList.remove('bad');
        });
      });
      var first = el.querySelector('.vev-form input, .vev-form select, .vev-form textarea');
      if (first && step > 1) try { first.focus({ preventScroll: true }); } catch (e) {}
    }

    function needSignIn(then) {
      if (signedIn()) { then(); return; }
      var back = location.pathname + location.search + location.hash;
      if (window.VEAuth && VEAuth.showAuthModal) VEAuth.showAuthModal('Sign in, or get your Passport, to send an event.', function () { then(); });
      else location.href = '/login?next=' + encodeURIComponent(back);
    }

    // What a flyer or a link gave us, into the draft (kept where it says nothing).
    function fill(x, note, links) {
      var tz = x.timezone || draft.timezone;
      Object.assign(draft, {
        title: x.title || draft.title, category: x.category || draft.category, description: x.description || draft.description,
        timezone: tz, start: x.starts_at ? isoToLocal(x.starts_at, tz) : draft.start, end: x.ends_at ? isoToLocal(x.ends_at, tz) : draft.end,
        online: x.event_type === 'virtual', location_name: x.location_name || draft.location_name, address: x.address || draft.address,
        city: x.city || draft.city, state: x.state || draft.state, country: x.country || draft.country, ticket_url: x.ticket_url || draft.ticket_url
      });
      draft.readNote = [note || '', links && !x.ticket_url ? 'Links we saw: ' + links + '.' : ''].filter(Boolean).join(' ');
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
            fill(d.event, d.note, d.links);
            draft.read = 'flyer';
            flyer.note = 'Read it.';
            go('#submit/4');
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
        api({ action: 'submit', event: ev, flyer_path: flyer && flyer.path, role: draft.role }).then(function (d) {
          if (!d.ok) {
            btn.disabled = false; btn.textContent = 'Send for approval';
            el.querySelector('[data-v="err"]').textContent = d.message || 'That did not send. Try again.';
            return;
          }
          var role = draft.role;
          draft = null; flyer = null; mine = null; how = '';
          go(role === 'host' || role === 'promoter' ? '#promote/' + d.id + '/sent' : '#mine/sent');
        }).catch(function () { btn.disabled = false; btn.textContent = 'Send for approval'; el.querySelector('[data-v="err"]').textContent = 'That did not send. Try again.'; });
      });
    }

    function drawMine(sent) {
      var head = '<nav class="vev-crumb" aria-label="Breadcrumb"><a href="#" data-go="list">' + esc(opts.listLabel || 'Events') + '</a><span>/</span><span>My events</span></nav>';
      if (!signedIn()) { el.innerHTML = head + '<div class="vev-form"><h2>My events</h2><p class="lead">Sign in to see the events you sent.</p><button type="button" class="vev-btn green" data-go="signin">Sign in</button></div>'; }
      else {
        el.innerHTML = head + '<div class="vev-form">' + (sent ? '<h2>Thanks, it is in</h2><p class="lead">We check every event before it goes on the calendar, usually within a day or two. We will email you when it is live.</p>' : '<h2>My events</h2><p class="lead">The events you organize, the ones you are going to, and every event you sent.</p>') +
          '<div class="vev-mine" data-v="mine"><p class="vev-count">Loading…</p></div>' +
          '<div class="vev-nav"><button type="button" class="vev-btn ghost" data-go="list">See the events</button><button type="button" class="vev-btn" data-go="submit">+ Submit another</button></div></div>';
        api({ action: 'mine' }).then(function (d) {
          mine = d.events || [];
          var box = el.querySelector('[data-v="mine"]'); if (!box) return;
          var label = { pending: 'Waiting for approval', approved: 'Live', rejected: 'Not approved', cancelled: 'Cancelled' };
          var row = function (e, right) { return '<div><span><b>' + esc(e.title) + '</b><small>' + esc(when(e)) + (e.city ? ' · ' + esc(e.city) : '') + (e.status === 'rejected' && e.rejection_reason ? ' · ' + esc(e.rejection_reason) : '') + '</small></span><span>' + right + '</span></div>'; };
          var html = '';
          // The event window (2026-10-28): events they organize, events they are going to, organizers they stopped.
          if ((d.organizing || []).length) html += '<p class="vev-sub">Events you organize</p>' + d.organizing.map(function (e) {
            return row(e, '<a class="vev-promote" href="#guests/' + esc(e.id) + '">Guests and messages</a>' + (e.paused ? '<span class="vev-tag rejected">Paused</span>' : '<span class="vev-tag ' + esc(e.status) + '">' + esc(label[e.status] || e.status) + '</span>'));
          }).join('');
          if ((d.going || []).length) html += '<p class="vev-sub">Events you are going to</p>' + d.going.map(function (e) {
            return row(e, (e.optin ? '<button type="button" class="vev-plain" data-off="' + esc(e.id) + '">Stop ' + esc(e.organizer || 'the organizer') + '\'s messages</button> ' : '') + '<a class="vev-promote" href="#event/' + esc(e.id) + '">Open</a>');
          }).join('');
          if ((d.muted || []).length) html += '<p class="vev-sub">Organizers you stopped</p>' + d.muted.map(function (x) {
            return '<div><span><b>' + esc(x.name) + '</b><small>No messages from them, on any event</small></span><span><button type="button" class="vev-plain" data-unmute="' + esc(x.organizer) + '">Let them message me again</button></span></div>';
          }).join('');
          html += (html ? '<p class="vev-sub">Events you sent</p>' : '') + (mine.length ? mine.map(function (e) {
            var promo = (e.submitter_role === 'host' || e.submitter_role === 'promoter') && e.status !== 'rejected' && new Date(e.starts_at) > new Date() ? '<a class="vev-promote" href="#promote/' + esc(e.id) + '">Promote it</a>' : '';
            return row(e, promo + '<span class="vev-tag ' + esc(e.status) + '">' + esc(label[e.status] || e.status) + '</span>');
          }).join('') : '<p class="vev-count">Nothing yet.</p>');
          box.innerHTML = html;
          box.querySelectorAll('[data-off]').forEach(function (b) { b.addEventListener('click', function () { b.disabled = true; api({ action: 'optin_off', id: b.getAttribute('data-off') }).then(function () { drawMine(false); }); }); });
          box.querySelectorAll('[data-unmute]').forEach(function (b) { b.addEventListener('click', function () { b.disabled = true; api({ action: 'unmute', organizer: b.getAttribute('data-unmute') }).then(function () { drawMine(false); }); }); });
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

    /* ---------- Promote your event (Sean, 2026-10-28) ----------
       For the event's host or promoter, after they send it and from My events. Three packages and six options, each only
       I'm interested for now (no prices): ve-events promote_interest, a lead (initiative event-promotion) and an email to Sean. */
    var PACKAGES = [
      ['spotlight', 'Spotlight', ['Featured on the calendar and its city\'s page', 'Ads on our pages across its chapter']],
      ['boost', 'Boost', ['Everything in Spotlight', 'Featured to our Meetup group (South Florida)', 'Graphics and posts on our social before it']],
      ['front_row', 'Front Row', ['Everything in Boost', 'One of our members there to capture it', 'A recap video after']]
    ];
    var PROMO = [
      ['feature', 'Feature it', 'At the top of the calendar and its city\'s page in the weeks before.'],
      ['ads', 'Run ads', 'Your event in our ad spots on the pages of its chapter.'],
      ['meetup', 'Meetup feature', 'Featured to our Meetup group, for events in South Florida.'],
      ['social', 'Social push', 'We make the graphics and post about it before the day.'],
      ['coverage', 'Coverage', 'A member of ours attends, captures content, and we post a recap video after.'],
      ['coproduce', 'Co-produce it with us', 'The full service: the event\'s page, tickets, vendors and volunteers, run with a Community Manager.']
    ];
    function drawPromote(id, sent) {
      var head = '<nav class="vev-crumb" aria-label="Breadcrumb"><a href="#" data-go="list">' + esc(opts.listLabel || 'Events') + '</a><span>/</span><a href="#mine" data-go="mine">My events</a><span>/</span><span>Promote your event</span></nav>';
      var bind = function () {
        el.querySelectorAll('[data-go]').forEach(function (b) {
          b.addEventListener('click', function (ev) { ev.preventDefault(); var k = b.getAttribute('data-go'); if (k === 'list') go(''); else if (k === 'mine') go('#mine'); });
        });
      };
      if (!signedIn()) {
        el.innerHTML = head + '<div class="vev-form"><h2>Promote your event</h2><p class="lead">Sign in to see the ways we can promote your event.</p><button type="button" class="vev-btn green" data-v="signin">Sign in</button></div>';
        bind(); el.querySelector('[data-v="signin"]').addEventListener('click', function () { needSignIn(function () { drawPromote(id, sent); }); });
        return;
      }
      el.innerHTML = head + '<div class="vev-form"><p class="vev-count">Loading…</p></div>';
      bind();
      api({ action: 'promote_get', id: id }).then(function (d) {
        var e = d.event;
        if (!e) { el.innerHTML = head + '<div class="vev-form"><h2>Promote your event</h2><p class="lead">We could not find that event in the ones you sent as its host or promoter.</p><div class="vev-nav"><button type="button" class="vev-btn ghost" data-go="mine">My events</button></div></div>'; bind(); return; }
        var sf = window.VECityBanner && VECityBanner.hubBySlug ? VECityBanner.matches(VECityBanner.hubBySlug('south-florida'), { city: e.city, state: e.state }) : true;
        var opts6 = PROMO.filter(function (o) { return o[0] !== 'meetup' || sf; });
        var pick = { pkg: '', opts: {} };
        el.innerHTML = head + '<div class="vev-form">' +
          (sent ? '<div class="vev-banner">Thanks, ' + esc(e.title) + ' is in. We check every event before it goes on the calendar, usually within a day or two, and email you when it is live.</div>' : '') +
          '<h2>Promote your event</h2><p class="lead">' + esc(e.title) + ', ' + esc(when(e)) + (e.city ? ', ' + esc(e.city) : '') + '. Here is how we can help it fill up. Pick a package, or any of the options, and our team will be in touch about what it takes. Nothing is charged here.</p>' +
          '<p class="vev-sub">Packages</p><div class="vev-cards" role="group" aria-label="Packages">' +
            PACKAGES.map(function (k) { return '<button type="button" class="vev-card" data-pkg="' + k[0] + '" aria-pressed="false"><b>' + esc(k[1]) + '</b><ul>' + k[2].filter(function (x) { return sf || x.indexOf('Meetup') < 0; }).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></button>'; }).join('') +
          '</div>' +
          '<p class="vev-sub">Or pick what you want</p><div class="vev-cards" role="group" aria-label="Options">' +
            opts6.map(function (o) { return '<button type="button" class="vev-card" data-opt="' + o[0] + '" aria-pressed="false"><b>' + esc(o[1]) + '</b><span>' + esc(o[2]) + '</span></button>'; }).join('') +
          '</div>' +
          '<div class="vev-grid">' + field('pnote', 'Anything we should know?', '<textarea id="vev-pnote" maxlength="1000"></textarea>', 'Your budget, how many people you expect, what help you need most.', true) + '</div>' +
          '<p class="vev-note bad" data-v="err" role="alert"></p>' +
          '<div class="vev-nav"><button type="button" class="vev-btn ghost" data-go="mine">Not now</button><button type="button" class="vev-btn green" data-v="send">I\'m interested</button></div></div>';
        bind();
        el.querySelectorAll('[data-pkg]').forEach(function (b) {
          b.addEventListener('click', function () {
            var k = b.getAttribute('data-pkg'); pick.pkg = pick.pkg === k ? '' : k;
            el.querySelectorAll('[data-pkg]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-pkg') === pick.pkg ? 'true' : 'false'); });
          });
        });
        el.querySelectorAll('[data-opt]').forEach(function (b) {
          b.addEventListener('click', function () {
            var k = b.getAttribute('data-opt'); pick.opts[k] = !pick.opts[k]; b.setAttribute('aria-pressed', pick.opts[k] ? 'true' : 'false');
          });
        });
        el.querySelector('[data-v="send"]').addEventListener('click', function () {
          var btn = this, list = Object.keys(pick.opts).filter(function (k) { return pick.opts[k]; }), err = el.querySelector('[data-v="err"]');
          if (!pick.pkg && !list.length) { err.textContent = 'Pick a package or at least one option.'; return; }
          btn.disabled = true; btn.textContent = 'Sending…';
          api({ action: 'promote_interest', id: id, package: pick.pkg, options: list, note: el.querySelector('#vev-pnote').value.trim() }).then(function (r) {
            if (!r.ok) { btn.disabled = false; btn.textContent = 'I\'m interested'; err.textContent = r.message || 'That did not send. Try again.'; return; }
            el.innerHTML = head + '<div class="vev-form"><h2>Thanks, we will be in touch</h2><p class="lead">Our team has what you picked for ' + esc(e.title) + ' and will reach out about what it takes, usually within a couple of days.</p><div class="vev-nav"><button type="button" class="vev-btn ghost" data-go="list">See the events</button><button type="button" class="vev-btn" data-go="mine">My events</button></div></div>';
            bind();
          }).catch(function () { btn.disabled = false; btn.textContent = 'I\'m interested'; err.textContent = 'That did not send. Try again.'; });
        });
      });
    }


    /* ---------- The event window (Sean, 2026-10-28: phase 2) ---------- */
    // What a guest's shown answers are called on the organizer's guest list. City and journey go on the line under the name.
    var SAID = { p_meal: 'Go-to Vegan meal', p_why: 'Why they went Vegan', p_day: 'A perfect day in their city', p_meet: 'Would love to meet people who', p_fact: 'Something surprising', q3_roles: 'What they do', q8_drivers: 'What drew them', q23_matters: 'What matters to them', q24_diet: 'How they eat' };
    function hubName(slug) { var h = (window.VE_HUBS || []).filter(function (x) { return x.slug === slug; })[0]; return h ? h.name : String(slug || '').replace(/-/g, ' '); }
    function crumbs(parts) {
      return '<nav class="vev-crumb" aria-label="Breadcrumb"><a href="#" data-go="list">' + esc(opts.listLabel || 'Events') + '</a>' + parts.map(function (x) { return '<span>/</span>' + (x[1] ? '<a href="' + x[1] + '">' + esc(x[0]) + '</a>' : '<span>' + esc(x[0]) + '</span>'); }).join('') + '</nav>';
    }
    function bindList() { el.querySelectorAll('[data-go="list"]').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); go(''); }); }); }
    function closes(e) { return new Date(new Date(e.ends_at || e.starts_at).getTime() + 7 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); }

    // Members-only tickets: an active Passport holder goes straight to the link (ve-events tickets); anyone else signs in or gets
    // their Passport first and then goes on to it.
    function getTickets(id, btn, err) {
      var go2 = function () {
        if (btn) { btn.disabled = true; btn.textContent = 'Opening the tickets…'; }
        api({ action: 'tickets', id: id }).then(function (r) {
          if (r && r.ok && r.url) { location.href = r.url; return; }
          if (btn) { btn.disabled = false; btn.textContent = 'Get tickets'; }
          if (r && r.error === 'not_eligible') { membersOnly({ signedIn: true }); return; }
          if (r && r.error === 'not_authenticated') { membersOnly(); return; }
          if (err) err.textContent = (r && r.message) || 'The tickets did not open. Try again.';
        }).catch(function () { if (btn) { btn.disabled = false; btn.textContent = 'Get tickets'; } if (err) err.textContent = 'The tickets did not open. Try again.'; });
      };
      if (signedIn()) { go2(); return; }
      membersOnly();
    }
    // Signed out: the members-only window the Directory uses (ve-votes.js, loaded on first need), Explore the Passport or Sign in,
    // both coming back to #event/<id>/tickets, which takes a member straight on to the tickets (Sean, 2026-10-28).
    function membersOnly(o) {
      if (location.hash.indexOf('/tickets') < 0 && /^#event\/[0-9a-f-]{36}$/i.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + location.hash + '/tickets');
      var show = function () { if (window.VEVotes && VEVotes.memberPrompt) VEVotes.memberPrompt('tickets', o); else location.href = '/passport?from=tickets&back=' + encodeURIComponent(location.pathname + location.search + location.hash); };
      if (window.VEVotes) { show(); return; }
      var sc = document.createElement('script'); sc.src = '/public/ve-votes.js'; sc.onload = show; sc.onerror = show; document.head.appendChild(sc);
    }

    function drawEvent(id, note, autoTix) {
      el.innerHTML = crumbs([['Event']]) + '<div class="vev-form"><p class="vev-count">Loading…</p></div>';
      bindList();
      api({ action: 'event', id: id }).then(function (d) {
        var e = d.event, v = d.viewer || {};
        if (!e) { el.innerHTML = crumbs([['Event']]) + '<div class="vev-form"><h2>That event is not on the calendar</h2><p class="lead">It may have ended or been taken down.</p><button type="button" class="vev-btn ghost" data-go="list">See the events</button></div>'; bindList(); return; }
        var over = new Date(e.ends_at || new Date(e.starts_at).getTime() + 6 * 3600000) < new Date();
        var tix = !!d.member_tickets && !over, link = tix ? '' : (safeUrl(e.ticket_url) || safeUrl(e.virtual_url)), org = v.organizer, member = signedIn();
        var rsvp;
        if (over) rsvp = '<h3>This event is over</h3><p>' + (v.going_count ? esc(v.going_count) + ' went with Vegans Explore.' : 'Thanks to everyone who went.') + '</p>';
        else if (!member || !v.going) rsvp = '<h3>Going?</h3><p>' + (v.going_count ? esc(v.going_count) + (v.going_count === 1 ? ' member is' : ' members are') + ' going. ' : '') + 'Let us know, and it shows on My events. ' + (tix ? 'Get your tickets through our group link.' : 'Tickets are on the official page.') + '</p>' +
          (org ? '<label class="vev-optin"><input type="checkbox" data-v="optin"><span><b>Let ' + esc(org) + ' message me about this event</b><small>Through Vegans Explore only: ' + esc(org) + ' never sees your email. Until ' + esc(closes(e)) + ', 7 days after the event. Turn it off any time. ' + (v.optin_paid ? '' : '25 points for saying yes.') + '</small></span></label>' : '') +
          '<button type="button" class="vev-btn green" data-v="going">I\'m going</button>';
        else rsvp = '<p class="vev-going">You\'re going</p>' +
          (org ? '<label class="vev-optin"><input type="checkbox" data-v="optin"' + (v.optin ? ' checked' : '') + '><span><b>Let ' + esc(org) + ' message me about this event</b><small>Through Vegans Explore only: ' + esc(org) + ' never sees your email. Until ' + esc(closes(e)) + ', 7 days after the event. ' + (v.optin_paid ? '' : '25 points for saying yes.') + '</small></span></label>' : '') +
          '<button type="button" class="vev-plain" data-v="notgoing">I can\'t make it</button>';
        el.innerHTML = crumbs([[e.title]]) + '<div class="vev-ev"><div class="vev-form">' +
          '<p class="vev-kind">' + esc(catLabel(e.category)) + (e.is_featured ? ' · Featured' : '') + '</p><h2>' + esc(e.title) + '</h2>' +
          '<div class="vev-facts"><span>' + esc(when(e)) + '</span><span>' + esc(place(e)) + (e.address && e.address !== e.location_name ? ' · ' + esc(e.address) : '') + '</span>' + (org ? '<span>Organized by ' + esc(org) + '</span>' : '') + '</div>' +
          // The group that hosts it, linked to its page in the Directory (Sean, 2026-10-29: "their profile will be tied to all their events").
          (e.host && e.host.slug ? '<a class="vev-host" href="/directory/' + encodeURIComponent(e.host.slug) + '">' + (e.host.logo_url ? '<img src="' + esc(e.host.logo_url) + '" alt="">' : '<i aria-hidden="true">' + esc((e.host.name || '?').charAt(0)) + '</i>') + '<span><small>Hosted by</small><b>' + esc(e.host.name) + '</b></span><em>See their page and events</em></a>' : '') +
          (e.description ? '<p class="vev-desc">' + esc(e.description) + '</p>' : '') +
          (tix ? '<button type="button" class="vev-btn green" data-v="tix">Get tickets</button><p class="vev-note" style="margin-top:8px">Through our Vegans Explore group link, for Passport holders.</p><p class="vev-note bad" data-v="tixerr" role="alert"></p>' : '') +
          (link ? '<a class="vev-btn ghost" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">Tickets and the official page</a>' : '') + '</div>' +
          '<div class="vev-form vev-rsvp">' + (note ? '<div class="vev-banner">' + esc(note) + '</div>' : '') + rsvp +
            '<p class="vev-note bad" data-v="err" role="alert"></p>' +
            (v.organizes ? '<p style="margin-top:14px"><a class="vev-btn" href="#guests/' + esc(e.id) + '">Guests and messages</a></p>' : '') +
            (member ? '<p style="margin-top:10px"><a class="vev-link" href="#mine">My events</a></p>' : '') + '</div></div>';
        bindList();
        var err = el.querySelector('[data-v="err"]'), opt = el.querySelector('[data-v="optin"]');
        var save = function (going, optin, btn) {
          if (!member) { needSignIn(function () { drawEvent(id); }); return; }
          if (btn) btn.disabled = true;
          api({ action: 'rsvp', id: id, going: going, optin: optin }).then(function (r) {
            if (!r.ok) { if (btn) btn.disabled = false; err.textContent = r.message || 'That did not save. Try again.'; if (opt && going && v.going) opt.checked = !optin; return; }
            mine = null;
            var w = r.viewer || {};
            drawEvent(id, !going ? 'Got it, you are off the list.' : w.points_now ? 'You\'re going, and 25 points are yours for letting ' + org + ' message you.' : (optin && !v.optin && v.going) ? org + ' can message you about this event now.' : (!optin && v.optin) ? org + ' won\'t message you about this event.' : !v.going ? 'You\'re going. See you there.' : '');
          }).catch(function () { if (btn) btn.disabled = false; err.textContent = 'That did not save. Try again.'; });
        };
        var g = el.querySelector('[data-v="going"]');
        if (g) g.addEventListener('click', function () { save(true, !!(opt && opt.checked), g); });
        if (opt && v.going) opt.addEventListener('change', function () { save(true, opt.checked, null); });
        var ng = el.querySelector('[data-v="notgoing"]');
        if (ng) ng.addEventListener('click', function () { save(false, false, ng); });
        var tb = el.querySelector('[data-v="tix"]');
        if (tb) {
          tb.addEventListener('click', function () { getTickets(id, tb, el.querySelector('[data-v="tixerr"]')); });
          if (autoTix) getTickets(id, tb, el.querySelector('[data-v="tixerr"]'));
        }
      });
    }

    function drawGuests(id, note) {
      var head = function (t) { return crumbs([['My events', '#mine'], [t || 'Guests and messages']]); };
      if (!signedIn()) { el.innerHTML = head() + '<div class="vev-form"><h2>Guests and messages</h2><p class="lead">Sign in to see your event\'s guests.</p><button type="button" class="vev-btn green" data-v="signin">Sign in</button></div>'; bindList(); el.querySelector('[data-v="signin"]').addEventListener('click', function () { needSignIn(function () { drawGuests(id); }); }); return; }
      el.innerHTML = head() + '<div class="vev-form"><p class="vev-count">Loading…</p></div>';
      bindList();
      api({ action: 'guests', id: id }).then(function (d) {
        if (!d.event) { el.innerHTML = head() + '<div class="vev-form"><h2>Guests and messages</h2><p class="lead">' + esc(d.message || 'We could not find that event in the ones you organize.') + '</p></div>'; bindList(); return; }
        var e = d.event, L = d.limits || {}, o = d.organizer || {};
        var why = o.paused ? 'Your messages are paused while our team looks at a guest\'s report.' : !L.open ? 'Messages for this event have closed.' : !L.left ? 'You have sent all ' + L.per_event + ' messages for this event.' : L.next_at ? 'One message a day: the next one can go ' + new Date(L.next_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) + '.' : !d.opted_in ? 'No guests have said you can message them yet.' : '';
        var guest = function (g) {
          var a = g.answers || {}, line = [a.q1_city ? hubName(a.q1_city) : '', a.q6_stage || '', /^\d{4}-\d{2}$/.test(a.q7_vegan_since || '') ? 'Vegan since ' + new Date(a.q7_vegan_since + '-15').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''].filter(Boolean).join(' · ');
          var said = Object.keys(SAID).filter(function (k) { return a[k] && (!Array.isArray(a[k]) || a[k].length); }).map(function (k) { return '<dt>' + esc(SAID[k]) + '</dt><dd>' + esc(Array.isArray(a[k]) ? a[k].join(', ') : a[k]) + '</dd>'; }).join('');
          return '<div class="vev-guest"><b>' + esc(g.name || 'A member') + '</b>' + (line ? '<div class="meta">' + esc(line) + '</div>' : '') + (said ? '<dl>' + said + '</dl>' : '') + '</div>';
        };
        el.innerHTML = head(e.title) + '<div class="vev-form">' + (note ? '<div class="vev-banner">' + esc(note) + '</div>' : '') + (o.paused ? '<div class="vev-warn">' + esc(why) + ' We will be in touch.</div>' : '') +
          '<h2>' + esc(e.title) + '</h2><p class="lead">' + esc(when(e)) + '. Guests who said you can message them hear from you through Vegans Explore, with your name on it. You never see their email, and they never see yours. Open until ' + esc(closes(e)) + ', 7 days after the event.</p>' +
          '<div class="vev-tiles"><div><b>' + esc(d.going) + '</b><span>Going</span></div><div><b>' + esc(d.opted_in) + '</b><span>Said you can message them</span></div><div><b>' + esc(L.left) + ' of ' + esc(L.per_event) + '</b><span>Messages left</span></div></div>' +
          '<p class="vev-sub">Send a message</p>' +
          '<div class="vev-grid"><div class="vev-f wide"><label for="vev-msg">Your message</label><textarea id="vev-msg" maxlength="' + esc(L.max) + '"' + (why ? ' disabled' : '') + ' placeholder="Doors open at 6. Bring a friend, and a bag for the market."></textarea><small><span data-v="cnt">0</span> of ' + esc(L.max) + ' characters. It goes by email from Vegans Explore. Guests can stop your messages or report one; a report pauses your messages until our team looks.</small></div></div>' +
          '<p class="vev-note bad" data-v="err" role="alert">' + esc(why) + '</p>' +
          '<div class="vev-nav"><span class="vev-left">' + (L.open ? 'One message a day, ' + esc(L.per_event) + ' in all' : '') + '</span><button type="button" class="vev-btn green" data-v="send"' + (why ? ' disabled' : '') + '>Send to ' + esc(d.opted_in) + (d.opted_in === 1 ? ' guest' : ' guests') + '</button></div>' +
          '<p class="vev-sub">Who said yes</p>' + (d.guests.length ? '<div class="vev-guests">' + d.guests.map(guest).join('') + '</div><p class="vev-left" style="margin-top:8px">Only what each guest chose to show on their profile.</p>' : '<p class="vev-count">No one yet. Guests say yes when they RSVP on the event\'s page.</p>') +
          '<p class="vev-sub">Messages you sent</p>' + (d.messages.length ? '<div class="vev-sent">' + d.messages.map(function (m) { return '<div><small>' + esc(new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) + ' · to ' + esc(m.sent) + (m.sent === 1 ? ' guest' : ' guests') + '</small><p>' + esc(m.body) + '</p></div>'; }).join('') + '</div>' : '<p class="vev-count">None yet.</p>') +
          '<p class="vev-sub">How guests see you</p><div class="vev-grid"><div class="vev-f"><label for="vev-oname">Your name on messages</label><input id="vev-oname" maxlength="80" value="' + esc(o.name) + '"></div></div>' +
          '<div class="vev-nav"><span class="vev-note" data-v="nmsg" role="status"></span><button type="button" class="vev-btn ghost" data-v="oname">Save the name</button></div></div>';
        bindList();
        var ta = el.querySelector('#vev-msg'), cnt = el.querySelector('[data-v="cnt"]'), err = el.querySelector('[data-v="err"]');
        ta.addEventListener('input', function () { cnt.textContent = ta.value.length; });
        el.querySelector('[data-v="send"]').addEventListener('click', function () {
          var b = this, t = ta.value.trim();
          if (!t) { err.textContent = 'Write your message first.'; return; }
          if (!confirm('Send this to ' + d.opted_in + (d.opted_in === 1 ? ' guest' : ' guests') + '? You have ' + L.left + ' of ' + L.per_event + ' left.')) return;
          b.disabled = true; b.textContent = 'Sending…';
          api({ action: 'message_send', id: id, body: t }).then(function (r) {
            if (!r.ok) { b.disabled = false; b.textContent = 'Send'; err.textContent = r.message || 'That did not send. Try again.'; return; }
            drawGuests(id, 'Sent to ' + r.sent + (r.sent === 1 ? ' guest.' : ' guests.'));
          }).catch(function () { b.disabled = false; b.textContent = 'Send'; err.textContent = 'That did not send. Try again.'; });
        });
        el.querySelector('[data-v="oname"]').addEventListener('click', function () {
          var nm = el.querySelector('[data-v="nmsg"]');
          api({ action: 'organizer_name', id: id, name: el.querySelector('#vev-oname').value.trim() }).then(function (r) { nm.className = 'vev-note' + (r.ok ? '' : ' bad'); nm.textContent = r.ok ? 'Saved.' : (r.message || 'That did not save.'); });
        });
      });
    }

    // A guest's link from a message email. No sign-in: the link is theirs alone.
    function drawMessage(tok) {
      var head = crumbs([['A message']]);
      el.innerHTML = head + '<div class="vev-form"><p class="vev-count">Loading…</p></div>';
      bindList();
      api({ action: 'msg_get', token: tok }).then(function (d) {
        if (!d.body) { el.innerHTML = head + '<div class="vev-form"><h2>That message is not here</h2><p class="lead">The link may be incomplete. Copy the whole link from the email.</p></div>'; bindList(); return; }
        var o = d.organizer;
        var done = function (t) { el.querySelector('[data-v="acts"]').innerHTML = '<div class="vev-banner">' + esc(t) + '</div>'; };
        el.innerHTML = head + '<div class="vev-form"><p class="vev-kind">From ' + esc(o) + ', through Vegans Explore</p><h2>' + esc(d.event ? d.event.title : 'Your event') + '</h2>' +
          '<p class="lead">' + (d.event ? esc(when(d.event)) + '. ' : '') + 'Sent ' + esc(new Date(d.sent_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) + '. ' + esc(o) + ' does not see your email address.</p>' +
          '<div class="vev-msgbox">' + esc(d.body) + '</div>' +
          '<div data-v="acts">' + (d.reported ? '<div class="vev-banner">You reported this message. Thank you.</div>' : d.muted ? '<div class="vev-banner">You stopped messages from ' + esc(o) + '.</div>' + '<button type="button" class="vev-btn ghost" data-v="report">Report this message</button>' :
            '<div class="vev-nav" style="justify-content:flex-start"><button type="button" class="vev-btn ghost" data-v="mute">Stop messages from ' + esc(o) + '</button><button type="button" class="vev-btn ghost" data-v="report">Report this message</button></div>') + '</div>' +
          (d.event ? '<p style="margin-top:16px"><a class="vev-link" href="#event/' + esc(d.event.id) + '">See the event</a></p>' : '') + '</div>';
        bindList();
        var mu = el.querySelector('[data-v="mute"]'), rp = el.querySelector('[data-v="report"]');
        if (mu) mu.addEventListener('click', function () { mu.disabled = true; api({ action: 'msg_mute', token: tok }).then(function (r) { if (r.ok) done('Done. You won\'t get messages from ' + o + ' again, on any event. You can change that on My events.'); else mu.disabled = false; }); });
        if (rp) rp.addEventListener('click', function () {
          el.querySelector('[data-v="acts"]').innerHTML = '<div class="vev-grid"><div class="vev-f wide"><label for="vev-why">What was wrong with it? (optional)</label><textarea id="vev-why" maxlength="1000"></textarea><small>Our team reads every report. ' + esc(o) + '\'s messages are paused until we look, and you won\'t hear from them again.</small></div></div><div class="vev-nav"><span></span><button type="button" class="vev-btn" data-v="send">Send the report</button></div>';
          el.querySelector('[data-v="send"]').addEventListener('click', function () {
            var b = this; b.disabled = true;
            api({ action: 'msg_report', token: tok, note: el.querySelector('#vev-why').value.trim() }).then(function (r) { if (r.ok) done('Thank you. ' + o + '\'s messages are paused while our team looks, and you won\'t hear from them again.'); else b.disabled = false; });
          });
        });
      });
    }

    function route() {
      var h = location.hash || '', em = /^#event\/([0-9a-f-]{36})(\/tickets)?$/i.exec(h), gm = /^#guests\/([0-9a-f-]{36})$/i.exec(h), mm = /^#message\/([0-9a-f]{64})$/.exec(h);
      if (em) { drawEvent(em[1], null, !!em[2]); if (opts.onView) opts.onView('event'); return; }
      if (gm) { drawGuests(gm[1]); if (opts.onView) opts.onView('guests'); return; }
      if (mm) { drawMessage(mm[1]); if (opts.onView) opts.onView('message'); return; }
      var m = /^#submit\/([1-4])$/.exec(h), pm = /^#promote\/([0-9a-f-]{36})(\/sent)?$/i.exec(h);
      if (pm) { drawPromote(pm[1], !!pm[2]); if (opts.onView) opts.onView('promote'); return; }
      if (m) { var s = +m[1]; if (s > 1 && !draft) { go('#submit/1'); return; } drawSubmit(s); if (opts.onView) opts.onView('submit'); }
      else if (/^#mine/.test(h)) { drawMine(h === '#mine/sent'); if (opts.onView) opts.onView('mine'); }
      else { drawList(); if (opts.onView) opts.onView('list'); }
    }
    // The first click into the calendar folds the page's banner, as on the Directory.
    el.addEventListener('click', function (ev) { if (opts.onInteract && ev.target.closest('button, select, input')) opts.onInteract(); });
    window.addEventListener('popstate', route);
    window.addEventListener('hashchange', route);

    route();
    load().then(function () { if (!/^#(submit|mine|promote|event|guests|message)/.test(location.hash)) { drawList(); } });

    return {
      setCity: function (slug) { st.city = slug || ''; st.shown = 40; if (!/^#(submit|mine|promote|event|guests|message)/.test(location.hash)) drawRows(); },
      submit: function () { go('#submit/1'); }, // the city banner's Submit an event button (2026-10-26)
      // The banner's Events home (Sean, 2026-10-27): every event in the city again, no search or filter, the list in view.
      home: function () { st.q = ''; st.where = ''; st.cat = ''; st.when = 'upcoming'; st.sort = 'date'; st.shown = 40; syncUrl(); go(''); },
      reload: function () { return load().then(drawRows); }
    };
  }

  window.VEEvents = {
    mount: mount, api: api, zonedToISO: zonedToISO, isoToLocal: isoToLocal, uploadFlyer: uploadFlyer, readFlyer: readFlyer, shrink: shrink,
    TZS: TZS, CATS: CATS, COUNTRIES: COUNTRIES, continentOf: continentOf, countryName: countryName, tile: tile, injectCss: injectCss, esc: esc
  };
})();
