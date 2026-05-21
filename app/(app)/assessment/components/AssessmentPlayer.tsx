'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ChevronRight, Clock, Loader2, Trophy, Zap, AlertTriangle, RefreshCw } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { AssessmentTimer } from './AssessmentTimer'
import { AssessmentResults } from './AssessmentResults'
import { startAssessment, submitAssessment } from '../../quiz/actions'
import { RANK_LABELS, type Rank } from '@/types'

interface QuestionOption {
    text: string
    is_correct?: boolean
}

interface QuestionData {
    id: string
    question: string
    options: QuestionOption[]
    explanation?: string | null
    order_index: number
}

interface AssessmentData {
    id: string
    title: string
    type?: string
    questions: QuestionData[]
    time_limit_minutes?: number | null
    instructions?: string | null
    passing_score_pct?: number
    max_attempts?: number
    xp_base?: number
    xp_bonus_80?: number
    xp_bonus_100?: number
}

interface AssessmentPlayerProps {
    assessment: AssessmentData
    /** If true, hides the instructions step and starts immediately */
    autoStart?: boolean
    /** Callback when assessment is completed (passed) */
    onComplete?: () => void
}

type Step = 'instructions' | 'active' | 'results'

export function AssessmentPlayer({ assessment, autoStart = false, onComplete }: AssessmentPlayerProps) {
    const [step, setStep] = useState<Step>(autoStart ? 'active' : 'instructions')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [attemptId, setAttemptId] = useState<string | null>(null)
    const [deadline, setDeadline] = useState<string | null>(null)
    const [timeSpent, setTimeSpent] = useState<number | null>(null)
    const [results, setResults] = useState<{
        scorePct: number
        xpEarned: number
        correctCount: number
        totalQuestions: number
        passed: boolean
        rankUp?: string | null
    } | null>(null)

    const questions = assessment.questions.sort((a, b) => a.order_index - b.order_index)
    const currentQuestion = questions[currentIndex]
    const options = currentQuestion?.options || []
    const isAnswered = answers[currentQuestion?.id] !== undefined

    function handleOptionSelect(optionIndex: number) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }))
    }

    const handleTimerExpire = useCallback(async () => {
        if (isSubmitting || step !== 'active') return
        if (!attemptId) return

        toast.warning('Time expired! Submitting your answers...')
        setIsSubmitting(true)

        const elapsed = deadline ? Math.floor((Date.now() - new Date(deadline).getTime() + (assessment.time_limit_minutes || 0) * 60000) / 1000) : 0
        const res = await submitAssessment(assessment.id, attemptId, answers, elapsed)

        if (res.success) {
            setResults({
                scorePct: res.scorePct!,
                xpEarned: res.xpEarned!,
                correctCount: res.correctCount!,
                totalQuestions: res.totalQuestions!,
                passed: res.passed!,
                rankUp: res.rankUp,
            })
            setTimeSpent(elapsed)
            setStep('results')
            if (res.passed && onComplete) onComplete()
        } else {
            toast.error(res.error || 'Submission failed')
        }
        setIsSubmitting(false)
    }, [isSubmitting, step, attemptId, deadline, assessment.id, assessment.time_limit_minutes, answers, onComplete])

    async function handleStart() {
        setIsStarting(true)
        const res = await startAssessment(assessment.id)
        if (res.success) {
            setAttemptId(res.attemptId!)
            if (res.deadline) setDeadline(res.deadline)
            setStep('active')
        } else {
            toast.error(res.error || 'Failed to start assessment')
        }
        setIsStarting(false)
    }

    function goToNext() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            handleSubmit()
        }
    }

    async function handleSubmit() {
        if (!attemptId) return
        setIsSubmitting(true)

        const elapsed = deadline ? Math.floor((Date.now() - new Date(deadline).getTime() + (assessment.time_limit_minutes || 0) * 60000) / 1000) : 0
        const res = await submitAssessment(assessment.id, attemptId, answers, elapsed)

        if (res.success) {
            setResults({
                scorePct: res.scorePct!,
                xpEarned: res.xpEarned!,
                correctCount: res.correctCount!,
                totalQuestions: res.totalQuestions!,
                passed: res.passed!,
                rankUp: res.rankUp,
            })
            setTimeSpent(elapsed)

            if (res.scorePct !== undefined) {
                setStep('results')
            }

            if (res.passed) {
                toast.success(`Assessment passed! +${res.xpEarned} XP`)
                if (onComplete) onComplete()
            } else {
                toast.error(`Score: ${res.scorePct}% - did not meet the passing requirement`)
            }

            if (res.rankUp) {
                toast(`NEW RANK: ${RANK_LABELS[res.rankUp as Rank]}`, {
                    description: "You've leveled up! Keep it up!",
                    duration: 5000,
                })
            }
        } else {
            toast.error(res.error || 'Submission failed')
        }
        setIsSubmitting(false)
    }

    async function handleRetry() {
        setStep('instructions')
        setCurrentIndex(0)
        setAnswers({})
        setAttemptId(null)
        setDeadline(null)
        setTimeSpent(null)
        setResults(null)
    }

    // ─── Instructions Step ─────────────────────────────────
    if (step === 'instructions') {
        return (
            <Card className="border-border/40 bg-secondary/5">
                <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{assessment.title}</h2>
                        {assessment.instructions && (
                            <p className="text-muted-foreground mt-2 text-sm max-w-md">{assessment.instructions}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            {questions.length} Questions
                        </span>
                        {assessment.time_limit_minutes && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {assessment.time_limit_minutes} min limit
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            Up to {assessment.xp_base || 100} XP
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            Pass: {assessment.passing_score_pct || 80}%
                        </Badge>
                        {(assessment.max_attempts || 0) > 0 && (
                            <Badge variant="outline">
                                Max {assessment.max_attempts} attempts
                            </Badge>
                        )}
                    </div>
                    <Button
                        onClick={handleStart}
                        disabled={isStarting}
                        size="lg"
                        className="w-full max-w-[200px] gap-2"
                    >
                        {isStarting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Zap className="w-4 h-4" />
                        )}
                        {isStarting ? 'Starting...' : 'Start Assessment'}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // ─── Active Quiz Step ──────────────────────────────────
    if (step === 'active') {
        const progress = ((currentIndex) / questions.length) * 100

        return (
            <div className="space-y-4">
                {/* Top bar: timer + progress */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        {deadline && (
                            <AssessmentTimer deadline={deadline} onExpire={handleTimerExpire} />
                        )}
                    </div>
                    <Badge variant="secondary">{Math.round(progress)}%</Badge>
                </div>
                <Progress value={progress} className="h-1" />

                {/* Question card */}
                <Card className="border-border/40">
                    <CardContent className="p-6 space-y-6">
                        <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
                        <div className="grid gap-3">
                            {options.map((option, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleOptionSelect(i)}
                                    className={`w-full p-4 text-left rounded-lg border transition-all ${
                        answers[currentQuestion.id] === i
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border/40 hover:border-border hover:bg-secondary/10'
                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.text}</span>
                                        {answers[currentQuestion.id] === i && (
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Button
                            disabled={!isAnswered || isSubmitting}
                            onClick={goToNext}
                            className="w-full gap-2"
                            size="lg"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : null}
                            {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
                            {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ─── Results Step ──────────────────────────────────────
    if (step === 'results' && results) {
        const questionResults = questions.map(q => {
            const userAnswer = answers[q.id]
            const correctIndex = q.options.findIndex(o => o.is_correct)
            return {
                id: q.id,
                question: q.question,
                options: q.options,
                explanation: q.explanation,
                userAnswerIndex: userAnswer,
                correctIndex,
                isCorrect: userAnswer === correctIndex,
            }
        })

        return (
            <AssessmentResults
                title={assessment.title}
                scorePct={results.scorePct}
                xpEarned={results.xpEarned}
                correctCount={results.correctCount}
                totalQuestions={results.totalQuestions}
                passed={results.passed}
                passingScorePct={assessment.passing_score_pct || 80}
                questions={questionResults}
                timeSpentSeconds={timeSpent}
                rankUp={results.rankUp}
                attemptNumber={1}
                maxAttempts={assessment.max_attempts || 0}
                canRetake={!results.passed}
                onRetry={handleRetry}
            />
        )
    }

    return null
}
