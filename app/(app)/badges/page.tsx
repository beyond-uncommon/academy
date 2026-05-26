import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Lock, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Badges' }

const rarityOrder: Record<string, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
}

const rarityColors: Record<string, string> = {
    common: 'border-slate-300 bg-slate-50 text-slate-700',
    uncommon: 'border-green-300 bg-green-50 text-green-700',
    rare: 'border-blue-300 bg-blue-50 text-blue-700',
    epic: 'border-purple-300 bg-purple-50 text-purple-700',
    legendary: 'border-amber-300 bg-amber-50 text-amber-700',
}

const rarityLabel: Record<string, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
}

export default async function BadgesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
        supabase.from('badges').select('*').order('rarity', { ascending: true }),
        supabase.from('user_badges').select('badge_id').eq('user_id', user.id),
    ])

    const earnedSet = new Set(userBadges?.map(ub => ub.badge_id) || [])
    const earned = allBadges?.filter(b => earnedSet.has(b.id)) || []
    const total = allBadges?.length || 0

    const grouped: Record<string, typeof allBadges> = {}
    for (const b of allBadges || []) {
        const key = b.rarity
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(b)
    }
    const sortedKeys = Object.keys(grouped).sort((a, b) => (rarityOrder[a] ?? 99) - (rarityOrder[b] ?? 99))

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Badges</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Collect badges by completing lessons, achieving streaks, and mastering skills.
                </p>
            </div>

            <Card className="border-border/40 bg-primary/5">
                <CardContent className="p-6 flex items-center gap-4">
                    <Trophy className="w-8 h-8 text-yellow-500 shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">{earned.length} of {total} badges earned</p>
                        <Progress value={total > 0 ? Math.round((earned.length / total) * 100) : 0} className="h-2 mt-2" />
                    </div>
                    <span className="text-2xl font-bold text-yellow-500">{total > 0 ? Math.round((earned.length / total) * 100) : 0}%</span>
                </CardContent>
            </Card>

            <div className="space-y-10">
                {sortedKeys.map(rarity => (
                    <div key={rarity}>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4" />
                            <h2 className="text-lg font-semibold capitalize">{rarityLabel[rarity] || rarity}</h2>
                            <Badge variant="secondary" className="text-xs">
                                {(grouped[rarity] || []).filter(b => earnedSet.has(b.id)).length}/{(grouped[rarity] || []).length}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {(grouped[rarity] || []).map(badge => {
                                const has = earnedSet.has(badge.id)
                                return (
                                    <Card key={badge.id} className={`border-border/40 transition-all ${has ? 'hover:border-border/80' : 'opacity-60'}`}>
                                        <CardContent className="p-4 text-center">
                                            <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl border-2 ${rarityColors[badge.rarity] || 'border-border'}`}>
                                                {has ? (badge.icon_url || '🏅') : <Lock className="w-5 h-5 text-muted-foreground" />}
                                            </div>
                                            <p className="text-sm font-medium truncate">{badge.name}</p>
                                            {badge.description && (
                                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                                            )}
                                            <Badge variant="outline" className={`text-[9px] mt-2 uppercase tracking-wider ${has ? '' : 'text-muted-foreground'}`}>
                                                {rarityLabel[badge.rarity] || badge.rarity}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {total === 0 && (
                <Card className="border-border/40">
                    <CardContent className="p-12 text-center">
                        <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">No badges defined yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Badges will be added over time as you progress.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
