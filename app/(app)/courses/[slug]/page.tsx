import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Zap, Video, FileText, Wrench, ClipboardCheck, Lock } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: course } = await supabase.from('courses').select('title').eq('slug', slug).maybeSingle()
    return { title: course?.title || 'Course' } satisfies Metadata
}

const lessonTypeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
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

    // Fetch module assessments for this course
    const moduleIds = (course.modules || []).map((m: { id: string }) => m.id)
    const { data: moduleAssessments } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(count)')
        .in('module_id', moduleIds)
        .eq('type', 'module')
        .eq('is_published', true)

    // Fetch course-level assessment
    const { data: courseAssessment } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(count)')
        .eq('course_id', course.id)
        .eq('type', 'course')
        .eq('is_published', true)
        .maybeSingle()

    // Fetch user's assessment statuses
    const assessmentMap = new Map<string, { attempt_count: number; best_score: number; passed: boolean; has_passed?: boolean }>()
    if (moduleAssessments) {
        for (const a of moduleAssessments) {
            const { data } = await supabase
                .rpc('get_assessment_status', { p_user_id: user.id, p_quiz_id: a.id })
            const status = Array.isArray(data) ? data[0] : data
            assessmentMap.set(a.id, status || { attempt_count: 0, best_score: 0, passed: false })
        }
    }
    if (courseAssessment) {
        const { data } = await supabase
            .rpc('get_assessment_status', { p_user_id: user.id, p_quiz_id: courseAssessment.id })
        const status = Array.isArray(data) ? data[0] : data
        assessmentMap.set(courseAssessment.id, status || { attempt_count: 0, best_score: 0, passed: false })
    }

    const modules = [...(course.modules || [])].sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)

    const allLessons = modules.flatMap((m: { lessons: { id: string; title: string; type: string; duration_minutes?: number; xp_reward?: number; order_index: number; is_published: boolean }[]; order_index: number }) =>
        [...(m.lessons || [])].sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
    )
    const totalLessons = allLessons.length
    const completedCount = allLessons.filter((l: { id: string }) => completedIds.has(l.id)).length
    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

    const nextLesson = allLessons.find((l: { id: string; is_published: boolean }) => !completedIds.has(l.id) && l.is_published)

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                All courses
            </Link>

            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">
                        {course.type === 'crash_course' ? 'Crash Course' : 'Specialization'}
                    </Badge>
                    {course.phase && <Badge variant="outline" className="text-xs">Phase {course.phase}</Badge>}
                </div>
                <h1 className="text-2xl font-bold">{course.title}</h1>
                {course.description && <p className="text-muted-foreground">{course.description}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{modules.length} modules</span>
                    <span>{totalLessons} lessons</span>
                    <span>{completedCount} completed</span>
                </div>
                <Progress value={pct} className="h-2" />
            </div>

            {nextLesson && (
                <Link href={`/lesson/${nextLesson.id}`}>
                    <Button className="gap-2">
                        {completedCount > 0 ? 'Continue learning' : 'Start course'}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            )}

            {/* Modules & lessons with assessments */}
            <div className="space-y-4">
                {modules.map((module: { id: string; title: string; order_index: number; xp_available?: number; lessons: { id: string; title: string; type: string; duration_minutes?: number; xp_reward?: number; order_index: number; is_published: boolean }[] }, i: number) => {
                    const lessons = [...(module.lessons || [])].sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
                    const modCompleted = lessons.filter((l: { id: string }) => completedIds.has(l.id)).length
                    const modPct = lessons.length > 0 ? Math.round((modCompleted / lessons.length) * 100) : 0
                    const allLessonsInModDone = lessons.length > 0 && lessons.every((l: { id: string }) => completedIds.has(l.id))

                    // Find module assessment
                    const modAssessment = moduleAssessments?.find((a: { module_id: string }) => a.module_id === module.id)
                    const modAssessmentStatus = modAssessment ? assessmentMap.get(modAssessment.id) : null

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
                                    {lessons.map((lesson: { id: string; title: string; type: string; duration_minutes?: number; xp_reward?: number; order_index: number; is_published: boolean }) => {
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

                                {/* Module assessment entry */}
                                {modAssessment && (
                                    <ModuleAssessmentEntry
                                        assessment={modAssessment}
                                        status={modAssessmentStatus ?? null}
                                        allLessonsDone={allLessonsInModDone}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Course-level assessment */}
            {courseAssessment && (
                <Card className="border-border/40 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Course Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CourseAssessmentEntry
                            assessment={courseAssessment}
                            status={assessmentMap.get(courseAssessment.id) ?? null}
                            allModulesDone={modules.every((m: { lessons: { id: string; is_published: boolean }[] }) => {
                                const mLessons = [...(m.lessons || [])].filter((l: { is_published: boolean }) => l.is_published)
                                return mLessons.length > 0 && mLessons.every((l: { id: string }) => completedIds.has(l.id))
                            })}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function ModuleAssessmentEntry({
    assessment,
    status,
    allLessonsDone,
}: {
    assessment: { id: string; questions?: { count: number }[]; time_limit_minutes?: number; module_id?: string }
    status: { has_passed?: boolean; attempt_count?: number; best_score?: number; passed?: boolean } | null
    allLessonsDone: boolean
}) {
    const questionCount = assessment.questions?.[0]?.count || 0
    const passed = status?.has_passed || false
    const canAccess = allLessonsDone && !passed

    return (
        <div className="mt-3 pt-3 border-t border-border/40">
            <Link
                href={canAccess ? `/assessments/${assessment.id}` : '#'}
                className={`flex items-center gap-3 py-2 px-2 rounded-md transition-colors group ${canAccess ? 'hover:bg-muted/50' : 'opacity-60 cursor-not-allowed'}`}
                onClick={(e) => { if (!canAccess) e.preventDefault() }}
            >
                {passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                ) : !allLessonsDone ? (
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                    <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
                )}
                <span className={`flex-1 text-sm ${passed ? 'text-muted-foreground line-through' : ''}`}>
                    Module Assessment{passed ? ' (Passed)' : ''}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{questionCount} questions</span>
                    {assessment.time_limit_minutes && <span>{assessment.time_limit_minutes}min</span>}
                    <Badge variant={passed ? 'default' : allLessonsDone ? 'outline' : 'secondary'} className="text-[10px]">
                        {passed ? 'Passed' : allLessonsDone ? 'Ready' : 'Locked'}
                    </Badge>
                </div>
            </Link>
        </div>
    )
}

function CourseAssessmentEntry({
    assessment,
    status,
    allModulesDone,
}: {
    assessment: { id: string; questions?: { count: number }[]; time_limit_minutes?: number; module_id?: string }
    status: { has_passed?: boolean; attempt_count?: number; best_score?: number; passed?: boolean } | null
    allModulesDone: boolean
}) {
    const questionCount = assessment.questions?.[0]?.count || 0
    const passed = status?.has_passed || false
    const canAccess = allModulesDone && !passed

    return (
        <Link
            href={canAccess ? `/assessments/${assessment.id}` : '#'}
            className={`flex items-center gap-3 py-2 px-2 rounded-md transition-colors group ${canAccess ? 'hover:bg-muted/50' : 'opacity-60 cursor-not-allowed'}`}
            onClick={(e) => { if (!canAccess) e.preventDefault() }}
        >
            {passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : !allModulesDone ? (
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            ) : (
                <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className={`flex-1 text-sm ${passed ? 'text-muted-foreground line-through' : ''}`}>
                Final Course Assessment{passed ? ' (Passed)' : ''}
            </span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{questionCount} questions</span>
                {assessment.time_limit_minutes && <span>{assessment.time_limit_minutes}min</span>}
                <Badge variant={passed ? 'default' : allModulesDone ? 'outline' : 'secondary'} className="text-[10px]">
                    {passed ? 'Passed' : allModulesDone ? 'Ready' : 'Locked'}
                </Badge>
            </div>
        </Link>
    )
}

