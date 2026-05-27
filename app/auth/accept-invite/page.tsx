'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { completeInstructorSetup } from './actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account...' : 'Create Account'}
        </Button>
    )
}

function useRole(code: string): 'instructor' | 'learner' | null {
    const parts = code.split(':')
    if (parts.length === 2 && (parts[0] === 'instructor' || parts[0] === 'learner')) {
        return parts[0]
    }
    return null
}

function AcceptInviteForm() {
    const searchParams = useSearchParams()
    const code = searchParams.get('code') || ''
    const sig = searchParams.get('s') || ''
    const role = useRole(code)
    const [state, formAction] = useActionState(completeInstructorSetup, null)

    useEffect(() => {
        if (state?.error) toast.error(state.error)
    }, [state])

    if (!code || !sig) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invalid Link</CardTitle>
                        <CardDescription>
                            This invite link is missing the invite code. Please contact your admin for a new one.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    if (!role) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invalid Invite</CardTitle>
                        <CardDescription>
                            The invite format is not recognized. Please ask your admin for a new invite link.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const roleLabel = role === 'instructor' ? 'an instructor' : 'a student'
    const roleTitle = role === 'instructor' ? 'Join as Instructor' : 'Join as Student'

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{roleTitle}</CardTitle>
                    <CardDescription>
                        You&apos;ve been invited to join as {roleLabel}. Fill in your details to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="code" value={code} />
                        <input type="hidden" name="s" value={sig} />
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="Your name" required autoComplete="name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="At least 8 characters"
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm Password</Label>
                            <Input
                                id="confirm"
                                name="confirm"
                                type="password"
                                placeholder="Repeat your password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={null}>
            <AcceptInviteForm />
        </Suspense>
    )
}
