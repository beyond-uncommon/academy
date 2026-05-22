'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function completeInstructorSetup(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!email || !name || !password || !confirm) {
        return { error: 'All fields are required' }
    }
    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' }
    }
    if (password !== confirm) {
        return { error: 'Passwords do not match' }
    }

    const admin = createAdminClient()

    // Find the user by email
    const { data: users, error: listError } = await admin.auth.admin.listUsers()
    if (listError) return { error: listError.message }

    const user = users?.users?.find(u => u.email === email)
    if (!user) return { error: 'Invited user not found. Please contact your admin.' }

    // Set the user's chosen password
    const { error: pwError } = await admin.auth.admin.updateUserById(user.id, { password })
    if (pwError) return { error: pwError.message }

    // Update profile with name
    const { error: profileError } = await admin
        .from('profiles')
        .update({ full_name: name, onboarding_completed: true })
        .eq('id', user.id)

    if (profileError) return { error: profileError.message }

    // Sign the user in with their new password
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) return { error: signInError.message }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
