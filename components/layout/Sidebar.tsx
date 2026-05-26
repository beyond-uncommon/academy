'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/actions'
import {
    LayoutDashboard,
    BookOpen,
    User,
    Settings,
    Trophy,
    LogOut,
    Shield,
    Users,
    BarChart2,
    Briefcase,
    ClipboardCheck,
    Activity,
    Search,
    GraduationCap,
    Wrench,
    Library,
    Bell,
    Award,
    HelpCircle,
    Calendar,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/projects', label: 'Projects', icon: Wrench },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/resources', label: 'Resources', icon: Library },
    { href: '/career', label: 'Career', icon: Briefcase },
    { href: '/assessments', label: 'Assessments', icon: ClipboardCheck },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/analytics', label: 'Analytics', icon: Activity },
    { href: '/badges', label: 'Badges', icon: Award },
    { href: '/profile', label: 'My Progress', icon: User },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/help', label: 'Help', icon: HelpCircle },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/search', label: 'Search', icon: Search },
]

interface SidebarProps {
    isAdmin?: boolean
    isInstructor?: boolean
    userInitials?: string
    avatarUrl?: string
    username?: string
}

export function Sidebar({
    isAdmin = false,
    isInstructor = false,
    userInitials = 'U',
    avatarUrl,
    username = 'Learner',
}: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const showStaffNav = isAdmin || isInstructor

    function NavButton({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) {
        const isActive = active ?? (href === '/' ? pathname === href : pathname.startsWith(href))
        return (
            <Link href={href}>
                <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                        'w-full justify-start gap-3 text-sm font-medium',
                        collapsed ? 'px-0 justify-center' : '',
                        isActive ? '' : 'text-muted-foreground hover:text-foreground'
                    )}
                    title={collapsed ? label : undefined}
                >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && label}
                </Button>
            </Link>
        )
    }

    return (
        <aside className={cn(
            'hidden md:flex flex-col min-h-screen border-r border-border/40 bg-card/30 p-4 transition-all duration-200',
            collapsed ? 'w-16' : 'w-64'
        )}>
            {/* Logo */}
            <div className={cn('mb-6 flex items-center', collapsed ? 'justify-center px-0' : 'px-2')}>
                {!collapsed && (
                    <>
                        <span className="text-lg font-bold tracking-tight">Academy</span>
                        <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
                    </>
                )}
                {collapsed && <span className="text-lg font-bold">A</span>}
            </div>

            {/* Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                    'mb-4 flex items-center text-muted-foreground hover:text-foreground transition-colors',
                    collapsed ? 'justify-center' : 'px-2'
                )}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Nav */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavButton key={item.href} href={item.href} icon={item.icon} label={item.label} active={pathname === item.href} />
                ))}

                {showStaffNav && (
                    <>
                        {!collapsed && (
                            <div className="mt-6 mb-2 px-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {isAdmin ? 'Admin Management' : 'Instructor'}
                                </p>
                            </div>
                        )}
                        {collapsed && <div className="mt-4 mb-2 border-t border-border/40" />}
                        {isAdmin && (
                            <>
                                <NavButton href="/admin" icon={Shield} label="Overview" />
                                <NavButton href="/admin/courses" icon={BookOpen} label="Courses" />
                                <NavButton href="/admin/lessons" icon={BookOpen} label="Lessons" />
                                <NavButton href="/admin/assessments" icon={ClipboardCheck} label="Assessments" />
                                <NavButton href="/admin/users" icon={Users} label="Users" />
                                <NavButton href="/admin/students" icon={GraduationCap} label="Students" />
                                <NavButton href="/admin/submissions" icon={Trophy} label="Submissions" />
                                <NavButton href="/admin/analytics" icon={BarChart2} label="Analytics" />
                            </>
                        )}
                    </>
                )}
            </nav>

            {/* User footer */}
            <Separator className="mb-3" />
            <div className={cn('flex items-center gap-3', collapsed ? 'justify-center' : 'px-2')}>
                <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarUrl} alt={username} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                {!collapsed && (
                    <>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{username}</p>
                        </div>
                        <form action={logout}>
                            <Button type="submit" variant="ghost" size="icon" className="shrink-0" title="Sign out">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </aside>
    )
}
