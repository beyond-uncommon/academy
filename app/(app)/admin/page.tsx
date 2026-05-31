import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, BarChart2, ArrowRight, Trophy, UserPlus, LayoutDashboard, ClipboardCheck, GraduationCap, MapPin, Calendar } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Staff Panel' }

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'
    const isInstructor = profile?.role === 'instructor'
    if (!isAdmin && !isInstructor) redirect('/dashboard')

    const admin = createAdminClient()

    // Pending reviews count (for both admin and instructor)
    const { count: pendingCount } = await admin
        .from('project_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    interface AdminSection {
        href: string
        icon: React.ComponentType<{ className?: string }>
        title: string
        description: string
        adminOnly: boolean
        badge?: number | null
    }

    const adminSections: AdminSection[] = [
        {
            href: '/admin/courses',
            icon: BookOpen,
            title: 'Courses',
            description: 'Create courses, modules, lessons, and quizzes.',
            adminOnly: true,
        },
        {
            href: '/admin/assessments',
            icon: ClipboardCheck,
            title: 'Assessments',
            description: 'Manage timed assessments with passing requirements.',
            adminOnly: true,
        },
        {
            href: '/admin/students',
            icon: Users,
            title: 'Students',
            description: 'View learners, invite new students to the platform.',
            adminOnly: false,
        },
        {
            href: '/admin/analytics',
            icon: BarChart2,
            title: 'Analytics',
            description: 'Track engagement, retention, and skill completion.',
            adminOnly: false,
        },
        {
            href: '/admin/submissions',
            icon: Trophy,
            title: 'Project Reviews',
            description: 'Review and approve student project submissions.',
            adminOnly: false,
            badge: pendingCount,
        },
        {
            href: '/admin/signup',
            icon: UserPlus,
            title: 'Add Admin',
            description: 'Create a new admin account with immediate access.',
            adminOnly: true,
        },
        {
            href: '/admin/hubs',
            icon: MapPin,
            title: 'Innovation Hubs',
            description: 'Add, rename, or hide the hubs shown during student onboarding.',
            adminOnly: true,
        },
        {
            href: '/admin/instructors',
            icon: GraduationCap,
            title: 'Instructors',
            description: 'View instructor accounts, see review activity, and remove access.',
            adminOnly: true,
        },
        {
            href: '/admin/events',
            icon: Calendar,
            title: 'Events',
            description: 'Create and manage workshops, AMAs, and community events.',
            adminOnly: true,
        },
    ]

    const visible = adminSections.filter((s) => isAdmin || !s.adminOnly)

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Staff Panel</h1>
                        {isInstructor && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Instructor</span>
                        )}
                        {isAdmin && (
                            <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full font-medium">Admin</span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{isAdmin ? 'Manage content and monitor learner performance.' : 'Review submissions and manage students.'}</p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Learner View
                    </Button>
                </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                {visible.map((s) => (
                    <Card key={s.href} className="border-border/40 hover:border-border/80 transition-colors">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <s.icon className="w-5 h-5 text-primary mb-1" />
                                {s.badge != null && s.badge > 0 && (
                                    <Badge variant="default" className="text-xs">
                                        {s.badge} pending
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-sm">{s.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">{s.description}</p>
                            <Link href={s.href}>
                                <Button variant="outline" size="sm" className="gap-2 w-full">
                                    Open <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
