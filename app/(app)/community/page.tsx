import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Flame, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { PostCard } from '@/components/community/PostCard'
import { CreatePostDialog } from '@/components/community/CreatePostDialog'
import { getCommunityPosts } from '@/components/community/actions'
import { CommunityFeed } from '@/components/community/CommunityFeed'

const SORT_OPTIONS = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
] as const

const TYPE_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'discussion', label: 'Discussions' },
  { key: 'question', label: 'Questions' },
  { key: 'tip', label: 'Tips' },
  { key: 'showcase', label: 'Showcases' },
] as const

export default async function CommunityPage(props: {
  searchParams?: Promise<{ sort?: string; type?: string; page?: string }>
}) {
  const searchParams = await props.searchParams
  const sort = (SORT_OPTIONS.find((o) => o.key === searchParams?.sort)?.key ?? 'new') as 'hot' | 'new' | 'top'
  const type = (TYPE_OPTIONS.find((o) => o.key === searchParams?.type)?.key ?? 'all') as string
  const page = Math.max(1, Number(searchParams?.page) || 1)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [{ count: activeToday }, { data: leaderboard }, { posts, total }] = await Promise.all([
    admin.from('user_activity_log').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    admin.from('user_xp').select('user_id, total_xp, rank, profile:profiles(full_name, avatar_url, username)').order('total_xp', { ascending: false }).limit(10),
    getCommunityPosts({ sort, type, page }),
  ])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground text-sm">Discuss, share, and connect with fellow designers.</p>
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
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 border-b border-border/40 pb-2">
            {SORT_OPTIONS.map((opt) => {
              const params = new URLSearchParams({ ...(type !== 'all' ? { type } : {}), sort: opt.key, page: '1' })
              return (
                <Link
                  key={opt.key}
                  href={`/community?${params}`}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                    sort === opt.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </Link>
              )
            })}
            <span className="flex-1" />
            {/* Type filter tabs */}
            <div className="flex items-center gap-1">
              {TYPE_OPTIONS.map((opt) => {
                const params = new URLSearchParams({ sort, ...(opt.key !== 'all' ? { type: opt.key } : {}), page: '1' })
                return (
                  <Link
                    key={opt.key}
                    href={`/community?${params}`}
                    className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                      type === opt.key ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Posts */}
          <div className="space-y-2">
            {posts.map((p: any) => (
              <PostCard
                key={p.id}
                id={p.id}
                userId={p.user_id}
                authorName={p.profile?.full_name}
                authorAvatar={p.profile?.avatar_url}
                title={p.title}
                content={p.content}
                type={p.type}
                votes={p.votes ?? 0}
                userVote={p.userVote ?? 0}
                commentCount={p.commentCount ?? 0}
                createdAt={p.created_at}
              />
            ))}
          </div>

          {/* Empty state */}
          {posts.length === 0 && (
            <div className="text-center py-16 border border-dashed rounded-lg">
              <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No posts yet. Be the first to share!</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <CommunityFeed totalPages={totalPages} currentPage={page} sort={sort} type={type} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Explorers
          </h2>
          <Card className="border-border/40">
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {leaderboard?.map((entry, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-center w-6 h-6">
                      {index === 0 ? <Trophy className="w-4 h-4 text-yellow-500" /> : index === 1 ? <Trophy className="w-4 h-4 text-slate-400" /> : index === 2 ? <Trophy className="w-4 h-4 text-amber-600" /> : <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>}
                    </div>
                    <Avatar className="w-7 h-7 border">
                      <AvatarImage src={(entry.profile as any)?.avatar_url} />
                      <AvatarFallback className="text-[10px]">{(entry.profile as any)?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${entry.user_id}`} className="hover:underline">
                        <p className="text-xs font-medium truncate">{(entry.profile as any)?.full_name}</p>
                      </Link>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{entry.rank}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">{entry.total_xp}</p>
                      <p className="text-[9px] text-muted-foreground">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
