'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePassword } from '@/app/(auth)/actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Updating...' : 'Update password'}
        </Button>
    )
}

export default function ResetPasswordPage() {
    const [state, formAction] = useActionState(updatePassword, null)

    useEffect(() => {
        if (state?.error) toast.error(state.error)
    }, [state])

    return (
        <Card className="border-border/40">
            <CardHeader>
                <CardTitle>Set a new password</CardTitle>
                <CardDescription>Choose a strong password for your account.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
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
                        <Label htmlFor="confirm">Confirm password</Label>
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
    )
}
