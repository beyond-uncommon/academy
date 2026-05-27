import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Video, FileText, Link2, Figma, Code, BookOpen, Search } from 'lucide-react'
import { ResourceFilters } from './components/ResourceFilters'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resources' }

const resourceTypeConfig: Record<string, { icon: any; color: string }> = {
  video: { icon: Video, color: 'text-red-500' },
  article: { icon: FileText, color: 'text-blue-500' },
  figma: { icon: Figma, color: 'text-purple-500' },
  link: { icon: Link2, color: 'text-cyan-500' },
  code: { icon: Code, color: 'text-green-500' },
  book: { icon: BookOpen, color: 'text-amber-500' },
  template: { icon: FileText, color: 'text-pink-500' },
  tool: { icon: Link2, color: 'text-slate-500' },
}

export default async function ResourcesPage(props: {
  searchParams?: Promise<{ type?: string; q?: string }>
}) {
  const searchParams = await props.searchParams
  const activeType = searchParams?.type || 'all'
  const query = (searchParams?.q || '').trim().toLowerCase()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, content, module_id, type, module:modules(title, course:courses(title, slug))')
    .eq('is_published', true)
    .not('content', 'is', null)
    .order('title')

  let resources: Array<{
    title: string
    url: string
    type: string
    lessonTitle: string
    lessonId: string
    moduleTitle: string
    courseTitle: string
    courseSlug: string
  }> = []

  for (const lesson of lessons || []) {
    const content = lesson.content as Record<string, any> | null
    const lessonResources = content?.resources
    if (Array.isArray(lessonResources)) {
      for (const r of lessonResources) {
        if (r.title && r.url) {
          resources.push({
            title: r.title,
            url: r.url,
            type: r.type || 'link',
            lessonTitle: lesson.title,
            lessonId: lesson.id,
            moduleTitle: (lesson.module as any)?.title || '',
            courseTitle: (lesson.module as any)?.course?.title || '',
            courseSlug: (lesson.module as any)?.course?.slug || '',
          })
        }
      }
    }
  }

  // Filter by type
  if (activeType !== 'all') {
    resources = resources.filter((r) => r.type === activeType)
  }

  // Filter by search query
  if (query) {
    resources = resources.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.lessonTitle.toLowerCase().includes(query) ||
        r.moduleTitle.toLowerCase().includes(query) ||
        r.courseTitle.toLowerCase().includes(query)
    )
  }

  // Counts for tabs
  const typeCounts: Record<string, number> = {}
  for (const r of resources) {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1
  }

  const typeOrder = ['video', 'article', 'figma', 'template', 'book', 'code', 'tool', 'link']
  const allTypes = ['all', ...typeOrder.filter((t) => typeCounts[t])]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resource Library</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Videos, articles, templates, and tools referenced across all lessons.
        </p>
      </div>

      <ResourceFilters
        activeType={activeType}
        query={searchParams?.q || ''}
        types={allTypes}
        counts={typeCounts}
      />

      {resources.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {query ? 'No resources match your search.' : 'No resources yet.'}
          </p>
          {(query || activeType !== 'all') && (
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {resources.map((r, i) => {
            const cfg = resourceTypeConfig[r.type] || { icon: Link2, color: 'text-muted-foreground' }
            const Icon = cfg.icon
            return (
              <a
                key={`${r.url}-${i}`}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="border-border/40 hover:border-border/80 hover:bg-muted/30 transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{r.url}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <span>{r.lessonTitle}</span>
                          {r.moduleTitle && <><span>·</span><span>{r.moduleTitle}</span></>}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
