"use client";

import { useEffect } from "react";

const RETIRED_SERVICE_WORKER_PATHS = new Set(["/sw.js"]);

function isRetiredServiceWorker(scriptURL: string): boolean {
  try {
    const url = new URL(scriptURL);
    return (
      url.origin === window.location.origin &&
      RETIRED_SERVICE_WORKER_PATHS.has(url.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Removes the root-scoped service worker used by older web deployments.
 *
 * Unregistering is idempotent and intentionally does not reload the page. The
 * static /sw.js retirement stub handles clients that are still controlled
 * before this component can run.
 */
export function ServiceWorkerRetirement() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    async function retireLegacyWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (cancelled) {
        return;
      }

      const legacyRegistrations = registrations.filter((registration) =>
        [registration.installing, registration.waiting, registration.active]
          .filter((worker): worker is ServiceWorker => worker !== null)
          .some((worker) => isRetiredServiceWorker(worker.scriptURL)),
      );

      await Promise.all(
        legacyRegistrations.map(async (registration) => {
          try {
            // Fetch /sw.js immediately so the no-op retirement worker can take
            // control of already-open tabs before unregistering itself.
            await registration.update();
          } catch {
            // Offline clients cannot fetch the retirement worker. Removing the
            // registration still prevents it from controlling future sessions.
            await registration.unregister();
          }
        }),
      );
    }

    void retireLegacyWorker().catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Legacy service worker could not be retired.", error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
