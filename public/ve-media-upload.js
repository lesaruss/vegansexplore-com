/* Upload into the Vegans Explore media library (images, audio, video).
 *
 * One uploader for every page that adds media (Media Library, Onboarding images),
 * so they never drift apart. Superadmins only; the ve-media-library function
 * checks. Sean, 2026-09-27: "expand this so it takes multiple types of media".
 *
 *   Images: resized in the browser to at most 2400px (WebP, or JPEG on Safari)
 *           with a 480px thumbnail, then posted to the function.
 *   Audio and video: sent as is, straight to storage through a one-time signed
 *           upload URL, then registered with their length (and size, for video).
 *   Every file is named by the SHA-256 of the original, so a file dropped twice
 *   is kept once.
 *
 *   VEMediaUpload.accepts(file)                 -> 'image' | 'audio' | 'video' | null
 *   VEMediaUpload.upload(files, token, onStep)  -> Promise<{ added, dupes, errors, items, saved }>
 *     items: only the files that are new to the library. saved: the library item for every
 *     file that went through, new or already there, in order (the Logos tab needs a dupe's url).
 *   VEMediaUpload.bindDrop(dropEl, inputEl, onFiles)   folder drag-and-drop + click to choose
 *   VEMediaUpload.logoFile(blob, listing)  -> Promise<File>  a logo drawn onto white, at most 800px, as PNG
 *   VEMediaUpload.setLogo(token, blob, listing) -> Promise<listing>  upload it and put it on the listing
 *   A File may carry veRef (where it came from, e.g. 'higgsfield:<id>') and veName (its label).
 */
(function () {
  var FN = 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-media-library';
  var MAX_MEDIA = 50 * 1024 * 1024; // the storage upload limit
  var EXT = { png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', ogg: 'audio', mp4: 'video', mov: 'video', webm: 'video' };

  function ext(f) { var m = /\.([a-z0-9]+)$/i.exec(f.name || ''); return m ? m[1].toLowerCase() : ''; }
  function accepts(f) { return EXT[ext(f)] || null; }
  function api(token, body) {
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { d._status = r.status; return d; }); });
  }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function sha256(ab) { return crypto.subtle.digest('SHA-256', ab).then(hex); }

  // ---- images
  function toBlob(c, type, q) { return new Promise(function (res) { c.toBlob(res, type, q); }); }
  function encode(c, q) { return toBlob(c, 'image/webp', q).then(function (b) { return b && b.type === 'image/webp' ? b : toBlob(c, 'image/jpeg', q); }); }
  function drawAt(bmp, w) {
    var h = Math.round(bmp.height * w / bmp.width), c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h);
    return c;
  }
  function b64(blob) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1]); }; r.onerror = rej; r.readAsDataURL(blob); }); }
  function uploadImage(f, token) {
    return f.arrayBuffer().then(function (ab) {
      return Promise.all([sha256(ab), createImageBitmap(new Blob([ab], { type: f.type || 'image/png' }))]);
    }).then(function (r) {
      var bmp = r[1], k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
      var fw = Math.round(bmp.width * k), fh = Math.round(bmp.height * k);
      return Promise.all([encode(drawAt(bmp, fw), 0.86), encode(drawAt(bmp, Math.min(480, fw)), 0.8)]).then(function (bl) {
        return Promise.all([b64(bl[0]), b64(bl[1])]);
      }).then(function (s) {
        return api(token, { action: 'upload', sha256: r[0], width: fw, height: fh, full_b64: s[0], thumb_b64: s[1], source_name: f.veName || f.webkitRelativePath || f.name, source_ref: f.veRef || null, license: f.veLicense, credit: f.veCredit, source_page_url: f.veSourcePage });
      });
    });
  }

  // ---- audio and video
  function probe(f, kind) {
    return new Promise(function (res) {
      var el = document.createElement(kind === 'video' ? 'video' : 'audio'), url = URL.createObjectURL(f), done = false;
      function finish(v) { if (done) return; done = true; URL.revokeObjectURL(url); res(v); }
      el.preload = 'metadata';
      el.onloadedmetadata = function () { finish({ duration: isFinite(el.duration) ? el.duration : null, width: el.videoWidth || null, height: el.videoHeight || null }); };
      el.onerror = function () { finish({}); };
      setTimeout(function () { finish({}); }, 8000);
      el.src = url;
    });
  }
  function uploadMedia(f, kind, token) {
    if (f.size > MAX_MEDIA) return Promise.resolve({ error: 'too_large' });
    var e = ext(f);
    return f.arrayBuffer().then(sha256).then(function (sha) {
      return api(token, { action: 'upload_url', sha256: sha, kind: kind, ext: e }).then(function (d) {
        if (!d.ok || d.duplicate) return d;
        // Same request the Supabase storage client sends for uploadToSignedUrl.
        var form = new FormData(); form.append('cacheControl', '3600'); form.append('', f);
        return fetch(d.signed_url, { method: 'PUT', headers: { 'x-upsert': 'true' }, body: form })
          .then(function (r) { if (!r.ok) throw new Error('storage ' + r.status); return probe(f, kind); })
          .then(function (m) {
            return api(token, { action: 'register', sha256: sha, kind: kind, ext: e, bytes: f.size, duration: m.duration, width: m.width, height: m.height, source_name: f.webkitRelativePath || f.name });
          });
      });
    });
  }

  function upload(files, token, onStep) {
    var list = files.filter(accepts), out = { added: 0, dupes: 0, errors: [], items: [], saved: [], skipped: files.length - list.length };
    return list.reduce(function (p, f, i) {
      return p.then(function () {
        if (onStep) onStep(i + 1, list.length, f);
        var kind = accepts(f);
        return (kind === 'image' ? uploadImage(f, token) : uploadMedia(f, kind, token)).then(function (d) {
          if (d.ok && d.item) out.saved.push(d.item);
          if (d.ok && d.duplicate) out.dupes++;
          else if (d.ok) { out.added++; out.items.push(d.item); }
          else out.errors.push(f.name + (d.error === 'too_large' ? ' (over 50 MB)' : d._status === 403 ? ' (admins only)' : ''));
        }).catch(function () { out.errors.push(f.name); });
      });
    }, Promise.resolve()).then(function () { return out; });
  }

  // Folder drops: walk the directory tree (Chrome, Edge, Safari, Firefox all support entries).
  function walk(entry) {
    return new Promise(function (res) {
      if (entry.isFile) return entry.file(function (f) { res([f]); }, function () { res([]); });
      if (!entry.isDirectory) return res([]);
      var rd = entry.createReader(), acc = [];
      (function more() {
        rd.readEntries(function (ents) {
          if (!ents.length) return Promise.all(acc.map(walk)).then(function (l) { res([].concat.apply([], l)); });
          acc = acc.concat(Array.prototype.slice.call(ents)); more();
        }, function () { res([]); });
      })();
    });
  }
  function bindDrop(dropEl, inputEl, onFiles) {
    ['dragenter', 'dragover'].forEach(function (t) { dropEl.addEventListener(t, function (e) { e.preventDefault(); dropEl.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { dropEl.addEventListener(t, function (e) { e.preventDefault(); dropEl.classList.remove('over'); }); });
    dropEl.addEventListener('drop', function (e) {
      var dt = e.dataTransfer, en = [];
      if (dt.items) for (var i = 0; i < dt.items.length; i++) { var x = dt.items[i].webkitGetAsEntry && dt.items[i].webkitGetAsEntry(); if (x) en.push(x); }
      if (en.length) Promise.all(en.map(walk)).then(function (l) { onFiles([].concat.apply([], l)); });
      else onFiles(Array.prototype.slice.call(dt.files || []));
    });
    dropEl.addEventListener('click', function (e) { if (e.target.closest('a')) return; inputEl.click(); });
    dropEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputEl.click(); } });
    inputEl.addEventListener('change', function (e) { onFiles(Array.prototype.slice.call(e.target.files || [])); e.target.value = ''; });
  }

  // Directory logos (the Depot's Logos tab and the listing editor). Any picture (PNG, JPEG, WebP,
  // SVG, GIF...) is drawn onto white first, so a see-through logo never turns black where the
  // library saves JPEG, and scaled to at most 800px, plenty for a 72px card on a sharp screen.
  var LOGO_MAX = 800;
  function logoFile(blob, l) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || 512, h = img.naturalHeight || 512, k = Math.min(1, LOGO_MAX / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) return rej(new Error('encode'));
          var f = new File([b], (l.slug || 'logo') + '-logo.png', { type: 'image/png' });
          f.veName = l.name + ' logo'; f.veRef = 'listing-logo:' + String(l.slug || l.id).slice(0, 180);
          res(f);
        }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('not_an_image')); };
      img.src = url;
    });
  }
  function setLogo(token, blob, l) {
    return logoFile(blob, l).then(function (f) { return upload([f], token); }).then(function (r) {
      var it = r.saved[0]; if (!it) throw new Error('upload');
      return api(token, { action: 'logo_set', listing_id: l.id, url: it.url });
    }).then(function (d) { if (!d.ok) throw new Error(d.error || 'save'); return d.listing; });
  }

  window.VEMediaUpload = { accepts: accepts, upload: upload, bindDrop: bindDrop, api: api, logoFile: logoFile, setLogo: setLogo };
})();
