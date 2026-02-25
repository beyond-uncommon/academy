'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateQuizXP } from '@/lib/xp'
import { updateStreak } from '@/lib/gamification'

export async function submitQuiz(
    quizId: string,
    userAnswers: Record<string, number> // questionId -> optionIndex
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    try {
        // 1. Fetch quiz and questions for secure scoring
        const { data: quiz } = await supabase
            .from('quizzes')
            .select('*, questions:quiz_questions(*)')
            .eq('id', quizId)
            .single()

        if (!quiz) throw new Error('Quiz not found')

        // Get rank before
        const { data: xpBefore } = await supabase
            .from('user_xp')
            .select('rank')
            .eq('user_id', user.id)
            .single()

        // 2. Score questions
        // options are stored as [{text, is_correct}] — find the index of the correct one
        let correctCount = 0
        const totalQuestions = quiz.questions.length

        quiz.questions.forEach((q: any) => {
            const userAnswer = userAnswers[q.id]
            const correctIndex = (q.options as Array<{ text: string; is_correct: boolean }>)
                .findIndex(o => o.is_correct)
            if (userAnswer === correctIndex) {
                correctCount++
            }
        })

        const scorePct = Math.round((correctCount / totalQuestions) * 100)

        // 3. Calculate XP
        const xpEarned = calculateQuizXP(
            scorePct,
            quiz.xp_base,
            quiz.xp_bonus_80,
            quiz.xp_bonus_100
        )

        // 4. Save attempt
        const { error: attemptError } = await supabase
            .from('user_quiz_attempts')
            .insert({
                user_id: user.id,
                quiz_id: quizId,
                score_pct: scorePct,
                xp_earned: xpEarned
            })

        if (attemptError) throw attemptError

        // 5. Award XP
        if (xpEarned > 0) {
            await supabase.rpc('award_xp', {
                p_user_id: user.id,
                p_xp: xpEarned
            })
        }

        // Mark the linked lesson as complete if quiz has a lesson_id
        if (quiz.lesson_id) {
            await supabase
                .from('user_progress')
                .upsert(
                    { user_id: user.id, lesson_id: quiz.lesson_id, completed: true, completed_at: new Date().toISOString() },
                    { onConflict: 'user_id,lesson_id' }
                )
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

        // 6. Check for "Quiz Ace" badge
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

        return {
            success: true,
            scorePct,
            xpEarned,
            correctCount,
            totalQuestions,
            rankUp
        }
    } catch (error: any) {
        console.error('Error submitting quiz:', error)
        return { success: false, error: error.message }
    }
}
