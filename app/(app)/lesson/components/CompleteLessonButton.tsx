'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { completeLesson } from '../actions'
import { toast } from 'sonner'
import { RANK_LABELS, type Rank } from '@/types'

interface CompleteLessonButtonProps {
    lessonId: string
    xpReward: number
    initialCompleted: boolean
}

export function CompleteLessonButton({
    lessonId,
    xpReward,
    initialCompleted
}: CompleteLessonButtonProps) {
    const [isCompleted, setIsCompleted] = useState(initialCompleted)
    const [isLoading, setIsLoading] = useState(false)

    async function handleComplete() {
        if (isCompleted) return

        setIsLoading(true)
        const result = await completeLesson(lessonId, xpReward)

        if (result.success) {
            setIsCompleted(true)
            toast.success(`Lesson completed! +${xpReward} XP awarded.`)
            if (result.rankUp) {
                toast(`🏆 NEW RANK: ${RANK_LABELS[result.rankUp as Rank]}`, {
                    description: "You've leveled up! Keep it up!",
                    duration: 5000,
                })
            }
        } else {
            toast.error(result.error || 'Failed to complete lesson')
        }
        setIsLoading(false)
    }

    return (
        <Button
            onClick={handleComplete}
            disabled={isCompleted || isLoading}
            className="gap-2"
            variant={isCompleted ? 'secondary' : 'default'}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <CheckCircle className="w-4 h-4" />
            )}
            {isCompleted ? 'Completed' : `Mark as complete (+${xpReward} XP)`}
        </Button>
    )
}
