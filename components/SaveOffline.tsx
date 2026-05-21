'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, DownloadCloud, Wifi } from 'lucide-react'
import { cacheForOffline, isCachedForOffline } from '@/lib/offline'

export function SaveOfflineButton({ url }: { url: string }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    isCachedForOffline(url).then(setSaved)
  }, [url])

  async function handleSave() {
    setSaving(true)
    await cacheForOffline([url, '/', '/dashboard'])
    setSaved(true)
    setSaving(false)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSave}
      disabled={saved || saving}
      className="gap-2 text-xs"
    >
      {saved ? (
        <>
          <DownloadCloud className="w-3.5 h-3.5 text-green-500" />
          Saved offline
        </>
      ) : saving ? (
        <>
          <Download className="w-3.5 h-3.5 animate-bounce" />
          Saving...
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          Save offline
        </>
      )}
    </Button>
  )
}

export function OfflineBadge({ url }: { url: string }) {
  const [cached, setCached] = useState(false)

  useEffect(() => {
    isCachedForOffline(url).then(setCached)
  }, [url])

  if (!cached) return null

  return (
    <Badge variant="outline" className="gap-1 text-[10px] text-green-500 border-green-500/30">
      <Wifi className="w-3 h-3" />
      Available offline
    </Badge>
  )
}
