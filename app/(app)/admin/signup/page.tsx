'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createAdminUser } from '../actions'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full gap-2" disabled={pending}>
            <UserPlus className="w-4 h-4" />
            {pending ? 'Creating admin...' : 'Create admin account'}
        </Button>
    )
}

export default function AdminSignupPage() {
    const [state, formAction] = useActionState(createAdminUser, null)

    useEffect(() => {
        if (state?.error) toast.error(state.error)
    }, [state])

    if (state?.success) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <Card className="border-border/40">
                    <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Admin created</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium text-foreground">{state.email}</span> can now sign in with their password.
                            </p>
                        </div>
                        <div className="flex gap-2 w-full">
                            <Link href="/admin/signup" className="flex-1">
                                <Button variant="outline" className="w-full">Add another</Button>
                            </Link>
                            <Link href="/admin/users" className="flex-1">
                                <Button className="w-full">View users</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto space-y-4">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to admin
            </Link>

            <Card className="border-border/40">
                <CardHeader>
                    <CardTitle>Create admin account</CardTitle>
                    <CardDescription>New admin will be able to sign in immediately — no email confirmation required.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Admin name"
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
                                placeholder="admin@example.com"
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
