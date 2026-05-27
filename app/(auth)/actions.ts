'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function signup(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: 'Name, email, and password are required' }
    }
    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' }
    }

    const supabase = await createClient()

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
            emailRedirectTo: `${siteUrl}/auth/confirm`,
        },
    })

    if (error) {
        if (error.message.includes('already registered')) {
            return { error: 'An account with this email already exists. Sign in instead.' }
        }
        return { error: error.message }
    }

    // Email confirmation required — no session created
    if (!data.session) {
        return { success: true, email }
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function resendConfirmation(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    if (!email) return { error: 'Email is required' }

    const supabase = await createClient()
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/confirm`,
        },
    })

    if (error) {
        if (error.message.includes('already_confirmed') || error.message.includes('already verified')) {
            return { error: 'This email is already confirmed. Try signing in.' }
        }
        if (error.message.includes('rate_limit')) {
            return { error: 'Too many requests. Please wait a moment before trying again.' }
        }
        return { error: error.message }
    }

    return { success: true, email }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function requestPasswordReset(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    if (!email) return { error: 'Email is required' }

    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm?type=recovery&next=/reset-password`,
    })

    // Always return success to prevent email enumeration
    if (error) console.error('Password reset error:', error.message)
    return { success: true, email }
}

export async function updatePassword(_prevState: unknown, formData: FormData) {
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!password || !confirm) return { error: 'All fields are required' }
    if (password !== confirm) return { error: 'Passwords do not match' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters' }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }

    redirect('/dashboard')
}

export async function loginAsDemo() {
    const email = process.env.DEMO_EMAIL
    const password = process.env.DEMO_PASSWORD

    if (!email || !password) redirect('/login?demo=unavailable')

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) redirect('/login?demo=unavailable')

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
