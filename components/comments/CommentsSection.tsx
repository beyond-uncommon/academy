'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Trash2, Reply, Loader2 } from 'lucide-react'
import { addComment, deleteComment, type Comment } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'

function CommentThread({
  comment,
  lessonId,
  currentUserId,
  depth = 0,
}: {
  comment: Comment
  lessonId: string
  currentUserId: string
  depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

    async function handleReply() {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await addComment({ lesson_id: lessonId }, replyText, comment.id)
      setReplyText('')
      setShowReply(false)
      router.refresh()
    } catch {
      toast.error('Failed to post reply')
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteComment(comment.id, { lesson_id: lessonId })
      router.refresh()
    } catch {
      toast.error('Failed to delete comment')
    }
    setDeleting(false)
  }

  const initials = comment.author?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l border-border/40' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author?.full_name || 'Anonymous'}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {comment.user_id === currentUserId && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Delete
              </button>
            )}
          </div>

          {showReply && (
            <div className="mt-2 space-y-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={submitting || !replyText.trim()}>
                  {submitting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Reply
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReply(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          lessonId={lessonId}
          currentUserId={currentUserId}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export function CommentsSection({
  lessonId,
  initialComments,
  currentUserId,
}: {
  lessonId: string
  initialComments: Comment[]
  currentUserId: string
}) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

    async function handleSubmit() {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await addComment({ lesson_id: lessonId }, newComment)
      setNewComment('')
      router.refresh()
    } catch {
      toast.error('Failed to post comment')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Discussion ({initialComments.length})
        </h2>
      </div>

      <div className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts on this lesson..."
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
            {submitting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            Post Comment
          </Button>
        </div>
      </div>

      {initialComments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to start the discussion!
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {initialComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              lessonId={lessonId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
