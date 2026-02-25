'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/app/(auth)/actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign in'}
        </Button>
    )
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null)

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <Card className="border-border/40">
            <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to continue your learning streak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form className="space-y-4" action={formAction}>
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <SubmitButton />
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-foreground font-medium hover:underline">
                        Sign up free
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}

