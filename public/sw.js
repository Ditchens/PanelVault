const CACHE = "panelvault-v4";
// Never precache index.html — Vite bundles have content hashes so the HTML
// must always be fetched fresh or the old HTML references the old JS filename.
const PRECACHE = ["/manifest.json", "/icon.svg"];

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
  // Claim clients first so we can navigate them, then clean old caches,
  // then force-reload every open window. This breaks the iOS PWA stale-JS
  // cycle even when the old page has no controllerchange listener.
  e.waitUntil(
    self.clients.claim()
      .then(() => caches.keys())
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Skip non-GET and external API calls
  if (e.request.method !== "GET") return;
  if (SKIP_CACHE.some((host) => url.includes(host))) return;
  if (!url.startsWith("http")) return;

  // Always fetch HTML from network so the app shell stays current.
  // Vite changes the JS bundle filename on every build, so serving a cached
  // index.html would point to a JS file that may no longer exist on the CDN.
  const isHtml =
    url.endsWith("/") ||
    url.includes("/index.html") ||
    (!url.includes(".", url.lastIndexOf("/")) && !url.includes("?"));

  if (isHtml) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Cache hit — return immediately, refresh in background
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

      // Cache miss — fetch from network and cache
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
