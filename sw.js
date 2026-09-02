// Service worker : mise en cache pour un fonctionnement hors-ligne.
// Stratégie : réseau d'abord (pour toujours servir la dernière version
// déployée quand on est en ligne), avec repli sur le cache uniquement
// si le réseau échoue (hors-ligne). Le cache est aussi tenu à jour en
// tâche de fond à chaque requête réussie.
const CACHE_VERSION = "v2";
const CACHE_NAME = "barometre-interieur-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "./",
  "./barometre-interieur-partage.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => {
        if (cached) return cached;
        if (req.mode === "navigate") {
          return caches.match("./barometre-interieur-partage.html");
        }
        return undefined;
      }))
  );
});
