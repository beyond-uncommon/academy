'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Comment {
  id: string
  lesson_id?: string | null
  submission_id?: string | null
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  author: {
    full_name: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

export async function getComments(target: { lesson_id?: string; submission_id?: string }): Promise<Comment[]> {
  const supabase = await createClient()
  const query: Record<string, string> = {}
  if (target.lesson_id) query.lesson_id = target.lesson_id
  if (target.submission_id) query.submission_id = target.submission_id

  const { data } = await supabase
    .from('lesson_comments')
    .select(`
      *,
      author:profiles(full_name, avatar_url)
    `)
    .match(query)
    .order('created_at', { ascending: true })

  if (!data) return []

  const topLevel = data.filter((c: any) => !c.parent_id) as Comment[]
  const replies = data.filter((c: any) => c.parent_id) as Comment[]

  return topLevel.map((c) => ({
    ...c,
    replies: replies.filter((r) => r.parent_id === c.id),
  }))
}

export async function addComment(target: { lesson_id?: string; submission_id?: string }, content: string, parentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!content.trim()) throw new Error('Comment cannot be empty')

  const payload: Record<string, unknown> = {
    user_id: user.id,
    parent_id: parentId || null,
    content: content.trim(),
  }
  if (target.lesson_id) payload.lesson_id = target.lesson_id
  if (target.submission_id) payload.submission_id = target.submission_id

  const { error } = await supabase.from('lesson_comments').insert(payload)
  if (error) throw error

  if (target.lesson_id) revalidatePath(`/lesson/${target.lesson_id}`)
  if (target.submission_id) revalidatePath('/community')

  return { success: true }
}

export async function deleteComment(commentId: string, target: { lesson_id?: string; submission_id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('lesson_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw error

  if (target.lesson_id) revalidatePath(`/lesson/${target.lesson_id}`)
  if (target.submission_id) revalidatePath('/community')
  return { success: true }
}

// ─── Likes ─────────────────────────────────────────────────────

export async function toggleLike(submissionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false, count: 0 }

  // Check if already liked
  const { data: existing } = await supabase
    .from('project_likes')
    .select('*')
    .eq('user_id', user.id)
    .eq('submission_id', submissionId)
    .single()

  if (existing) {
    await supabase.from('project_likes').delete().eq('user_id', user.id).eq('submission_id', submissionId)
  } else {
    await supabase.from('project_likes').insert({ user_id: user.id, submission_id: submissionId })
  }

  const { count } = await supabase
    .from('project_likes')
    .select('*', { count: 'exact', head: true })
    .eq('submission_id', submissionId)

  revalidatePath('/community')
  return { liked: !existing, count: count || 0 }
}

export async function getLikeCount(submissionId: string): Promise<{ count: number; liked: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count }, { data: userLike }] = await Promise.all([
    supabase.from('project_likes').select('*', { count: 'exact', head: true }).eq('submission_id', submissionId),
    user
      ? supabase.from('project_likes').select('*').eq('user_id', user.id).eq('submission_id', submissionId).single()
      : Promise.resolve({ data: null }),
  ])

  return { count: count || 0, liked: !!userLike }
}
