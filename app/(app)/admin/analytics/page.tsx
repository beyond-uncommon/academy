import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Zap, Trophy, TrendingUp, BookOpen, Clock, UserPlus, Flame, Target, Award } from 'lucide-react'

function getSevenDaysAgo() {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

export default async function AdminAnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isStaff = profile?.role === 'admin' || profile?.role === 'instructor'
    if (!isStaff) redirect('/dashboard')

    const admin = createAdminClient()

    // 1. Key Metrics
    const { count: totalLearners } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'learner')

    const { data: xpData } = await admin
        .from('user_xp')
        .select('total_xp')

    const totalXP = xpData?.reduce((sum, entry) => sum + entry.total_xp, 0) || 0
    const avgXP = totalLearners ? Math.round(totalXP / totalLearners) : 0

    const { count: totalGraduates } = await admin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('has_graduated', true)

    const completionRate = totalLearners ? Math.round((totalGraduates || 0) / totalLearners * 100) : 0

    // 2. Platform status (real data)
    const sevenDaysAgo = getSevenDaysAgo()

    const [
        { count: pendingSubmissions },
        { count: publishedLessons },
        { count: newSignups },
    ] = await Promise.all([
        admin.from('project_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        admin.from('lessons').select('*', { count: 'exact', head: true }).eq('is_published', true),
        admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo).eq('role', 'learner'),
    ])

    // 3. Recent Activity
    const { data: recentProgress } = await admin
        .from('user_progress')
        .select(`
            id,
            completed_at,
            profile:profiles(full_name),
            lesson:lessons(title)
        `)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(5)

    // 4. Streak Statistics
    const { data: streakData } = await admin
        .from('user_streaks')
        .select('current_streak, longest_streak')
    
    const activeStreaks = streakData?.filter(s => s.current_streak > 0).length || 0
    const avgStreak = streakData?.length ? Math.round(streakData.reduce((sum, s) => sum + s.current_streak, 0) / streakData.length) : 0
    const maxStreak = streakData?.reduce((max, s) => Math.max(max, s.longest_streak), 0) || 0

    // 5. Skill Level Distribution
    const { data: skillLevels } = await admin
        .from('profiles')
        .select('skill_level')
        .not('skill_level', 'is', null)

    const beginnerCount = skillLevels?.filter(p => p.skill_level === 'beginner').length || 0
    const intermediateCount = skillLevels?.filter(p => p.skill_level === 'intermediate').length || 0
    const advancedCount = skillLevels?.filter(p => p.skill_level === 'advanced').length || 0

    // 6. Course Performance
    const { data: courseStats } = await admin
        .from('courses')
        .select(`
            id,
            title,
            modules:modules(
                lessons:lessons(
                    progress:user_progress(completed)
                )
            )
        `)

    const courseCompletionRates = courseStats?.map(course => {
        const allLessons = course.modules?.flatMap(m => m.lessons || []) || []
        const completedLessons = (allLessons as { progress: { completed: boolean }[] | null }[]).filter(
            (l) => l.progress?.some((p) => p.completed)
        ).length
        return {
            title: course.title,
            rate: allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0,
            total: allLessons.length
        }
    }) || []

    // 7. Top Performers
    const { data: topPerformers } = await admin
        .from('user_xp')
        .select(`
            total_xp,
            rank,
            profile:profiles(full_name, avatar_url)
        `)
        .order('total_xp', { ascending: false })
        .limit(5)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1">Detailed overview of platform engagement and learner success.</p>
            </div>

            {/* KPI Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Learners', value: totalLearners?.toLocaleString() ?? '0', icon: Users, color: 'text-blue-500' },
                    { label: 'Avg XP / Learner', value: avgXP.toLocaleString(), icon: Zap, color: 'text-yellow-500' },
                    { label: 'Graduation Rate', value: `${completionRate}%`, icon: Trophy, color: 'text-purple-500' },
                    { label: 'Total XP Awarded', value: totalXP >= 1000 ? (totalXP / 1000).toFixed(1) + 'k' : String(totalXP), icon: TrendingUp, color: 'text-green-500' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="border-border/40">
                        <CardContent className="p-6">
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            <div className="mt-4">
                                <p className="text-2xl font-bold">{kpi.value}</p>
                                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* KPI Grid - Row 2 (Engagement) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Active Streaks', value: activeStreaks.toString(), icon: Flame, color: 'text-orange-500' },
                    { label: 'Avg Streak', value: `${avgStreak} days`, icon: Target, color: 'text-red-500' },
                    { label: 'Longest Streak', value: `${maxStreak} days`, icon: Award, color: 'text-amber-500' },
                    { label: 'New Signups (7d)', value: newSignups?.toString() || '0', icon: UserPlus, color: 'text-cyan-500' },
                ].map((kpi) => (
                    <Card key={kpi.label} className="border-border/40">
                        <CardContent className="p-6">
                            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                            <div className="mt-4">
                                <p className="text-2xl font-bold">{kpi.value}</p>
                                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Progress Feed */}
                <Card className="lg:col-span-2 border-border/40">
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Progress Feed</CardTitle>
                        <CardDescription>Live stream of lesson completions across the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentProgress?.map((item) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            <span className="text-primary">{(item.profile as any)?.full_name}</span>
                                            <span className="text-muted-foreground"> completed </span>
                                            <span className="font-semibold">{(item.lesson as any)?.title}</span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                                            {new Date(item.completed_at!).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!recentProgress || recentProgress.length === 0) && (
                                <p className="text-center py-8 text-sm text-muted-foreground italic">No recent activity detected.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Status — real data only */}
                <Card className="border-border/40 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Platform Status</CardTitle>
                        <CardDescription>Live counts from the database.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Pending reviews', value: pendingSubmissions ?? 0, icon: Clock, note: 'submissions awaiting approval' },
                            { label: 'Published lessons', value: publishedLessons ?? 0, icon: BookOpen, note: 'live and accessible to learners' },
                            { label: 'New signups (7d)', value: newSignups ?? 0, icon: UserPlus, note: 'learners joined this week' },
                        ].map(({ label, value, icon: Icon, note }) => (
                            <div key={label} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{value}</p>
                                    <p className="text-xs text-muted-foreground">{note}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Skill Level Distribution & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Skill Level Distribution */}
                <Card className="border-border/40">
                    <CardHeader>
                        <CardTitle className="text-lg">Skill Level Distribution</CardTitle>
                        <CardDescription>Learners by self-reported skill level.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Beginner', count: beginnerCount, color: 'bg-green-500', pct: totalLearners ? Math.round(beginnerCount / totalLearners * 100) : 0 },
                            { label: 'Intermediate', count: intermediateCount, color: 'bg-yellow-500', pct: totalLearners ? Math.round(intermediateCount / totalLearners * 100) : 0 },
                            { label: 'Advanced', count: advancedCount, color: 'bg-purple-500', pct: totalLearners ? Math.round(advancedCount / totalLearners * 100) : 0 },
                        ].map((level) => (
                            <div key={level.label} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{level.label}</span>
                                    <span className="text-muted-foreground">{level.count} ({level.pct}%)</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${level.color} transition-all`} style={{ width: `${level.pct}%` }} />
                                </div>
                            </div>
                        ))}
                        {(!skillLevels || skillLevels.length === 0) && (
                            <p className="text-center py-4 text-sm text-muted-foreground italic">No skill level data yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Performers */}
                <Card className="border-border/40">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Performers</CardTitle>
                        <CardDescription>Highest XP earners on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topPerformers?.map((performer, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                                        idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                                        'bg-muted text-muted-foreground'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{(performer.profile as any)?.full_name || 'Anonymous'}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{performer.rank}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{performer.total_xp.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">XP</p>
                                    </div>
                                </div>
                            ))}
                            {(!topPerformers || topPerformers.length === 0) && (
                                <p className="text-center py-4 text-sm text-muted-foreground italic">No performers yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Course Performance */}
            <Card className="border-border/40">
                <CardHeader>
                    <CardTitle className="text-lg">Course Performance</CardTitle>
                    <CardDescription>Completion rates by course.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {courseCompletionRates.map((course) => (
                            <div key={course.title} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{course.title}</span>
                                        <span className="text-muted-foreground">{course.rate}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary transition-all" 
                                            style={{ width: `${course.rate}%` }} 
                                        />
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground w-16 text-right">{course.total} lessons</span>
                            </div>
                        ))}
                        {courseCompletionRates.length === 0 && (
                            <p className="text-center py-4 text-sm text-muted-foreground italic">No course data yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
