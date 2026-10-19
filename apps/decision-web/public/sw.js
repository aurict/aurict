/*
 * Service worker retirement stub.
 *
 * Aurict Decision no longer uses a service worker, but older deployments registered
 * /sw.js with a root scope. Keeping this small, cache-free worker available lets
 * browsers replace that legacy worker without receiving a 404. It deliberately
 * has no fetch or navigation handlers and never reloads a client.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
