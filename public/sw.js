// ===== Service worker de Tetrago =====
// Site installable (manifest.webmanifest) et fiches déjà consultées relisibles sans réseau. Enregistré par
// src/services/pwa.js (build de production, ou VITE_SERVICE_WORKER=true).
//
// - Pages (navigation) : réseau d'abord, sinon la dernière coquille du site (index.html) gardée ;
// - /assets/ (fichiers du build au nom haché, immuables) : cache d'abord ;
// - API (GET /api/…) : réseau d'abord (au plus RESEAU_MS d'attente quand une copie existe), sinon la dernière réponse
//   gardée ; jamais la session, les notifications ni la connexion. Vidé à la déconnexion (message « vider-api ») ;
// - autres fichiers du site, polices et images : réseau d'abord, copie gardée en secours.
// Changer VERSION à chaque modification de ce fichier : les anciens caches sont supprimés à l'activation.
const VERSION = "v1";
const CACHE_COQUILLE = `tetrago-coquille-${VERSION}`;
const CACHE_SITE = `tetrago-site-${VERSION}`;
const CACHE_ASSETS = `tetrago-assets-${VERSION}`;
const CACHE_API = `tetrago-api-${VERSION}`;
const CACHES = [CACHE_COQUILLE, CACHE_SITE, CACHE_ASSETS, CACHE_API];
const COQUILLE = "/index.html";
const MAX_API = 400;
const MAX_ASSETS = 300;
// Images, manifeste ; en développement, les modules servis un à un par Vite (plusieurs centaines)
const MAX_SITE = 1500;
const RESEAU_MS = 6000;

// Données liées à la session ou qui n'ont pas de sens hors ligne
const API_EXCLUES = [/^\/api\/users\/verify/, /^\/api\/users\/token/, /^\/api\/notifications/, /^\/api\/oauth/, /^\/api\/auth/, /^\/api\/users\/me/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_COQUILLE).then((cache) => cache.add(COQUILLE)),
      caches.open(CACHE_SITE).then((cache) => cache.addAll(["/manifest.webmanifest", "/images/logo/icon-192.png", "/images/logo/tetrago_favicon.svg"])),
    ])
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle.startsWith("tetrago-") && !CACHES.includes(cle)).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "vider-api") event.waitUntil(caches.delete(CACHE_API));
});

// Garde au plus `max` entrées (les plus anciennes partent d'abord)
async function limiter(nom, max) {
  const cache = await caches.open(nom);
  const cles = await cache.keys();
  await Promise.all(cles.slice(0, Math.max(0, cles.length - max)).map((cle) => cache.delete(cle)));
}

async function garder(nom, cle, reponse, max) {
  if (!reponse || !reponse.ok || reponse.type === "opaque") return;
  const cache = await caches.open(nom);
  await cache.put(cle, reponse);
  if (max) await limiter(nom, max);
}

// Réseau d'abord ; une copie gardée répond si le réseau échoue, ou s'il tarde plus de `delai` ms
async function reseauDabord(event, nom, { cle = event.request, max, delai } = {}) {
  const copie = await caches.match(cle, { cacheName: nom });
  const reseau = fetch(event.request).then((reponse) => {
    event.waitUntil(garder(nom, cle, reponse.clone(), max));
    return reponse;
  });
  if (!copie) return reseau;
  const attente = delai ? new Promise((resolve) => setTimeout(() => resolve(copie), delai)) : null;
  try {
    return await (attente ? Promise.race([reseau, attente]) : reseau);
  } catch {
    return copie;
  }
}

async function cacheDabord(event, nom, max) {
  const copie = await caches.match(event.request, { cacheName: nom });
  if (copie) return copie;
  const reponse = await fetch(event.request);
  event.waitUntil(garder(nom, event.request, reponse.clone(), max));
  return reponse;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const memeOrigine = url.origin === self.location.origin;

  if (request.mode === "navigate") {
    if (!memeOrigine) return;
    // La coquille a son propre cache : jamais évincée par la limite des autres fichiers
    event.respondWith(reseauDabord(event, CACHE_COQUILLE, { cle: COQUILLE }).catch(() => caches.match(COQUILLE, { cacheName: CACHE_COQUILLE })));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    if (API_EXCLUES.some((motif) => motif.test(url.pathname))) return;
    event.respondWith(reseauDabord(event, CACHE_API, { max: MAX_API, delai: RESEAU_MS }));
    return;
  }

  if (memeOrigine && url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheDabord(event, CACHE_ASSETS, MAX_ASSETS));
    return;
  }

  // Fichiers du site (images, manifeste, modules du serveur de développement) et polices de la charte
  if (memeOrigine || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(reseauDabord(event, CACHE_SITE, { max: MAX_SITE }));
  }
});
