// public/depot-cover.js
// The Depot's cover picker for a Daily Post piece (Sean, 2026-09-29, BOSS "source reliable photos"):
// a piece about a real business goes out with a real photo we have the right to use, credited,
// or with that business's logo card. Never a photo taken from the source article, never one
// copied off a website without a press grant, never Google or Yelp photos.
//
//   VEDepotCover.open({ pulseId, title, listingId?, onDone(piece) })
//
// "A real photo": upload it, say what lets us use it, and give the credit line.
// "Their logo card": pick the business; the card is drawn here from the logo on its listing
// (the owner's own mark) and saved to the Library as license 'logo_card'.
// Both land in the Library with their credit, then ve-media-library pulse_cover puts the picture
// on the piece; the database copies the credit onto it. Needs /public/ve-auth.js.
(function () {
  if (window.VEDepotCover) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-media-library';
  var STORAGE = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/';
  var LICENSE = [
    ['press_kit', 'From their press or media page (it says media may use it)'],
    ['permission', 'They said yes when we asked'],
    ['owner_upload', 'They sent it to us'],
    ['own', 'We took it (Vegans Explore, a member, a Roving Reporter)'],
    ['open_license', 'Creative Commons or similar (a place or a city, not their food)'],
  ];
  var NEEDS_PAGE = { press_kit: 1, open_license: 1 };
  var dlg, opts, pickedListing = null, cardFile = null;

  function tok() { return window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : ''; }
  function api(body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function uploader() {
    if (window.VEMediaUpload) return Promise.resolve(window.VEMediaUpload);
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = '/public/ve-media-upload.js';
      s.onload = function () { res(window.VEMediaUpload); }; s.onerror = rej; document.head.appendChild(s);
    });
  }

  var st = document.createElement('style');
  st.textContent =
    'dialog.ve-cv{border:0;border-radius:14px;padding:0;width:min(760px,calc(100% - 32px));max-height:calc(var(--ve-view-h,100vh) - 48px);overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:Montserrat,system-ui,sans-serif;color:#1a1a1a;}' +
    'dialog.ve-cv::backdrop{background:rgba(10,20,12,.7);}' +
    '.ve-cv-in{padding:20px 22px;}' +
    '.ve-cv h2{font-size:17px;font-weight:900;margin:0 0 4px;}' +
    '.ve-cv .lead{font-size:13px;line-height:1.55;color:rgba(26,26,26,.75);margin:0 0 14px;}' +
    '.ve-cv-tabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}' +
    '.ve-cv-tabs button{font:inherit;font-size:13px;font-weight:800;padding:9px 14px;min-height:44px;border-radius:8px;border:1px solid rgba(0,0,0,.25);background:#fff;cursor:pointer;}' +
    '.ve-cv-tabs button[aria-selected=true]{background:#1f5f2a;color:#fff;border-color:#1f5f2a;}' +
    '.ve-cv label{display:block;font-size:12.5px;font-weight:800;margin:12px 0 5px;}' +
    '.ve-cv input[type=text],.ve-cv input[type=url],.ve-cv select{box-sizing:border-box;width:100%;font:inherit;font-size:14px;padding:10px 12px;min-height:44px;border:1px solid rgba(0,0,0,.28);border-radius:8px;background:#fff;}' +
    '.ve-cv .hint{font-size:12px;color:rgba(26,26,26,.7);margin:4px 0 0;line-height:1.5;}' +
    '.ve-cv-hits{display:flex;flex-direction:column;gap:6px;margin-top:6px;}' +
    '.ve-cv-hits button{font:inherit;font-size:13px;text-align:left;padding:9px 12px;min-height:44px;border:1px solid rgba(0,0,0,.18);border-radius:8px;background:#fff;cursor:pointer;display:flex;gap:10px;align-items:center;}' +
    '.ve-cv-hits img{width:32px;height:32px;object-fit:contain;border-radius:6px;background:#f4f6f4;}' +
    '.ve-cv-picked{font-size:13px;font-weight:700;margin-top:8px;}' +
    '.ve-cv canvas,.ve-cv .pv{display:block;width:100%;max-width:520px;aspect-ratio:16/9;border-radius:10px;margin-top:12px;background:#eef2ee;object-fit:cover;}' +
    '.ve-cv-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:flex-end;margin-top:18px;}' +
    '.ve-cv-foot button{font:inherit;font-size:13.5px;font-weight:800;padding:10px 16px;min-height:44px;border-radius:8px;border:1px solid rgba(0,0,0,.25);background:#fff;cursor:pointer;}' +
    '.ve-cv-foot .go{background:#1f5f2a;color:#fff;border-color:#1f5f2a;}' +
    '.ve-cv-foot .go[disabled]{opacity:.5;cursor:not-allowed;}' +
    '.ve-cv-msg{flex:1 1 200px;font-size:13px;color:#8a1c1c;min-height:1em;}' +
    '.ve-cv-msg.ok{color:#1f5f2a;}' +
    '[data-cv-pane][hidden]{display:none;}' +
    '.ve-cv textarea{box-sizing:border-box;width:100%;font:inherit;font-size:13.5px;line-height:1.55;padding:10px 12px;border:1px solid rgba(0,0,0,.28);border-radius:8px;}' +
    '.ve-cv-mail{font-size:13.5px;font-weight:800;padding:10px 16px;min-height:44px;display:inline-flex;align-items:center;border-radius:8px;background:#1f5f2a;color:#fff;text-decoration:none;}' +
    '.ve-cv-mail[hidden]{display:none;}';
  document.head.appendChild(st);

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 've-cv';
    dlg.setAttribute('aria-labelledby', 've-cv-h');
    dlg.innerHTML =
      '<div class="ve-cv-in">' +
      '<h2 id="ve-cv-h">Cover</h2>' +
      '<p class="lead">A piece about a real business needs a real photo we have the right to use, with its credit, or that business\'s logo card. Never a photo from the source article, and never one copied off a website unless their press page says media may use it.</p>' +
      '<div class="ve-cv-tabs" role="tablist"><button type="button" role="tab" data-cv-tab="photo" aria-selected="true">A real photo</button><button type="button" role="tab" data-cv-tab="card" aria-selected="false">Their logo card</button><button type="button" role="tab" data-cv-tab="ask" aria-selected="false">Ask them for a photo</button></div>' +
      '<label for="ve-cv-q">Which business is this piece about?</label>' +
      '<input type="text" id="ve-cv-q" autocomplete="off" placeholder="Type the name as it is in the Directory">' +
      '<div class="ve-cv-hits" id="ve-cv-hits"></div><div class="ve-cv-picked" id="ve-cv-picked"></div>' +
      '<div data-cv-pane="photo">' +
      '<label for="ve-cv-file">The photo</label><input type="file" id="ve-cv-file" accept="image/jpeg,image/png,image/webp">' +
      '<img class="pv" id="ve-cv-pv" alt="" hidden>' +
      '<label for="ve-cv-lic">What lets us use it</label><select id="ve-cv-lic">' + LICENSE.map(function (l) { return '<option value="' + l[0] + '">' + esc(l[1]) + '</option>'; }).join('') + '</select>' +
      '<label for="ve-cv-credit">Credit line (shows under the picture)</label><input type="text" id="ve-cv-credit" maxlength="160" placeholder="Courtesy of the business">' +
      '<label for="ve-cv-page">Where it came from</label><input type="url" id="ve-cv-page" placeholder="https://their-site.com/press">' +
      '<p class="hint" id="ve-cv-pagehint">The page that says media may use it. We keep it with the photo.</p>' +
      '</div>' +
      '<div data-cv-pane="card" hidden><canvas id="ve-cv-canvas" width="1600" height="900" aria-label="Logo card preview"></canvas><p class="hint">Drawn from the logo on their Directory listing, their own mark, so it never suggests what their food looks like.</p></div>' +
      '<div data-cv-pane="ask" hidden><p class="hint" id="ve-cv-askto"></p><label for="ve-cv-asktext">The message (edit it if you like)</label><textarea id="ve-cv-asktext" rows="11"></textarea>' +
      '<div class="ve-cv-foot" style="justify-content:flex-start;margin-top:10px"><a class="ve-cv-mail" id="ve-cv-mail" hidden>Open in email</a><button type="button" id="ve-cv-copy">Copy the message</button></div>' +
      '<p class="hint">Nothing is sent from here: you send it. When they reply with photos, add one with A real photo and choose "They said yes when we asked".</p></div>' +
      '<div class="ve-cv-foot"><span class="ve-cv-msg" id="ve-cv-msg" role="status"></span><button type="button" data-cv-close>Cancel</button><button type="button" class="go" id="ve-cv-go">Use this cover</button></div>' +
      '</div>';
    document.body.appendChild(dlg);
    var $ = function (id) { return dlg.querySelector('#' + id); };
    dlg.querySelectorAll('[data-cv-tab]').forEach(function (b) { b.addEventListener('click', function () { tab(b.getAttribute('data-cv-tab')); }); });
    dlg.querySelector('[data-cv-close]').addEventListener('click', function () { dlg.close(); });
    var timer;
    $('ve-cv-q').addEventListener('input', function () {
      clearTimeout(timer); var q = this.value.trim();
      timer = setTimeout(function () { search(q); }, 250);
    });
    $('ve-cv-file').addEventListener('change', function () {
      var f = this.files[0], pv = $('ve-cv-pv');
      if (!f) { pv.hidden = true; return; }
      pv.src = URL.createObjectURL(f); pv.hidden = false;
    });
    $('ve-cv-lic').addEventListener('change', licHint);
    $('ve-cv-go').addEventListener('click', go);
    $('ve-cv-asktext').addEventListener('input', mailLink);
    $('ve-cv-copy').addEventListener('click', function () {
      var t = $('ve-cv-asktext').value;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { say('Copied.', true); }, function () { $('ve-cv-asktext').select(); say('Select all and copy.'); });
    });
  }

  function $(id) { return dlg.querySelector('#' + id); }
  function say(m, ok) { var e = $('ve-cv-msg'); e.textContent = m || ''; e.className = 've-cv-msg' + (ok ? ' ok' : ''); }
  function tab(name) {
    dlg.querySelectorAll('[data-cv-tab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-cv-tab') === name)); });
    dlg.querySelectorAll('[data-cv-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-cv-pane') !== name; });
    say('');
    $('ve-cv-go').hidden = name === 'ask';
    if (name === 'card') drawCard();
    if (name === 'ask') askDraft();
  }
  // ---- asking the business for a photo: a draft Sean sends himself (never sent from here).
  function askDraft() {
    var l = pickedListing, to = $('ve-cv-askto');
    if (!l) { to.textContent = 'Pick the business above first.'; $('ve-cv-asktext').value = ''; mailLink(); return; }
    var hi = l.ve_contact_name ? 'Hi ' + l.ve_contact_name.split(' ')[0] + ',' : 'Hi ' + l.name + ' team,';
    $('ve-cv-asktext').value = hi + '\n\n' +
      'We are writing a story about ' + l.name + ' for the Vegans Explore Daily Post' + (opts.title ? ': "' + opts.title + '"' : '') + '. We would love to run one of your own photos with it, so readers see your food and your space as they really are.\n\n' +
      'Could you send one or two photos you are happy for us to use with the story? We will credit them "Courtesy of ' + l.name + '" and link back to you. Replying with the photos attached tells us we have your permission to use them for this story.\n\n' +
      'Thank you,\nSean A. Russell\nVegans Explore\nvegansexplore.com';
    var email = l.ve_contact_email || l.email || '';
    var ways = [];
    if (email) ways.push('Email: ' + email);
    if (l.instagram) ways.push('Instagram: ' + l.instagram);
    if (l.website) ways.push('Website: ' + l.website);
    to.textContent = ways.length ? 'How to reach them. ' + ways.join('. ') + '.' : 'No contact details on their listing. Find them on their website or social pages.';
    mailLink();
  }
  function mailLink() {
    var l = pickedListing, a = $('ve-cv-mail'), email = l && (l.ve_contact_email || l.email);
    a.hidden = !email;
    if (email) a.href = 'mailto:' + String(email).replace(/[^\w.@+-]/g, '') + '?subject=' + encodeURIComponent('A photo for our Vegans Explore story on ' + l.name) + '&body=' + encodeURIComponent($('ve-cv-asktext').value);
  }
  function current() { var b = dlg.querySelector('[data-cv-tab][aria-selected=true]'); return b ? b.getAttribute('data-cv-tab') : 'photo'; }
  function licHint() {
    var v = $('ve-cv-lic').value;
    $('ve-cv-pagehint').textContent = NEEDS_PAGE[v] ? (v === 'press_kit' ? 'Required: the page that says media may use it.' : 'Required: the page with the license and the photographer.') : 'Optional: where it came from.';
    var c = $('ve-cv-credit');
    if (!c.value || /^(Courtesy of|Photo: )/.test(c.value)) c.value = v === 'own' ? 'Photo: Vegans Explore' : pickedListing ? 'Courtesy of ' + pickedListing.name : '';
  }

  function search(q) {
    var hits = $('ve-cv-hits');
    if (q.length < 2) { hits.innerHTML = ''; return; }
    api({ action: 'listing_search', q: q }).then(function (d) {
      var ls = (d && d.listings) || [];
      hits.innerHTML = ls.length ? ls.map(function (l, i) {
        return '<button type="button" data-i="' + i + '">' + (l.logo_url ? '<img src="' + esc(l.logo_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') + '<span><b>' + esc(l.name) + '</b> ' + esc(l.address_city || '') + '</span></button>';
      }).join('') : '<p class="hint">Not in the Directory. Add them first, or use a real photo without linking a business.</p>';
      hits.querySelectorAll('[data-i]').forEach(function (b) { b.addEventListener('click', function () { pick(ls[+b.getAttribute('data-i')]); }); });
    });
  }
  function pick(l) {
    pickedListing = l; cardFile = null;
    $('ve-cv-hits').innerHTML = '';
    $('ve-cv-q').value = l ? l.name : '';
    $('ve-cv-picked').textContent = l ? 'This piece is about ' + l.name + (l.address_city ? ' (' + l.address_city + ')' : '') + '.' : '';
    licHint();
    if (current() === 'card') drawCard();
    if (current() === 'ask') askDraft();
  }

  // ---- the logo card: 1600x900, the business's color, its logo on a white tile, its name.
  function logoBlob(l) {
    if (!l.logo_url) return Promise.resolve(null);
    if (l.logo_url.indexOf(STORAGE) === 0) return fetch(l.logo_url).then(function (r) { return r.ok ? r.blob() : null; }).catch(function () { return null; });
    return api({ action: 'logo_fetch', listing_id: l.id }).then(function (d) {
      if (!d || !d.ok) return null;
      var bin = atob(d.b64), a = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      return new Blob([a], { type: d.mime });
    }).catch(function () { return null; });
  }
  function imgOf(blob) {
    return new Promise(function (res) {
      if (!blob) return res(null);
      var u = URL.createObjectURL(blob), im = new Image();
      im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = u;
    });
  }
  function drawCard() {
    var c = $('ve-cv-canvas'), x = c.getContext('2d'), l = pickedListing;
    x.fillStyle = '#eef2ee'; x.fillRect(0, 0, 1600, 900);
    if (!l) { x.fillStyle = '#1a1a1a'; x.font = '700 44px Montserrat, sans-serif'; x.textAlign = 'center'; x.fillText('Pick the business above', 800, 460); return; }
    say('Drawing the card...', true);
    var fonts = document.fonts && document.fonts.load ? document.fonts.load('800 64px Montserrat').catch(function () {}) : Promise.resolve();
    Promise.all([logoBlob(l).then(imgOf), fonts]).then(function (r) {
      if (pickedListing !== l) return;
      var im = r[0], bg = /^#[0-9a-f]{6}$/i.test(l.color || '') ? l.color : '#1f5f2a';
      x.fillStyle = bg; x.fillRect(0, 0, 1600, 900);
      // the white tile
      var T = 460, tx = 800 - T / 2, ty = 150;
      x.fillStyle = '#fff'; round(x, tx, ty, T, T, 36); x.fill();
      if (im) {
        var k = Math.min((T - 70) / im.naturalWidth, (T - 70) / im.naturalHeight);
        var w = im.naturalWidth * k, h = im.naturalHeight * k;
        x.imageSmoothingQuality = 'high'; x.drawImage(im, 800 - w / 2, ty + T / 2 - h / 2, w, h);
      } else {
        x.fillStyle = bg; x.font = '900 160px Montserrat, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(String(l.initials || l.name.slice(0, 2)).toUpperCase().slice(0, 3), 800, ty + T / 2);
      }
      x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = light(bg) ? '#1a1a1a' : '#fff';
      var size = 64; x.font = '800 ' + size + 'px Montserrat, sans-serif';
      while (x.measureText(l.name).width > 1400 && size > 34) { size -= 4; x.font = '800 ' + size + 'px Montserrat, sans-serif'; }
      x.fillText(l.name, 800, 730);
      if (l.address_city) { x.font = '600 32px Montserrat, sans-serif'; x.globalAlpha = 0.85; x.fillText(l.address_city, 800, 790); x.globalAlpha = 1; }
      say(im ? '' : 'No logo on their listing yet, so the card uses their initials. Add their logo in the Directory for a better card.', !im ? false : true);
      c.toBlob(function (b) {
        if (!b || pickedListing !== l) return;
        cardFile = new File([b], (l.slug || 'business') + '-logo-card.png', { type: 'image/png' });
        cardFile.veName = 'Logo card: ' + l.name; cardFile.veRef = 'logo-card:' + String(l.slug || l.id).slice(0, 180);
        cardFile.veLicense = 'logo_card'; cardFile.veCredit = l.name + ' logo';
      }, 'image/png');
    });
  }
  function round(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function light(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 160; }

  function go() {
    var btn = $('ve-cv-go'), mode = current(), file, lic, credit, page;
    if (mode === 'card') {
      if (!pickedListing) return say('Pick the business first.');
      if (!cardFile) return say('The card is still drawing. Try again in a moment.');
      file = cardFile; lic = 'logo_card'; credit = pickedListing.name + ' logo'; page = null;
    } else {
      file = $('ve-cv-file').files[0]; lic = $('ve-cv-lic').value; credit = $('ve-cv-credit').value.trim(); page = $('ve-cv-page').value.trim();
      if (!file) return say('Choose the photo first.');
      if (!credit) return say('Add the credit line, for example "Courtesy of ' + (pickedListing ? pickedListing.name : 'the business') + '".');
      if (NEEDS_PAGE[lic] && !/^https:\/\//i.test(page)) return say('Add the https:// page that shows we may use it.');
      file.veLicense = lic; file.veCredit = credit; file.veSourcePage = page || undefined;
      file.veName = (pickedListing ? pickedListing.name + ': ' : '') + (file.name || 'photo');
    }
    btn.disabled = true; say('Saving...', true);
    uploader().then(function (U) { return U.upload([file], tok()); }).then(function (r) {
      var it = r.saved[0];
      if (!it) throw new Error(r.errors[0] || 'upload');
      // The same file may already be in the Library; make sure it carries this credit.
      return api({ action: 'update', id: it.id, license: lic, credit: credit, source_page_url: page || null }).then(function () { return it; });
    }).then(function (it) {
      return api({ action: 'pulse_cover', id: opts.pulseId, url: it.url, listing_id: pickedListing ? pickedListing.id : undefined });
    }).then(function (d) {
      btn.disabled = false;
      if (!d || !d.ok) return say('That did not save. Try again.');
      say('Saved.', true);
      if (opts.onDone) opts.onDone(d.piece);
      setTimeout(function () { dlg.close(); }, 400);
    }).catch(function () { btn.disabled = false; say('That did not save. Try again.'); });
  }

  function open(o) {
    if (!dlg) build();
    opts = o || {};
    $('ve-cv-h').textContent = 'Cover: ' + (opts.title || 'this piece');
    $('ve-cv-file').value = ''; $('ve-cv-pv').hidden = true; $('ve-cv-credit').value = ''; $('ve-cv-page').value = ''; $('ve-cv-lic').value = 'press_kit';
    $('ve-cv-hits').innerHTML = ''; $('ve-cv-go').disabled = false; say('');
    pick(null); tab('photo'); licHint();
    dlg.showModal();
    if (opts.listingId) {
      api({ action: 'listing_search', id: opts.listingId }).then(function (d) {
        var l = ((d && d.listings) || [])[0];
        if (l) pick(l);
      });
    }
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cover]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open({ pulseId: b.getAttribute('data-cover'), title: b.getAttribute('data-cover-title') || '', listingId: b.getAttribute('data-cover-listing') || '', onDone: function () { if (window.veDepotReload) window.veDepotReload(); } });
  }, true);

  window.VEDepotCover = { open: open };
})();
