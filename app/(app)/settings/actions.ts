'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Updates the user's profile information.
 */
export async function updateProfile(formData: {
    full_name?: string
    username?: string
    bio?: string
    avatar_url?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    // Update the profile
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.full_name,
            username: formData.username,
            bio: formData.bio,
            avatar_url: formData.avatar_url,
        })
        .eq('id', user.id)

    if (error) {
        // Handle unique constraint on username
        if (error.code === '23505') {
            throw new Error('Username is already taken')
        }
        throw error
    }

    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return { success: true }
}
