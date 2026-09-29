// public/depot-preview.js
// Preview (Sean, 2026-09-29): shows a Pulse piece, draft or not, on its real article page in a
// lightbox, with a Desktop / Phone toggle. Any button with data-preview="<ve_pulse_content id>"
// (and optionally data-preview-title) opens it. The link comes from the ve-news-desk engine
// (pulse_preview), lasts one hour, and is never indexed. The same Preview exists in HQ's Depot.
// Needs /public/ve-auth.js on the page. Inside the dashboard frame, depot-tabs.js places the
// dialog where Sean is looking.
(function () {
  if (window.VEDepotPreview) return;
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-news-desk';
  var dlg, frame, head, status, link, btnDesk, btnPhone, opener;

  var st = document.createElement('style');
  st.textContent =
    'dialog.ve-pv{border:0;border-radius:14px;padding:0;width:min(1200px,calc(100% - 32px));height:calc(var(--ve-view-h,100vh) - 48px);max-height:none;box-shadow:0 24px 60px rgba(0,0,0,.35);background:#f4f6f4;font-family:Montserrat,system-ui,sans-serif;}' +
    'dialog.ve-pv[open]{display:flex;flex-direction:column;}' +
    'dialog.ve-pv::backdrop{background:rgba(10,20,12,.7);}' +
    '.ve-pv-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 14px;background:#fff;border-bottom:1px solid rgba(0,0,0,.12);}' +
    '.ve-pv-bar h2{flex:1 1 220px;min-width:0;margin:0;font-size:14.5px;font-weight:800;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.ve-pv-seg{display:inline-flex;border:1px solid rgba(0,0,0,.25);border-radius:8px;overflow:hidden;}' +
    '.ve-pv-seg button{font:inherit;font-size:13px;font-weight:700;padding:8px 12px;min-height:40px;border:0;background:#fff;color:#1a1a1a;cursor:pointer;}' +
    '.ve-pv-seg button[aria-pressed=true]{background:#1f5f2a;color:#fff;}' +
    '.ve-pv-bar a,.ve-pv-close{box-sizing:border-box;font:inherit;font-size:13px;font-weight:700;padding:8px 12px;min-height:40px;display:inline-flex;align-items:center;border-radius:8px;border:1px solid rgba(0,0,0,.25);background:#fff;color:#1a1a1a;text-decoration:none;cursor:pointer;}' +
    '.ve-pv-bar a[hidden]{display:none;}' +
    '.ve-pv-close{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}' +
    '.ve-pv-body{flex:1;min-height:0;display:flex;justify-content:center;overflow:auto;padding:0;}' +
    '.ve-pv-body.phone{padding:14px 0;}' +
    '.ve-pv-body iframe{border:0;width:100%;height:100%;background:#fff;display:block;}' +
    '.ve-pv-body.phone iframe{width:390px;max-width:100%;border-radius:22px;box-shadow:0 0 0 8px #1a1a1a;}' +
    '.ve-pv-status{margin:auto;padding:24px;font-size:14px;color:#1a1a1a;text-align:center;}' +
    '@media (max-width:600px){dialog.ve-pv{width:100%;max-width:100%;height:100%;margin:0;border-radius:0;}}';
  document.head.appendChild(st);

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 've-pv';
    dlg.setAttribute('aria-labelledby', 've-pv-h');
    dlg.innerHTML =
      '<div class="ve-pv-bar"><h2 id="ve-pv-h">Preview</h2>' +
      '<div class="ve-pv-seg" role="group" aria-label="Screen size"><button type="button" data-pv="desk" aria-pressed="true">Desktop</button><button type="button" data-pv="phone" aria-pressed="false">Phone</button></div>' +
      '<a target="_blank" rel="noopener" hidden>Open in a new tab</a>' +
      '<button type="button" class="ve-pv-close">Close</button></div>' +
      '<div class="ve-pv-body"><p class="ve-pv-status" role="status"></p></div>';
    document.body.appendChild(dlg);
    head = dlg.querySelector('h2');
    status = dlg.querySelector('.ve-pv-status');
    link = dlg.querySelector('.ve-pv-bar a');
    btnDesk = dlg.querySelector('[data-pv=desk]');
    btnPhone = dlg.querySelector('[data-pv=phone]');
    btnDesk.addEventListener('click', function () { size(false); });
    btnPhone.addEventListener('click', function () { size(true); });
    dlg.querySelector('.ve-pv-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      if (frame) { frame.remove(); frame = null; }
      document.documentElement.style.overflow = '';
      if (opener && opener.focus) opener.focus();
    });
  }

  function size(phone) {
    dlg.querySelector('.ve-pv-body').classList.toggle('phone', phone);
    btnDesk.setAttribute('aria-pressed', String(!phone));
    btnPhone.setAttribute('aria-pressed', String(phone));
  }

  function say(msg) { status.textContent = msg; status.hidden = false; }

  function open(pulseId, title) {
    if (!dlg) build();
    opener = document.activeElement;
    head.textContent = 'Preview: ' + (title || 'this piece');
    link.hidden = true;
    if (frame) { frame.remove(); frame = null; }
    size(false);
    say('Opening the preview...');
    document.documentElement.style.overflow = 'hidden';
    dlg.showModal();
    dlg.querySelector('.ve-pv-close').focus();
    var token = window.VEAuth && VEAuth.getToken ? VEAuth.getToken() : '';
    fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ action: 'pulse_preview', pulse_id: pulseId }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!dlg.open) return;
        if (!d || !d.ok || !/^https:\/\//.test(String(d.url || ''))) {
          return say(d && d.error === 'not_found' ? 'That piece is gone. Refresh the page.' : 'The preview did not open. Try again.');
        }
        status.hidden = true;
        link.href = d.url; link.hidden = false;
        frame = document.createElement('iframe');
        frame.title = 'Preview of ' + (title || 'this piece');
        frame.src = d.url;
        dlg.querySelector('.ve-pv-body').appendChild(frame);
      }, function () { if (dlg.open) say('Could not connect. Try again.'); });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-preview]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    open(b.getAttribute('data-preview'), b.getAttribute('data-preview-title') || '');
  }, true);

  window.VEDepotPreview = { open: open };
})();
