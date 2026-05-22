'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function AcceptInviteForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [error, setError] = useState('')
    const [userId, setUserId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()

            // Supabase client auto-detects #access_token from URL fragment (implicit flow)
            const { data } = await supabase.auth.getUser()

            if (data?.user) {
                setUserId(data.user.id)
                setStatus('ready')
                return
            }

            // Fallback: handle PKCE ?code= flow (if Supabase project uses it)
            const code = searchParams.get('code')
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (error) {
                    setError(error.message)
                    setStatus('error')
                    return
                }
                const { data: userData } = await supabase.auth.getUser()
                if (userData?.user) {
                    setUserId(userData.user.id)
                    setStatus('ready')
                    return
                }
            }

            setError('The invite link is invalid or has expired. Please contact your admin for a new one.')
            setStatus('error')
        }

        init()
    }, [searchParams])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setSubmitting(true)
        const supabase = createClient()

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: name.trim(), onboarding_completed: true })
            .eq('id', userId)

        if (profileError) {
            setError(profileError.message)
            setSubmitting(false)
            return
        }

        if (password.length >= 8) {
            const { error: pwError } = await supabase.auth.updateUser({ password })
            if (pwError) {
                setError(pwError.message)
                setSubmitting(false)
                return
            }
        }

        router.push('/dashboard')
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invalid Invite</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => router.push('/login')}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Complete Your Account</CardTitle>
                    <CardDescription>Set your name and password to start using the platform as an instructor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your name"
                                required
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                minLength={8}
                                autoComplete="new-password"
                            />
                            <p className="text-xs text-muted-foreground">
                                Set a password to sign in later. Leave blank to use the invite link next time.
                            </p>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
                            {submitting ? 'Saving...' : 'Complete Setup'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <AcceptInviteForm />
        </Suspense>
    )
}
