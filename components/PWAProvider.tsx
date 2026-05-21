'use client'

import { useEffect } from 'react'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err)
      })
    }

    if ('Notification' in window && Notification.permission === 'default') {
      console.log('PWA ready - notifications available')
    }
  }, [])

  return <>{children}</>
}
