import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Zap, Flame, Trophy, ClipboardCheck, Activity, CalendarDays } from 'lucide-react'
import { getLearnerStats, getMonthlyXpTrend } from '@/lib/analytics'
import { RANK_LABELS, type Rank } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Analytics' }

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const stats = await getLearnerStats(user.id)
    const monthlyXp = await getMonthlyXpTrend(user.id)

    const maxActivity = Math.max(...stats.weeklyActivity.map((d) => d.count), 1)
    const maxMonthlyXp = Math.max(...monthlyXp.map((d) => d.xp), 1)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">My Analytics</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Track your learning activity and progress.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <div>
                            <p className="text-2xl font-bold">{stats.totalLessonsCompleted}</p>
                            <p className="text-xs text-muted-foreground">Lessons done</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <ClipboardCheck className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-2xl font-bold">{stats.totalQuizzesPassed}</p>
                            <p className="text-xs text-muted-foreground">Quizzes passed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <div>
                            <p className="text-2xl font-bold">{stats.totalProjectsApproved}</p>
                            <p className="text-xs text-muted-foreground">Projects approved</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <div>
                            <p className="text-2xl font-bold">{stats.currentStreak}</p>
                            <p className="text-xs text-muted-foreground">Day streak</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* XP & Rank */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            Total XP
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{stats.totalXP.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            Current Rank
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <p className="text-3xl font-bold capitalize">{RANK_LABELS[stats.rank as Rank]}</p>
                            <Badge variant="secondary" className="text-xs capitalize">{stats.rank}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Activity Chart */}
            <Card className="border-border/40">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        This Week
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-32">
                        {stats.weeklyActivity.map((day) => (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <span className="text-xs text-muted-foreground">{day.count}</span>
                                <div
                                    className="w-full rounded-md bg-primary/20 transition-all"
                                    style={{
                                        height: `${Math.max((day.count / maxActivity) * 100, day.count > 0 ? 8 : 4)}%`,
                                        backgroundColor: day.count > 0 ? 'var(--primary)' : 'var(--muted)',
                                        opacity: day.count > 0 ? 0.7 : 0.3,
                                    }}
                                />
                                <span className="text-[10px] text-muted-foreground">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Monthly XP Trend */}
            <Card className="border-border/40">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        XP Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-2 h-32">
                        {monthlyXp.map((m) => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <span className="text-xs text-muted-foreground">{m.xp}</span>
                                <div
                                    className="w-full rounded-md bg-yellow-500/20 transition-all"
                                    style={{
                                        height: `${Math.max((m.xp / maxMonthlyXp) * 100, m.xp > 0 ? 8 : 4)}%`,
                                        backgroundColor: m.xp > 0 ? 'rgb(234 179 8)' : 'var(--muted)',
                                        opacity: m.xp > 0 ? 0.7 : 0.3,
                                    }}
                                />
                                <span className="text-[10px] text-muted-foreground">{m.month}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Longest Streak */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Streak Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-8">
                        <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-2xl font-bold">{stats.currentStreak} days</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Best</p>
                            <p className="text-2xl font-bold">{stats.longestStreak} days</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {stats.recentActivity.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No activity yet. Start learning!
                        </div>
                    ) : (
                        <div className="divide-y divide-border/40">
                            {stats.recentActivity.map((event) => (
                                <div key={event.id} className="px-4 py-3 flex items-center gap-3">
                                    <ActivityIcon type={event.event_type} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">{eventLabel(event.event_type)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {timeAgo(event.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function ActivityIcon({ type }: { type: string }) {
    const className = 'w-4 h-4 shrink-0'
    switch (type) {
        case 'lesson_complete':
            return <BookOpen className={`${className} text-primary`} />
        case 'quiz_pass':
            return <ClipboardCheck className={`${className} text-green-500`} />
        case 'quiz_fail':
            return <ClipboardCheck className={`${className} text-destructive`} />
        case 'project_approved':
            return <Trophy className={`${className} text-yellow-500`} />
        default:
            return <Activity className={`${className} text-muted-foreground`} />
    }
}

function eventLabel(type: string): string {
    const labels: Record<string, string> = {
        lesson_complete: 'Completed a lesson',
        lesson_view: 'Viewed a lesson',
        quiz_pass: 'Passed a quiz',
        quiz_fail: 'Failed a quiz',
        quiz_attempt: 'Attempted a quiz',
        project_submit: 'Submitted a project',
        project_approved: 'Project approved',
        login: 'Logged in',
        streak_update: 'Streak updated',
    }
    return labels[type] || type
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString()
}
