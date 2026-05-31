import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Zap, Flame } from 'lucide-react'
import Link from 'next/link'
import { RANK_LABELS, type Profile, type Rank } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leaderboard' }

const medalColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600']

export default async function LeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const [{ data: topXP }, { data: topStreak }] = await Promise.all([
        supabase
            .from('user_xp')
            .select('user_id, total_xp, weekly_xp, rank, profiles(username, full_name, avatar_url)')
            .order('total_xp', { ascending: false })
            .limit(20),
        supabase
            .from('user_streaks')
            .select('user_id, current_streak, profiles(username, full_name, avatar_url)')
            .order('current_streak', { ascending: false })
            .limit(5),
    ])

    const rows = (topXP || []).map((row, i) => ({
        rank: i + 1,
        userId: row.user_id,
        username: (row.profiles?.[0] as Profile)?.username || (row.profiles?.[0] as Profile)?.full_name || 'Anonymous',
        avatarUrl: (row.profiles?.[0] as Profile)?.avatar_url,
        totalXP: row.total_xp,
        weeklyXP: row.weekly_xp,
        rankLabel: RANK_LABELS[row.rank as Rank] || row.rank,
        isMe: row.user_id === user.id,
    }))

    const streakRows = (topStreak || []).map((row, i) => ({
        rank: i + 1,
        userId: row.user_id,
        username: (row.profiles?.[0] as Profile)?.username || (row.profiles?.[0] as Profile)?.full_name || 'Anonymous',
        avatarUrl: (row.profiles?.[0] as Profile)?.avatar_url,
        streak: row.current_streak,
        isMe: row.user_id === user.id,
    }))

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Top learners ranked by total XP earned.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main XP table */}
                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" /> Total XP
                    </h2>
                    <Card className="border-border/40">
                        <CardContent className="p-0">
                            <ul className="divide-y divide-border/40">
                                {rows.length === 0 && (
                                    <li className="p-8 text-center text-sm text-muted-foreground">
                                        No learners yet — be the first to earn XP!
                                    </li>
                                )}
                                {rows.map(row => (
                                    <li
                                        key={row.userId}
                                        className={`flex items-center gap-3 px-4 py-3 ${row.isMe ? 'bg-primary/5' : ''}`}
                                    >
                                        <span className={`w-6 text-center text-sm font-bold ${medalColors[row.rank - 1] || 'text-muted-foreground'}`}>
                                            {row.rank <= 3 ? <Trophy className="w-4 h-4 inline" /> : row.rank}
                                        </span>
                                        <Link href={`/profile/${row.userId}`} className="flex items-center gap-2 flex-1 min-w-0 hover:underline underline-offset-2">
                                            <Avatar className="w-7 h-7 shrink-0">
                                                <AvatarFallback className="text-xs">{row.username[0]?.toUpperCase()}</AvatarFallback>
                                                {row.avatarUrl && <AvatarImage src={row.avatarUrl} />}
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {row.username}
                                                    {row.isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{row.rankLabel}</p>
                                            </div>
                                        </Link>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold">{row.totalXP.toLocaleString()} XP</p>
                                            <p className="text-xs text-muted-foreground">+{row.weeklyXP} this week</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                {/* Streak sidebar */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" /> Top Streaks
                    </h2>
                    <Card className="border-border/40">
                        <CardContent className="p-0">
                            <ul className="divide-y divide-border/40">
                                {streakRows.length === 0 && (
                                    <li className="p-6 text-center text-sm text-muted-foreground">No streaks yet.</li>
                                )}
                                {streakRows.map(row => (
                                    <li key={row.userId} className={`flex items-center gap-3 px-4 py-3 ${row.isMe ? 'bg-primary/5' : ''}`}>
                                        <span className="text-sm text-muted-foreground w-4">{row.rank}</span>
                                        <Avatar className="w-6 h-6 shrink-0">
                                            <AvatarFallback className="text-xs">{row.username[0]?.toUpperCase()}</AvatarFallback>
                                            {row.avatarUrl && <AvatarImage src={row.avatarUrl} />}
                                        </Avatar>
                                        <span className="flex-1 text-sm truncate">{row.username}</span>
                                        <span className="text-sm font-semibold text-orange-500">{row.streak}d</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
