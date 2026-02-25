import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Zap, Flame, Trophy, Star } from 'lucide-react'
import { RANK_LABELS, RANK_THRESHOLDS, Rank } from '@/types'
import { getRank, xpToNextRank } from '@/lib/xp'
import { CourseCertificate } from '@/components/profile/CourseCertificate'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch XP & Rank
    const { data: xp } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch Streak
    const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch Badges
    const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id, badge:badges(name, icon_url)')
        .eq('user_id', user.id)

    // Fetch Project Count
    const { count: projectsCount } = await supabase
        .from('project_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    // Fetch Lessons Completed
    const { count: lessonsCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true)

    // Fetch Certificate
    const { data: certificate } = await supabase
        .from('certificates')
        .select(`
            *,
            course:courses(title)
        `)
        .eq('user_id', user.id)
        .single()

    const totalXP = xp?.total_xp || 0
    const rankKey = (xp?.rank || 'beginner') as Rank
    const nextRankData = xpToNextRank(totalXP)

    // Progress calculation for progress bar
    const currentRankXP = RANK_THRESHOLDS[rankKey]
    const nextRankXP = nextRankData ? RANK_THRESHOLDS[nextRankData.nextRank] : totalXP
    const progressPct = nextRankData
        ? ((totalXP - currentRankXP) / (nextRankXP - currentRankXP)) * 100
        : 100

    const fullName = profile?.full_name || 'Learner'
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'L'

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Profile header */}
            <Card className="border-border/40">
                <CardContent className="p-6 flex items-center gap-6">
                    <Avatar className="w-20 h-20">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={fullName} />
                        <AvatarFallback className="text-2xl">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{fullName}</h1>
                        <p className="text-muted-foreground text-sm">@{profile?.username || 'learner'}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                            {RANK_LABELS[rankKey]}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total XP', value: totalXP.toLocaleString(), icon: Zap, color: 'text-yellow-500' },
                    { label: 'Current streak', value: `${streak?.current_streak || 0}d`, icon: Flame, color: 'text-orange-500' },
                    { label: 'Badges earned', value: userBadges?.length || 0, icon: Trophy, color: 'text-purple-500' },
                    { label: 'Lessons done', value: lessonsCount || 0, icon: Star, color: 'text-blue-500' },
                ].map((s) => (
                    <Card key={s.label} className="border-border/40">
                        <CardContent className="p-4 flex items-center gap-3">
                            <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                            <div>
                                <p className="text-xl font-bold">{s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* XP to next rank */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Progress to next rank</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{RANK_LABELS[rankKey]}</span>
                        <span>
                            {nextRankData ? `${RANK_LABELS[nextRankData.nextRank]} (${RANK_THRESHOLDS[nextRankData.nextRank]} XP)` : 'Max Rank reached!'}
                        </span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                        {nextRankData
                            ? `${nextRankData.xpNeeded} XP to reach ${RANK_LABELS[nextRankData.nextRank]} rank`
                            : 'You are at the top rank! 🏆'}
                    </p>
                </CardContent>
            </Card>

            {/* Badges */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Badges</CardTitle>
                </CardHeader>
                <CardContent>
                    {!userBadges || userBadges.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                            No badges yet — complete your first lesson to earn 🌱 First Step!
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {userBadges.map((ub: any) => (
                                <div key={ub.badge_id} className="flex flex-col items-center gap-2 p-2 border border-border/40 rounded-lg bg-secondary/10">
                                    <span className="text-2xl">{ub.badge?.icon_url?.includes('http') ? '🏅' : (ub.badge?.icon_url || '🏅')}</span>
                                    <span className="text-[10px] font-medium text-center">{ub.badge?.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Projects */}
            <Card className="border-border/40">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Projects submitted</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground font-medium">
                        {projectsCount === 0
                            ? 'No projects yet — check the lesson for your first project brief.'
                            : `${projectsCount} project(s) submitted.`}
                    </p>
                </CardContent>
            </Card>

            {/* Certification */}
            {certificate && (
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Certification</h2>
                    <CourseCertificate
                        learnerName={fullName}
                        courseTitle={(certificate.course as any)?.title || 'Explorer Path'}
                        completionDate={new Date(certificate.issued_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                        certificateId={certificate.certificate_id}
                        rank={RANK_LABELS[rankKey]}
                    />
                </div>
            )}
        </div>
    )
}

