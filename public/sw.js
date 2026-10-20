const CACHE = "valeriano-static-v1"
const STATIC_PATH = /^\/(assets\/|favicon|apple-touch-icon|web-app-manifest-|manifest\.json$|valeriano\.webp$)/

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// Only same-origin static GET assets are cached; pages, API and chat requests always use the network.
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !STATIC_PATH.test(url.pathname)
  ) {
    return
  }
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) await cache.put(request, response.clone())
      return response
    })
  )
})
