'use client'

import Link from 'next/link'
import { useActionState, useEffect, Suspense } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
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

function SearchParamsWatcher() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const error = searchParams.get('error')
        const demo = searchParams.get('demo')
        const msg: Record<string, string> = {
            invalid_link: 'Invalid or expired confirmation link. Please sign up again.',
            link_expired: 'This confirmation link has expired. Sign up again to get a new one.',
            already_confirmed: 'This email is already confirmed. Sign in with your password.',
        }
        if (error && msg[error]) {
            toast.error(msg[error])
        }
        if (demo === 'unavailable') {
            toast.error('Demo account is not configured.')
        }
    }, [searchParams])

    return null
}

function LoginForm() {
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

export default function LoginPage() {
    return (
        <Suspense>
            <SearchParamsWatcher />
            <LoginForm />
        </Suspense>
    )
}
