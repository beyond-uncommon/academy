'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signup, resendConfirmation } from '@/app/(auth)/actions'
import { MailCheck, Loader2 } from 'lucide-react'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account...' : 'Create account'}
        </Button>
    )
}

function ResendButton({ email }: { email: string }) {
    const [resent, setResent] = useState(false)
    const [pending, setPending] = useState(false)

    async function handleResend() {
        setPending(true)
        const fd = new FormData()
        fd.set('email', email)
        const res = await resendConfirmation(null, fd)
        setPending(false)
        if (res?.error) {
            toast.error(res.error)
        } else {
            setResent(true)
            toast.success('Confirmation email resent!')
        }
    }

    if (resent) {
        return <p className="text-xs text-muted-foreground">Email sent! Check your inbox.</p>
    }

    return (
        <Button variant="outline" size="sm" onClick={handleResend} disabled={pending}>
            {pending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Sending...</> : 'Resend email'}
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

    if (state?.success) {
        return (
            <Card className="border-border/40">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <MailCheck className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle>Check your email</CardTitle>
                    <CardDescription>
                        We sent a confirmation link to <strong>{state.email}</strong>. Click it to activate your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-xs text-muted-foreground">
                        Didn&apos;t receive an email? Check your spam folder — it might have been filtered.
                    </p>
                    <div className="flex justify-center">
                        <ResendButton email={state.email} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Already confirmed?{' '}
                        <Link href="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
                    </p>
                </CardContent>
            </Card>
        )
    }

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
