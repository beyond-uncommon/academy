import { createAdminClient } from '@/lib/supabase/server'
import { sendStreakReminderEmail } from '@/lib/email'

export const maxDuration = 300

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('Authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        user_streaks (current_streak, last_activity_date)
      `)
      .eq('onboarding_completed', true)

    if (error) throw error

    let emailsSent = 0
    let errors = 0

    for (const user of users) {
      if (!user.email || !user.user_streaks?.[0]) continue
      
      const streak = user.user_streaks[0]
      const lastActivity = streak.last_activity_date
      
      if (lastActivity === today) continue
      
      const lastDate = new Date(lastActivity)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1 && streak.current_streak > 0) {
        const sent = await sendStreakReminderEmail(
          user.email,
          user.full_name || 'Learner',
          streak.current_streak
        )
        
        if (sent) {
          emailsSent++
        } else {
          errors++
        }
      }
    }

    return Response.json({ 
      success: true, 
      emailsSent,
      errors,
      message: `Sent ${emailsSent} streak reminder emails`
    })
  } catch (error) {
    console.error('Streak reminder error:', error)
    return Response.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
