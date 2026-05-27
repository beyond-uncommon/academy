'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateStreak } from '@/lib/gamification'

export async function submitProject(
    lessonId: string,
    submissionUrl: string,
    notes?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Simple URL validation
    try {
        new URL(submissionUrl)
    } catch {
        return { error: 'Invalid submission URL' }
    }

    // 1. Fetch lesson to get XP reward
    const { data: lesson } = await supabase
        .from('lessons')
        .select('xp_reward')
        .eq('id', lessonId)
        .maybeSingle()

    if (!lesson) return { error: 'Lesson not found' }

    // 2. Insert/Upsert submission
    const { error: submissionError } = await supabase
        .from('project_submissions')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            submission_url: submissionUrl,
            notes: notes || '',
            status: 'pending',
            xp_earned: lesson.xp_reward,
            submitted_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' })

    if (submissionError) return { error: submissionError.message }

    // 3. Mark lesson as complete in user_progress
    await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: lesson.xp_reward
        }, { onConflict: 'user_id,lesson_id' })

    // 4. Award XP
    await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp: lesson.xp_reward
    })

    // 5. Update Streak
    await updateStreak(user.id)

    revalidatePath(`/lesson/${lessonId}`)
    revalidatePath('/projects')
    revalidatePath('/dashboard')
    revalidatePath('/profile')

    return { success: true }
}
