import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Flame, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { SubmissionCard } from '@/components/community/SubmissionCard'
import { PostCard } from '@/components/community/PostCard'
import { CreatePostDialog } from '@/components/community/CreatePostDialog'
import { getLikeCount } from '@/components/comments/actions'
import { getComments } from '@/components/comments/actions'
import { getCommunityPosts } from '@/components/community/actions'

export default async function CommunityPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const admin = createAdminClient()

    const todayStr = new Date().toISOString().slice(0, 10)
    const [{ data: leaderboard }, { data: showcase }, communityPosts, { count: activeToday }] = await Promise.all([
        admin
            .from('user_xp')
            .select('user_id, total_xp, rank, profile:profiles(full_name, avatar_url, username)')
            .order('total_xp', { ascending: false })
            .limit(10),
        admin
            .from('project_submissions')
            .select('*, profile:profiles(full_name, avatar_url, username), lesson:lessons(title)')
            .order('submitted_at', { ascending: false })
            .limit(12),
        getCommunityPosts(),
        admin
            .from('user_activity_log')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStr),
    ])

    const submissionsWithData = await Promise.all(
        (showcase || []).map(async (item) => {
            const [likeData, comments] = await Promise.all([
                getLikeCount(item.id),
                getComments({ submission_id: item.id }),
            ])
            return { ...item, ...likeData, comments }
        })
    )

    // Merge posts and submissions, sorted by created_at descending
    const postsWithComments = await Promise.all(
        (communityPosts || []).map(async (post: any) => {
            const comments = await getComments({ post_id: post.id })
            return { ...post, _comments: comments }
        })
    )

    const feed = [
        ...submissionsWithData.map((s) => ({ kind: 'submission' as const, data: s, date: s.submitted_at })),
        ...postsWithComments.map((p) => ({ kind: 'post' as const, data: p, date: p.created_at })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community</h1>
                    <p className="text-muted-foreground">See what your fellow designers are building, discussing, and sharing.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{activeToday ?? 0} Active Today</span>
                    </Badge>
                    <CreatePostDialog />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Feed - Left 2 Columns */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Latest Activity
                    </h2>

                    <div className="space-y-4">
                        {feed.map((item) =>
                            item.kind === 'submission' ? (
                                <SubmissionCard
                                    key={`sub-${item.data.id}`}
                                    submission={item.data}
                                    initialLikes={(item.data as any).count ?? 0}
                                    initialLiked={(item.data as any).liked ?? false}
                                    initialComments={(item.data as any).comments ?? []}
                                    currentUserId={user.id}
                                />
                            ) : (
                                <PostCard
                                    key={`post-${item.data.id}`}
                                    post={item.data}
                                    currentUserId={user.id}
                                />
                            )
                        )}
                    </div>

                    {feed.length === 0 && (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No activity yet. Be the first to post!</p>
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

                    <Card className="border-border/40 bg-primary/5">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-sm">Peer Reviews</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 text-xs text-muted-foreground space-y-2">
                            <p>Give feedback on 3 projects to earn the 🤝 &quot;Helper&quot; badge and an extra 50 XP!</p>
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
