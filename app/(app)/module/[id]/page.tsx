import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Zap, Video, FileText, Wrench, ClipboardCheck, Lock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: mod } = await supabase.from('modules').select('title, course:courses(title)').eq('id', id).maybeSingle()
    return { title: mod?.title || 'Module' } satisfies Metadata
}

const lessonTypeIcon: Record<string, any> = {
    video: Video,
    text: FileText,
    project: Wrench,
    interactive: Zap,
}

const lessonTypeLabel: Record<string, string> = {
    video: 'Video',
    text: 'Reading',
    project: 'Project',
    interactive: 'Interactive',
}

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: mod }, { data: userProgress }] = await Promise.all([
        supabase
            .from('modules')
            .select('*, course:courses(id, title, slug)')
            .eq('id', id)
            .single(),
        supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true),
    ])

    if (!mod) notFound()

    const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', mod.id)
        .eq('is_published', true)
        .order('order_index', { ascending: true })

    const completedIds = new Set(userProgress?.map(p => p.lesson_id) || [])
    const completedCount = (lessons || []).filter(l => completedIds.has(l.id)).length
    const totalLessons = (lessons || []).length
    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    const allDone = totalLessons > 0 && (lessons || []).every(l => completedIds.has(l.id))

    const { data: assessment } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(count)')
        .eq('module_id', mod.id)
        .eq('type', 'module')
        .eq('is_published', true)
        .maybeSingle()

    let assessmentStatus = null
    if (assessment) {
        const { data } = await supabase
            .rpc('get_assessment_status', { p_user_id: user.id, p_quiz_id: assessment.id })
        assessmentStatus = Array.isArray(data) ? data[0] : data
    }

    const passed = assessmentStatus?.has_passed || false

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Link href={`/courses/${mod.course?.slug}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {mod.course?.title}
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{mod.title}</span>
            </div>

            <div className="space-y-3">
                <h1 className="text-2xl font-bold">{mod.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{totalLessons} lessons</span>
                    <span>{completedCount} completed</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{mod.xp_available} XP</span>
                </div>
                <Progress value={pct} className="h-2" />
            </div>

            <div className="space-y-2">
                {(lessons || []).map((lesson) => {
                    const done = completedIds.has(lesson.id)
                    const Icon = lessonTypeIcon[lesson.type as keyof typeof lessonTypeIcon] || FileText
                    return (
                        <Link key={lesson.id} href={`/lesson/${lesson.id}`} className="block">
                            <Card className="border-border/40 hover:border-border/80 transition-all cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    {done ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                    ) : (
                                        <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>
                                            {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span>{lessonTypeLabel[lesson.type as keyof typeof lessonTypeLabel]}</span>
                                            {lesson.duration_minutes && (
                                                <span className="flex items-center gap-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    {lesson.duration_minutes}m
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-0.5 text-xs text-yellow-500 shrink-0">
                                        <Zap className="w-3 h-3" />
                                        {lesson.xp_reward}
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {assessment && (
                <Card className="border-border/40 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-primary" />
                            Module Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <p className="text-sm">{assessment.title}</p>
                                <div className="flex gap-3 text-xs text-muted-foreground">
                                    <span>{(assessment as any).questions?.[0]?.count || 0} questions</span>
                                    {assessment.time_limit_minutes && <span>{assessment.time_limit_minutes} min limit</span>}
                                    <span>Pass: {assessment.passing_score_pct}%</span>
                                </div>
                            </div>
                            {passed ? (
                                <Badge variant="default" className="shrink-0">Passed</Badge>
                            ) : !allDone ? (
                                <Badge variant="secondary" className="shrink-0 gap-1"><Lock className="w-3 h-3" />Complete all lessons first</Badge>
                            ) : (
                                <Link href={`/assessments/${assessment.id}`}>
                                    <Button size="sm" className="gap-2 shrink-0">Take assessment <ArrowRight className="w-3 h-3" /></Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!assessment && allDone && (
                <Card className="border-border/40 bg-primary/5">
                    <CardContent className="p-6 text-center">
                        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="font-medium">Module completed!</p>
                        <p className="text-sm text-muted-foreground mt-1">All lessons in this module are done.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
