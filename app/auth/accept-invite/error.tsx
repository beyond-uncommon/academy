'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AcceptInviteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-4">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                <div>
                    <h2 className="text-lg font-semibold">Something went wrong</h2>
                    <p className="text-sm text-muted-foreground mt-1">{error.message || 'Failed to process invite.'}</p>
                </div>
                <Button variant="outline" onClick={reset} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try again
                </Button>
            </div>
        </div>
    )
}
