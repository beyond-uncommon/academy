import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Checks if a user is eligible for graduation and issues a certificate if so.
 */
export async function checkGraduation(userId: string, courseId: string) {
    const supabase = await createClient()

    // 1. Get all lessons for the course
    const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)

    const moduleIds = modules?.map(m => m.id) || []

    // 2. Get user's completed lesson IDs from the database
    const { data: userCompletedLessons } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('completed', true)

    const completedLessonIds = userCompletedLessons?.map(up => up.lesson_id) || []

    // Fetch lessons in those modules to compare
    const { data: courseLessons } = await supabase
        .from('lessons')
        .select('id, type')
        .in('module_id', moduleIds)
        .eq('is_published', true)

    const requiredLessonIds = courseLessons?.map(l => l.id) || []
    const projects = courseLessons?.filter(l => l.type === 'project').map(l => l.id) || []

    // 3. Check if all required lessons are done
    const isAllLessonsDone = requiredLessonIds.every(id => completedLessonIds.includes(id))

    if (!isAllLessonsDone) return { graduated: false, progress: (completedLessonIds.length / requiredLessonIds.length) * 100 }

    // 4. Check if all projects are approved
    const { data: submissions } = await supabase
        .from('project_submissions')
        .select('lesson_id, status')
        .eq('user_id', userId)
        .in('lesson_id', projects)
        .eq('status', 'approved')

    const approvedProjectIds = submissions?.map(s => s.lesson_id) || []
    const areAllProjectsApproved = projects.every(id => approvedProjectIds.includes(id))

    if (!areAllProjectsApproved) return { graduated: false, message: 'All lessons done! Waiting for final project approval.' }

    // 5. GRADUATE!
    // Fetch real XP and rank for certificate metadata
    const { data: userXP } = await supabase
        .from('user_xp')
        .select('total_xp, rank')
        .eq('user_id', userId)
        .single()

    // check if already graduated to avoid double entry
    const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single()

    if (existingCert) return { graduated: true, certificateId: existingCert.id }

    // Issue Certificate
    const certId = `ACAD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    const { data: cert, error } = await supabase
        .from('certificates')
        .insert({
            user_id: userId,
            course_id: courseId,
            certificate_id: certId,
            metadata: {
                total_xp: userXP?.total_xp ?? 0,
                completion_level: userXP?.rank ?? 'explorer'
            }
        })
        .select()
        .single()

    if (error) throw error

    // Update profile
    await supabase
        .from('profiles')
        .update({ has_graduated: true })
        .eq('id', userId)

    // Award "Explorer" badge if not already awarded
    await supabase
        .from('user_badges')
        .upsert({ user_id: userId, badge_id: 'explorer_badge' })

    revalidatePath('/profile')
    revalidatePath('/dashboard')

    return { graduated: true, certificate: cert }
}
