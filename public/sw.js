const CACHE_NAME = 'academy-v2'
const STATIC_CACHE = 'academy-static-v2'
const DYNAMIC_CACHE = 'academy-dynamic-v2'
const CONTENT_CACHE = 'academy-content-v2'

const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/courses',
  '/assessments',
  '/leaderboard',
  '/community',
  '/career',
  '/profile',
  '/settings',
  '/manifest.json',
]

const CONTENT_PATTERNS = [
  '/lesson/',
  '/courses/',
  '/assessments/',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== CONTENT_CACHE)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  // API requests: network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }

  // Content pages (lessons, courses, assessments): cache-on-visit for offline reading
  if (isContentPage(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Same-origin navigation & pages: stale-while-revalidate
  if (url.origin === location.origin) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // External assets (images, scripts): cache first
  event.respondWith(cacheFirst(request))
})

function isContentPage(pathname) {
  return CONTENT_PATTERNS.some((pattern) => pathname.startsWith(pattern))
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cacheTarget = isContentPage(new URL(request.url).pathname) ? CONTENT_CACHE : DYNAMIC_CACHE
      caches.open(cacheTarget).then((cache) => {
        cache.put(request, response.clone())
      })
    }
    return response
  }).catch(() => {
    // Network failed, cached response will be used
  })
  return cached || fetchPromise
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ─── Push notifications ───────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(self.clients.openWindow(url))
})
