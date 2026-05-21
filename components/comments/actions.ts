'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Comment {
  id: string
  lesson_id: string
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

export async function getComments(lessonId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('lesson_comments')
    .select(`
      *,
      author:profiles(full_name, avatar_url)
    `)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: true })

  if (!data) return []

  const topLevel = data.filter((c: any) => !c.parent_id) as Comment[]
  const replies = data.filter((c: any) => c.parent_id) as Comment[]

  return topLevel.map((c) => ({
    ...c,
    replies: replies.filter((r) => r.parent_id === c.id),
  }))
}

export async function addComment(lessonId: string, content: string, parentId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!content.trim()) throw new Error('Comment cannot be empty')

  const { error } = await supabase.from('lesson_comments').insert({
    lesson_id: lessonId,
    user_id: user.id,
    parent_id: parentId || null,
    content: content.trim(),
  })

  if (error) throw error

  revalidatePath(`/lesson/${lessonId}`)

  // Notify lesson author if not self-comment
  const { data: lesson } = await supabase
    .from('lessons')
    .select('module:modules(course_id)')
    .eq('id', lessonId)
    .single()

  if (lesson && parentId) {
    const { data: parentComment } = await supabase
      .from('lesson_comments')
      .select('user_id')
      .eq('id', parentId)
      .single()

    if (parentComment && parentComment.user_id !== user.id) {
      await supabase.rpc('create_notification', {
        p_user_id: parentComment.user_id,
        p_type: 'peer_feedback',
        p_title: 'New reply to your comment',
        p_body: content.trim().slice(0, 120),
        p_link: `/lesson/${lessonId}`,
      })
    }
  }

  return { success: true }
}

export async function deleteComment(commentId: string, lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('lesson_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw error

  revalidatePath(`/lesson/${lessonId}`)
  return { success: true }
}
