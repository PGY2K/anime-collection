const CACHE_NAME = "mat-v6.3.3";
const OFFLINE_ASSETS = [
  "./offline.html",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/mat-logo.png",
  "./assets/icons/rp-gem.png",
  "./js/pioneer-badge.js",
  "./assets/badges/pioneer.png",
  "./assets/badges/anime-completion-master.png",
  "./assets/badges/event-champion.png",
  "./assets/badges/secret-badge.png",
  "./assets/badges/conversation-champion.png",
  "./assets/badges/vip.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" }).catch(() =>
      caches.match("./offline.html")
    )
  );
});
