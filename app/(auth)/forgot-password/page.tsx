'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/(auth)/actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Sending...' : 'Send reset link'}
        </Button>
    )
}

export default function ForgotPasswordPage() {
    const [state, formAction] = useActionState(requestPasswordReset, null)

    useEffect(() => {
        if (state?.error) toast.error(state.error)
    }, [state])

    if (state?.success) {
        return (
            <Card className="border-border/40">
                <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Check your email</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            We sent a password reset link to{' '}
                            <span className="text-foreground font-medium">{state.email}</span>
                        </p>
                    </div>
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Back to sign in
                    </Link>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-border/40">
            <CardHeader>
                <CardTitle>Reset your password</CardTitle>
                <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>
                    <SubmitButton />
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    Remembered it?{' '}
                    <Link href="/login" className="text-foreground font-medium hover:underline">
                        Back to sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}
