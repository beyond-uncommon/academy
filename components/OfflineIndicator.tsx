'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
      <WifiOff className="w-4 h-4" />
      You are offline — content from previously visited pages is still available
    </div>
  )
}
