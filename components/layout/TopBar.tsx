import { Zap, Flame, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RANK_LABELS, type Rank } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { SearchBar } from '@/components/search/SearchBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileNav } from '@/components/layout/MobileNav'

interface TopBarProps {
    totalXP?: number
    streak?: number
    rank?: Rank
    isStaff?: boolean
    unreadNotifications?: number
    notifications?: { id: string; title: string; body: string | null; link: string | null; is_read: boolean; created_at: string; type: string }[]
    username?: string
    userInitials?: string
    avatarUrl?: string
    isAdmin?: boolean
    isInstructor?: boolean
    pendingReviewCount?: number
}

export function TopBar({ totalXP = 0, streak = 0, rank = 'beginner', isStaff = false, unreadNotifications = 0, notifications = [], username = 'Learner', userInitials = 'U', avatarUrl, isAdmin = false, isInstructor = false, pendingReviewCount }: TopBarProps) {
    return (
        <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-end px-6 gap-6 sticky top-0 z-40">
            <div className="mr-auto flex items-center gap-3">
                <MobileNav
                    isAdmin={isAdmin}
                    isInstructor={isInstructor}
                    username={username}
                    userInitials={userInitials}
                    avatarUrl={avatarUrl}
                    pendingReviewCount={pendingReviewCount}
                />
                {isStaff && (
                    <Link href="/admin" className="hidden md:inline-flex">
                        <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary hover:bg-primary/10">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Staff Panel</span>
                        </Button>
                    </Link>
                )}
            </div>

            {/* Search */}
            <SearchBar />

            {/* Notifications */}
            <NotificationBell initialUnread={unreadNotifications} initialNotifications={notifications} />

            {/* Streak */}
            <div className="flex items-center gap-1.5 text-sm font-medium">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{streak}</span>
                <span className="text-muted-foreground text-xs">day streak</span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1.5 text-sm font-medium">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>{totalXP.toLocaleString()}</span>
                <span className="text-muted-foreground text-xs">XP</span>
            </div>

            {/* Rank */}
            <Badge variant="outline" className="text-xs">
                {RANK_LABELS[rank]}
            </Badge>

            {/* Theme */}
            <ThemeToggle />
        </header>
    )
}
