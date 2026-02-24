/* ============================
   OtakuZone — SW FINAL CLEAN
   - Pas de /offline.html (fallback sur index.html)
   - Network-first pour HTML/CSS/JS/JSON (évite ancienne version)
   - Cache-first pour images (perf)
   ============================ */

const APP_VERSION = "2.0.0";
const CACHE_NAME = `otakuzone-${APP_VERSION}`;

// ⚠️ Doit matcher TA structure réelle
const CORE = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/app.js",
  "/js/pwa-configs.js",
  "/manifest.json",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png",
  "/assets/icons/og-image.png",
  "/favicon.ico"
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(CORE.map((u) => cache.add(u).catch(() => null)));
    })()
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

// MESSAGES
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Traiter les navigations d'abord
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Essayer le réseau d'abord
          const fresh = await fetch(req);
          // Mettre en cache pour usage futur
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req, fresh.clone());
          return fresh;
        } catch (error) {
          // Fallback au cache
          const cached = await caches.match("/index.html");
          if (cached) return cached;
          // Fallback ultra simple
          return new Response("Pas de connexion", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" }
          });
        }
      })()
    );
    return;
  }

  // Ignorer les requêtes non-GET et cross-origin
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const accept = req.headers.get("accept") || "";
  const isHTML = accept.includes("text/html");
  const isCSS = url.pathname.endsWith(".css");
  const isJS = url.pathname.endsWith(".js");
  const isJSON = url.pathname.endsWith(".json");

  // ✅ Network-first pour éviter les vieilles versions
  if (isHTML || isCSS || isJS || isJSON) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          // Mettre à jour le cache
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          // Fallback au cache
          const cached = await caches.match(req);
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }

  // ✅ Images: cache-first (amélioration performance)
  const isImg = url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico)$/i);
  if (isImg) {
    event.respondWith(
      (async () => {
        // Chercher dans le cache d'abord
        const cached = await caches.match(req);
        if (cached) return cached;
        
        // Sinon, fetch du réseau
        try {
          const fresh = await fetch(req);
          if (fresh.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (error) {
          // Fallback pour les images
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1a1a2e"/><text x="50" y="50" text-anchor="middle" fill="#ff4081" font-family="sans-serif" font-size="10">Image non disponible</text></svg>',
            {
              status: 404,
              headers: { "Content-Type": "image/svg+xml" }
            }
          );
        }
      })()
    );
    return;
  }

  // ✅ API calls: réseau d'abord, puis cache
  const isAPI = url.pathname.includes("/api/") || url.hostname.includes("jikan.moe");
  if (isAPI) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch (error) {
          const cached = await caches.match(req);
          if (cached) return cached;
          throw error;
        }
      })()
    );
    return;
  }

  // ✅ Stratégie par défaut: Cache puis réseau
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      
      try {
        const fresh = await fetch(req);
        // Mettre en cache si c'est une ressource statique
        if (fresh.ok && !req.url.includes("?")) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (error) {
        // Dernier recours
        return new Response("Ressource non disponible hors ligne", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" }
        });
      }
    })()
  );
});