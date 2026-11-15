const CACHE_NAME = "nexus-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Leave API calls, cross-origin requests, and non-GET requests untouched.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // A network pass-through fetch handler makes the app installable without
  // changing application responses or caching potentially stale user data.
  event.respondWith(fetch(request));
});
