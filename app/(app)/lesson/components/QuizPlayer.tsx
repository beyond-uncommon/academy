'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ChevronRight, Loader2, Trophy, Zap, XCircle } from 'lucide-react'
import { submitQuiz } from '../../quiz/actions'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { RANK_LABELS, type Rank } from '@/types'

interface QuizOption {
    text: string
    is_correct: boolean
}

interface QuizPlayerProps {
    quiz: {
        id: string
        title: string
        lesson_id?: string | null
        questions: Array<{
            id: string
            question: string
            options: QuizOption[]
            explanation?: string | null
        }>
    }
}

export function QuizPlayer({ quiz }: QuizPlayerProps) {
    const [currentStep, setCurrentStep] = useState<'intro' | 'active' | 'results'>('intro')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, number>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [results, setResults] = useState<{
        scorePct: number
        xpEarned: number
        correctCount: number
        totalQuestions: number
    } | null>(null)

    const questions = quiz.questions
    const currentQuestion = questions[currentIndex]
    const options = currentQuestion.options

    function handleOptionSelect(optionIndex: number) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }))
    }

    function goToNext() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1)
        } else {
            handleSubmit()
        }
    }

    async function handleSubmit() {
        setIsSubmitting(true)
        const res = await submitQuiz(quiz.id, answers)
        if (res.success) {
            setResults({
                scorePct: res.scorePct!,
                xpEarned: res.xpEarned!,
                correctCount: res.correctCount!,
                totalQuestions: res.totalQuestions!
            })
            setCurrentStep('results')
            toast.success(`Quiz complete! +${res.xpEarned} XP`)
            if (res.rankUp) {
                toast(`🏆 NEW RANK: ${RANK_LABELS[res.rankUp as Rank]}`, {
                    description: "You've levels up! Keep it up!",
                    duration: 5000,
                })
            }
        } else {
            toast.error(res.error || 'Submission failed')
        }
        setIsSubmitting(false)
    }

    if (currentStep === 'intro') {
        return (
            <Card className="border-border/40 bg-secondary/5">
                <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{quiz.title}</h2>
                        <p className="text-muted-foreground mt-2">Test your knowledge and earn bonus XP!</p>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{questions.length} Questions</span>
                        <span>•</span>
                        <span>Bonus XP available</span>
                    </div>
                    <Button onClick={() => setCurrentStep('active')} size="lg" className="w-full max-w-[200px]">
                        Start Quiz
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (currentStep === 'active') {
        const progress = ((currentIndex) / questions.length) * 100
        const isAnswered = answers[currentQuestion.id] !== undefined

        return (
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-medium text-muted-foreground">
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        <Badge variant="secondary">{Math.round(progress)}%</Badge>
                    </div>
                    <Progress value={progress} className="h-1" />
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
                    <div className="grid gap-3">
                        {options.map((option, i) => (
                            <button
                                key={i}
                                onClick={() => handleOptionSelect(i)}
                                className={`w-full p-4 text-left rounded-lg border transition-all ${answers[currentQuestion.id] === i
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
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (currentStep === 'results' && results) {
        const isPerfect = results.scorePct === 100
        return (
            <div className="space-y-6">
                <Card className="border-border/40 overflow-hidden">
                    <div className={`h-2 ${isPerfect ? 'bg-yellow-500' : 'bg-primary'}`} />
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-5">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isPerfect ? 'bg-yellow-500/10' : 'bg-primary/10'}`}>
                            <Trophy className={`w-8 h-8 ${isPerfect ? 'text-yellow-500' : 'text-primary'}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {isPerfect ? 'Perfect Score!' : 'Quiz Complete'}
                            </h2>
                            <p className="text-muted-foreground mt-1 text-lg">
                                You scored <span className="text-foreground font-bold">{results.scorePct}%</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {results.correctCount} of {results.totalQuestions} correct
                            </p>
                        </div>
                        <div className="p-4 bg-secondary/10 rounded-xl border border-border/40 w-full max-w-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">XP Earned:</span>
                                <span className="font-bold flex items-center gap-1">
                                    <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    +{results.xpEarned} XP
                                </span>
                            </div>
                        </div>
                        <Button asChild variant="outline">
                            <a href="/dashboard">Return to Dashboard</a>
                        </Button>
                    </CardContent>
                </Card>

                {/* Answer Review */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Answer Review</h3>
                    {questions.map((q, qi) => {
                        const userAnswer = answers[q.id]
                        const correctIndex = q.options.findIndex(o => o.is_correct)
                        const isCorrect = userAnswer === correctIndex
                        return (
                            <Card key={q.id} className={`border-border/40 overflow-hidden`}>
                                <div className={`h-1 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start gap-2">
                                        {isCorrect
                                            ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            : <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        }
                                        <p className="text-sm font-medium">{qi + 1}. {q.question}</p>
                                    </div>
                                    <div className="grid gap-1.5 pl-6">
                                        {q.options.map((opt, i) => {
                                            const isUserPick = userAnswer === i
                                            const isRight = opt.is_correct
                                            let cls = 'text-xs px-3 py-1.5 rounded border '
                                            if (isRight) cls += 'border-green-500/40 bg-green-500/5 text-green-700 dark:text-green-400'
                                            else if (isUserPick && !isRight) cls += 'border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-400 line-through'
                                            else cls += 'border-border/30 text-muted-foreground'
                                            return (
                                                <div key={i} className={cls}>
                                                    {opt.text}
                                                    {isRight && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide">correct</span>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {q.explanation && (
                                        <p className="text-xs text-muted-foreground pl-6 italic">{q.explanation}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        )
    }

    return null
}
