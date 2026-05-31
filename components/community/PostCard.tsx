'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, MessageSquare, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { votePost } from '@/components/community/actions'
import { timeAgo } from '@/lib/utils'

const typeBadge: Record<string, { label: string; color: string }> = {
  question: { label: 'Question', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  discussion: { label: 'Discussion', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  tip: { label: 'Tip', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  showcase: { label: 'Showcase', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
}

interface PostCardProps {
  id: string
  userId: string
  authorName: string
  authorAvatar: string | null
  title: string
  content: string
  type: string
  votes: number
  userVote: number
  commentCount: number
  createdAt: string
}

export function PostCard({
  id,
  userId,
  authorName,
  authorAvatar,
  title,
  content,
  type,
  votes,
  userVote,
  commentCount,
  createdAt,
}: PostCardProps) {
  const [voteCount, setVoteCount] = useState(votes)
  const [myVote, setMyVote] = useState(userVote)
  const [voting, setVoting] = useState(false)
  const badge = typeBadge[type] ?? typeBadge.discussion

  async function handleVote(vote: number) {
    if (voting) return
    setVoting(true)
    const res = await votePost(id, vote)
    if (res.success) {
      if (res.state === 'none') {
        setMyVote(0)
        setVoteCount(voteCount - (myVote === 1 ? 1 : myVote === -1 ? -1 : 0))
      } else if (res.state === 'upvoted') {
        setVoteCount(voteCount + (myVote === -1 ? 2 : myVote === 1 ? -1 : 1))
        setMyVote(1)
      } else if (res.state === 'downvoted') {
        setVoteCount(voteCount + (myVote === 1 ? -2 : myVote === -1 ? 1 : -1))
        setMyVote(-1)
      }
    }
    setVoting(false)
  }

  return (
    <div className="flex gap-2 rounded-lg border border-border/40 bg-card hover:border-border/80 transition-colors">
      {/* Vote Column */}
      <div className="flex flex-col items-center gap-0.5 pt-3 pl-3 w-10 shrink-0">
        <button
          onClick={() => handleVote(1)}
          disabled={voting}
          aria-label="Upvote"
          className={`p-1 rounded transition-colors ${myVote === 1 ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'}`}
        >
          {voting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <span className={`text-xs font-bold tabular-nums leading-none ${myVote === 1 ? 'text-orange-500' : myVote === -1 ? 'text-blue-500' : 'text-muted-foreground'}`}>
          {voteCount}
        </span>
        <button
          onClick={() => handleVote(-1)}
          disabled={voting}
          aria-label="Downvote"
          className={`p-1 rounded transition-colors ${myVote === -1 ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10'}`}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 py-3 pr-3">
        {/* Title */}
        <Link href={`/community/post/${id}`} className="group">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <Badge variant="outline" className={`text-[10px] py-0 h-5 shrink-0 mt-0.5 ${badge.color}`}>
              {badge.label}
            </Badge>
          </div>
        </Link>

        {/* Content preview */}
        {content && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {content.replace(/[#*`\[\]]/g, '').slice(0, 200)}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <Link href={`/profile/${userId}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Avatar className="w-4 h-4 border">
              <AvatarImage src={authorAvatar ?? undefined} alt={authorName || 'User avatar'} />
              <AvatarFallback className="text-[6px]">{authorName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[120px]">{authorName}</span>
          </Link>
          <span>·</span>
          <span>{timeAgo(createdAt)}</span>
          <Link href={`/community/post/${id}`} className="flex items-center gap-1 hover:text-foreground transition-colors ml-auto">
            <MessageSquare className="w-3 h-3" />
            <span>{commentCount} comments</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
