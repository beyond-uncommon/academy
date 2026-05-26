import { createClient } from '@/lib/supabase/server'

/**
 * Updates the user's daily streak.
 * Logic:
 * - If last_activity was yesterday: streak++
 * - If last_activity was today: do nothing
 * - If last_activity was before yesterday: streak = 1
 */
export async function updateStreak(userId: string) {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().split('T')[0]

    const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

    if (!streak) {
        // First ever activity
        await supabase.from('user_streaks').insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today
        })
        return
    }

    const lastDate = streak.last_activity_date

    if (lastDate === today) {
        // Already active today
        return
    }

    if (lastDate === yesterday) {
        // Yesterday was active, increment streak
        const newStreak = streak.current_streak + 1
        await supabase
            .from('user_streaks')
            .update({
                current_streak: newStreak,
                longest_streak: Math.max(newStreak, streak.longest_streak),
                last_activity_date: today,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
    } else {
        // Streak broken
        await supabase
            .from('user_streaks')
            .update({
                current_streak: 1,
                last_activity_date: today,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
    }
}
