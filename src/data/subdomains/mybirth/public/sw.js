/*
   MyBirth's service worker.

   Two jobs, and deliberately not a third. It makes the shell survive a lost connection, and it
   makes a second visit cheap. It does not try to be an offline copy of the product: the archive
   is assembled from half a dozen public APIs, and a cached weather reading from three weeks ago
   presented as today's is exactly the kind of unverifiable figure this site exists to refuse.
   Anything cross-origin is passed straight through and never stored.

   There is no build step here. The file is served from public/ verbatim, so it cannot be handed
   the hashed asset names, and precaching a list it would have to guess at is worse than useless.
   Instead: navigations are network-first, which means a deploy is picked up the moment the
   visitor is online, and the hashed files under /assets/ are content-addressed, so they can be
   cached hard and forever without ever going stale.

   VERSION only needs bumping when the *strategies* below change. A new deploy of the site does
   not need it — new hashes are new cache entries, and the old ones fall out with the old worker.
*/
const VERSION = "1";
const SHELL_CACHE = `mybirth-shell-v${VERSION}`;
const ASSET_CACHE = `mybirth-assets-v${VERSION}`;
const KEEP = new Set([SHELL_CACHE, ASSET_CACHE]);

/** What a navigation falls back to when the network is gone. */
const SHELL_URL = "/";

/*
   The 3D models are several megabytes each and every one of them is optional decoration: the
   archive renders without them. Caching them would spend most of a visitor's storage budget on
   the least important bytes on the page, so they are fetched normally and never kept.
*/
const NEVER_CACHE = [/^\/models\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.add(new Request(SHELL_URL, { cache: "reload" })))
      // a shell that would not download is not a reason to refuse to install; the worker is
      // still useful for assets, and the next navigation will fill this in
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith("mybirth-") && !KEEP.has(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* the page asks for the new worker when it is ready to take it, never the other way round */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((re) => re.test(url.pathname))) return;

  if (request.mode === "navigate") {
    event.respondWith(navigation(request));
    return;
  }
  event.respondWith(asset(request));
});

/**
 * Network first, and the cached shell only when the network has actually failed.
 *
 * Falling back on a non-ok response instead would hide a real 404 behind a stale page, which is
 * the harder bug to find of the two.
 */
async function navigation(request) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(SHELL_URL, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(SHELL_URL);
    if (cached) return cached;
    throw new Error("offline, and no shell cached yet");
  }
}

/**
 * Cache first for the hashed build output, stale-while-revalidate for everything else.
 *
 * A file under /assets/ carries its content hash in its name, so it can never change under that
 * URL and re-checking it costs a round trip for a guaranteed 304. Fonts, icons and the manifest
 * keep their names across deploys, so those are served from the cache and refreshed behind the
 * reader rather than in front of them.
 */
async function asset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const immutable = new URL(request.url).pathname.startsWith("/assets/");

  if (cached && immutable) return cached;

  const network = fetch(request)
    .then((response) => {
      // opaque and partial responses are not safe to replay; only a plain, whole, ok one is kept
      if (response.ok && response.type === "basic") cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) return cached;
  const fresh = await network;
  if (fresh) return fresh;
  throw new Error(`offline, and ${request.url} was never cached`);
}
