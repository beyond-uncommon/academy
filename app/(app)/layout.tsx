import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNotifications, getUnreadCount } from '@/lib/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    // Fetch XP & Rank
    const { data: xp } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    // Fetch Streak
    const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    // Fetch Notifications
    const [notifications, unreadCount] = await Promise.all([
        getNotifications(user.id, 10),
        getUnreadCount(user.id),
    ])

    const role = profile?.role || 'learner'
    const isStaff = role === 'admin' || role === 'instructor'

    // Fetch pending review count for staff sidebar badge
    let pendingReviewCount: number | undefined
    if (isStaff) {
        const admin = createAdminClient()
        const { count } = await admin
            .from('project_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
        pendingReviewCount = count ?? undefined
    }

    const username = profile?.full_name || 'Learner'
    const initials = username.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'L'

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                isAdmin={role === 'admin'}
                isInstructor={role === 'instructor'}
                username={username}
                userInitials={initials}
                avatarUrl={profile?.avatar_url}
                pendingReviewCount={pendingReviewCount}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar
                    totalXP={xp?.total_xp || 0}
                    streak={streak?.current_streak || 0}
                    rank={xp?.rank || 'beginner'}
                    isStaff={isStaff}
                    unreadNotifications={unreadCount}
                    notifications={notifications}
                />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}

