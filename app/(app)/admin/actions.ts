'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkGraduation } from '@/lib/graduation'
import { signInviteCode } from '@/lib/invite'

function isStaff(role?: string | null) {
    return role === 'admin' || role === 'instructor'
}

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
 * Generates an invite link (no email, no DB storage).
 * Uses a signed token (HMAC) so the server can verify it at claim time.
 * Admin shares the link; the invitee fills in their own email + name + password.
 */
async function generateInviteLink(role: 'instructor' | 'learner') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Only admins can invite instructors; admins and instructors can invite students
    if (role === 'instructor' && profile?.role !== 'admin') return { error: 'Unauthorized' }
    if (role === 'learner' && !isStaff(profile?.role)) return { error: 'Unauthorized' }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Embed the role in the code so the accept page knows what to create
    const code = `${role}:${crypto.randomUUID()}`
    const sig = await signInviteCode(code)

    const link = `${appUrl}/auth/accept-invite?code=${code}&s=${sig}`

    revalidatePath('/admin/users')
    return { success: true, link }
}

export async function inviteInstructor(_prevState: unknown, _formData: FormData) {
    return generateInviteLink('instructor')
}

export async function inviteStudentLink(_prevState: unknown, _formData: FormData) {
    return generateInviteLink('learner')
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    if (userId === user.id) return { error: 'You cannot delete your own account' }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { error: error.message }

    revalidatePath('/admin/students')
    return { success: true }
}

// ─── Course Management ─────────────────────────────────────────

export async function createCourse(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as string
    const phase = Number(formData.get('phase'))

    if (!title) return { error: 'Title is required' }

    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const { error } = await supabase.from('courses').insert({
        title,
        slug,
        description,
        type,
        phase: phase || 1,
        is_published: false,
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/courses')
    return { success: true }
}

export async function updateCourse(courseId: string, data: { title?: string; slug?: string; description?: string; type?: string; phase?: number; is_published?: boolean }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const allowed = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.phase !== undefined && { phase: data.phase }),
        ...(data.is_published !== undefined && { is_published: data.is_published }),
    }
    const { error } = await supabase.from('courses').update(allowed).eq('id', courseId)
    if (error) return { error: error.message }

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${courseId}`)
    return { success: true }
}

export async function toggleCoursePublish(courseId: string, isPublished: boolean) {
    return updateCourse(courseId, { is_published: isPublished })
}

// ─── Module Management ─────────────────────────────────────────

export async function createModule(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const courseId = formData.get('course_id') as string
    const skillNodeId = formData.get('skill_node_id') as string
    const xpAvailable = Number(formData.get('xp_available'))

    if (!title || !courseId) return { error: 'Title and course are required' }

    // Get next order_index
    const { data: last } = await supabase
        .from('modules')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1)

    const orderIndex = (last?.[0]?.order_index ?? 0) + 1

    const { error } = await supabase.from('modules').insert({
        course_id: courseId,
        title,
        order_index: orderIndex,
        skill_node_id: skillNodeId || null,
        xp_available: xpAvailable || 0,
    })

    if (error) return { error: error.message }
    revalidatePath(`/admin/courses/${courseId}`)
    return { success: true }
}

export async function deleteModule(moduleId: string, courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('modules').delete().eq('id', moduleId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/courses/${courseId}`)
    return { success: true }
}

// ─── Quiz / Assessment Management ───────────────────────────────

export async function createQuiz(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const moduleId = formData.get('module_id') as string
    const courseId = formData.get('course_id') as string
    const xpBase = Number(formData.get('xp_base'))
    const timeLimit = Number(formData.get('time_limit_minutes')) || null
    const passingScore = Number(formData.get('passing_score_pct'))
    const maxAttempts = Number(formData.get('max_attempts'))
    const instructions = formData.get('instructions') as string

    if (!title) return { error: 'Title is required' }

    const { error } = await supabase.from('quizzes').insert({
        title,
        type: type || 'lesson',
        module_id: moduleId || null,
        course_id: courseId || null,
        xp_base: xpBase || 100,
        xp_bonus_80: 50,
        xp_bonus_100: 100,
        time_limit_minutes: timeLimit,
        passing_score_pct: passingScore || 80,
        max_attempts: maxAttempts || 0,
        instructions: instructions || null,
        is_published: false,
    })

    if (error) return { error: error.message }

    const path = moduleId ? `/admin/courses/${courseId}` : '/admin/assessments'
    revalidatePath(path)
    return { success: true }
}

export async function addQuestion(quizId: string, question: string, options: { text: string; is_correct: boolean }[], explanation: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { data: last } = await supabase
        .from('quiz_questions')
        .select('order_index')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: false })
        .limit(1)

    const orderIndex = (last?.[0]?.order_index ?? 0) + 1

    const { error } = await supabase.from('quiz_questions').insert({
        quiz_id: quizId,
        question,
        options,
        explanation: explanation || null,
        order_index: orderIndex,
    })

    if (error) return { error: error.message }

    revalidatePath('/admin/courses/*')
    revalidatePath('/admin/assessments')
    revalidatePath(`/admin/quizzes/${quizId}`)
    return { success: true }
}

export async function updateQuestion(questionId: string, data: {
    question: string
    options: { text: string; is_correct: boolean }[]
    explanation: string | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('quiz_questions')
        .update({
            question: data.question,
            options: data.options,
            explanation: data.explanation || null,
        })
        .eq('id', questionId)

    if (error) return { error: error.message }

    revalidatePath('/admin/assessments')
    revalidatePath('/admin/courses/*')
    return { success: true }
}

export async function deleteQuestion(questionId: string, quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath('/admin/courses/*')
    revalidatePath('/admin/assessments')
    return { success: true }
}

export async function updateQuiz(quizId: string, data: { title?: string; type?: string; xp_base?: number; xp_bonus_80?: number; xp_bonus_100?: number; time_limit_minutes?: number | null; passing_score_pct?: number; max_attempts?: number; instructions?: string | null; is_published?: boolean }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const allowed = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.xp_base !== undefined && { xp_base: data.xp_base }),
        ...(data.xp_bonus_80 !== undefined && { xp_bonus_80: data.xp_bonus_80 }),
        ...(data.xp_bonus_100 !== undefined && { xp_bonus_100: data.xp_bonus_100 }),
        ...(data.time_limit_minutes !== undefined && { time_limit_minutes: data.time_limit_minutes }),
        ...(data.passing_score_pct !== undefined && { passing_score_pct: data.passing_score_pct }),
        ...(data.max_attempts !== undefined && { max_attempts: data.max_attempts }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.is_published !== undefined && { is_published: data.is_published }),
    }
    const { error } = await supabase.from('quizzes').update(allowed).eq('id', quizId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath('/admin/courses/*')
    revalidatePath('/admin/assessments')
    return { success: true }
}

export async function toggleQuizPublish(quizId: string, isPublished: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase.from('quizzes').update({ is_published: isPublished }).eq('id', quizId)
    if (error) return { error: error.message }

    revalidatePath('/admin/assessments')
    revalidatePath('/admin/courses/*')
    return { success: true }
}

// ─── AI Question Generation ─────────────────────────────────────

export async function generateQuizQuestions(quizId: string, count = 5, moduleIds?: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    // Fetch quiz and course info
    const { data: quiz } = await supabase
        .from('quizzes')
        .select('*, course:courses(title, description)')
        .eq('id', quizId)
        .single()

    if (!quiz) return { error: 'Quiz not found' }

    // Fetch lessons from selected modules (or fall back to quiz's own module)
    let moduleTitles: string[] = []
    let lessons: any[] = []

    if (moduleIds && moduleIds.length > 0) {
        const { data: modules } = await supabase
            .from('modules')
            .select('title, lessons:lessons(title, content, type)')
            .in('id', moduleIds)

        moduleTitles = (modules || []).map((m: any) => m.title)
        lessons = (modules || []).flatMap((m: any) => m.lessons || [])
    } else if (quiz.module_id) {
        const { data: mod } = await supabase
            .from('modules')
            .select('title, lessons:lessons(title, content, type)')
            .eq('id', quiz.module_id)
            .single()

        if (mod) {
            moduleTitles = [mod.title]
            lessons = mod.lessons || []
        }
    }

    const { buildCurriculumContext, generateQuestions } = await import('@/lib/ai/generate-questions')

    const context = buildCurriculumContext({
        courseTitle: quiz.course?.title,
        courseDescription: quiz.course?.description,
        moduleTitle: moduleTitles.join(', '),
        lessons: lessons.map((l: any) => ({
            title: l.title,
            contentNotes: l.content?.notes,
            contentBody: l.content?.body || l.content?.text_content,
            type: l.type,
        })),
    })

    if (!context.trim()) return { error: 'No curriculum content found for this quiz context' }

    try {
        const generated = await generateQuestions(context, count)

        // Get next order_index
        const { data: last } = await supabase
            .from('quiz_questions')
            .select('order_index')
            .eq('quiz_id', quizId)
            .order('order_index', { ascending: false })
            .limit(1)

        let orderIndex = (last?.[0]?.order_index ?? 0) + 1

        // Insert each as draft
        for (const q of generated) {
            const { error } = await supabase.from('quiz_questions').insert({
                quiz_id: quizId,
                question: q.question,
                options: q.options,
                explanation: q.explanation,
                order_index: orderIndex++,
                is_draft: true,
                generated_by: 'ai',
            })
            if (error) return { error: error.message }
        }

        revalidatePath(`/admin/quizzes/${quizId}`)
        revalidatePath('/admin/assessments')
        return { success: true, count: generated.length }
    } catch (e) {
        return { error: e instanceof Error ? e.message : 'AI generation failed' }
    }
}

export async function publishQuestion(questionId: string, quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('quiz_questions')
        .update({ is_draft: false })
        .eq('id', questionId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/quizzes/${quizId}`)
    return { success: true }
}

export async function publishAllQuestions(quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('quiz_questions')
        .update({ is_draft: false })
        .eq('quiz_id', quizId)
        .eq('is_draft', true)
    if (error) return { error: error.message }

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath('/admin/assessments')
    return { success: true }
}

export async function unpublishQuestion(questionId: string, quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('quiz_questions')
        .update({ is_draft: true })
        .eq('id', questionId)
    if (error) return { error: error.message }

    revalidatePath(`/admin/quizzes/${quizId}`)
    return { success: true }
}

/**
 * Toggles a lesson's publishing status.
 */
export async function toggleLessonStatus(lessonId: string, isPublished: boolean) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    const { error } = await supabase
        .from('lessons')
        .update({ is_published: isPublished })
        .eq('id', lessonId)

    if (error) return { error: error.message }

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
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

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

    if (error) return { error: error.message }

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
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!isStaff(profile?.role)) return { error: 'Unauthorized' }

    const updatePayload: Record<string, unknown> = { status, score: score || 0 }
    if (feedback !== undefined) updatePayload.feedback = feedback

    const { error } = await supabase
        .from('project_submissions')
        .update(updatePayload)
        .eq('id', submissionId)

    if (error) return { error: error.message }

    // Fetch submission details for notification
    const { data: submission } = await supabase
        .from('project_submissions')
        .select('user_id, lesson_id')
        .eq('id', submissionId)
        .single()

    if (submission) {
        if (status === 'approved') {
            await supabase.rpc('create_notification', {
                p_user_id: submission.user_id,
                p_type: 'project_approved',
                p_title: 'Project approved!',
                p_body: feedback ? `Feedback: ${feedback}` : 'Great work! Your project has been approved.',
                p_link: `/profile`,
            })

            const { data: lessonData } = await supabase
                .from('lessons')
                .select('module:modules(course_id)')
                .eq('id', submission.lesson_id)
                .single()

            const courseId = (lessonData as { module: { course_id: string } | null } | null)?.module?.course_id
            if (courseId) {
                await checkGraduation(submission.user_id, courseId)
            }
        } else if (status === 'reviewed') {
            await supabase.rpc('create_notification', {
                p_user_id: submission.user_id,
                p_type: 'project_reviewed',
                p_title: 'Project reviewed',
                p_body: feedback ? `Feedback: ${feedback}` : 'Your project has been reviewed. Check your profile.',
                p_link: `/profile`,
            })
        }
    }

    revalidatePath('/admin/submissions')
    revalidatePath('/community')
    revalidatePath('/profile')

    return { success: true }
}
