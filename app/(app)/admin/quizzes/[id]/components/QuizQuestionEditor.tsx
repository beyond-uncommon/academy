'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Check, X, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { QuestionFormDialog } from './QuestionFormDialog'

interface Question {
    id: string
    quiz_id: string
    question: string
    options: { text: string; is_correct: boolean }[]
    explanation: string | null
    order_index: number
    is_draft: boolean
    generated_by: string | null
}

export function QuizQuestionEditor({ quizId, questions: initial }: { quizId: string; questions: Question[] }) {
    const [questions, setQuestions] = useState(initial)
    const [editQuestion, setEditQuestion] = useState<Question | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
    const router = useRouter()

    const filtered = questions.filter((q) => {
        if (filter === 'published') return !q.is_draft
        if (filter === 'draft') return q.is_draft
        return true
    })

    async function handleSave(question: string, options: { text: string; is_correct: boolean }[], explanation: string) {
        try {
            if (editQuestion) {
                const { updateQuestion } = await import('../../../actions')
                const res = await updateQuestion(editQuestion.id, { question, options, explanation })
                if (!res.success) throw new Error('Failed to update')
                toast.success('Question updated')
            } else {
                const { addQuestion } = await import('../../../actions')
                const res = await addQuestion(quizId, question, options, explanation)
                if (!res.success) throw new Error('Failed to add')
                toast.success('Question added')
            }
            setDialogOpen(false)
            setEditQuestion(null)
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Something went wrong')
        }
    }

    async function handleDelete(questionId: string) {
        try {
            const { deleteQuestion } = await import('../../../actions')
            const res = await deleteQuestion(questionId, quizId)
            if (!res.success) throw new Error('Failed to delete')
            toast.success('Question deleted')
            setDeleteId(null)
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Something went wrong')
        }
    }

    async function handleGenerate() {
        setIsGenerating(true)
        try {
            const { generateQuizQuestions } = await import('../../../actions')
            const res = await generateQuizQuestions(quizId, 5)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success(`${res.count} questions generated as drafts`)
                router.refresh()
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Generation failed')
        } finally {
            setIsGenerating(false)
        }
    }

    async function handlePublish(questionId: string) {
        try {
            const { publishQuestion } = await import('../../../actions')
            await publishQuestion(questionId, quizId)
            toast.success('Question published')
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to publish')
        }
    }

    async function handlePublishAll() {
        try {
            const { publishAllQuestions } = await import('../../../actions')
            await publishAllQuestions(quizId)
            toast.success('All drafts published')
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to publish')
        }
    }

    async function handleUnpublish(questionId: string) {
        try {
            const { unpublishQuestion } = await import('../../../actions')
            await unpublishQuestion(questionId, quizId)
            toast.success('Question unpublished')
            router.refresh()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to unpublish')
        }
    }

    const draftCount = questions.filter((q) => q.is_draft).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Questions</h2>
                    <div className="flex items-center gap-1 ml-2">
                        {(['all', 'published', 'draft'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'secondary' : 'ghost'}
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' && `All (${questions.length})`}
                                {f === 'published' && `Published (${questions.length - draftCount})`}
                                {f === 'draft' && `Draft (${draftCount})`}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {draftCount > 0 && (
                        <Button variant="outline" size="sm" className="gap-1" onClick={handlePublishAll}>
                            <Eye className="w-4 h-4" />
                            Publish All Drafts
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1" onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                            setEditQuestion(null)
                            setDialogOpen(true)
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Manually
                    </Button>
                </div>
            </div>

            {questions.length === 0 ? (
                <Card className="border-border/40">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No questions yet. Generate with AI or add manually.
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="border-border/40">
                    <CardContent className="p-8 text-center text-muted-foreground">
                        {filter === 'published' ? 'No published questions.' : 'No draft questions.'}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map((q, idx) => (
                        <Card key={q.id} className={`border-border/40 ${q.is_draft ? 'border-yellow-500/30 bg-yellow-500/[0.02]' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {idx + 1}
                                            </span>
                                            <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                                            {q.is_draft && (
                                                <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">
                                                    Draft
                                                </Badge>
                                            )}
                                            {q.generated_by === 'ai' && (
                                                <Badge variant="outline" className="text-[10px] text-purple-500 border-purple-500/30">
                                                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1 pl-6">
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2 text-sm">
                                                    {opt.is_correct ? (
                                                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                    ) : (
                                                        <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                                    )}
                                                    <span className={opt.is_correct ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                                                        {opt.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {q.explanation && (
                                            <p className="text-xs text-muted-foreground pl-6 pt-1 border-t border-border/20 mt-2">
                                                <span className="font-medium">Explanation:</span> {q.explanation}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {q.is_draft ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-500"
                                                onClick={() => handlePublish(q.id)}
                                                title="Publish"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground"
                                                onClick={() => handleUnpublish(q.id)}
                                                title="Unpublish"
                                            >
                                                <EyeOff className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditQuestion(q)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        {deleteId === q.id ? (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => handleDelete(q.id)}
                                                >
                                                    Confirm
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => setDeleteId(null)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => setDeleteId(q.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <QuestionFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditQuestion(null)
                }}
                onSave={handleSave}
                initial={editQuestion}
            />
        </div>
    )
}
