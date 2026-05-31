'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Users, User } from 'lucide-react'

const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
]

export function MobileBottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background md:hidden flex items-center justify-around py-2 px-2">
            {items.map((item) => {
                const isActive = item.href === '/' ? pathname === item.href : pathname.startsWith(item.href)
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors ${
                            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}
