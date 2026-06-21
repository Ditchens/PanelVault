const CACHE = "panelvault-v1";
const PRECACHE = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
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

// Network-first for API calls, cache-first for assets
self.addEventListener("fetch", (e) => {
  if (e.request.url.includes("api.jikan.moe") || e.request.url.includes("supabase")) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Handle incoming push notifications
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

// Open the app when a notification is clicked
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
