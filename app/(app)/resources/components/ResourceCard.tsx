'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Video, FileText, Link2, Figma, Code, BookOpen } from 'lucide-react'
import { ResourcePreviewModal } from '@/components/resources/ResourcePreviewModal'

const iconMap: Record<string, any> = {
  video: Video, article: FileText, figma: Figma, link: Link2,
  code: Code, book: BookOpen, template: FileText, tool: Link2,
}

const colorMap: Record<string, string> = {
  video: 'text-red-500', article: 'text-blue-500', figma: 'text-purple-500',
  link: 'text-cyan-500', code: 'text-green-500', book: 'text-amber-500',
  template: 'text-pink-500', tool: 'text-slate-500',
}

export function ResourceCard({
  resource,
}: {
  resource: {
    title: string
    url: string
    type: string
    lessonTitle: string
    moduleTitle: string
    courseTitle: string
  }
}) {
  const [open, setOpen] = useState(false)
  const cfg = { icon: iconMap[resource.type] || Link2, color: colorMap[resource.type] || 'text-muted-foreground' }
  const Icon = cfg.icon

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        <Card className="border-border/40 hover:border-border/80 hover:bg-muted/30 transition-all h-full cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{resource.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{resource.url}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>{resource.lessonTitle}</span>
                  {resource.moduleTitle && <><span>·</span><span>{resource.moduleTitle}</span></>}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </button>
      <ResourcePreviewModal
        resource={resource}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
