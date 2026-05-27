import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Search } from 'lucide-react'
import { ResourceFilters } from './components/ResourceFilters'
import { ResourceCard } from './components/ResourceCard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resources' }

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

  const typeOrder = ['video', 'article', 'figma', 'template', 'book', 'code', 'tool', 'link']

  // Compute total counts from all resources (tabs always show)
  const totalCounts: Record<string, number> = {}
  for (const r of resources) {
    totalCounts[r.type] = (totalCounts[r.type] || 0) + 1
  }
  const allTypes = ['all', ...typeOrder.filter((t) => totalCounts[t])]

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

  // Compute search-filtered counts for tab badges
  const typeCounts: Record<string, number> = {}
  for (const r of resources) {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1
  }
  // Ensure all known types appear in typeCounts (even if 0), and add total for "All"
  typeCounts.all = resources.length
  for (const t of typeOrder) {
    if (typeCounts[t] === undefined) typeCounts[t] = 0
  }

  // Filter by type
  if (activeType !== 'all') {
    resources = resources.filter((r) => r.type === activeType)
  }

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
          {resources.map((r, i) => (
            <ResourceCard
              key={`${r.url}-${i}`}
              resource={{
                title: r.title,
                url: r.url,
                type: r.type,
                lessonTitle: r.lessonTitle,
                moduleTitle: r.moduleTitle,
                courseTitle: r.courseTitle,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
