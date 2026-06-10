/* =====================================================================
   service-worker.js — Makes MyLift work offline once installed.
   Caches the app files so it opens with no internet (e.g. at the gym).
   Bump CACHE_VERSION whenever you change app files to force an update.
   ===================================================================== */

var CACHE_VERSION = "mylift-v1";
var FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./data/exercises.js",
  "./js/storage.js",
  "./js/planner.js",
  "./js/timer.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(FILES);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Cache-first: serve from cache, fall back to network. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (resp) {
        return resp;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
