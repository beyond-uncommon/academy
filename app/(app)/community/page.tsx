import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Flame, Zap, ExternalLink, MessageSquare, Heart, Link2 } from 'lucide-react'
import Link from 'next/link'

export default async function CommunityPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const admin = createAdminClient()

    const [{ data: leaderboard }, { data: showcase }] = await Promise.all([
        // Fetch Leaderboard (Top 10) — admin client bypasses self-only RLS on user_xp and profiles
        admin
            .from('user_xp')
            .select('user_id, total_xp, rank, profile:profiles(full_name, avatar_url, username)')
            .order('total_xp', { ascending: false })
            .limit(10),
        // Fetch Recent Project Submissions — admin client bypasses self-only RLS on project_submissions and profiles
        admin
            .from('project_submissions')
            .select('*, profile:profiles(full_name, avatar_url, username), lesson:lessons(title)')
            .order('submitted_at', { ascending: false })
            .limit(12),
    ])

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community</h1>
                    <p className="text-muted-foreground">See what your fellow designers are building and track your rank.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>42 Active Today</span>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Showcase Feed - Left 2 Columns */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Recent Submissions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {showcase?.map((item) => (
                            <Card key={item.id} className="border-border/40 hover:border-border/80 transition-all group">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Link href={`/profile/${item.user_id}`} className="flex items-center gap-2 group/author">
                                            <Avatar className="w-6 h-6 border group-hover/author:border-primary/50 transition-colors">
                                                <AvatarImage src={item.profile?.avatar_url} />
                                                <AvatarFallback className="text-[10px]">
                                                    {item.profile?.full_name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium truncate group-hover/author:text-primary transition-colors">
                                                {(item.profile as any)?.full_name}
                                            </span>
                                        </Link>
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                            {new Date(item.submitted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                        {item.lesson?.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    <div className="aspect-video bg-muted/50 rounded-md border border-border/40 flex items-center justify-center relative overflow-hidden">
                                        {/* In a real app, this would be a screenshot or cover image */}
                                        <Link2 className="w-8 h-8 text-muted-foreground/30" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                            <a
                                                href={item.submission_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-background/90 text-foreground text-xs px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5"
                                            >
                                                View Project <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-3">
                                            <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-500 transition-colors">
                                                <Heart className="w-3 h-3" />
                                                <span>0</span>
                                            </button>
                                            <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                                                <MessageSquare className="w-3 h-3" />
                                                <span>0</span>
                                            </button>
                                        </div>
                                        {item.status === 'approved' && (
                                            <Badge variant="outline" className="text-[10px] bg-green-500/5 text-green-600 border-green-500/20 py-0 h-5">
                                                Approved
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {(!showcase || showcase.length === 0) && (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No submissions yet. Be the first!</p>
                        </div>
                    )}
                </div>

                {/* Leaderboard - Right Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Top Explorers
                    </h2>
                    <Card className="border-border/40">
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/40">
                                {leaderboard?.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center justify-center w-6 h-6">
                                            {index === 0 ? (
                                                <Trophy className="w-4 h-4 text-yellow-500" />
                                            ) : index === 1 ? (
                                                <Trophy className="w-4 h-4 text-slate-400" />
                                            ) : index === 2 ? (
                                                <Trophy className="w-4 h-4 text-amber-600" />
                                            ) : (
                                                <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                                            )}
                                        </div>
                                        <Avatar className="w-8 h-8 border">
                                            <AvatarImage src={(entry.profile as any)?.avatar_url} />
                                            <AvatarFallback className="text-xs">
                                                {(entry.profile as any)?.full_name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <Link href={`/profile/${entry.user_id}`} className="hover:underline">
                                                <p className="text-sm font-medium truncate">{(entry.profile as any)?.full_name}</p>
                                            </Link>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{entry.rank}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold">{entry.total_xp}</p>
                                            <p className="text-[10px] text-muted-foreground">XP</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats or Community Info */}
                    <Card className="border-border/40 bg-primary/5">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm">Peer Reviews</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 text-xs text-muted-foreground space-y-2">
                            <p>Give feedback on 3 projects to earn the 🤝 **"Helper"** badge and an extra 50 XP!</p>
                            <Button variant="outline" size="sm" className="w-full text-[10px] h-8 mt-2">
                                Learn about community rules
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
