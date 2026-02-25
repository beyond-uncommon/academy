import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Zap, Video, FileText, Wrench } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: course } = await supabase.from('courses').select('title').eq('slug', slug).single()
    return { title: course?.title || 'Course' } satisfies Metadata
}

const lessonTypeIcon = {
    video: Video,
    text: FileText,
    project: Wrench,
    interactive: Zap,
}

const lessonTypeLabel = {
    video: 'Video',
    text: 'Reading',
    project: 'Project',
    interactive: 'Interactive',
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const [{ data: course }, { data: userProgress }] = await Promise.all([
        supabase
            .from('courses')
            .select(`
                *,
                modules(
                    id, title, order_index, xp_available,
                    lessons(id, title, type, duration_minutes, xp_reward, order_index, is_published)
                )
            `)
            .eq('slug', slug)
            .eq('is_published', true)
            .single(),
        supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true),
    ])

    if (!course) notFound()

    const completedIds = new Set(userProgress?.map(p => p.lesson_id) || [])

    const modules = [...(course.modules || [])].sort((a: any, b: any) => a.order_index - b.order_index)

    const allLessons = modules.flatMap((m: any) =>
        [...(m.lessons || [])].sort((a: any, b: any) => a.order_index - b.order_index)
    )
    const totalLessons = allLessons.length
    const completedCount = allLessons.filter((l: any) => completedIds.has(l.id)).length
    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    const nextLesson = allLessons.find((l: any) => !completedIds.has(l.id) && l.is_published)

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Back link */}
            <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                All courses
            </Link>

            {/* Course header */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">
                        {course.type === 'crash_course' ? 'Crash Course' : 'Specialization'}
                    </Badge>
                    {course.phase && <Badge variant="outline" className="text-xs">Phase {course.phase}</Badge>}
                </div>
                <h1 className="text-2xl font-bold">{course.title}</h1>
                {course.description && (
                    <p className="text-muted-foreground">{course.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{modules.length} modules</span>
                    <span>{totalLessons} lessons</span>
                    <span>{completedCount} completed</span>
                </div>
                <Progress value={pct} className="h-2" />
            </div>

            {/* CTA */}
            {nextLesson && (
                <Link href={`/lesson/${nextLesson.id}`}>
                    <Button className="gap-2">
                        {completedCount > 0 ? 'Continue learning' : 'Start course'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            )}
            {pct === 100 && (
                <p className="text-sm text-green-500 font-medium">You have completed this course!</p>
            )}

            {/* Modules & lessons */}
            <div className="space-y-4">
                {modules.map((module: any, i: number) => {
                    const lessons = [...(module.lessons || [])].sort((a: any, b: any) => a.order_index - b.order_index)
                    const modCompleted = lessons.filter((l: any) => completedIds.has(l.id)).length
                    const modPct = lessons.length > 0 ? Math.round((modCompleted / lessons.length) * 100) : 0

                    return (
                        <Card key={module.id} className="border-border/40">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <CardTitle className="text-sm">{module.title}</CardTitle>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{modCompleted}/{lessons.length}</span>
                                </div>
                                <Progress value={modPct} className="h-1 mt-1" />
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-1">
                                    {lessons.map((lesson: any) => {
                                        const done = completedIds.has(lesson.id)
                                        const Icon = lessonTypeIcon[lesson.type as keyof typeof lessonTypeIcon] || FileText
                                        return (
                                            <li key={lesson.id}>
                                                <Link
                                                    href={`/lesson/${lesson.id}`}
                                                    className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors group"
                                                >
                                                    {done ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                    ) : (
                                                        <Icon className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                                                    )}
                                                    <span className={`flex-1 text-sm ${done ? 'text-muted-foreground line-through' : ''}`}>
                                                        {lesson.title}
                                                    </span>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="hidden sm:inline">{lessonTypeLabel[lesson.type as keyof typeof lessonTypeLabel]}</span>
                                                        {lesson.duration_minutes && (
                                                            <span className="flex items-center gap-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {lesson.duration_minutes}m
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-0.5 text-yellow-500">
                                                            <Zap className="w-3 h-3" />
                                                            {lesson.xp_reward}
                                                        </span>
                                                    </div>
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
