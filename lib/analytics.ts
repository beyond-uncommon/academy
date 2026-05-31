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

export interface MonthlyXpTrend {
  month: string
  xp: number
}

export async function getMonthlyXpTrend(userId: string): Promise<MonthlyXpTrend[]> {
  const supabase = await createClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data } = await supabase
    .from('user_xp')
    .select('xp_awarded, created_at')
    .eq('user_id', userId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  if (!data) return []

  const monthMap = new Map<string, number>()

  for (const row of data) {
    const date = new Date(row.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthMap.set(key, (monthMap.get(key) || 0) + row.xp_awarded)
  }

  const months: MonthlyXpTrend[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' })
    months.push({ month: label, xp: monthMap.get(key) || 0 })
  }

  return months
}

export async function getLearnerStats(userId: string): Promise<LearnerStats> {
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
    supabase.from('user_quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('passed', true),
    supabase.from('project_submissions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved'),
    supabase.from('user_xp').select('total_xp, rank').eq('user_id', userId).maybeSingle(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', userId).maybeSingle(),
    supabase.rpc('get_weekly_activity', { p_user_id: userId }),
    supabase.from('user_activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ])

  const lessonsDone = results[0]?.count || 0
  const quizzesPassedVal = results[1]?.count || 0
  const projectsApprovedVal = results[2]?.count || 0
  const xp = results[3]?.data as { total_xp: number; rank: string } | undefined
  const streak = results[4]?.data as { current_streak: number; longest_streak: number } | undefined
  const weeklyLog = results[5]?.data as WeeklyActivity[] | undefined
  const recentLog = results[6]?.data as RecentActivity[] | undefined

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
