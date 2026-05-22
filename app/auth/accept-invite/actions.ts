'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/** Must match the helpers in app/(app)/admin/actions.ts */
const INVITE_SECRET = process.env.INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-invite-secret'

async function verifyInviteCode(code: string, sig: string): Promise<boolean> {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(INVITE_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expectedBuf = await crypto.subtle.sign('HMAC', key, enc.encode(code))
    const expected = Array.from(new Uint8Array(expectedBuf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
    return sig === expected
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

    // Verify the signed invite code (no DB lookup needed)
    const valid = await verifyInviteCode(code, sig)
    if (!valid) {
        return { error: 'Invalid or expired invite link.' }
    }

    const admin = createAdminClient()

    // Create the user with their chosen email and password
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

    // Create profile with instructor role
    const { error: profileError } = await admin
        .from('profiles')
        .upsert({
            id: newUser.user.id,
            full_name: name,
            role: 'instructor',
            onboarding_completed: true,
        }, { onConflict: 'id' })

    if (profileError) return { error: profileError.message }

    // Sign the user in
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { error: signInError.message }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
