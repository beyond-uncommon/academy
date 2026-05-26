'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CommunityPost {
  id: string
  user_id: string
  title: string
  content: string
  type: 'question' | 'discussion' | 'tip' | 'showcase'
  created_at: string
  profile: {
    full_name: string
    avatar_url: string | null
    username: string | null
  }
  likes: { count: number; liked: boolean }
}

export async function createPost(data: { title: string; content: string; type: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!data.title.trim()) return { error: 'Title is required' }
  if (!data.content.trim()) return { error: 'Content is required' }

  const { error } = await supabase.from('community_posts').insert({
    user_id: user.id,
    title: data.title.trim(),
    content: data.content.trim(),
    type: data.type,
  })
  if (error) return { error: error.message }

  revalidatePath('/community')
  return { success: true }
}

export async function togglePostLike(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false, count: 0 }

  const { data: existing } = await supabase
    .from('post_likes')
    .select('*')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', postId)
  } else {
    await supabase.from('post_likes').insert({ user_id: user.id, post_id: postId })
  }

  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  revalidatePath('/community')
  return { liked: !existing, count: count || 0 }
}

export async function getPostLikeCount(postId: string): Promise<{ count: number; liked: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count }, { data: userLike }] = await Promise.all([
    supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    user
      ? supabase.from('post_likes').select('*').eq('user_id', user.id).eq('post_id', postId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return { count: count || 0, liked: !!userLike }
}

export async function getCommunityPosts() {
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await admin
    .from('community_posts')
    .select(`
      *,
      profile:profiles(full_name, avatar_url, username)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!posts) return []

  const postsWithData = await Promise.all(
    posts.map(async (post: any) => {
      const likeData = user
        ? await getPostLikeCount(post.id)
        : { count: 0, liked: false }
      return {
        ...post,
        likes: likeData,
      }
    })
  )

  return postsWithData
}
