'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkGraduation } from '@/lib/graduation'

function isStaff(role?: string | null) {
    return role === 'admin' || role === 'instructor'
}

/** Signs an invite code with HMAC-SHA256 so it can be verified without DB storage. */
const INVITE_SECRET = process.env.INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-invite-secret'

async function signInviteCode(code: string): Promise<string> {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(INVITE_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(code))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

async function verifyInviteCode(code: string, sig: string): Promise<boolean> {
    const expected = await signInviteCode(code)
    return sig === expected
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
 * Invites a new student. Callable by admins and instructors.
 */
export async function inviteStudent(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!isStaff(profile?.role)) return { error: 'Unauthorized' }

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
            role: 'learner',
        }, { onConflict: 'id' })

    if (profileError) return { error: profileError.message }

    revalidatePath('/admin/students')
    return { success: true, email }
}

/**
 * Generates an instructor invite link (no email, no DB storage).
 * Uses a signed token (HMAC) so the server can verify it at claim time.
 * Admin shares the link; the instructor fills in their email + name + password.
 */
export async function inviteInstructor(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { error: 'Unauthorized' }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const code = crypto.randomUUID()
    const sig = await signInviteCode(code)

    const link = `${appUrl}/auth/accept-invite?code=${code}&s=${sig}`

    revalidatePath('/admin/users')
    return { success: true, link }
}

// ─── Course Management ─────────────────────────────────────────

export async function createCourse(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

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

export async function updateCourse(courseId: string, data: Record<string, unknown>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase.from('courses').update(data).eq('id', courseId)
    if (error) throw error

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
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

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
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase.from('modules').delete().eq('id', moduleId)
    if (error) throw error

    revalidatePath(`/admin/courses/${courseId}`)
    return { success: true }
}

// ─── Quiz / Assessment Management ───────────────────────────────

export async function createQuiz(_prevState: unknown, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

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
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

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

    if (error) throw error

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
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase
        .from('quiz_questions')
        .update({
            question: data.question,
            options: data.options,
            explanation: data.explanation || null,
        })
        .eq('id', questionId)

    if (error) throw error

    revalidatePath('/admin/assessments')
    revalidatePath('/admin/courses/*')
    return { success: true }
}

export async function deleteQuestion(questionId: string, quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase.from('quiz_questions').delete().eq('id', questionId)
    if (error) throw error

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath('/admin/courses/*')
    revalidatePath('/admin/assessments')
    return { success: true }
}

export async function updateQuiz(quizId: string, data: Record<string, unknown>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase.from('quizzes').update(data).eq('id', quizId)
    if (error) throw error

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath('/admin/courses/*')
    revalidatePath('/admin/assessments')
    return { success: true }
}

export async function toggleQuizPublish(quizId: string, isPublished: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase.from('quizzes').update({ is_published: isPublished }).eq('id', quizId)
    if (error) throw error

    revalidatePath('/admin/assessments')
    revalidatePath('/admin/courses/*')
    return { success: true }
}

// ─── AI Question Generation ─────────────────────────────────────

export async function generateQuizQuestions(quizId: string, count = 5, moduleIds?: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

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
            if (error) throw error
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
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase
        .from('quiz_questions')
        .update({ is_draft: false })
        .eq('id', questionId)
    if (error) throw error

    revalidatePath(`/admin/quizzes/${quizId}`)
    return { success: true }
}

export async function publishAllQuestions(quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase
        .from('quiz_questions')
        .update({ is_draft: false })
        .eq('quiz_id', quizId)
        .eq('is_draft', true)
    if (error) throw error

    revalidatePath(`/admin/quizzes/${quizId}`)
    revalidatePath('/admin/assessments')
    return { success: true }
}

export async function unpublishQuestion(questionId: string, quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') throw new Error('Unauthorized')

    const { error } = await supabase
        .from('quiz_questions')
        .update({ is_draft: true })
        .eq('id', questionId)
    if (error) throw error

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

    if (!isStaff(profile?.role)) throw new Error('Unauthorized')

    const updatePayload: Record<string, unknown> = { status, score: score || 0 }
    if (feedback !== undefined) updatePayload.feedback = feedback

    const { error } = await supabase
        .from('project_submissions')
        .update(updatePayload)
        .eq('id', submissionId)

    if (error) throw error

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
