'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(data: { title: string; content: string; type: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!data.title.trim()) return { error: 'Title is required' }
  if (!data.content.trim()) return { error: 'Content is required' }

  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      content: data.content.trim(),
      type: data.type,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/community')
  return { success: true, postId: post?.id }
}

export async function votePost(postId: string, vote: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (vote !== -1 && vote !== 0 && vote !== 1) return { error: 'Invalid vote' }

  if (vote === 0) {
    const { error } = await supabase
      .from('post_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
    if (error) return { error: error.message }
  } else {
    const { data: existing } = await supabase
      .from('post_votes')
      .select('vote')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle()

    if (existing && existing.vote === vote) {
      await supabase
        .from('post_votes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)
      revalidatePath('/community')
      revalidatePath(`/community/post/${postId}`)
      return { success: true, state: 'none' }
    }

    await supabase
      .from('post_votes')
      .upsert({ user_id: user.id, post_id: postId, vote }, { onConflict: 'user_id,post_id' })
  }

  revalidatePath('/community')
  revalidatePath(`/community/post/${postId}`)
  return { success: true, state: vote === 0 ? 'none' : vote === 1 ? 'upvoted' : 'downvoted' }
}

export async function getUserVote(postId: string): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from('post_votes')
    .select('vote')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  return data?.vote ?? 0
}

interface GetPostsOptions {
  sort?: 'hot' | 'new' | 'top'
  type?: string
  page?: number
  limit?: number
}

export async function getCommunityPosts(opts: GetPostsOptions = {}) {
  const { sort = 'new', type = 'all', page = 1, limit = 20 } = opts
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = admin
    .from('community_posts')
    .select(`
      *,
      profile:profiles(full_name, avatar_url, username)
    `, { count: 'exact' })

  if (type !== 'all') {
    query = query.eq('type', type)
  }

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'top') {
    query = query.order('votes', { ascending: false }).order('created_at', { ascending: false })
  } else if (sort === 'hot') {
    query = query
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('votes', { ascending: false })
      .order('created_at', { ascending: false })
  }

  const { data: posts, count } = await query.range(from, to)

  if (!posts) return { posts: [], total: 0 }

  const postsWithData = await Promise.all(
    posts.map(async (post: { id: string; title: string; content: string; type: string; user_id: string; created_at: string; votes: number; profile: { full_name: string; avatar_url: string | null; username: string | null } | null }) => {
      const vote = user ? await getUserVote(post.id) : 0

      const { count: commentCount } = await supabase
        .from('lesson_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      return { ...post, userVote: vote, commentCount: commentCount || 0 }
    })
  )

  return { posts: postsWithData, total: count || 0 }
}

export async function getPost(postId: string) {
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await admin
    .from('community_posts')
    .select(`
      *,
      profile:profiles(full_name, avatar_url, username)
    `)
    .eq('id', postId)
    .single()

  if (!post) return null

  const vote = user ? await getUserVote(post.id) : 0
  const { count: commentCount } = await supabase
    .from('lesson_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', post.id)

  return { ...post, userVote: vote, commentCount: commentCount || 0 }
}
