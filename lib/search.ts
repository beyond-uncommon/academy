'use server'

import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  courses: Array<{
    id: string
    title: string
    description: string | null
    slug: string
    type: string
    match: string
  }>
  lessons: Array<{
    id: string
    title: string
    type: string
    module_title: string
    course_title: string
    content_preview: string | null
    match: string
  }>
  profiles: Array<{
    id: string
    full_name: string | null
    bio: string | null
    avatar_url: string | null
    match: string
  }>
}

export async function searchAll(query: string): Promise<SearchResult> {
  if (!query.trim()) return { courses: [], lessons: [], profiles: [] }

  const supabase = await createClient()
  const searchTerm = `%${query.trim()}%`

  const [{ data: courses }, { data: lessons }, { data: profiles }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, description, slug, type')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq('is_published', true)
      .limit(5),
    supabase
      .from('lessons')
      .select(`
        id, title, type, content,
        module:modules!inner(
          title,
          course:courses!inner(title)
        )
      `)
      .or(`title.ilike.${searchTerm},content::text.ilike.${searchTerm}`)
      .eq('is_published', true)
      .limit(5),
    supabase
      .from('profiles')
      .select('id, full_name, bio, avatar_url')
      .or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
      .limit(5),
  ])

  type CourseRow = { id: string; title: string; description: string | null; slug: string; type: string }
  type LessonRow = { id: string; title: string; type: string; content: unknown; module: { title: string; course: { title: string }[] }[] | null }
  type ProfileRow = { id: string; full_name: string | null; bio: string | null; avatar_url: string | null }

  return {
    courses: (courses || []).map((c: CourseRow) => ({
      ...c,
      match: c.title,
    })),
    lessons: (lessons || []).map((l: LessonRow) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      module_title: l.module?.[0]?.title || '',
      course_title: l.module?.[0]?.course?.[0]?.title || '',
      content_preview: l.content ? JSON.stringify(l.content).substring(0, 100) : null,
      match: l.title,
    })),
    profiles: (profiles || []).map((p: ProfileRow) => ({
      ...p,
      match: p.full_name || p.bio || '',
    })),
  }
}
