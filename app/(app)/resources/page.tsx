import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Video, FileText, Link2, Figma, Code, BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resources' }

const resourceTypeIcon: Record<string, any> = {
    video: Video,
    article: FileText,
    figma: Figma,
    link: Link2,
    code: Code,
    book: BookOpen,
    template: FileText,
    tool: Link2,
}

const resourceTypeColors: Record<string, string> = {
    video: 'text-red-500',
    article: 'text-blue-500',
    figma: 'text-purple-500',
    link: 'text-cyan-500',
    code: 'text-green-500',
    book: 'text-amber-500',
    template: 'text-pink-500',
    tool: 'text-slate-500',
}

export default async function ResourcesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, content, module_id, type, module:modules(title, course:courses(title, slug))')
        .eq('is_published', true)
        .not('content', 'is', null)
        .order('title')

    const resources: Array<{
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

    const grouped: Record<string, typeof resources> = {}
    for (const r of resources) {
        const t = r.type
        if (!grouped[t]) grouped[t] = []
        grouped[t].push(r)
    }

    const typeOrder = ['video', 'article', 'figma', 'template', 'book', 'code', 'tool', 'link']
    const sortedTypes = typeOrder.filter(t => grouped[t]).concat(Object.keys(grouped).filter(t => !typeOrder.includes(t)))

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Resource Library</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Videos, articles, templates, and tools referenced across all lessons.
                </p>
            </div>

            {resources.length === 0 ? (
                <Card className="border-border/40">
                    <CardContent className="p-12 text-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">No resources yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Resources will appear here as course content is added.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-10">
                    {sortedTypes.map(type => (
                        <div key={type}>
                            <div className="flex items-center gap-2 mb-4">
                                {(() => {
                                    const Icon = resourceTypeIcon[type] || Link2
                                    return <Icon className={`w-4 h-4 ${resourceTypeColors[type] || 'text-muted-foreground'}`} />
                                })()}
                                <h2 className="text-lg font-semibold capitalize">{type}s</h2>
                                <Badge variant="secondary" className="text-xs">{grouped[type].length}</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {grouped[type].map((r, i) => (
                                    <a key={`${r.url}-${i}`} href={r.url} target="_blank" rel="noopener noreferrer" className="block">
                                        <Card className="border-border/40 hover:border-border/80 hover:bg-muted/30 transition-all h-full">
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                                                        {(() => {
                                                            const Icon = resourceTypeIcon[r.type] || Link2
                                                            return <Icon className={`w-4 h-4 ${resourceTypeColors[r.type] || 'text-muted-foreground'}`} />
                                                        })()}
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
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
