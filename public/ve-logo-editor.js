/* ve-logo-editor.js: make a square logo in the browser, no Photoshop (Sean, 2026-10-27: "Could I just drop whatever image that
   I find and then you do that for me, and then we can adjust it... crop it and size it so it looks good, maybe drop a background
   in it if it's a transparent image").

   VELogoEditor.mount(el, { fetchUrl(url) -> Promise<{ data: base64, type }>, onChange(ready), background?, trim? })
     -> { load(file|blob|url), toBlob() -> Promise<Blob>, ready() }
   VELogoEditor.auto(file|blob|url, { fetchUrl, background? }) -> Promise<{ canvas, toBlob() }>   the same square with no hands:
     trimmed, fitted and filled (background "match", "white", "black" or #rrggbb; by default the editor's own choice). The logo
     sweep's suggestions (Depot > Directory review > Logos > Suggested) are drawn with it.
   Drop a picture, choose a file, paste one (copy image, then Ctrl+V / Cmd+V anywhere on the page) or paste its link. Links go
   through fetchUrl (ve-discover logo_fetch) so the canvas is never tainted. The square is 800 x 800: drag to move, the slider
   or the wheel to zoom, Fit shows the whole logo, Fill covers the square, Trim edges cuts empty margins. The background fills
   anything the picture does not cover: the color at its edges (the default for a picture with a solid background), white (the
   default for a transparent one), black, our green or any color. The result is always a JPEG with a solid background. */
(function () {
  if (window.VELogoEditor) return;
  var OUT = 800;
  var CSS = '.vle{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:18px;align-items:start;}' +
    '@media (max-width:760px){.vle{grid-template-columns:1fr;}}' +
    '.vle-stage{position:relative;width:100%;aspect-ratio:1/1;border-radius:10px;overflow:hidden;border:1px solid rgba(0,0,0,.18);background:repeating-conic-gradient(#e9e9e9 0 25%,#fff 0 50%) 0 0/20px 20px;touch-action:none;cursor:grab;}' +
    '.vle-stage canvas{display:block;width:100%;height:100%;}' +
    '.vle-stage.drag{cursor:grabbing;}' +
    '.vle-drop{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:18px;background:#fafafa;border:2px dashed rgba(0,0,0,.25);border-radius:10px;font-size:13px;color:#333;cursor:pointer;}' +
    '.vle-drop strong{font-size:15px;}' +
    '.vle.over .vle-stage{outline:3px solid #2e7d32;outline-offset:2px;}' +
    '.vle-side{display:flex;flex-direction:column;gap:12px;font-size:13px;}' +
    '.vle-side .vle-lbl{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#333;margin:0 0 6px;}' +
    '.vle-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}' +
    '.vle-btn{font:inherit;font-size:12px;font-weight:700;padding:8px 12px;border-radius:6px;border:1px solid rgba(0,0,0,.25);background:#fff;color:#111;cursor:pointer;}' +
    '.vle-btn:hover{border-color:#111;}' +
    '.vle-btn[aria-pressed="true"]{background:#1b5e20;border-color:#1b5e20;color:#fff;}' +
    '.vle-sw{width:30px;height:30px;border-radius:6px;border:1px solid rgba(0,0,0,.25);cursor:pointer;padding:0;}' +
    '.vle-sw[aria-pressed="true"]{outline:3px solid #1b5e20;outline-offset:2px;}' +
    '.vle-side input[type=range]{width:100%;accent-color:#1b5e20;}' +
    '.vle-side input[type=color]{width:30px;height:30px;padding:0;border:1px solid rgba(0,0,0,.25);border-radius:6px;background:#fff;cursor:pointer;}' +
    '.vle-url{display:flex;gap:6px;}.vle-url input{flex:1;min-width:0;font:inherit;font-size:13px;padding:8px 10px;border:1px solid rgba(0,0,0,.25);border-radius:6px;}' +
    '.vle-prev{display:flex;gap:14px;align-items:flex-end;}' +
    '.vle-prev div{text-align:center;font-size:11px;color:#555;}' +
    '.vle-prev canvas{display:block;border:1px solid rgba(0,0,0,.15);background:#fff;margin:0 auto 4px;}' +
    '.vle-msg{font-size:12px;font-weight:700;color:#b71c1c;min-height:1em;margin:0;}' +
    '.vle-info{font-size:12px;color:#555;margin:0;}';

  // ---- Shared by the editor and auto(): open a picture, read its edges, trim it, pick a background ----
  function openImage(x, fetchUrl) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () { res(img); };
      img.onerror = function () { rej(new Error('That picture did not open.')); };
      if (typeof x !== 'string') { img.src = URL.createObjectURL(x); return; }
      if (/^data:image\//.test(x)) { img.src = x; return; }
      if (!fetchUrl) { rej(new Error('Links cannot be loaded here.')); return; }
      fetchUrl(x).then(function (d) {
        if (!d || !d.data) throw new Error((d && d.message) || 'That link did not give a picture.');
        img.src = 'data:' + d.type + ';base64,' + d.data;
      }).catch(rej);
    });
  }
  function edgesOf(src) {
    var n = 64, t = document.createElement('canvas'); t.width = n; t.height = n;
    var c = t.getContext('2d'); c.drawImage(src, 0, 0, n, n);
    var d = c.getImageData(0, 0, n, n).data, r = 0, g = 0, b = 0, k = 0, clear = 0;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      if (i && j && i < n - 1 && j < n - 1) continue;
      var p = (j * n + i) * 4;
      if (d[p + 3] < 200) { clear++; continue; }
      r += d[p]; g += d[p + 1]; b += d[p + 2]; k++;
    }
    return { alpha: clear > (n * 4) * 0.2, edge: k ? '#' + [r / k, g / k, b / k].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('') : '#ffffff' };
  }
  // Cut away margins that are empty (see-through) or the same color as the edges; null when there is nothing to cut.
  function trimmed(src, sw, sh, e) {
    var t = document.createElement('canvas'); t.width = sw; t.height = sh;
    var c = t.getContext('2d'); c.drawImage(src, 0, 0);
    var d = c.getImageData(0, 0, sw, sh).data, er = parseInt(e.edge.slice(1, 3), 16), eg = parseInt(e.edge.slice(3, 5), 16), eb = parseInt(e.edge.slice(5, 7), 16);
    var x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (var y = 0; y < sh; y++) for (var x = 0; x < sw; x++) {
      var p = (y * sw + x) * 4;
      var empty = d[p + 3] < 16 || (!e.alpha && Math.abs(d[p] - er) + Math.abs(d[p + 1] - eg) + Math.abs(d[p + 2] - eb) < 36);
      if (empty) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0 || (x0 === 0 && y0 === 0 && x1 === sw - 1 && y1 === sh - 1)) return null;
    var o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
    o.getContext('2d').drawImage(t, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }
  function bgFor(want, e) {
    if (want === 'match') return e.alpha ? '#ffffff' : e.edge;
    if (want === 'white') return '#ffffff';
    if (want === 'black') return '#000000';
    if (/^#[0-9a-f]{6}$/i.test(want || '')) return want;
    return e.alpha ? '#ffffff' : e.edge;
  }
  function auto(x, o) {
    o = o || {};
    return openImage(x, o.fetchUrl).then(function (img) {
      var src = img, sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
      if (!sw || !sh) throw new Error('That picture did not open.');
      var e = edgesOf(src), t = trimmed(src, sw, sh, e);
      if (t) { src = t; sw = t.width; sh = t.height; }
      var cv = document.createElement('canvas'); cv.width = OUT; cv.height = OUT;
      var c = cv.getContext('2d'), k = Math.min(OUT / sw, OUT / sh) * 0.86, w = sw * k, h = sh * k;
      c.fillStyle = bgFor(o.background, e); c.fillRect(0, 0, OUT, OUT);
      c.imageSmoothingQuality = 'high'; c.drawImage(src, OUT / 2 - w / 2, OUT / 2 - h / 2, w, h);
      return { canvas: cv, small: Math.min(img.naturalWidth || 0, img.naturalHeight || 0) < 200, toBlob: function () { return new Promise(function (res) { cv.toBlob(res, 'image/jpeg', 0.92); }); } };
    });
  }

  function mount(el, opts) {
    opts = opts || {};
    if (!document.getElementById('vle-css')) { var st = document.createElement('style'); st.id = 'vle-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML = '<div class="vle">' +
      '<div><div class="vle-stage"><canvas width="' + OUT + '" height="' + OUT + '" aria-label="The logo, square"></canvas>' +
        '<label class="vle-drop"><strong>Drop a picture here</strong><span>or click to choose one, or paste it (copy the image, then Ctrl+V or Cmd+V)</span><input type="file" accept="image/*" hidden></label></div></div>' +
      '<div class="vle-side">' +
        '<div><p class="vle-lbl">Or paste its link</p><div class="vle-url"><input type="url" placeholder="https://.../logo.png" aria-label="Picture link"><button type="button" class="vle-btn" data-v="url">Load</button></div></div>' +
        '<div class="vle-tools" hidden>' +
          '<p class="vle-lbl">Size</p><div class="vle-row"><button type="button" class="vle-btn" data-v="fit">Fit</button><button type="button" class="vle-btn" data-v="fill">Fill</button><button type="button" class="vle-btn" data-v="trim">Trim edges</button><button type="button" class="vle-btn" data-v="center">Center</button><button type="button" class="vle-btn" data-v="new">New picture</button></div>' +
          '<input type="range" min="10" max="500" value="100" data-v="zoom" aria-label="Zoom" style="margin-top:8px">' +
          '<p class="vle-info">Drag the picture to move it. The wheel zooms too.</p>' +
        '</div>' +
        '<div class="vle-tools" hidden><p class="vle-lbl">Background</p><div class="vle-row">' +
          '<button type="button" class="vle-btn" data-bg="edge">Match its edges</button>' +
          '<button type="button" class="vle-sw" data-bg="#ffffff" style="background:#fff" aria-label="White"></button>' +
          '<button type="button" class="vle-sw" data-bg="#000000" style="background:#000" aria-label="Black"></button>' +
          '<button type="button" class="vle-sw" data-bg="#1b5e20" style="background:#1b5e20" aria-label="Green"></button>' +
          '<input type="color" value="#ffffff" data-v="color" aria-label="Any color"></div></div>' +
        '<div class="vle-tools" hidden><p class="vle-lbl">How it looks</p><div class="vle-prev"><div><canvas width="112" height="112" style="width:56px;height:56px;border-radius:10px"></canvas>Card</div><div><canvas width="192" height="192" style="width:96px;height:96px;border-radius:14px"></canvas>Listing page</div></div></div>' +
        '<p class="vle-msg" role="status"></p>' +
      '</div></div>';
    var root = el.querySelector('.vle'), cv = el.querySelector('.vle-stage canvas'), ctx = cv.getContext('2d');
    var drop = el.querySelector('.vle-drop'), file = el.querySelector('input[type=file]'), msg = el.querySelector('.vle-msg');
    var urlIn = el.querySelector('.vle-url input'), zoom = el.querySelector('[data-v="zoom"]'), color = el.querySelector('[data-v="color"]');
    var prevs = el.querySelectorAll('.vle-prev canvas');
    var src = null, sw = 0, sh = 0, fit = 1, scale = 1, ox = 0, oy = 0, bg = '#ffffff', bgMode = '#ffffff', edge = '#ffffff', alpha = false;

    function say(t) { msg.textContent = t || ''; }
    function tools(on) { Array.prototype.forEach.call(el.querySelectorAll('.vle-tools'), function (t) { t.hidden = !on; }); drop.hidden = on; if (opts.onChange) opts.onChange(on); }
    function draw() {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, OUT, OUT);
      if (src) { var w = sw * scale, h = sh * scale; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(src, OUT / 2 - w / 2 + ox, OUT / 2 - h / 2 + oy, w, h); }
      Array.prototype.forEach.call(prevs, function (p) { var c = p.getContext('2d'); c.imageSmoothingQuality = 'high'; c.clearRect(0, 0, p.width, p.height); c.drawImage(cv, 0, 0, p.width, p.height); });
      zoom.value = Math.round(scale / fit * 100);
      Array.prototype.forEach.call(el.querySelectorAll('[data-bg]'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.bg === bgMode)); });
    }
    // The picture's edge: its color (for "Match its edges") and whether it is see-through.
    function study() { var e = edgesOf(src); alpha = e.alpha; edge = e.edge; }
    function setFit(mode) {
      fit = Math.min(OUT / sw, OUT / sh) * 0.86;
      scale = mode === 'fill' ? Math.max(OUT / sw, OUT / sh) : fit; ox = 0; oy = 0; draw();
    }
    function useImage(img) {
      src = img; sw = img.naturalWidth || img.width; sh = img.naturalHeight || img.height;
      if (!sw || !sh) { say('That picture did not open.'); return; }
      study(); bgMode = alpha ? '#ffffff' : 'edge'; bg = alpha ? '#ffffff' : edge;
      say(Math.min(sw, sh) < 200 ? 'This picture is small (' + sw + ' x ' + sh + '), so it may look soft. A bigger one is better if you can find it.' : '');
      // A suggestion opened to adjust starts the way the sweep showed it: trimmed, on its background.
      if (opts.trim) { var t = trimmed(src, sw, sh, { alpha: alpha, edge: edge }); if (t) { src = t; sw = t.width; sh = t.height; } opts.trim = false; }
      if (opts.background) { bg = bgFor(opts.background, { alpha: alpha, edge: edge }); bgMode = opts.background === 'match' ? 'edge' : bg; opts.background = ''; }
      tools(true); setFit('fit');
    }
    function fromBlob(b) {
      if (!b || !/^image\//.test(b.type || 'image/')) { say('That is not a picture.'); return; }
      var u = URL.createObjectURL(b), img = new Image();
      img.onload = function () { useImage(img); };
      img.onerror = function () { say('That picture did not open. Try a PNG or JPEG.'); };
      img.src = u;
    }
    function fromUrl(u) {
      u = String(u || '').trim(); if (!u) return;
      if (/^data:image\//.test(u)) { var im = new Image(); im.onload = function () { useImage(im); }; im.src = u; return; }
      if (!/^https?:\/\//i.test(u)) { say('Paste a link that starts with http.'); return; }
      if (!opts.fetchUrl) { say('Links cannot be loaded here.'); return; }
      say('Getting the picture...');
      opts.fetchUrl(u).then(function (d) {
        if (!d || !d.data) throw new Error(d && d.message || 'That link did not give a picture.');
        say(''); var img = new Image(); img.onload = function () { useImage(img); };
        img.onerror = function () { say('That picture did not open.'); };
        img.src = 'data:' + d.type + ';base64,' + d.data;
      }).catch(function (e) { say(e.message || 'That link did not give a picture.'); });
    }
    function load(x) { if (!x) return; if (typeof x === 'string') fromUrl(x); else fromBlob(x); }
    // Cut away margins that are empty (see-through) or the same color as the edges.
    function trim() {
      var o = trimmed(src, sw, sh, { alpha: alpha, edge: edge });
      if (!o) { say('No empty edges to trim.'); return; }
      src = o; sw = o.width; sh = o.height; say(''); setFit('fit');
    }

    drop.addEventListener('dragover', function (e) { e.preventDefault(); });
    root.addEventListener('dragover', function (e) { e.preventDefault(); root.classList.add('over'); });
    root.addEventListener('dragleave', function (e) { if (!root.contains(e.relatedTarget)) root.classList.remove('over'); });
    root.addEventListener('drop', function (e) {
      e.preventDefault(); root.classList.remove('over');
      var dt = e.dataTransfer, f = dt.files && dt.files[0];
      if (f) return fromBlob(f);
      // A picture dragged from another tab arrives as its link (or HTML with its src).
      var html = dt.getData('text/html'), m = html && html.match(/<img[^>]+src=["']([^"']+)["']/i);
      fromUrl(m ? m[1].replace(/&amp;/g, '&') : (dt.getData('text/uri-list') || dt.getData('text/plain')).split('\n')[0]);
    });
    file.addEventListener('change', function () { if (file.files[0]) fromBlob(file.files[0]); file.value = ''; });
    function onPaste(e) {
      if (!document.body.contains(el)) { document.removeEventListener('paste', onPaste); return; }
      var a = e.target; if (a && a !== urlIn && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) if (items[i].kind === 'file' && /^image\//.test(items[i].type)) { e.preventDefault(); return fromBlob(items[i].getAsFile()); }
      var t = e.clipboardData && e.clipboardData.getData('text');
      if (a !== urlIn && t && /^(https?:\/\/|data:image\/)/i.test(t.trim())) { e.preventDefault(); fromUrl(t); }
    }
    document.addEventListener('paste', onPaste);
    el.querySelector('[data-v="url"]').addEventListener('click', function () { fromUrl(urlIn.value); });
    urlIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); fromUrl(urlIn.value); } });
    el.querySelector('[data-v="fit"]').addEventListener('click', function () { setFit('fit'); });
    el.querySelector('[data-v="fill"]').addEventListener('click', function () { setFit('fill'); });
    el.querySelector('[data-v="center"]').addEventListener('click', function () { ox = 0; oy = 0; draw(); });
    el.querySelector('[data-v="trim"]').addEventListener('click', trim);
    el.querySelector('[data-v="new"]').addEventListener('click', function () { src = null; tools(false); say(''); draw(); });
    zoom.addEventListener('input', function () { scale = fit * (+zoom.value / 100); draw(); });
    Array.prototype.forEach.call(el.querySelectorAll('[data-bg]'), function (b) {
      b.addEventListener('click', function () { bgMode = b.dataset.bg; bg = bgMode === 'edge' ? edge : bgMode; draw(); });
    });
    color.addEventListener('input', function () { bgMode = color.value; bg = color.value; draw(); });
    var stage = el.querySelector('.vle-stage'), drag = null;
    stage.addEventListener('pointerdown', function (e) { if (!src) return; drag = { x: e.clientX, y: e.clientY, ox: ox, oy: oy }; stage.setPointerCapture(e.pointerId); stage.classList.add('drag'); });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return; var k = OUT / stage.clientWidth;
      ox = drag.ox + (e.clientX - drag.x) * k; oy = drag.oy + (e.clientY - drag.y) * k; draw();
    });
    stage.addEventListener('pointerup', function () { drag = null; stage.classList.remove('drag'); });
    stage.addEventListener('pointercancel', function () { drag = null; stage.classList.remove('drag'); });
    stage.addEventListener('wheel', function (e) {
      if (!src) return; e.preventDefault();
      scale = Math.max(fit * 0.1, Math.min(fit * 5, scale * (e.deltaY < 0 ? 1.06 : 1 / 1.06))); draw();
    }, { passive: false });
    draw();
    return {
      load: load,
      ready: function () { return !!src; },
      toBlob: function () { draw(); return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92); }); },
    };
  }
  window.VELogoEditor = { mount: mount, auto: auto, size: OUT };
})();
