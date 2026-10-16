/**
 * Service Worker لیگ گرز گران — کش محافظه‌کارانه
 * - کش استاتیک‌ها برای اجرای سریع و آفلاین
 * - هرگز داده‌های حساس مدیر کش نمی‌شوند
 * - صفحهٔ آفلاین برای درخواست‌های ناموفق
 */
const CACHE_NAME = "garz-geran-v2";
const STATIC_ASSETS = ["/offline", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // مسیرهای مدیریتی و API هرگز کش نمی‌شوند
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api"))
    return;

  // ناوبری: شبکه با فالبک آفلاین
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok)
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline")),
        ),
    );
    return;
  }

  // استاتیک‌ها: کش اول
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(svg|png|jpg|jpeg|webp|woff2|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
            return response;
          }),
      ),
    );
  }
});
