import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, Zap, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompleteLessonButton } from '../components/CompleteLessonButton'
import { AssessmentPlayer } from '../../assessment/components/AssessmentPlayer'
import { ProjectSubmission } from '../components/ProjectSubmission'
import { LessonContent } from '../components/LessonContent'
import { SaveOfflineButton, OfflineBadge } from '@/components/SaveOffline'
import { CommentsSection } from '@/components/comments/CommentsSection'
import { getComments } from '@/components/comments/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Lesson' }

export default async function LessonPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: lesson, error } = await supabase
        .from('lessons')
        .select(`
            *,
            module:modules(
                title,
                course:courses(title)
            )
        `)
        .eq('id', id)
        .single()

    if (error || !lesson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-muted-foreground">Lesson not found.</p>
                <Link href="/dashboard">
                    <Badge variant="outline" className="cursor-pointer">Return to Dashboard</Badge>
                </Link>
            </div>
        )
    }

    const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', id)
        .maybeSingle()

    const isCompleted = !!progress?.completed
    const courseTitle = (lesson.module as any)?.course?.title || 'Unknown Course'
    const moduleTitle = (lesson.module as any)?.title || 'Unknown Module'

    // Fetch quiz (lesson assessment)
    const { data: rawQuiz } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(*)')
        .eq('lesson_id', id)
        .maybeSingle()

    // Only published questions shown to learners
    const quiz = rawQuiz ? { ...rawQuiz, questions: (rawQuiz.questions || []).filter((q: any) => !q.is_draft) } : null

    const { data: projectSubmission } = await supabase
        .from('project_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', id)
        .maybeSingle()

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/module/${lesson.module_id}`} className="hover:text-foreground flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" />
                    {moduleTitle}
                </Link>
                <span>/</span>
                <span className="truncate max-w-[150px]">{courseTitle}</span>
                <span>/</span>
                <span className="truncate max-w-[150px]">{moduleTitle}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{lesson.title}</h1>
                        <OfflineBadge url={`/lesson/${id}`} />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs capitalize">{lesson.type}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration_minutes} min
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            {lesson.xp_reward} XP
                        </span>
                    </div>
                </div>
                <SaveOfflineButton url={`/lesson/${id}`} />
            </div>

            <Card className="border-border/40">
                <CardContent className="p-6">
                    <LessonContent
                        type={lesson.type}
                        content={lesson.content as Record<string, unknown> | null}
                    />
                </CardContent>
            </Card>

            {quiz ? (
                <div id="quiz" className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lesson Assessment</h2>
                    <AssessmentPlayer
                        assessment={quiz}
                        onComplete={() => {
                            // AssessmentPlayer handles lesson completion on pass via submitAssessment
                        }}
                    />
                </div>
            ) : lesson.type === 'project' ? (
                <div id="project" className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Project Milestone</h2>
                    <ProjectSubmission
                        lessonId={lesson.id}
                        xpReward={lesson.xp_reward}
                        initialSubmission={projectSubmission as any}
                    />
                </div>
            ) : (
                <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Your progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={isCompleted ? 100 : 0} className="h-2" />
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground">
                                {isCompleted ? 'Completed on ' + new Date(progress.completed_at!).toLocaleDateString() : 'Not started yet'}
                            </p>
                            <CompleteLessonButton
                                lessonId={lesson.id}
                                xpReward={lesson.xp_reward}
                                initialCompleted={isCompleted}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Discussion */}
            <Card className="border-border/40" id="discussion">
                <CardContent className="p-6">
                    <CommentsSection
                        lessonId={id}
                        initialComments={await getComments({ lesson_id: id })}
                        currentUserId={user.id}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

