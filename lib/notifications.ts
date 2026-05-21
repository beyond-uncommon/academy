import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'lesson_completed'
  | 'quiz_passed'
  | 'quiz_failed'
  | 'project_approved'
  | 'project_reviewed'
  | 'badge_earned'
  | 'streak_at_risk'
  | 'module_unlocked'
  | 'course_completed'
  | 'assessment_ready'
  | 'xp_milestone'
  | 'peer_feedback'
  | 'admin_message'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
}

export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data || []) as Notification[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return count || 0
}
