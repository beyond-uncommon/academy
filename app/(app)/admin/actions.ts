'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkGraduation } from '@/lib/graduation'

/**
 * Creates a new admin user. Only callable by existing admins.
 */
export async function createAdminUser(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !email || !password) return { error: 'All fields are required' }
    if (password.length < 8) return { error: 'Password must be at least 8 characters' }

    const admin = createAdminClient()

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name },
    })

    if (createError) return { error: createError.message }

    // Set role to admin in profiles (trigger creates the row, but may not exist yet)
    const { error: profileError } = await admin
        .from('profiles')
        .upsert({
            id: newUser.user.id,
            full_name: name,
            role: 'admin',
        }, { onConflict: 'id' })

    if (profileError) return { error: profileError.message }

    revalidatePath('/admin/users')
    return { success: true, email }
}

/**
 * Toggles a lesson's publishing status.
 */
export async function toggleLessonStatus(lessonId: string, isPublished: boolean) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required')
    }

    const { error } = await supabase
        .from('lessons')
        .update({ is_published: isPublished })
        .eq('id', lessonId)

    if (error) throw error

    revalidatePath('/admin/lessons')
    revalidatePath('/dashboard')
    revalidatePath(`/lesson/${lessonId}`)

    return { success: true }
}

/**
 * Creates a new lesson.
 */
interface CreateLessonInput {
    title: string
    module_id: string
    order_index: number
    type: 'video' | 'text' | 'interactive' | 'project'
    duration_minutes: number
    xp_reward: number
    content: unknown
    is_published?: boolean
}

export async function createLesson(formData: CreateLessonInput) {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase
        .from('lessons')
        .insert({
            title: formData.title,
            module_id: formData.module_id,
            order_index: formData.order_index,
            type: formData.type,
            duration_minutes: formData.duration_minutes,
            xp_reward: formData.xp_reward,
            content: formData.content,
            is_published: formData.is_published || false
        })

    if (error) throw error

    revalidatePath('/admin/lessons')
    revalidatePath('/dashboard')

    return { success: true }
}

/**
 * Reviews a project submission.
 */
export async function reviewSubmission(submissionId: string, status: 'approved' | 'reviewed', score?: number, feedback?: string) {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const updatePayload: Record<string, unknown> = { status, score: score || 0 }
    if (feedback !== undefined) updatePayload.feedback = feedback

    const { error } = await supabase
        .from('project_submissions')
        .update(updatePayload)
        .eq('id', submissionId)

    if (error) throw error

    if (status === 'approved') {
        const { data: submission } = await supabase
            .from('project_submissions')
            .select('user_id, lesson_id')
            .eq('id', submissionId)
            .single()

        if (submission) {
            const { data: lessonData } = await supabase
                .from('lessons')
                .select('module:modules(course_id)')
                .eq('id', submission.lesson_id)
                .single()

            const courseId = (lessonData as { module: { course_id: string } | null } | null)?.module?.course_id
            if (courseId) {
                await checkGraduation(submission.user_id, courseId)
            }
        }
    }

    revalidatePath('/admin/submissions')
    revalidatePath('/community')
    revalidatePath('/profile')

    return { success: true }
}
