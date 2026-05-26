import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RANK_LABELS, type Rank } from '@/types'
import { Users, GraduationCap, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Users' }

export default async function AdminUsersPage() {
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

    const { data: profiles } = await admin
        .from('profiles')
        .select('id, username, full_name, avatar_url, role, created_at, has_graduated')
        .order('created_at', { ascending: false })

    const userIds = profiles?.map(p => p.id) || []

    const [{ data: allXP }, { data: allStreaks }, { data: allProgress }] = await Promise.all([
        admin.from('user_xp').select('user_id, total_xp, rank').in('user_id', userIds),
        admin.from('user_streaks').select('user_id, current_streak').in('user_id', userIds),
        admin.from('user_progress').select('user_id').eq('completed', true).in('user_id', userIds),
    ])

    const xpMap = Object.fromEntries((allXP || []).map(x => [x.user_id, x]))
    const streakMap = Object.fromEntries((allStreaks || []).map(s => [s.user_id, s]))
    const progressCount: Record<string, number> = {}
    for (const p of allProgress || []) {
        progressCount[p.user_id] = (progressCount[p.user_id] || 0) + 1
    }

    const rows = (profiles || []).map(p => ({
        ...p,
        xp: xpMap[p.id]?.total_xp ?? 0,
        rank: xpMap[p.id]?.rank as Rank | undefined,
        streak: streakMap[p.id]?.current_streak ?? 0,
        lessonsCompleted: progressCount[p.id] ?? 0,
    }))

    const adminCount = rows.filter(r => r.role === 'admin').length
    const instructorCount = rows.filter(r => r.role === 'instructor').length
    const learnerCount = rows.filter(r => r.role === 'learner').length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {rows.length} registered user{rows.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/40">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <CardTitle className="text-sm">Admins</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{adminCount}</p>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-purple-500" />
                        <CardTitle className="text-sm">Instructors</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{instructorCount}</p>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
                        <Users className="w-5 h-5 text-green-500" />
                        <CardTitle className="text-sm">Students</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{learnerCount}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/40">
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40">
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">User</th>
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Role</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">XP</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Rank</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Streak</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Lessons done</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Graduated</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => {
                                    const displayName = row.username || row.full_name || 'Anonymous'
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
                                            <td className="px-4 py-3">
                                                <Badge variant={row.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">
                                                    {row.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{row.xp.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {row.rank ? RANK_LABELS[row.rank] : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.streak > 0
                                                    ? <span className="text-orange-500 font-medium">{row.streak}d 🔥</span>
                                                    : <span className="text-muted-foreground">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right">{row.lessonsCompleted}</td>
                                            <td className="px-4 py-3 text-right">
                                                {row.has_graduated
                                                    ? <span className="text-green-500 text-xs font-medium">Yes ✓</span>
                                                    : <span className="text-muted-foreground text-xs">No</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {new Date(row.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )
                                })}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">No users yet.</td>
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
