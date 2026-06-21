const CACHE = "panelvault-v2";
const PRECACHE = ["/", "/index.html", "/manifest.json", "/icon.svg"];

const SKIP_CACHE = [
  "api.jikan.moe",
  "api.mangadex.org",
  "uploads.mangadex.org",
  "supabase.co",
  "myanimelist.net",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Skip non-GET and external API calls — let them go straight to network
  if (e.request.method !== "GET") return;
  if (SKIP_CACHE.some((host) => url.includes(host))) return;
  // Skip chrome-extension and non-http requests
  if (!url.startsWith("http")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Cache hit — return immediately, then refresh in background
      if (cached) {
        fetch(e.request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE).then((c) => c.put(e.request, response));
            }
          })
          .catch(() => {});
        return cached;
      }

      // Cache miss — fetch from network and cache the response
      return fetch(e.request)
        .then((response) => {
          if (response.ok && response.type !== "opaque") {
            const clone = response.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});

self.addEventListener("push", (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || "PanelVault", {
      body: data.body || "New updates available.",
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      if (cs.length > 0) {
        cs[0].focus();
        cs[0].navigate(e.notification.data?.url || "/");
      } else {
        clients.openWindow(e.notification.data?.url || "/");
      }
    })
  );
});
