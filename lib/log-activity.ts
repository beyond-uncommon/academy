'use server'

import { createClient } from '@/lib/supabase/server'

type ActivityEvent =
  | 'lesson_view'
  | 'lesson_complete'
  | 'quiz_attempt'
  | 'quiz_pass'
  | 'quiz_fail'
  | 'project_submit'
  | 'project_approved'
  | 'login'
  | 'streak_update'

export async function logActivity(
  eventType: ActivityEvent,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_activity_log').insert({
    user_id: user.id,
    event_type: eventType,
    metadata: metadata || {},
  })
}
