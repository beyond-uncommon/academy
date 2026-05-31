import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Zap, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAssessmentStatus } from '../quiz/actions'

export const metadata: Metadata = { title: 'Assessments' }

export default async function AssessmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch standalone assessments
    const { data: assessments } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(count)')
        .eq('type', 'standalone')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Assessments</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Test your knowledge with standalone skill assessments.
                </p>
            </div>

            {(!assessments || assessments.length === 0) ? (
                <Card className="border-border/40 bg-secondary/5">
                    <CardContent className="p-12 text-center">
                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium">No assessments available yet.</p>
                        <p className="text-xs text-muted-foreground mt-1">Check back soon for new challenges.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {assessments.map((assessment) => (
                        <AssessmentCard key={assessment.id} assessment={assessment} />
                    ))}
                </div>
            )}
        </div>
    )
}

async function AssessmentCard({
    assessment,
}: {
    assessment: {
        id: string
        title: string
        type: string
        time_limit_minutes: number | null
        max_attempts: number
        xp_base: number
        passing_score_pct: number
        questions: { count: number }[]
    }
}) {
    const status = await getAssessmentStatus(assessment.id)
    const questionCount = assessment.questions?.[0]?.count || 0
    const attemptsUsed = status?.attempt_count || 0
    const maxAttempts = assessment.max_attempts || 0
    const canAttempt = maxAttempts === 0 || attemptsUsed < maxAttempts

    let statusBadge: { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
    if (status?.has_passed) {
        statusBadge = { label: 'Passed', variant: 'default' }
    } else if (attemptsUsed > 0 && !canAttempt) {
        statusBadge = { label: 'No attempts left', variant: 'destructive' }
    } else if (attemptsUsed > 0) {
        statusBadge = { label: `Attempted (${attemptsUsed}/${maxAttempts || '\u221E'})`, variant: 'secondary' }
    } else {
        statusBadge = { label: 'Not started', variant: 'outline' }
    }

    return (
        <Card key={assessment.id} className="border-border/40 hover:border-border transition-colors">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{assessment.title}</h3>
                            <Badge variant={statusBadge.variant} className="text-[10px]">
                                {statusBadge.label}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {questionCount} questions
                            </span>
                            {assessment.time_limit_minutes && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {assessment.time_limit_minutes} min
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                {assessment.xp_base || 100} XP
                            </span>
                            <span className="flex items-center gap-1">
                                Pass: {assessment.passing_score_pct || 80}%
                            </span>
                        </div>
                        {status && status.best_score > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Best score: {status.best_score}%
                            </p>
                        )}
                    </div>
                    <Link href={`/assessments/${assessment.id}`} className="shrink-0">
                        <Button size="sm" className="gap-2" disabled={!canAttempt && !status?.has_passed}>
                            {status?.has_passed ? 'Review' : canAttempt ? 'Start' : 'Locked'}
                            <ArrowRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
