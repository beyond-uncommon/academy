import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { createClient } from '@/lib/supabase/server'
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
        .single()

    // Fetch XP & Rank
    const { data: xp } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch Streak
    const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

    // Fetch Notifications
    const [notifications, unreadCount] = await Promise.all([
        getNotifications(user.id, 10),
        getUnreadCount(user.id),
    ])

    const username = profile?.full_name || 'Learner'
    const initials = username.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'L'

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar
                isAdmin={profile?.role === 'admin'}
                username={username}
                userInitials={initials}
                avatarUrl={profile?.avatar_url}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar
                    totalXP={xp?.total_xp || 0}
                    streak={streak?.current_streak || 0}
                    rank={xp?.rank || 'beginner'}
                    isAdmin={profile?.role === 'admin'}
                    unreadNotifications={unreadCount}
                    notifications={notifications}
                />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}

