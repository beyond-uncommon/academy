'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateStreak } from '@/lib/gamification'
import { logActivity } from '@/lib/log-activity'

export async function completeLesson(lessonId: string, xpReward: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
            xp_earned: xpReward
        }, { onConflict: 'user_id,lesson_id' })

    if (progressError) return { error: progressError.message }

    const { data: xpBefore } = await supabase
        .from('user_xp')
        .select('rank')
        .eq('user_id', user.id)
        .maybeSingle()

    const { error: xpError } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_xp: xpReward
    })
    if (xpError) return { error: xpError.message }

    await updateStreak(user.id)

    const { data: xpAfter } = await supabase
        .from('user_xp')
        .select('rank')
        .eq('user_id', user.id)
        .maybeSingle()

    const rankUp = xpBefore?.rank !== xpAfter?.rank ? xpAfter?.rank : null

    await logActivity('lesson_complete', { lesson_id: lessonId, xp_earned: xpReward })
    await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'lesson_completed',
        p_title: 'Lesson completed',
        p_body: `You earned ${xpReward} XP`,
        p_link: `/lesson/${lessonId}`,
    })

    revalidatePath(`/lesson/${lessonId}`)
    revalidatePath('/dashboard')
    revalidatePath('/profile')

    return { success: true, rankUp }
}
