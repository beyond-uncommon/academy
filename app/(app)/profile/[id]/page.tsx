import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Zap, Flame, Trophy, Star, ChevronLeft, ExternalLink } from 'lucide-react'
import { RANK_LABELS, Rank } from '@/types'
import Link from 'next/link'

export default async function PublicProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) redirect('/login')

    // If it's my own profile, redirect to the private profile page
    if (authUser.id === id) redirect('/profile')

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

    if (!profile) notFound()

    // Fetch XP & Rank
    const { data: xp } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', id)
        .maybeSingle()

    // Fetch Streak
    const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', id)
        .maybeSingle()

    // Fetch Badges
    const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, badge:badges(name, icon_url)')
        .eq('user_id', id)

    // Fetch Approved Projects
    const { data: projects } = await supabase
        .from('project_submissions')
        .select('*, lesson:lessons(title)')
        .eq('user_id', id)
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })

    const totalXP = xp?.total_xp || 0
    const rankKey = (xp?.rank || 'beginner') as Rank

    const fullName = profile.full_name || 'Learner'
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'L'

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <Link
                href="/community"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
                <ChevronLeft className="w-4 h-4" />
                Back to Community
            </Link>

            {/* Profile header */}
            <Card className="border-border/40">
                <CardContent className="p-6 flex items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-primary/10">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                        <AvatarFallback className="text-2xl bg-secondary/50">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{fullName}</h1>
                        <p className="text-muted-foreground text-sm">@{profile?.username || 'learner'}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className="text-[10px] h-5 px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                                {RANK_LABELS[rankKey]}
                            </Badge>
                            {streak?.current_streak && streak.current_streak > 0 && (
                                <Badge variant="outline" className="text-[10px] h-5 px-2 gap-1 border-orange-500/20 text-orange-500 bg-orange-500/5">
                                    <Flame className="w-3 h-3" />
                                    {streak.current_streak}d
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Achievements</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Total XP', value: totalXP.toLocaleString(), icon: Zap, color: 'text-yellow-500' },
                            { label: 'Longest Streak', value: `${streak?.longest_streak || 0}d`, icon: Flame, color: 'text-orange-500' },
                            { label: 'Badges', value: userBadges?.length || 0, icon: Trophy, color: 'text-purple-500' },
                            { label: 'Projects', value: projects?.length || 0, icon: Star, color: 'text-blue-500' },
                        ].map((s) => (
                            <Card key={s.label} className="border-border/40 bg-card/50">
                                <CardContent className="p-4 flex flex-col gap-1">
                                    <s.icon className={`w-4 h-4 ${s.color}`} />
                                    <p className="text-lg font-bold">{s.value}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="border-border/40 overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border/40">
                            <CardTitle className="text-xs uppercase tracking-tight">Recent Badges</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {!userBadges || userBadges.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">No badges earned yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    {userBadges.slice(0, 4).map((ub: any) => (
                                        <div key={ub.badge_id} className="group relative">
                                            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-border/40 hover:scale-110 transition-transform cursor-help">
                                                <span className="text-xl">{ub.badge?.icon_url || '🏅'}</span>
                                            </div>
                                            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[8px] px-1.5 py-0.5 rounded border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                {ub.badge?.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Published Projects */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Showcase Projects</h2>
                    <div className="space-y-3">
                        {(!projects || projects.length === 0) ? (
                            <Card className="border-border/40 border-dashed bg-transparent h-40 flex items-center justify-center italic">
                                <p className="text-xs text-muted-foreground text-center px-6">
                                    This learner hasn&apos;t showcased any projects yet.
                                </p>
                            </Card>
                        ) : (
                            projects.map((proj) => (
                                <Card key={proj.id} className="border-border/40 hover:border-border/80 transition-colors">
                                    <CardContent className="p-4 flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <h3 className="text-sm font-bold truncate flex-1">{proj.lesson?.title}</h3>
                                            <Badge variant="outline" className="text-[8px] h-4 py-0 bg-green-500/5 text-green-600 border-green-500/20">Approved</Badge>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <p className="text-[10px] text-muted-foreground">
                                                Submitted {new Date(proj.submitted_at).toLocaleDateString()}
                                            </p>
                                            <a
                                                href={proj.submission_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                            >
                                                View work <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
