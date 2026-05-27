import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { ChevronLeft, ArrowUp, ArrowDown, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPost } from '@/components/community/actions'
import { getComments } from '@/components/comments/actions'
import { timeAgo } from '@/lib/utils'
import { PostDetail } from '@/components/community/PostDetail'
import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Post' }

const typeBadge: Record<string, { label: string; color: string }> = {
  question: { label: 'Question', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  discussion: { label: 'Discussion', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  tip: { label: 'Tip', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  showcase: { label: 'Showcase', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [post, comments] = await Promise.all([
    getPost(id),
    getComments({ post_id: id }),
  ])

  if (!post) notFound()

  const badge = typeBadge[post.type] ?? typeBadge.discussion

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/community"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
        Back to Community
      </Link>

      {/* Post */}
      <div className="flex gap-4">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 pt-1 w-10 shrink-0">
          <PostDetail postId={post.id} initialVotes={post.votes ?? 0} initialUserVote={post.userVote ?? 0} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold">{post.title}</h1>
              <Badge variant="outline" className={`text-[10px] py-0 h-5 ${badge.color}`}>
                {badge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href={`/profile/${post.user_id}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Avatar className="w-5 h-5 border">
                  <AvatarImage src={post.profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[8px]">{post.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.profile?.full_name}</span>
              </Link>
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.commentCount ?? 0} comments
              </span>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Comments */}
          <div className="pt-4 border-t border-border/40">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </h2>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No comments yet. Start the discussion!
              </p>
            ) : (
              <div className="space-y-1">
                {comments.map((comment: any, i: number) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    postId={id}
                    currentUserId={user.id}
                    depth={0}
                    isLast={i === comments.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentThread({
  comment,
  postId,
  currentUserId,
  depth,
  isLast,
}: {
  comment: any
  postId: string
  currentUserId: string
  depth: number
  isLast: boolean
}) {
  return (
    <div className="relative">
      <div className="flex gap-2 py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors">
        <Avatar className="w-5 h-5 shrink-0 mt-0.5">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[8px]">
            {comment.author?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{comment.author?.full_name || 'Anonymous'}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
      {comment.replies?.map((reply: any, i: number) => (
        <div key={reply.id} className="ml-6 border-l border-border/40 pl-3">
          <CommentThread
            comment={reply}
            postId={postId}
            currentUserId={currentUserId}
            depth={depth + 1}
            isLast={i === (comment.replies?.length ?? 0) - 1}
          />
        </div>
      ))}
      {!isLast && depth === 0 && <div className="border-b border-border/20 ml-2" />}
    </div>
  )
}
