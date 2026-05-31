'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <Card className="border-border/40">
            <CardContent className="p-12 text-center space-y-4">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                <div>
                    <h2 className="text-lg font-semibold">Something went wrong</h2>
                    <p className="text-sm text-muted-foreground mt-1">{error.message || 'An unexpected error occurred.'}</p>
                </div>
                <Button variant="outline" onClick={reset} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try again
                </Button>
            </CardContent>
        </Card>
    )
}
