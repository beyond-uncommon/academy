'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(_prevState: any, formData: FormData) {
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

export async function signup(_prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
        return { error: 'Name, email, and password are required' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function requestPasswordReset(_prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    if (!email) return { error: 'Email is required' }

    const supabase = await createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm?type=recovery&next=/reset-password`,
    })

    // Always return success to prevent email enumeration
    if (error) console.error('Password reset error:', error.message)
    return { success: true, email }
}

export async function updatePassword(_prevState: any, formData: FormData) {
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
