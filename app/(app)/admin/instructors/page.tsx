import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { InstructorsTable } from './components/InstructorsTable'
import type { Rank } from '@/types'

export const metadata: Metadata = { title: 'Staff — Instructors' }

export default async function InstructorsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/admin')

    const admin = createAdminClient()

    const { data: instructors } = await admin
        .from('profiles')
        .select('id, full_name, username, avatar_url, created_at')
        .eq('role', 'instructor')
        .order('created_at', { ascending: false })

    const ids = instructors?.map(i => i.id) || []

    const [{ data: allXP }, { data: allStreaks }, { data: allSubmissions }, { data: allQuizAttempts }] = await Promise.all([
        admin.from('user_xp').select('user_id, total_xp, rank').in('user_id', ids),
        admin.from('user_streaks').select('user_id, current_streak').in('user_id', ids),
        admin.from('project_submissions').select('user_id, status').in('user_id', ids),
        admin.from('user_quiz_attempts').select('user_id, passed').in('user_id', ids),
    ])

    const xpMap = Object.fromEntries((allXP || []).map(x => [x.user_id, x]))
    const streakMap = Object.fromEntries((allStreaks || []).map(s => [s.user_id, s.current_streak]))

    const reviewStats: Record<string, { total: number; approved: number }> = {}
    for (const s of allSubmissions || []) {
        if (!reviewStats[s.user_id]) reviewStats[s.user_id] = { total: 0, approved: 0 }
        reviewStats[s.user_id].total++
        if (s.status === 'approved') reviewStats[s.user_id].approved++
    }

    const quizStats: Record<string, { passed: number; total: number }> = {}
    for (const a of allQuizAttempts || []) {
        if (!quizStats[a.user_id]) quizStats[a.user_id] = { passed: 0, total: 0 }
        quizStats[a.user_id].total++
        if (a.passed) quizStats[a.user_id].passed++
    }

    const rows = (instructors || []).map(i => ({
        id: i.id,
        full_name: i.full_name,
        username: i.username,
        avatar_url: i.avatar_url,
        created_at: i.created_at,
        xp: xpMap[i.id]?.total_xp ?? 0,
        rank: xpMap[i.id]?.rank as Rank | undefined,
        streak: streakMap[i.id] ?? 0,
        reviewed: reviewStats[i.id]?.total ?? 0,
        approved: reviewStats[i.id]?.approved ?? 0,
        quizPassed: quizStats[i.id]?.passed ?? 0,
        quizTotal: quizStats[i.id]?.total ?? 0,
    }))

    return <InstructorsTable rows={rows} />
}
