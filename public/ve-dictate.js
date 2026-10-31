/* Speak instead of typing, on every field people write in (Sean, 2026-10-31: "make sure we have the record the dictation feature
 * on all things where people are going to type in information").
 *
 * nav.js loads this on every page (the dashboard loads it itself). When someone is in a textarea or a text field, a small mic sits at
 * its right edge; tap it and the browser's own speech recognition writes what they say into the field at the cursor, until they tap
 * Stop or go quiet. Nothing is recorded or sent by us: the browser does the listening. Browsers without speech recognition
 * (Firefox) show no mic; phones' keyboards have their own.
 *
 * Left out: email, password, number, phone, web address, date and similar fields; very short fields (maxlength under 12); fields
 * whose autocomplete or inputmode says they hold an email, phone, address code or card; anything read-only or disabled; and any
 * field (or anything inside an element) marked data-dictate="off". A page with its own Speak button marks its field that way. */
(function () {
  if (window.VEDictate) return;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { window.VEDictate = { supported: false }; return; }

  var SKIP_AUTO = /email|tel|postal|cc-|one-time-code|username|password|url/i;
  var SKIP_HINT = /^(https?:\/\/|@|www\.)/i;
  var MIC = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><path d="M12 18v4"/></svg>';
  var STOP = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';

  function eligible(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (el.closest && el.closest('[data-dictate="off"]')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    if (t !== 'text' && t !== 'search') return false;
    var max = el.maxLength;
    if (max > 0 && max < 12) return false;
    if (SKIP_AUTO.test(el.getAttribute('autocomplete') || '')) return false;
    if (/email|tel|numeric|decimal|url/i.test(el.getAttribute('inputmode') || '')) return false;
    if (SKIP_HINT.test(el.getAttribute('placeholder') || '')) return false;
    return true;
  }

  // The button floats over the field's right edge while it has focus, so no page's layout changes.
  var css = document.createElement('style');
  css.textContent = '.ve-dict{position:fixed;z-index:2147483000;display:none;align-items:center;gap:6px;height:30px;min-width:30px;padding:0 8px;' +
    'border:1px solid rgba(0,0,0,.14);border-radius:6px;background:#fff;color:#1a3a2a;font:700 12px/1 Montserrat,system-ui,sans-serif;' +
    'cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)}.ve-dict:hover{background:#f2f7f3}.ve-dict span{display:none}' +
    '.ve-dict.on{background:#b42318;border-color:#b42318;color:#fff}.ve-dict.on span{display:inline}' +
    '.ve-dict:focus-visible{outline:2px solid #2e7d4f;outline-offset:2px}';
  (document.head || document.documentElement).appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 've-dict';
  btn.setAttribute('aria-label', 'Speak instead of typing');
  btn.innerHTML = MIC + '<span>Stop</span>';
  var field = null, rec = null, before = '', after = '';

  function place() {
    if (!field || !document.contains(field)) { hide(true); return; }
    var r = field.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > innerHeight) { btn.style.display = 'none'; return; }
    var w = btn.offsetWidth || 30, h = 30;
    var top = field.tagName === 'TEXTAREA' ? r.bottom - h - 6 : r.top + (r.height - h) / 2;
    btn.style.top = Math.max(4, top) + 'px';
    btn.style.left = Math.max(4, r.right - w - 6) + 'px';
    btn.style.display = 'flex';
  }
  function hide(force) {
    if (rec && !force) return;
    btn.style.display = 'none'; field = null;
  }
  function setValue(el, v) {
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var set = Object.getOwnPropertyDescriptor(proto, 'value').set;
    if (el.maxLength > 0) v = v.slice(0, el.maxLength);
    set.call(el, v);                                  // the native setter, so React-style pages see the change
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function stop() { if (rec) rec.stop(); }
  function start() {
    var el = field; if (!el) return;
    var v = el.value || '', s = el.selectionStart == null ? v.length : el.selectionStart, e = el.selectionEnd == null ? v.length : el.selectionEnd;
    before = v.slice(0, s); after = v.slice(e);
    if (before && !/\s$/.test(before)) before += ' ';
    rec = new SR();
    rec.lang = document.documentElement.lang || navigator.language || 'en-US';
    rec.continuous = true; rec.interimResults = true;
    rec.onresult = function (ev) {
      var text = '';
      for (var k = 0; k < ev.results.length; k++) text += ev.results[k][0].transcript;
      text = text.replace(/^\s+/, '');
      setValue(el, before + text + (after && text && !/^\s/.test(after) ? ' ' : '') + after);
      var at = (before + text).length; try { el.setSelectionRange(at, at); } catch (x) {}
    };
    rec.onerror = function () { stop(); };
    rec.onend = function () {
      rec = null; btn.classList.remove('on'); btn.setAttribute('aria-pressed', 'false');
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (document.activeElement !== el) hide(true); else place();
    };
    try { rec.start(); } catch (x) { rec = null; return; }
    btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); place();
  }

  btn.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep the field's focus and cursor
  btn.addEventListener('click', function () { if (rec) stop(); else start(); if (field) field.focus(); });

  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (el === btn) return;
    if (rec && el !== field) stop();
    if (!eligible(el)) { if (!rec) hide(); return; }
    field = el;
    if (!btn.parentNode) document.body.appendChild(btn);
    place();
  });
  document.addEventListener('focusout', function (e) {
    if (e.target !== field) return;
    setTimeout(function () { if (document.activeElement !== btn && document.activeElement !== field) hide(); }, 120);
  });
  addEventListener('scroll', function () { if (field) place(); }, true);
  addEventListener('resize', function () { if (field) place(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && rec) stop(); });

  window.VEDictate = { supported: true, stop: stop };
})();
