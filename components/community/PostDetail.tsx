'use client'

import { useState } from 'react'
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { votePost } from '@/components/community/actions'

export function PostDetail({
  postId,
  initialVotes,
  initialUserVote,
}: {
  postId: string
  initialVotes: number
  initialUserVote: number
}) {
  const [voteCount, setVoteCount] = useState(initialVotes)
  const [myVote, setMyVote] = useState(initialUserVote)
  const [voting, setVoting] = useState(false)

  async function handleVote(vote: number) {
    if (voting) return
    setVoting(true)
    const res = await votePost(postId, vote)
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
    <>
      <button
        onClick={() => handleVote(1)}
        disabled={voting}
        className={`p-1.5 rounded transition-colors ${myVote === 1 ? 'text-orange-500 bg-orange-500/10' : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'}`}
      >
        {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
      </button>
      <span className={`text-sm font-bold tabular-nums ${myVote === 1 ? 'text-orange-500' : myVote === -1 ? 'text-blue-500' : 'text-muted-foreground'}`}>
        {voteCount}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={voting}
        className={`p-1.5 rounded transition-colors ${myVote === -1 ? 'text-blue-500 bg-blue-500/10' : 'text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10'}`}
      >
        <ArrowDown className="w-5 h-5" />
      </button>
    </>
  )
}
