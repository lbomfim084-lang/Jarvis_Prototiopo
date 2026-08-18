// service-worker.js
// Cache básico "app shell" para permitir abrir o JARVIS offline
// (funções que dependem de internet, como IA e pesquisa, continuam exigindo conexão).

const CACHE_NAME = "jarvis-shell-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./modules/ai/aiClient.js",
  "./modules/speech/speech.js",
  "./modules/memory/memoryStore.js",
  "./modules/notes/notesStore.js",
  "./modules/commands/registry.js",
  "./modules/commands/time.js",
  "./modules/commands/date.js",
  "./modules/commands/calculator.js",
  "./modules/commands/browser.js",
  "./modules/commands/search.js",
  "./modules/commands/notes.js",
  "./modules/commands/memory.js",
  "./modules/commands/system.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // Se algum arquivo falhar (ex: durante desenvolvimento), não travar a instalação.
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Não interceptar chamadas de API/rede externas (IA, pesquisa, etc.)
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
    })
  );
});
