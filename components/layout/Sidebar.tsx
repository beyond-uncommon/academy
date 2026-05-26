'use client'

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
    const showStaffNav = isAdmin || isInstructor

    return (
        <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-border/40 bg-card/30 p-4">
            {/* Logo */}
            <div className="mb-6 px-2">
                <span className="text-lg font-bold tracking-tight">Academy</span>
                <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const active = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={active ? 'secondary' : 'ghost'}
                                className={cn(
                                    'w-full justify-start gap-3 text-sm font-medium',
                                    active ? '' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                            </Button>
                        </Link>
                    )
                })}

                {showStaffNav && (
                    <>
                        <div className="mt-6 mb-2 px-3">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {isAdmin ? 'Admin Management' : 'Instructor'}
                            </p>
                        </div>
                        {isAdmin && (
                            <>
                                <Link href="/admin">
                                    <Button
                                        variant={pathname === '/admin' ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname === '/admin' ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Shield className="w-4 h-4 shrink-0" />
                                        Overview
                                    </Button>
                                </Link>
                                <Link href="/admin/courses">
                                    <Button
                                        variant={pathname.startsWith('/admin/courses') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/courses') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <BookOpen className="w-4 h-4 shrink-0" />
                                        Courses
                                    </Button>
                                </Link>
                                <Link href="/admin/lessons">
                                    <Button
                                        variant={pathname.startsWith('/admin/lessons') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/lessons') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <BookOpen className="w-4 h-4 shrink-0" />
                                        Lessons
                                    </Button>
                                </Link>
                                <Link href="/admin/assessments">
                                    <Button
                                        variant={pathname.startsWith('/admin/assessments') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/assessments') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <ClipboardCheck className="w-4 h-4 shrink-0" />
                                        Assessments
                                    </Button>
                                </Link>
                                <Link href="/admin/users">
                                    <Button
                                        variant={pathname.startsWith('/admin/users') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/users') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Users className="w-4 h-4 shrink-0" />
                                        Users
                                    </Button>
                                </Link>
                                <Link href="/admin/students">
                                    <Button
                                        variant={pathname.startsWith('/admin/students') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/students') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <GraduationCap className="w-4 h-4 shrink-0" />
                                        Students
                                    </Button>
                                </Link>
                                <Link href="/admin/submissions">
                                    <Button
                                        variant={pathname.startsWith('/admin/submissions') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/submissions') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Trophy className="w-4 h-4 shrink-0" />
                                        Submissions
                                    </Button>
                                </Link>
                                <Link href="/admin/analytics">
                                    <Button
                                        variant={pathname.startsWith('/admin/analytics') ? 'secondary' : 'ghost'}
                                        className={cn(
                                            'w-full justify-start gap-3 text-sm font-medium',
                                            pathname.startsWith('/admin/analytics') ? '' : 'text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <BarChart2 className="w-4 h-4 shrink-0" />
                                        Analytics
                                    </Button>
                                </Link>
                            </>
                        )}
                    </>
                )}
            </nav>

            {/* User footer */}
            <Separator className="mb-3" />
            <div className="flex items-center gap-3 px-2">
                <Avatar className="w-8 h-8">
                    <AvatarImage src={avatarUrl} alt={username} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{username}</p>
                </div>
                <form action={logout}>
                    <Button type="submit" variant="ghost" size="icon" className="shrink-0" title="Sign out">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </aside>
    )
}
