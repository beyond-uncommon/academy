'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    Menu,
    X,
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
    GraduationCap,
    Wrench,
    Library,
    Bell,
    Award,
    HelpCircle,
    Calendar,
} from 'lucide-react'
import { logout } from '@/app/(auth)/actions'
import { cn } from '@/lib/utils'

function NavItem({ href, icon: Icon, label, badge, pathname, onNavigate }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; badge?: number; pathname: string; onNavigate: () => void }) {
    const isActive = href === '/' ? pathname === href : pathname.startsWith(href)
    return (
        <Link href={href} onClick={onNavigate} aria-current={isActive ? 'page' : undefined}>
            <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 text-sm font-medium"
            >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {badge != null && badge > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground ml-auto">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </Button>
        </Link>
    )
}

interface MobileNavProps {
    isAdmin: boolean
    isInstructor: boolean
    username: string
    userInitials: string
    avatarUrl?: string
    pendingReviewCount?: number
}

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
]

export function MobileNav({ isAdmin, isInstructor, username, userInitials, avatarUrl, pendingReviewCount }: MobileNavProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const showStaff = isAdmin || isInstructor

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open navigation menu"
            >
                <Menu className="w-5 h-5" />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[300px] h-dvh top-0 left-0 translate-x-0 translate-y-0 p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left rounded-none border-r">
                    <div className="flex items-center justify-between p-4 border-b border-border/40">
                        <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                            Academy
                            <Badge variant="secondary" className="text-xs">Beta</Badge>
                        </DialogTitle>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" aria-label="Close menu">
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogClose>
                    </div>

                    <nav className="flex-1 overflow-auto p-4 space-y-1" aria-label="Mobile navigation">
                        {navItems.map((item) => (
                            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} pathname={pathname} onNavigate={() => setOpen(false)} />
                        ))}

                        {showStaff && (
                            <>
                                <Separator className="my-4" />
                                <p className={cn(
                                    'text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2',
                                )}>
                                    {isAdmin ? 'Admin Management' : 'Instructor'}
                                </p>
                                {isAdmin && (
                                    <>
                                        <NavItem href="/admin" icon={Shield} label="Overview" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/courses" icon={BookOpen} label="Courses" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/lessons" icon={BookOpen} label="Lessons" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/assessments" icon={ClipboardCheck} label="Assessments" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/users" icon={Users} label="Users" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/students" icon={GraduationCap} label="Students" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/submissions" icon={Trophy} label="Submissions" badge={pendingReviewCount} pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/analytics" icon={BarChart2} label="Analytics" pathname={pathname} onNavigate={() => setOpen(false)} />
                                    </>
                                )}
                                {isInstructor && (
                                    <>
                                        <NavItem href="/admin" icon={Shield} label="Overview" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/students" icon={GraduationCap} label="Students" pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/submissions" icon={Trophy} label="Submissions" badge={pendingReviewCount} pathname={pathname} onNavigate={() => setOpen(false)} />
                                        <NavItem href="/admin/analytics" icon={BarChart2} label="Analytics" pathname={pathname} onNavigate={() => setOpen(false)} />
                                    </>
                                )}
                            </>
                        )}
                    </nav>

                    <div className="border-t border-border/40 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={avatarUrl} alt={username} />
                                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{username}</p>
                            </div>
                            <form action={logout}>
                                <Button type="submit" variant="ghost" size="icon" title="Sign out">
                                    <LogOut className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
