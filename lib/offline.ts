/**
 * Proactively cache the current page and related resources for offline access.
 */
export async function cacheForOffline(urls: string[]) {
  if (!('caches' in window)) return

  try {
    const cache = await caches.open('academy-content-v2')
    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) {
            await cache.put(url, response)
          }
        } catch {
          // silently fail for individual URLs
        }
      })
    )
  } catch {
    // caching not available
  }
}

export async function isCachedForOffline(url: string): Promise<boolean> {
  if (!('caches' in window)) return false
  const cache = await caches.open('academy-content-v2')
  const cached = await cache.match(url)
  return !!cached
}
