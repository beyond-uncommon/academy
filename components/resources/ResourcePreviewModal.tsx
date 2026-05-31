'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Video, FileText, Link2, Figma, Code, BookOpen, Loader2 } from 'lucide-react'

const resourceConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  video: { icon: Video, color: 'text-red-500' },
  article: { icon: FileText, color: 'text-blue-500' },
  figma: { icon: Figma, color: 'text-purple-500' },
  link: { icon: Link2, color: 'text-cyan-500' },
  code: { icon: Code, color: 'text-green-500' },
  book: { icon: BookOpen, color: 'text-amber-500' },
  template: { icon: FileText, color: 'text-pink-500' },
  tool: { icon: Link2, color: 'text-slate-500' },
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)

    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.slice(1)
        return `https://www.youtube.com/embed/${id}`
      }
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      // Handle /embed/ already in URL
      if (u.pathname.includes('/embed/')) return url
    }

    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop()
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }

    // Loom
    if (u.hostname.includes('loom.com')) {
      const id = u.pathname.replace('/share/', '').replace('/embed/', '')
      return `https://www.loom.com/embed/${id}`
    }

    // Figma
    if (u.hostname.includes('figma.com')) {
      return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`
    }

    // Google Drive
    if (u.hostname.includes('drive.google.com')) {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/)
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
    }

    // Codepen
    if (u.hostname.includes('codepen.io')) {
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length >= 3) {
        return `https://codepen.io/${parts[0]}/embed/${parts[2]}`
      }
    }

    // Google Slides, Docs, Sheets
    if (u.hostname.includes('docs.google.com') || u.hostname.includes('slides.google.com')) {
      return url.includes('/preview') ? url : url.replace('/edit', '/preview')
    }

    return null
  } catch {
    return null
  }
}

export function ResourcePreviewModal({
  resource,
  open,
  onOpenChange,
}: {
  resource: {
    title: string
    url: string
    type: string
    lessonTitle: string
    moduleTitle: string
    courseTitle: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(true)
  const embedUrl = getEmbedUrl(resource.url)
  const cfg = resourceConfig[resource.type] || { icon: Link2, color: 'text-muted-foreground' }
  const Icon = cfg.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border/40">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base truncate">{resource.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] py-0 h-5 capitalize">{resource.type}</Badge>
                <span>{resource.lessonTitle}</span>
                {resource.moduleTitle && <><span>·</span><span>{resource.moduleTitle}</span></>}
              </div>
            </div>
          </div>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </Button>
          </a>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {embedUrl ? (
            <div className="relative w-full h-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <Link2 className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium">Preview not available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This resource cannot be embedded. Click the button below to open it.
                </p>
              </div>
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Visit {resource.title}
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
