'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateQuizXP } from '@/lib/xp'
import { updateStreak } from '@/lib/gamification'

// ─── Legacy submit (kept for backward compat) ─────────────────

export async function submitQuiz(
    quizId: string,
    userAnswers: Record<string, number>
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
        const { data: quiz } = await supabase
            .from('quizzes')
            .select('*, questions:quiz_questions(*)')
            .eq('id', quizId)
            .single()

        if (!quiz) throw new Error('Quiz not found')

        const { data: xpBefore } = await supabase
            .from('user_xp')
            .select('rank')
            .eq('user_id', user.id)
            .single()

        let correctCount = 0
        const totalQuestions = quiz.questions.length

        quiz.questions.forEach((q: any) => {
            const userAnswer = userAnswers[q.id]
            const correctIndex = (q.options as Array<{ text: string; is_correct: boolean }>)
                .findIndex(o => o.is_correct)
            if (userAnswer === correctIndex) correctCount++
        })

        const scorePct = Math.round((correctCount / totalQuestions) * 100)
        const xpEarned = calculateQuizXP(scorePct, quiz.xp_base, quiz.xp_bonus_80, quiz.xp_bonus_100)

        await supabase.from('user_quiz_attempts').insert({
            user_id: user.id,
            quiz_id: quizId,
            score_pct: scorePct,
            xp_earned: xpEarned,
            answers: userAnswers,
            passed: scorePct >= (quiz.passing_score_pct || 80),
            attempt_number: 1,
        })

        if (xpEarned > 0) {
            await supabase.rpc('award_xp', { p_user_id: user.id, p_xp: xpEarned })
        }

        if (quiz.lesson_id) {
            await supabase
                .from('user_progress')
                .upsert(
                    { user_id: user.id, lesson_id: quiz.lesson_id, completed: true, completed_at: new Date().toISOString(), xp_earned: xpEarned },
                    { onConflict: 'user_id,lesson_id' }
                )
        }

        await updateStreak(user.id)

        const { data: xpAfter } = await supabase
            .from('user_xp')
            .select('rank')
            .eq('user_id', user.id)
            .single()

        const rankUp = xpBefore?.rank !== xpAfter?.rank ? xpAfter?.rank : null

        if (scorePct === 100) {
            const { data: aceBadge } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id)
                .eq('badge_id', 'quiz_ace')
                .single()

            if (!aceBadge) {
                await supabase.from('user_badges').insert({
                    user_id: user.id,
                    badge_id: 'quiz_ace'
                })
            }
        }

        revalidatePath('/dashboard')
        revalidatePath('/profile')
        if (quiz.lesson_id) revalidatePath(`/lesson/${quiz.lesson_id}`)

        return {
            success: true,
            scorePct,
            xpEarned,
            correctCount,
            totalQuestions,
            rankUp,
            passed: scorePct >= (quiz.passing_score_pct || 80),
        }
    } catch (error: any) {
        console.error('Error submitting quiz:', error)
        return { success: false, error: error.message }
    }
}

// ─── New Assessment Actions ───────────────────────────────────

export async function startAssessment(quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
        // Fetch quiz with assessment config
        const { data: quiz } = await supabase
            .from('quizzes')
            .select('*, questions:quiz_questions(*)')
            .eq('id', quizId)
            .single()

        if (!quiz) throw new Error('Assessment not found')

        // Check can retake
        const { data: retake } = await supabase
            .rpc('can_retake_assessment', { p_user_id: user.id, p_quiz_id: quizId })

        const retakeResult = Array.isArray(retake) ? retake[0] : retake
        if (!retakeResult?.can_retake && retakeResult?.has_passed) {
            return { success: false, error: 'You have already passed this assessment' }
        }
        if (!retakeResult?.can_retake && !retakeResult?.has_passed) {
            return { success: false, error: 'No attempts remaining' }
        }

        // Get the attempt count for this user
        const { count } = await supabase
            .from('user_quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('quiz_id', quizId)

        const attemptNumber = (count || 0) + 1

        // Create attempt row
        const { data: attempt, error } = await supabase
            .from('user_quiz_attempts')
            .insert({
                user_id: user.id,
                quiz_id: quizId,
                started_at: new Date().toISOString(),
                attempt_number: attemptNumber,
            })
            .select()
            .single()

        if (error) throw error

        return {
            success: true,
            attemptId: attempt.id,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                type: quiz.type,
                questions: quiz.questions.map((q: any) => ({
                    id: q.id,
                    question: q.question,
                    options: q.options.map((o: any) => ({ text: o.text })), // strip is_correct
                    order_index: q.order_index,
                })),
                time_limit_minutes: quiz.time_limit_minutes,
                instructions: quiz.instructions,
                passing_score_pct: quiz.passing_score_pct,
                max_attempts: quiz.max_attempts,
                xp_base: quiz.xp_base,
                xp_bonus_80: quiz.xp_bonus_80,
                xp_bonus_100: quiz.xp_bonus_100,
            },
            deadline: quiz.time_limit_minutes
                ? new Date(Date.now() + quiz.time_limit_minutes * 60000).toISOString()
                : null,
        }
    } catch (error: any) {
        console.error('Error starting assessment:', error)
        return { success: false, error: error.message }
    }
}

export async function submitAssessment(
    quizId: string,
    attemptId: string,
    userAnswers: Record<string, number>,
    timeSpentSeconds?: number
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    try {
        // Fetch quiz and questions for secure scoring
        const { data: quiz } = await supabase
            .from('quizzes')
            .select('*, questions:quiz_questions(*)')
            .eq('id', quizId)
            .single()

        if (!quiz) throw new Error('Assessment not found')

        // Fetch the attempt to verify ownership and check timer
        const { data: attempt } = await supabase
            .from('user_quiz_attempts')
            .select('*')
            .eq('id', attemptId)
            .eq('user_id', user.id)
            .single()

        if (!attempt) throw new Error('Attempt not found')
        if (attempt.completed_at) throw new Error('This attempt has already been submitted')

        // Check time limit if applicable
        if (quiz.time_limit_minutes && attempt.started_at) {
            const startedAt = new Date(attempt.started_at).getTime()
            const elapsed = Date.now() - startedAt
            const limitMs = quiz.time_limit_minutes * 60000
            if (elapsed > limitMs) {
                timeSpentSeconds = Math.floor(limitMs / 1000)
            }
        }

        // Get rank before
        const { data: xpBefore } = await supabase
            .from('user_xp')
            .select('rank')
            .eq('user_id', user.id)
            .single()

        // Score questions
        let correctCount = 0
        const totalQuestions = quiz.questions.length

        quiz.questions.forEach((q: any) => {
            const userAnswer = userAnswers[q.id]
            const correctIndex = (q.options as Array<{ text: string; is_correct: boolean }>)
                .findIndex((o: any) => o.is_correct)
            if (userAnswer === correctIndex) correctCount++
        })

        const scorePct = Math.round((correctCount / totalQuestions) * 100)
        const passed = scorePct >= (quiz.passing_score_pct || 80)
        const xpEarned = passed ? calculateQuizXP(scorePct, quiz.xp_base, quiz.xp_bonus_80, quiz.xp_bonus_100) : 0

        // Update attempt with results
        const { error: updateError } = await supabase
            .from('user_quiz_attempts')
            .update({
                score_pct: scorePct,
                xp_earned: xpEarned,
                answers: userAnswers,
                passed,
                completed_at: new Date().toISOString(),
                time_spent_seconds: timeSpentSeconds || null,
            })
            .eq('id', attemptId)

        if (updateError) throw updateError

        // Award XP only if passed
        if (xpEarned > 0) {
            await supabase.rpc('award_xp', { p_user_id: user.id, p_xp: xpEarned })
        }

        // Create notification
        if (passed) {
            await supabase.rpc('create_notification', {
                p_user_id: user.id,
                p_type: 'quiz_passed',
                p_title: `${quiz.title} — Passed!`,
                p_body: `Score: ${scorePct}% | ${xpEarned} XP earned`,
                p_link: quiz.lesson_id ? `/lesson/${quiz.lesson_id}` : `/assessments/${quiz.id}`,
            })
        } else {
            await supabase.rpc('create_notification', {
                p_user_id: user.id,
                p_type: 'quiz_failed',
                p_title: `${quiz.title} — Needs improvement`,
                p_body: `Score: ${scorePct}% (passing: ${quiz.passing_score_pct}%)`,
                p_link: `/assessments/${quiz.id}`,
            })
        }

        // ─── Progression gating ─────────────────────────────
        if (passed) {
            const assessmentType = quiz.type as string

            if (assessmentType === 'lesson' && quiz.lesson_id) {
                // Mark the linked lesson as complete
                await supabase
                    .from('user_progress')
                    .upsert(
                        {
                            user_id: user.id,
                            lesson_id: quiz.lesson_id,
                            completed: true,
                            completed_at: new Date().toISOString(),
                            xp_earned: xpEarned,
                        },
                        { onConflict: 'user_id,lesson_id' }
                    )
            }

            if (assessmentType === 'module' && quiz.module_id) {
                // Mark module completion (we'll use a convention: user_progress with lesson_id = null and module context)
                // Or we can track module completion in the skill tree
                // For now, we'll mark the module as completed in the skill tree
                const { data: moduleData } = await supabase
                    .from('modules')
                    .select('skill_node_id')
                    .eq('id', quiz.module_id)
                    .single()

                if (moduleData?.skill_node_id) {
                    await supabase
                        .from('user_skill_tree')
                        .upsert(
                            {
                                user_id: user.id,
                                node_id: moduleData.skill_node_id,
                                status: 'completed',
                                progress_pct: 100,
                                updated_at: new Date().toISOString(),
                            },
                            { onConflict: 'user_id,node_id' }
                        )
                }
            }

            if (assessmentType === 'course' && quiz.course_id) {
                // Check graduation - handled by the course completion check
                // We'll mark it and let the graduation system handle certificates
                const { checkGraduation } = await import('@/lib/graduation')
                await checkGraduation(user.id, quiz.course_id)
            }
        }

        // Streak update
        await updateStreak(user.id)

        // Get rank after
        const { data: xpAfter } = await supabase
            .from('user_xp')
            .select('rank')
            .eq('user_id', user.id)
            .single()

        const rankUp = xpBefore?.rank !== xpAfter?.rank ? xpAfter?.rank : null

        // Quiz Ace badge for perfect score
        if (scorePct === 100) {
            const { data: aceBadge } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', user.id)
                .eq('badge_id', 'quiz_ace')
                .single()

            if (!aceBadge) {
                await supabase.from('user_badges').insert({
                    user_id: user.id,
                    badge_id: 'quiz_ace'
                })
                await supabase.rpc('create_notification', {
                    p_user_id: user.id,
                    p_type: 'badge_earned',
                    p_title: 'Badge earned: Quiz Ace',
                    p_body: 'Perfect score on an assessment!',
                    p_link: '/profile',
                })
            }
        }

        revalidatePath('/dashboard')
        revalidatePath('/profile')
        if (quiz.lesson_id) revalidatePath(`/lesson/${quiz.lesson_id}`)
        if (quiz.course_id) revalidatePath(`/courses`)
        revalidatePath('/assessments')

        return {
            success: true,
            scorePct,
            xpEarned,
            correctCount,
            totalQuestions,
            passed,
            rankUp,
        }
    } catch (error: any) {
        console.error('Error submitting assessment:', error)
        return { success: false, error: error.message }
    }
}

export async function getAssessmentStatus(quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .rpc('get_assessment_status', { p_user_id: user.id, p_quiz_id: quizId })

    const result = Array.isArray(data) ? data[0] : data
    return result || { attempt_count: 0, best_score: 0, has_passed: false, last_attempt_id: null }
}

export async function getCanRetakeAssessment(quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .rpc('can_retake_assessment', { p_user_id: user.id, p_quiz_id: quizId })

    const result = Array.isArray(data) ? data[0] : data
    return result || { can_retake: true, attempts_used: 0, max_attempts: 0, has_passed: false }
}

export async function getAssessmentById(quizId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: quiz } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(*)')
        .eq('id', quizId)
        .single()

    return quiz
}
