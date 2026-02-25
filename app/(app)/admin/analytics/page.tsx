import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, Zap, Trophy, TrendingUp, BookOpen, Clock, UserPlus } from 'lucide-react'

export default async function AdminAnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

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
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-1">Detailed overview of platform engagement and learner success.</p>
            </div>

            {/* KPI Grid */}
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
        </div>
    )
}
