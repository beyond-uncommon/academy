'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signup } from '@/app/(auth)/actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account...' : 'Create account'}
        </Button>
    )
}

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, null)

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <Card className="border-border/40">
            <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>Start your product design journey today — it&apos;s free</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form className="space-y-4" action={formAction}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your name"
                            required
                            autoComplete="name"
                        />
                    </div>
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
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="At least 8 characters"
                            required
                            autoComplete="new-password"
                            minLength={8}
                        />
                    </div>
                    <SubmitButton />
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-foreground font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}

