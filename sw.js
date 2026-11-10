// Makes the store installable and usable offline.
const CACHE = 'shop-v3';
const SHELL = self.registration.scope;

async function precache() {
  const cache = await caches.open(CACHE);
  const response = await fetch(new URL('precache-manifest.json', SHELL), { cache: 'no-store' });
  const files = await response.json();
  // One missing file must not stop everything else from being cached.
  await Promise.allSettled(['', 'manifest.webmanifest', ...files].map((file) => cache.add(new URL(file, SHELL))));
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// Pages come from the network when possible so new releases show up; files are hashed, so cached copies stay valid.
async function respond(request) {
  const cache = await caches.open(CACHE);
  if (request.mode === 'navigate') {
    try {
      return await fetch(request);
    } catch {
      return (await cache.match(SHELL)) ?? Response.error();
    }
  }

  // Matched by URL alone: module scripts send an Origin header that precaching doesn't,
  // so a server's "Vary: Origin" would otherwise turn every lookup into a miss.
  const cached = await cache.match(request.url, { ignoreVary: true });
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) await cache.put(request.url, fresh.clone());
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'GET' && request.url.startsWith(SHELL)) {
    event.respondWith(respond(request));
  }
});
