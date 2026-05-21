import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Zap, Flame, Trophy, BookOpen, ArrowRight, ClipboardCheck, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const [
        { data: xp },
        { data: streak },
        { count: badgesCount },
        { count: lessonsCount },
        { data: nodes },
        { data: userProgress },
        { data: latestBadges }
    ] = await Promise.all([
        supabase.from('user_xp').select('*').eq('user_id', user.id).single(),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).single(),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
        supabase.from('skill_tree_nodes').select('*, modules(*)'),
        supabase.from('user_progress').select('lesson_id, completed').eq('user_id', user.id),
        supabase.from('user_badges').select('badge_id, badge:badges(name, icon_url)').eq('user_id', user.id).limit(3)
    ])

    const { data: allLessons } = await supabase.from('lessons').select('id, module_id, title, xp_reward, duration_minutes')

    const completedLessonIds = new Set(userProgress?.filter(p => p.completed).map(p => p.lesson_id) || [])

    // Fetch all module assessments and their statuses
    const { data: moduleAssessments } = await supabase
        .from('quizzes')
        .select('id, module_id, title, time_limit_minutes, passing_score_pct, xp_base')
        .eq('type', 'module')
        .eq('is_published', true)

    // Find first module that is fully completed but assessment not passed
    let nextAssessment: any = null
    if (moduleAssessments && nodes && allLessons) {
        for (const node of nodes.sort((a: any, b: any) => (a.position_x || 0) - (b.position_x || 0))) {
            const moduleLessons = allLessons.filter(l => l.module_id === node.module_id)
            if (moduleLessons.length === 0) continue
            const allDone = moduleLessons.every(l => completedLessonIds.has(l.id))
            if (!allDone) break // Stop at first incomplete module

            const assessment = moduleAssessments.find((a: any) => a.module_id === node.module_id)
            if (assessment) {
                const { data: statusData } = await supabase
                    .rpc('get_assessment_status', { p_user_id: user.id, p_quiz_id: assessment.id })
                const status = Array.isArray(statusData) ? statusData[0] : statusData
                if (!status?.has_passed) {
                    nextAssessment = { ...assessment, moduleLabel: node.label }
                    break
                }
            }
        }
    }

    // Process nodes with real progress
    const skillNodes = (nodes || []).map(node => {
        const moduleLessons = allLessons?.filter(l => l.module_id === node.module_id) || []
        const totalLessons = moduleLessons.length
        const completedCount = moduleLessons.filter(l => completedLessonIds.has(l.id)).length

        const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

        let status = 'locked'
        if (progressPct === 100) {
            status = 'completed'
        } else if (progressPct > 0) {
            status = 'in_progress'
        } else {
            const prereq = node.prerequisite_node_id ? nodes?.find(n => n.id === node.prerequisite_node_id) : null
            if (!prereq) {
                status = 'in_progress'
            } else {
                const prereqLessons = allLessons?.filter(l => l.module_id === prereq.module_id) || []
                const prereqCompleted = prereqLessons.length > 0 && prereqLessons.every(l => completedLessonIds.has(l.id))
                if (prereqCompleted) status = 'in_progress'
            }
        }

        return { ...node, status, progress_pct: progressPct }
    })

    const nextLesson = allLessons?.find(l => !completedLessonIds.has(l.id))
    const nextLessonModule = nodes?.find(n => n.module_id === nextLesson?.module_id)

    const statCards = [
        { label: 'Total XP', value: xp?.total_xp || 0, icon: Zap, color: 'text-yellow-500' },
        { label: 'Day Streak', value: streak?.current_streak || 0, icon: Flame, color: 'text-orange-500' },
        { label: 'Badges', value: badgesCount || 0, icon: Trophy, color: 'text-purple-500' },
        { label: 'Lessons Done', value: lessonsCount || 0, icon: BookOpen, color: 'text-blue-500' },
    ]

    const isNewUser = (lessonsCount ?? 0) === 0 && (badgesCount ?? 0) === 0

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">{isNewUser ? 'Welcome to Academy 👋' : 'Welcome back 👋'}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {isNewUser
                        ? 'Your journey starts here. Pick a course and earn your first XP.'
                        : 'Keep your streak alive — pick up where you left off.'}
                </p>
            </div>

            {isNewUser && nextLesson && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Start your first lesson</p>
                            <p className="text-xs text-muted-foreground">
                                {nextLesson.title} · {nextLesson.duration_minutes} min · {nextLesson.xp_reward} XP
                            </p>
                        </div>
                        <Link href={`/lesson/${nextLesson.id}`} className="shrink-0">
                            <Button size="sm" className="gap-2 w-full sm:w-auto">
                                Begin <ArrowRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((s) => (
                    <Card key={s.label} className="border-border/40">
                        <CardContent className="p-4 flex items-center gap-3">
                            <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                            <div>
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Skill tree */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold">Skill Tree</h2>
                    <div className="space-y-3">
                        {skillNodes.sort((a, b) => (a.position_x || 0) - (b.position_x || 0)).map((node) => (
                            <Card key={node.id} className="border-border/40 transition-opacity duration-300" style={{ opacity: node.status === 'locked' ? 0.6 : 1 }}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{node.label}</span>
                                            {node.status === 'locked' && <Badge variant="outline" className="text-[10px] scale-90">Prerequisite required</Badge>}
                                        </div>
                                        <Badge
                                            variant={
                                                node.status === 'completed'
                                                    ? 'default'
                                                    : node.status === 'in_progress'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                            className="text-xs"
                                        >
                                            {node.status === 'locked'
                                                ? '🔒 Locked'
                                                : node.status === 'in_progress'
                                                    ? '⚡ In Progress'
                                                    : '✅ Completed'}
                                        </Badge>
                                    </div>
                                    <Progress value={node.progress_pct} className="h-1.5" />
                                    <p className="text-xs text-muted-foreground mt-1">{node.progress_pct}% complete</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Continue learning */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Continue Learning</h2>
                    {nextAssessment ? (
                        <Card className="border-border/40 ring-1 ring-yellow-500/30 bg-yellow-500/5">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <ClipboardCheck className="w-4 h-4 text-yellow-500" />
                                    <CardTitle className="text-sm">Module Assessment Ready</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    {nextAssessment.moduleLabel} · {nextAssessment.time_limit_minutes || 'No'} min limit · Pass: {nextAssessment.passing_score_pct || 80}%
                                </p>
                                <Progress value={0} className="h-1.5" />
                                <Link href={`/assessments/${nextAssessment.id}`}>
                                    <Button size="sm" className="w-full gap-2 mt-1 shadow-sm">
                                        Take assessment <ArrowRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : nextLesson ? (
                        <Card className="border-border/40 ring-1 ring-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">{nextLessonModule?.label || 'Next Module'}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    {nextLesson.title} · {nextLesson.duration_minutes} min · {nextLesson.xp_reward} XP
                                </p>
                                <Progress value={0} className="h-1.5" />
                                <Link href={`/lesson/${nextLesson.id}`}>
                                    <Button size="sm" className="w-full gap-2 mt-1 shadow-sm">
                                        Start lesson <ArrowRight className="w-3 h-3" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border/40 bg-secondary/5">
                            <CardContent className="p-6 text-center">
                                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                <p className="text-sm font-medium">All content completed!</p>
                                <p className="text-xs text-muted-foreground mt-1">Check back soon for more.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Badges preview */}
                    <Card className="border-border/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Recent badges</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {!latestBadges || latestBadges.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Complete your first lesson to earn the 🌱 First Step badge.
                                    </p>
                                ) : (
                                    latestBadges.map((ub: any) => (
                                        <div key={ub.badge_id} title={ub.badge?.name} className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-lg border border-border/40">
                                            {ub.badge?.icon_url?.includes('http') ? '🏅' : (ub.badge?.icon_url || '🏅')}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
