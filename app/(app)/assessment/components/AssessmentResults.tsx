'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Trophy, XCircle, Zap, RefreshCw, Clock, AlertTriangle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { RANK_LABELS, type Rank } from '@/types'

interface QuestionResult {
    id: string
    question: string
    options: Array<{ text: string; is_correct?: boolean }>
    explanation?: string | null
    userAnswerIndex: number | undefined
    correctIndex: number
    isCorrect: boolean
}

interface AssessmentResultsProps {
    scorePct: number
    xpEarned: number
    correctCount: number
    totalQuestions: number
    passed: boolean
    passingScorePct: number
    questions: QuestionResult[]
    timeSpentSeconds?: number | null
    rankUp?: string | null
    attemptNumber?: number
    maxAttempts?: number
    canRetake?: boolean
    onRetry?: () => void
}

export function AssessmentResults({
    scorePct,
    xpEarned,
    correctCount,
    totalQuestions,
    passed,
    passingScorePct,
    questions,
    timeSpentSeconds,
    rankUp,
    attemptNumber,
    maxAttempts,
    canRetake,
    onRetry,
}: AssessmentResultsProps) {
    const isPerfect = scorePct === 100

    function formatTime(seconds: number | null | undefined) {
        if (!seconds) return null
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        if (m === 0) return `${s}s`
        return `${m}m ${s}s`
    }

    return (
        <div className="space-y-6">
            {/* Result banner */}
            <Card className={`border-border/40 overflow-hidden ${passed ? 'ring-1 ring-green-500/30' : 'ring-1 ring-red-500/30'}`}>
                <div className={`h-2 ${passed ? (isPerfect ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}`} />
                <CardContent className="p-8 flex flex-col items-center text-center space-y-5">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            passed ? (isPerfect ? 'bg-yellow-500/10' : 'bg-green-500/10') : 'bg-red-500/10'
                        }`}
                    >
                        {passed ? (
                            <Trophy className={`w-8 h-8 ${isPerfect ? 'text-yellow-500' : 'text-green-500'}`} />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">
                            {isPerfect ? 'Perfect Score!' : passed ? 'Assessment Passed!' : 'Assessment Failed'}
                        </h2>
                        <p className="text-muted-foreground mt-1 text-lg">
                            You scored{' '}
                            <span className={`font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>
                                {scorePct}%
                            </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {correctCount} of {totalQuestions} correct
                            {!passed && ` \u2022 ${passingScorePct}% required to pass`}
                        </p>
                        {timeSpentSeconds && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3" />
                                Time: {formatTime(timeSpentSeconds)}
                            </p>
                        )}
                    </div>

                    <div className="p-4 bg-secondary/10 rounded-xl border border-border/40 w-full max-w-xs space-y-2">
                        {xpEarned > 0 ? (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">XP Earned:</span>
                                <span className="font-bold flex items-center gap-1">
                                    <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    +{xpEarned} XP
                                </span>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">XP Earned:</span>
                                <span className="text-muted-foreground text-sm">0 (must pass to earn XP)</span>
                            </div>
                        )}
                        <Progress value={scorePct} className={`h-1.5 ${passed ? 'bg-green-500/20' : 'bg-red-500/20'}`} />
                    </div>

                    {rankUp && (
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <p className="text-sm font-semibold">
                                NEW RANK: {RANK_LABELS[rankUp as Rank]}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        {!passed && canRetake && onRetry && (
                            <Button onClick={onRetry} className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Retry{attemptNumber && maxAttempts ? ` (${attemptNumber}/${maxAttempts})` : ''}
                            </Button>
                        )}
                        <Button asChild variant={passed ? 'default' : 'outline'}>
                            <a href="/dashboard">Return to Dashboard</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Answer Review */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Answer Review</h3>
                {questions.map((q, qi) => (
                    <Card key={q.id} className="border-border/40 overflow-hidden">
                        <div className={`h-1 ${q.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-2">
                                {q.isCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                )}
                                <p className="text-sm font-medium">
                                    {qi + 1}. {q.question}
                                </p>
                            </div>
                            <div className="grid gap-1.5 pl-6">
                                {q.options.map((opt, i) => {
                                    const isUserPick = q.userAnswerIndex === i
                                    const isRight = opt.is_correct
                                    let cls =
                                        'text-xs px-3 py-1.5 rounded border '
                                    if (isRight)
                                        cls +=
                                            'border-green-500/40 bg-green-500/5 text-green-700 dark:text-green-400'
                                    else if (isUserPick && !isRight)
                                        cls +=
                                            'border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-400 line-through'
                                    else cls += 'border-border/30 text-muted-foreground'
                                    return (
                                        <div key={i} className={cls}>
                                            {opt.text}
                                            {isRight && (
                                                <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide">
                                                    correct
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {q.explanation && (
                                <p className="text-xs text-muted-foreground pl-6 italic">{q.explanation}</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
