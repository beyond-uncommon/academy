'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { createQuiz } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CreateQuizDialog({ moduleId, courseId }: { moduleId?: string; courseId?: string }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        if (moduleId) formData.set('module_id', moduleId)
        if (courseId) formData.set('course_id', courseId)
        formData.set('type', moduleId ? 'module' : 'standalone')

        const res = await createQuiz({}, formData)
        if (res.success) {
            toast.success('Quiz created!')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to create quiz')
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    Quiz
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Quiz</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Quiz Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Module 1 Quiz" required />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="xp_base">Base XP</Label>
                            <Input id="xp_base" name="xp_base" type="number" defaultValue={100} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passing_score_pct">Pass %</Label>
                            <Input id="passing_score_pct" name="passing_score_pct" type="number" defaultValue={80} min={0} max={100} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_attempts">Max Attempts</Label>
                            <Input id="max_attempts" name="max_attempts" type="number" defaultValue={0} placeholder="0 = unlimited" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="time_limit_minutes">Time Limit (min)</Label>
                            <Input id="time_limit_minutes" name="time_limit_minutes" type="number" placeholder="Leave empty for no limit" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions (optional)</Label>
                        <textarea
                            id="instructions"
                            name="instructions"
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Instructions shown before the quiz starts..."
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Create Quiz
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
