import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { UserPlus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { RANK_LABELS, type Rank } from '@/types'
import type { Metadata } from 'next'
import { InviteStudentDialog } from './components/InviteStudentDialog'

export const metadata: Metadata = { title: 'Staff — Students' }

export default async function StudentsPage() {
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

    const { data: profiles } = await admin
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at')
        .eq('role', 'learner')
        .order('created_at', { ascending: false })

    const userIds = profiles?.map(p => p.id) || []

    const [{ data: allXP }, { data: allStreaks }, { data: allQuizAttempts }, { data: allSubmissions }] = await Promise.all([
        admin.from('user_xp').select('user_id, total_xp, rank').in('user_id', userIds),
        admin.from('user_streaks').select('user_id, current_streak').in('user_id', userIds),
        admin.from('user_quiz_attempts').select('user_id, passed, quiz_id, score_pct').in('user_id', userIds),
        admin.from('project_submissions').select('user_id, status, lesson_id').in('user_id', userIds),
    ])

    const xpMap = Object.fromEntries((allXP || []).map(x => [x.user_id, x]))
    const streakMap = Object.fromEntries((allStreaks || []).map(s => [s.user_id, s]))

    const quizStats: Record<string, { total: number; passed: number; recentScores: number[] }> = {}
    for (const a of allQuizAttempts || []) {
        if (!quizStats[a.user_id]) quizStats[a.user_id] = { total: 0, passed: 0, recentScores: [] }
        quizStats[a.user_id].total++
        if (a.passed) quizStats[a.user_id].passed++
        if (quizStats[a.user_id].recentScores.length < 5) {
            quizStats[a.user_id].recentScores.push(a.score_pct || 0)
        }
    }

    const submissionStats: Record<string, { total: number; approved: number }> = {}
    for (const s of allSubmissions || []) {
        if (!submissionStats[s.user_id]) submissionStats[s.user_id] = { total: 0, approved: 0 }
        submissionStats[s.user_id].total++
        if (s.status === 'approved') submissionStats[s.user_id].approved++
    }

    const rows = (profiles || []).map(p => ({
        ...p,
        xp: xpMap[p.id]?.total_xp ?? 0,
        rank: xpMap[p.id]?.rank as Rank | undefined,
        streak: streakMap[p.id]?.current_streak ?? 0,
        quizPassed: quizStats[p.id]?.passed ?? 0,
        quizTotal: quizStats[p.id]?.total ?? 0,
        projectsApproved: submissionStats[p.id]?.approved ?? 0,
        projectsTotal: submissionStats[p.id]?.total ?? 0,
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Students</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {rows.length} learner{rows.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <InviteStudentDialog />
            </div>

            <Card className="border-border/40">
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40">
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Student</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">XP</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Rank</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Streak</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Quizzes Passed</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Projects Approved</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => {
                                    const displayName = row.full_name || row.username || 'Anonymous'
                                    const initials = displayName[0]?.toUpperCase() ?? '?'
                                    return (
                                        <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 shrink-0">
                                                        <AvatarImage src={row.avatar_url ?? undefined} />
                                                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{displayName}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{row.id.slice(0, 8)}…</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{row.xp.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {row.rank ? RANK_LABELS[row.rank] : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.streak > 0
                                                    ? <span className="text-orange-500 font-medium">{row.streak}d</span>
                                                    : <span className="text-muted-foreground">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.quizTotal > 0 ? (
                                                    <span className={row.quizPassed === row.quizTotal ? 'text-green-500' : 'text-yellow-500'}>
                                                        {row.quizPassed}/{row.quizTotal}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.projectsTotal > 0 ? (
                                                    <span className={row.projectsApproved === row.projectsTotal ? 'text-green-500' : 'text-yellow-500'}>
                                                        {row.projectsApproved}/{row.projectsTotal}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {new Date(row.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No students yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
