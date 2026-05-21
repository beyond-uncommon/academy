'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface AssessmentTimerProps {
    deadline: string
    onExpire: () => void
}

export function AssessmentTimer({ deadline, onExpire }: AssessmentTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null)
    const [isLow, setIsLow] = useState(false)
    const expiredRef = useRef(false)

    const calcTimeLeft = useCallback(() => {
        const now = Date.now()
        const diff = new Date(deadline).getTime() - now
        if (diff <= 0) return null
        return {
            minutes: Math.floor(diff / 60000),
            seconds: Math.floor((diff % 60000) / 1000),
        }
    }, [deadline])

    useEffect(() => {
        const tick = () => {
            const remaining = calcTimeLeft()
            if (!remaining) {
                if (!expiredRef.current) {
                    expiredRef.current = true
                    onExpire()
                }
                return
            }
            setTimeLeft(remaining)
            setIsLow(remaining.minutes < 1)
        }

        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [calcTimeLeft, onExpire])

    if (!timeLeft) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-semibold">Time expired</span>
            </div>
        )
    }

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
                isLow
                    ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                    : 'bg-secondary/10 border-border/40 text-muted-foreground'
            }`}
        >
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm font-bold tabular-nums">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    )
}
