/* global __PRECACHE__, __VERSION__ */
const VERSION = "3daa085e9739";
const BASE = "/klick-desk/";
const PREFIX = "klick-desk-";
const SHELL = `${PREFIX}shell-${VERSION}`;
const STATIC = `${PREFIX}static-${VERSION}`;
const API = `${PREFIX}public-api-${VERSION}`;
const PRECACHE = ["/klick-desk/assets/AboutPage-DlAQadmm.js","/klick-desk/assets/AuthSetupNotice-CBn3dORC.js","/klick-desk/assets/DashboardPage-C-5meeoI.js","/klick-desk/assets/LoginPage-BacLk9WL.js","/klick-desk/assets/MoviesPage-DYcIwq7E.js","/klick-desk/assets/NotFoundPage-CJukuOLy.js","/klick-desk/assets/OfflinePage-C60mz08z.js","/klick-desk/assets/ProfilePage-CWvSyNBj.js","/klick-desk/assets/SignupPage-CQu1IEgG.js","/klick-desk/assets/index-BDdDfrTS.css","/klick-desk/assets/index-DxzJCfuD.js","/klick-desk/assets/jsx-runtime-DyZJNswf.js","/klick-desk/assets/onest-cyrillic-ext-wght-normal-DOFToQv1.woff2","/klick-desk/assets/onest-cyrillic-wght-normal-DayYxulF.woff2","/klick-desk/assets/onest-latin-ext-wght-normal-QAhDxQuo.woff2","/klick-desk/assets/onest-latin-wght-normal-Dun_Rd-l.woff2","/klick-desk/assets/onest-math-wght-normal-Bl4ZGkZl.woff2","/klick-desk/assets/onest-symbols-wght-normal-DxQzqQfC.woff2","/klick-desk/assets/onest-vietnamese-wght-normal-BBxOatbv.woff2","/klick-desk/assets/redux-toolkit.modern-B0rHE7b7.js","/klick-desk/favicon.png","/klick-desk/icons/icon-192.png","/klick-desk/icons/icon-512.png","/klick-desk/images/klick-focus.webp","/klick-desk/images/klick-happy.webp","/klick-desk/images/klick-idle.webp","/klick-desk/index.html","/klick-desk/manifest.json","/klick-desk/offline.html"];
const DAY = 86400000;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX) && ![SHELL, STATIC, API].includes(key))
          await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
async function storeResponse(cacheName, request, response, max) {
  if (!response.ok || response.type === "opaque") return;
  const headers = new Headers(response.headers);
  headers.set("X-Klick-Saved-At", String(Date.now()));
  const copy = new Response(await response.clone().arrayBuffer(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  const cache = await caches.open(cacheName);
  await cache.delete(request);
  await cache.put(request, copy);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max)))
    await cache.delete(key);
}
async function cachedResponse(cacheName, request, ttl, mark = false) {
  const cache = await caches.open(cacheName);
  const response = await cache.match(request);
  if (!response) return null;
  if (Date.now() - Number(response.headers.get("X-Klick-Saved-At")) > ttl) {
    await cache.delete(request);
    return null;
  }
  if (!mark) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Klick-Cache", "hit");
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers,
  });
}
async function networkFirst(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (!response.ok) throw new Error("Public API unavailable");
    await storeResponse(API, request, response, 40);
    return response;
  } catch {
    return (
      (await cachedResponse(API, request, 7 * DAY, true)) || Response.error()
    );
  } finally {
    clearTimeout(timer);
  }
}
async function cacheFirst(request) {
  // Module requests may carry Origin while precache requests do not (Vary: Origin).
  // These are public, content-hashed same-origin build assets.
  const precached = await (
    await caches.open(SHELL)
  ).match(request, { ignoreVary: true });
  if (precached) return precached;
  const cached = await cachedResponse(STATIC, request, 30 * DAY);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await storeResponse(STATIC, request, response, 60);
    return response;
  } catch {
    return Response.error();
  }
}
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Explicit public endpoints only. Never intercept auth, private APIs or credentials.
  if (request.method !== "GET" || request.headers.has("Authorization")) return;
  const publicApi =
    (url.origin === "https://api.open-meteo.com" &&
      url.pathname === "/v1/forecast") ||
    (url.origin === "https://api.themoviedb.org" &&
      /^\/3\/movie\/(popular|\d+)$/.test(url.pathname));
  if (publicApi) {
    event.respondWith(networkFirst(request));
    return;
  }
  const sameApp =
    url.origin === self.location.origin && url.pathname.startsWith(BASE);
  if (sameApp && request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) return response;
          // GitHub Pages returns its redirecting 404 for deep routes. Use the SPA shell.
        } catch {
          /* Offline: all bundled routes are in the application shell. */
        }
        const cache = await caches.open(SHELL);
        const relative = url.pathname.slice(BASE.length);
        const appRoute =
          /^(|about\/?|dashboard\/?|movies\/?|login\/?|signup\/?|profile\/?|tasks(?:\/[^/]+)?\/?|offline\/?)$/.test(
            relative,
          );
        return (
          (await cache.match(
            appRoute ? `${BASE}index.html` : `${BASE}offline.html`,
          )) || Response.error()
        );
      })(),
    );
    return;
  }
  const publicImage =
    url.origin === "https://image.tmdb.org" && url.pathname.startsWith("/t/p/");
  if (
    (sameApp && /\.(js|css|woff2?|png|webp|svg|ico)$/.test(url.pathname)) ||
    publicImage
  )
    event.respondWith(cacheFirst(request));
});
