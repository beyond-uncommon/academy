import { Zap, Flame, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RANK_LABELS, type Rank } from '@/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { SearchBar } from '@/components/search/SearchBar'
import { ThemeToggle } from '@/components/ThemeToggle'

interface TopBarProps {
    totalXP?: number
    streak?: number
    rank?: Rank
    isStaff?: boolean
    unreadNotifications?: number
    notifications?: any[]
}

export function TopBar({ totalXP = 0, streak = 0, rank = 'beginner', isStaff = false, unreadNotifications = 0, notifications = [] }: TopBarProps) {
    return (
        <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-sm flex items-center justify-end px-6 gap-6 sticky top-0 z-40">
            {isStaff && (
                <div className="mr-auto flex items-center gap-3">
                    <Link href="/admin">
                        <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary hover:bg-primary/10">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Staff Panel</span>
                        </Button>
                    </Link>
                </div>
            )}

            {!isStaff && <div className="mr-auto" />}

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
