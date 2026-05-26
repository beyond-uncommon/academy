'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageSquare, ExternalLink, Link2, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toggleLike, addComment, deleteComment, type Comment } from '@/components/comments/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'
import type { ProjectSubmission, Profile } from '@/types'

type SubmissionWithProfile = ProjectSubmission & {
    profile?: Pick<Profile, 'full_name' | 'avatar_url' | 'username'>
    lesson?: { title: string }
}

interface SubmissionCardProps {
    submission: SubmissionWithProfile
    initialLikes: number
    initialLiked: boolean
    initialComments: Comment[]
    currentUserId: string
}

export function SubmissionCard({ submission, initialLikes, initialLiked, initialComments, currentUserId }: SubmissionCardProps) {
    const [likes, setLikes] = useState(initialLikes)
    const [liked, setLiked] = useState(initialLiked)
    const [comments, setComments] = useState(initialComments)
    const [showComments, setShowComments] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [liking, setLiking] = useState(false)
    const router = useRouter()

    async function handleLike() {
        setLiking(true)
        const result = await toggleLike(submission.id)
        setLiked(result.liked)
        setLikes(result.count)
        setLiking(false)
    }

    async function handleAddComment() {
        if (!newComment.trim()) return
        setSubmitting(true)
        try {
            await addComment({ submission_id: submission.id }, newComment)
            setNewComment('')
            setComments((prev: any[]) => [...prev, { id: 'temp', submission_id: submission.id, user_id: currentUserId, content: newComment, created_at: new Date().toISOString(), author: { full_name: 'You', avatar_url: null }, replies: [] }])
            router.refresh()
        } catch {
            toast.error('Failed to post comment')
        }
        setSubmitting(false)
    }

    async function handleDeleteComment(commentId: string) {
        try {
            await deleteComment(commentId, { submission_id: submission.id })
            setComments((prev: any[]) => prev.filter((c: any) => c.id !== commentId))
            router.refresh()
        } catch {
            toast.error('Failed to delete comment')
        }
    }

    return (
        <Card className="border-border/40 hover:border-border/80 transition-all group">
            <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-2">
                    <Link href={`/profile/${submission.user_id}`} className="flex items-center gap-2 group/author">
                        <Avatar className="w-6 h-6 border group-hover/author:border-primary/50 transition-colors">
                            <AvatarImage src={submission.profile?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                                {submission.profile?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium truncate group-hover/author:text-primary transition-colors">
                            {submission.profile?.full_name}
                        </span>
                    </Link>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                </div>
                <CardTitle className="text-sm line-clamp-1 group-hover:text-primary transition-colors">
                    {submission.lesson?.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="aspect-video bg-muted/50 rounded-md border border-border/40 flex items-center justify-center relative overflow-hidden">
                    <Link2 className="w-8 h-8 text-muted-foreground/30" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                        <a
                            href={submission.submission_url ?? '#'}
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
                        <button
                            onClick={handleLike}
                            disabled={liking}
                            className={`flex items-center gap-1 text-[10px] transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        >
                            {liking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />}
                            <span>{likes}</span>
                        </button>
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                        >
                            <MessageSquare className="w-3 h-3" />
                            <span>{comments.length}</span>
                        </button>
                    </div>
                    {submission.status === 'approved' && (
                        <Badge variant="outline" className="text-[10px] bg-green-500/5 text-green-600 border-green-500/20 py-0 h-5">
                            Approved
                        </Badge>
                    )}
                </div>

                {/* Comments */}
                {showComments && (
                    <div className="pt-2 border-t border-border/40 space-y-3">
                        <div className="flex gap-2">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <Button size="sm" onClick={handleAddComment} disabled={submitting || !newComment.trim()}>
                                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Post'}
                            </Button>
                        </div>

                        {comments.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {comments.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-2 text-xs">
                                        <Avatar className="w-5 h-5 shrink-0">
                                            <AvatarFallback className="text-[8px]">
                                                {comment.author?.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium">{comment.author?.full_name || 'Anonymous'}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {timeAgo(comment.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground">{comment.content}</p>
                                        </div>
                                        {comment.user_id === currentUserId && (
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-muted-foreground hover:text-destructive shrink-0"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


