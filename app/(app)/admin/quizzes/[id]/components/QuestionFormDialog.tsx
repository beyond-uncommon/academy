'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
    id: string
    question: string
    options: { text: string; is_correct: boolean }[]
    explanation: string | null
}

export function QuestionFormDialog({
    open,
    onOpenChange,
    onSave,
    initial,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (question: string, options: { text: string; is_correct: boolean }[], explanation: string) => Promise<void>
    initial: Question | null
}) {
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<string[]>(['', '', '', ''])
    const [correctIndex, setCorrectIndex] = useState(0)
    const [explanation, setExplanation] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (initial) {
            setQuestion(initial.question)
            setOptions(initial.options.map((o) => o.text))
            setCorrectIndex(initial.options.findIndex((o) => o.is_correct))
            setExplanation(initial.explanation || '')
        } else {
            setQuestion('')
            setOptions(['', '', '', ''])
            setCorrectIndex(0)
            setExplanation('')
        }
    }, [initial, open])

    function addOption() {
        setOptions([...options, ''])
    }

    function removeOption(index: number) {
        if (options.length <= 2) return
        const next = options.filter((_, i) => i !== index)
        setOptions(next)
        if (correctIndex >= next.length) setCorrectIndex(next.length - 1)
        else if (correctIndex === index) setCorrectIndex(0)
    }

    function updateOption(index: number, value: string) {
        const next = [...options]
        next[index] = value
        setOptions(next)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = options.map((o) => o.trim()).filter(Boolean)
        if (!question.trim()) {
            toast.error('Question text is required')
            return
        }
        if (trimmed.length < 2) {
            toast.error('At least 2 options are required')
            return
        }
        setIsLoading(true)
        try {
            await onSave(
                question.trim(),
                options.map((text, i) => ({
                    text: text.trim(),
                    is_correct: i === correctIndex,
                })),
                explanation.trim()
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Edit Question' : 'Add Question'}</DialogTitle>
                    <DialogDescription>
                        Write the question, add options, and mark the correct answer.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Textarea
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. What is the primary purpose of design thinking?"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Options</Label>
                            <Button type="button" variant="ghost" size="sm" className="gap-1 h-7" onClick={addOption}>
                                <Plus className="w-3 h-3" />
                                Add option
                            </Button>
                        </div>
                        <RadioGroup
                            value={String(correctIndex)}
                            onValueChange={(v) => setCorrectIndex(Number(v))}
                        >
                            {options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                                    <Input
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        className="flex-1"
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 h-8 w-8 p-0 text-destructive"
                                            onClick={() => removeOption(i)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </RadioGroup>
                        <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="explanation">Explanation (shown after answering)</Label>
                        <Textarea
                            id="explanation"
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            placeholder="Explain why the correct answer is right..."
                            rows={2}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {initial ? 'Save Changes' : 'Add Question'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
