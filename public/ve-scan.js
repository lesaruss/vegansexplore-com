/* VE Scan: read a product's barcode with the phone's camera (Sean, 2026-11-01: "a tab where they can scan an item... it should take
 * them to its profile").
 *
 *   VEScan.open({ onCode(code), title? })   a window with the camera, a frame to line the barcode up in, and a box to type the number
 *                                           for anyone without a camera or who would rather; onCode gets the digits once and it closes
 *   VEScan.close()
 *
 * The browser's own BarcodeDetector where it has one (Chrome on Android); else ZXing from jsDelivr (iPhone Safari has no
 * BarcodeDetector). Nothing is recorded; the picture never leaves the phone.
 */
(function () {
  var ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
  var el = null, stream = null, timer = null, reader = null, done = false;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('vsc-style')) return;
    var s = document.createElement('style'); s.id = 'vsc-style';
    s.textContent = '.vsc{position:fixed;inset:0;z-index:100000;background:rgba(10,20,12,.92);display:flex;align-items:center;justify-content:center;padding:16px}' +
      '.vsc-card{background:#fff;border-radius:8px;width:min(480px,100%);max-height:100%;overflow:auto;padding:18px}' +
      '.vsc-top{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.vsc-top h2{font-size:18px;font-weight:900;margin:0}' +
      '.vsc-x{border:0;background:none;font-size:26px;line-height:1;cursor:pointer;padding:4px 8px;color:#1a1a1a}' +
      '.vsc-cam{position:relative;aspect-ratio:4/3;background:#111;border-radius:6px;overflow:hidden}' +
      '.vsc-cam video{width:100%;height:100%;object-fit:cover;display:block}' +
      '.vsc-frame{position:absolute;left:10%;right:10%;top:32%;bottom:32%;border:3px solid #3A9B3E;border-radius:6px;box-shadow:0 0 0 999px rgba(0,0,0,.35)}' +
      '.vsc-msg{font-size:13.5px;line-height:1.5;color:rgba(26,26,26,.75);margin:10px 0 0}' +
      '.vsc-type{display:flex;gap:8px;margin-top:14px}.vsc-type input{flex:1;min-width:0;padding:11px 12px;border:1.5px solid rgba(0,0,0,.18);border-radius:6px;font-size:16px}' +
      '.vsc-type button{padding:11px 16px;border:0;border-radius:6px;background:var(--vb-go,#2D5C27);color:#fff;font-weight:800;font-size:14px;cursor:pointer}';
    document.head.appendChild(s);
  }
  function loadZxing() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = ZXING; s.onload = function () { window.ZXing ? res(window.ZXing) : rej(); }; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function stop() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (reader) { try { reader.reset(); } catch (e) {} reader = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  }
  function close() { stop(); if (el) { el.remove(); el = null; } document.removeEventListener('keydown', onKey); }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function msg(t) { var m = el && el.querySelector('.vsc-msg'); if (m) m.textContent = t; }
  function open(opts) {
    opts = opts || {}; close(); css(); done = false;
    el = document.createElement('div'); el.className = 'vsc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = '<div class="vsc-card"><div class="vsc-top"><h2>' + esc(opts.title || 'Scan a product') + '</h2><button type="button" class="vsc-x" aria-label="Close">&times;</button></div>' +
      '<div class="vsc-cam"><video playsinline muted autoplay></video><div class="vsc-frame" aria-hidden="true"></div></div>' +
      '<p class="vsc-msg" aria-live="polite">Starting the camera...</p>' +
      '<form class="vsc-type"><label class="sr-only" for="vscCode" style="position:absolute;left:-9999px">Barcode number</label><input id="vscCode" inputmode="numeric" autocomplete="off" placeholder="Or type the numbers under the barcode" data-dictate="off"><button type="submit">Look it up</button></form></div>';
    document.body.appendChild(el);
    document.addEventListener('keydown', onKey);
    el.querySelector('.vsc-x').onclick = close;
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    function hit(code) {
      code = String(code || '').replace(/\D/g, '');
      if (done || code.length < 8 || code.length > 14) return;
      done = true;
      if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
      close(); if (opts.onCode) opts.onCode(code);
    }
    el.querySelector('.vsc-type').onsubmit = function (e) {
      e.preventDefault();
      var v = el.querySelector('#vscCode').value.replace(/\D/g, '');
      if (v.length < 8 || v.length > 14) { msg('A barcode has 8 to 14 numbers. Type all of them.'); return; }
      hit(v);
    };
    var video = el.querySelector('video');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg('This browser cannot use the camera here. Type the numbers under the barcode instead.'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(function (s) {
      if (!el) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; video.srcObject = s; video.play().catch(function () {});
      msg('Hold the barcode inside the green frame.');
      if ('BarcodeDetector' in window) {
        var det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        (function tick() {
          if (!el || done) return;
          det.detect(video).then(function (r) { if (r && r.length) hit(r[0].rawValue); else timer = setTimeout(tick, 180); })
            .catch(function () { timer = setTimeout(tick, 400); });
        })();
      } else {
        loadZxing().then(function (Z) {
          if (!el || done) return;
          var hints = new Map();
          hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E]);
          reader = new Z.BrowserMultiFormatReader(hints, 200);
          // ZXing reads the stream we already opened.
          reader.decodeFromStream(stream, video, function (res) { if (res) hit(res.getText()); });
        }).catch(function () { msg('The scanner did not load. Type the numbers under the barcode instead.'); });
      }
    }).catch(function () {
      msg('The camera is off for this page. Allow it in your browser, or type the numbers under the barcode.');
    });
  }
  window.VEScan = { open: open, close: close };
})();
