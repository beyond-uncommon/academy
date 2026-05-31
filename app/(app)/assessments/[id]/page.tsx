import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AssessmentPlayer } from '../../assessment/components/AssessmentPlayer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Assessment' }

export default async function AssessmentPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: quiz } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(*)')
        .eq('id', id)
        .single()

    if (!quiz) notFound()

    const publishedQuestions = (quiz.questions || []).filter((q: { is_draft?: boolean }) => !q.is_draft)

    // Progression check for module assessments
    if (quiz.type === 'module' && quiz.module_id) {
        const { data: moduleLessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', quiz.module_id)
            .eq('is_published', true)

        const { data: completedProgress } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)

        const completedIds = new Set(completedProgress?.map(p => p.lesson_id) || [])
        const allLessonsDone = moduleLessons?.every(l => completedIds.has(l.id))

        if (!allLessonsDone) {
            return (
                <div className="max-w-lg mx-auto space-y-6 pt-12">
                    <Card className="border-border/40 bg-secondary/5">
                        <CardContent className="p-12 text-center space-y-4">
                            <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
                            <div>
                                <h1 className="text-xl font-bold">Assessment Locked</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Complete all lessons in this module before taking the assessment.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/courses">Go to Courses</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )
        }
    }

    // Progression check for course assessments
    if (quiz.type === 'course' && quiz.course_id) {
        const { data: course } = await supabase
            .from('courses')
            .select(`
                modules(
                    id,
                    lessons(id)
                )
            `)
            .eq('id', quiz.course_id)
            .single()

        const allModuleLessonIds = course?.modules?.flatMap((m: { lessons: { id: string }[] }) =>
            (m.lessons || []).map(l => l.id)
        ) || []

        const { data: completedProgress } = await supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)

        const completedIds = new Set(completedProgress?.map(p => p.lesson_id) || [])
        const allLessonsDone = allModuleLessonIds.every(l => completedIds.has(l))

        if (!allLessonsDone) {
            return (
                <div className="max-w-lg mx-auto space-y-6 pt-12">
                    <Card className="border-border/40 bg-secondary/5">
                        <CardContent className="p-12 text-center space-y-4">
                            <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
                            <div>
                                <h1 className="text-xl font-bold">Final Assessment Locked</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Complete all modules in this course before taking the final assessment.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/courses">Go to Courses</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )
        }
    }

    // Get assessment status (for potential future use)
    await supabase
        .rpc('get_assessment_status', { p_user_id: user.id, p_quiz_id: id })

    // Determine back link
    let backHref = '/assessments'
    let backLabel = 'All assessments'
    if (quiz.type === 'module') backHref = '/courses'
    if (quiz.type === 'module') backLabel = 'Back to courses'
    if (quiz.type === 'course') backHref = '/courses'
    if (quiz.type === 'course') backLabel = 'Back to courses'
    if (quiz.type === 'lesson') backHref = '/dashboard'
    if (quiz.type === 'lesson') backLabel = 'Back to dashboard'

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                {backLabel}
            </Link>

            <AssessmentPlayer
                assessment={{
                    id: quiz.id,
                    title: quiz.title,
                    type: quiz.type,
                    questions: publishedQuestions.map((q: { id: string; question: string; options: { text: string; is_correct: boolean }[]; explanation: string | null; order_index: number }) => ({
                        id: q.id,
                        question: q.question,
                        options: q.options,
                        explanation: q.explanation,
                        order_index: q.order_index,
                    })),
                    time_limit_minutes: quiz.time_limit_minutes,
                    instructions: quiz.instructions || 'Test your knowledge with this assessment. You must pass to earn XP.',
                    passing_score_pct: quiz.passing_score_pct || 80,
                    max_attempts: quiz.max_attempts || 0,
                    xp_base: quiz.xp_base,
                    xp_bonus_80: quiz.xp_bonus_80,
                    xp_bonus_100: quiz.xp_bonus_100,
                }}
            />
        </div>
    )
}
