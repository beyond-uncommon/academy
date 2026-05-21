import { createClient } from '@/lib/supabase/server'

export interface WeeklyActivity {
  day: string
  label: string
  count: number
}

export interface LearnerStats {
  totalLessonsCompleted: number
  totalQuizzesPassed: number
  totalProjectsApproved: number
  currentStreak: number
  longestStreak: number
  totalXP: number
  rank: string
  weeklyActivity: WeeklyActivity[]
  recentActivity: RecentActivity[]
}

export interface RecentActivity {
  id: string
  event_type: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function getLearnerStats(userId: string): Promise<LearnerStats> {
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
    supabase.from('user_quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('passed', true),
    supabase.from('project_submissions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved'),
    supabase.from('user_xp').select('total_xp, rank').eq('user_id', userId).single(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', userId).single(),
    supabase.rpc('get_weekly_activity', { p_user_id: userId }),
    supabase.from('user_activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ])

  const lessonsDone = (results[0] as any)?.count || 0
  const quizzesPassedVal = (results[1] as any)?.count || 0
  const projectsApprovedVal = (results[2] as any)?.count || 0
  const xp = (results[3] as any)?.data
  const streak = (results[4] as any)?.data
  const weeklyLog = (results[5] as any)?.data
  const recentLog = (results[6] as any)?.data

  return {
    totalLessonsCompleted: lessonsDone,
    totalQuizzesPassed: quizzesPassedVal,
    totalProjectsApproved: projectsApprovedVal,
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    totalXP: xp?.total_xp || 0,
    rank: xp?.rank || 'beginner',
    weeklyActivity: (weeklyLog as WeeklyActivity[]) || getEmptyWeek(),
    recentActivity: (recentLog as RecentActivity[]) || [],
  }
}

function getEmptyWeek(): WeeklyActivity[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days.map((label, i) => ({
    day: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][i],
    label,
    count: 0,
  }))
}
