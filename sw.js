/* Vegans Explore service worker (playbook ve-mobile-app, step D, 2026-11-07).
 * Kept small on purpose: the site changes daily, so nothing is served from a stale copy while the network works.
 *  - Page loads go to the network first. Only when the network fails do we show the copy we kept of that page (if any),
 *    else /offline.html.
 *  - Our icons and the offline page are kept on install. Nothing else is cached ahead of time.
 *  - Never touches other sites, POSTs, the API (/api/, functions), /admin/ or the dashboard's data.
 * A change here: bump VERSION. */
var VERSION = 've-sw-v2';
var SHELL = ['/offline', '/public/app/icon-192.png', '/public/app/icon-512.png', '/favicon.ico'];
var PAGES = VERSION + '-pages';
var MAX_PAGES = 30;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== PAGES; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function trim(cache) {
  cache.keys().then(function (keys) { if (keys.length > MAX_PAGES) cache.delete(keys[0]).then(function () { trim(cache); }); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode !== 'navigate') return;
  if (/^\/(admin|api|go|auth)\//.test(url.pathname)) return;
  e.respondWith(fetch(req).then(function (res) {
    // Keep a copy of ordinary pages that loaded fine, for the next time the network is gone.
    if (res && res.ok && res.type === 'basic') {
      var copy = res.clone();
      caches.open(PAGES).then(function (c) { c.put(url.pathname + url.search, copy).then(function () { trim(c); }); });
    }
    return res;
  }).catch(function () {
    return caches.open(PAGES).then(function (c) { return c.match(url.pathname + url.search); }).then(function (hit) {
      return hit || caches.match('/offline');
    });
  }));
});
