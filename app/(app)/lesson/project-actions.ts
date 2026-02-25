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

    if (!user) throw new Error('Not authenticated')

    // Simple URL validation
    try {
        new URL(submissionUrl)
    } catch (e) {
        throw new Error('Invalid submission URL')
    }

    try {
        // 1. Fetch lesson to get XP reward
        const { data: lesson } = await supabase
            .from('lessons')
            .select('xp_reward')
            .eq('id', lessonId)
            .single()

        if (!lesson) throw new Error('Lesson not found')

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

        if (submissionError) throw submissionError

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
        revalidatePath('/dashboard')
        revalidatePath('/profile')

        return { success: true }
    } catch (error: any) {
        console.error('Error submitting project:', error)
        return { success: false, error: error.message }
    }
}
