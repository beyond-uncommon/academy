'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { verifyInviteCode } from '@/lib/invite'

function parseInviteCode(code: string): { role: 'instructor' | 'learner'; uuid: string } | null {
    const parts = code.split(':')
    if (parts.length === 2 && (parts[0] === 'instructor' || parts[0] === 'learner')) {
        return { role: parts[0], uuid: parts[1] }
    }
    if (parts.length === 1) {
        return { role: 'instructor', uuid: parts[0] }
    }
    return null
}

export async function completeInstructorSetup(_prevState: unknown, formData: FormData) {
    const code = formData.get('code') as string
    const sig = formData.get('s') as string
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!code || !sig || !email || !name || !password || !confirm) {
        return { error: 'All fields are required' }
    }
    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' }
    }
    if (password !== confirm) {
        return { error: 'Passwords do not match' }
    }

    const parsed = parseInviteCode(code)
    if (!parsed) return { error: 'Invalid invite code format.' }

    const valid = await verifyInviteCode(code, sig)
    if (!valid) {
        return { error: 'Invalid or expired invite link.' }
    }

    const admin = createAdminClient()

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (createError) {
        if (createError.message?.includes?.('already registered')) {
            return { error: 'An account with this email already exists.' }
        }
        return { error: createError.message }
    }

    if (!newUser?.user?.id) return { error: 'Failed to create user' }

    const { error: profileError } = await admin
        .from('profiles')
        .upsert({
            id: newUser.user.id,
            full_name: name,
            role: parsed.role,
            onboarding_completed: true,
        }, { onConflict: 'id' })

    if (profileError) return { error: profileError.message }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { error: signInError.message }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
