'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink, BookOpen, FileText, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Resource {
    title: string
    url: string
    type?: 'article' | 'docs' | 'video' | 'tool' | string
}

interface LessonContentProps {
    type: string
    content: Record<string, unknown> | null
}

const resourceTypeIcon: { [key: string]: any } = {
    article: FileText,
    docs: BookOpen,
    video: Globe,
    tool: Globe,
};

const resourceTypeLabel: { [key: string]: string } = {
    article: 'Article',
    docs: 'Documentation',
    video: 'Video',
    tool: 'Tool',
};

function Markdown({ children }: { children: string }) {
    return (
        <div className="lesson-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {children}
            </ReactMarkdown>
        </div>
    )
}

export function LessonContent({ type, content }: LessonContentProps) {
    if (!content) {
        return <p className="text-muted-foreground text-sm">No content available for this lesson.</p>
    }

    const videoUrl = content.video_url as string | undefined
    const notes = content.notes as string | undefined
    const textContent = content.text_content as string | undefined
    const brief = content.brief as string | undefined
    const resources = content.resources as Resource[] | undefined

    return (
        <div className="space-y-6">
            {/* ── Video player ── */}
            {type === 'video' && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border/40">
                    {videoUrl ? (
                        <iframe
                            src={videoUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-muted-foreground text-sm">Video coming soon</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Notes / explanation below video ── */}
            {notes && (
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lesson notes</h3>
                    <Markdown>{notes}</Markdown>
                </div>
            )}

            {/* ── Full text content (text-type lessons) ── */}
            {textContent && (
                <Markdown>{textContent}</Markdown>
            )}

            {/* ── Project brief ── */}
            {brief && (
                <div className="rounded-lg border border-border/40 bg-secondary/5 p-5 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project brief</h3>
                    <Markdown>{brief}</Markdown>
                </div>
            )}

            {/* ── Additional resources ── */}
            {resources && resources.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional resources</h3>
                    <div className="space-y-2">
                        {resources.map((r, i) => {
                            const isYouTube = r.url?.includes('youtube.com/watch') || r.url?.includes('youtu.be/')
                            if (r.type === 'video' && isYouTube) {
                                const videoId = r.url?.includes('youtube.com/watch')
                                    ? new URL(r.url).searchParams.get('v')
                                    : r.url?.split('youtu.be/')[1]?.split('?')[0]
                                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null
                                if (embedUrl) {
                                    return (
                                        <div key={i} className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">{r.title}</p>
                                            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-border/40">
                                                <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                            </div>
                                        </div>
                                    )
                                }
                            }
                            const Icon = resourceTypeIcon[r.type ?? ''] ?? ExternalLink
                            const label = resourceTypeLabel[r.type ?? ''] ?? 'Resource'
                            return (
                                <a
                                    key={i}
                                    href={r.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-border hover:bg-secondary/10 transition-colors group"
                                >
                                    <Icon className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                                    <span className="flex-1 text-sm font-medium">{r.title}</span>
                                    <Badge variant="outline" className="text-xs shrink-0">{label}</Badge>
                                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                                </a>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Fallback if no renderable content ── */}
            {!notes && !textContent && !brief && (!resources || resources.length === 0) && type !== 'video' && (
                <p className="text-muted-foreground text-sm">No content available for this lesson.</p>
            )}
        </div>
    )
}
