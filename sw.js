const CACHE_NAME = "kaarvi-v8";
const CORE = [
  "./",
  "./welcome.html",
  "./index.html",
  "./artisan-hub.html",
  "./buyers-hub.html",
  "./chatbot.html",
  "./login.html",
  "./enhancer.html",
  "./styles.css",
  "./app.js",
  "./products.js",
  "./chat-widget.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache API responses.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok && url.origin === location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then(r => r || caches.match("./index.html")))
  );
});
