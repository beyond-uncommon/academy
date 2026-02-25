import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, BarChart2, ArrowRight, Trophy, UserPlus, LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Admin' }

const sections = [
    {
        href: '/admin/lessons',
        icon: BookOpen,
        title: 'Lessons & Courses',
        description: 'Upload lessons, quizzes, and project briefs.',
    },
    {
        href: '/admin/users',
        icon: Users,
        title: 'Learners',
        description: 'View learner progress, XP, and activity.',
    },
    {
        href: '/admin/analytics',
        icon: BarChart2,
        title: 'Analytics',
        description: 'Track engagement, retention, and skill completion.',
    },
    {
        href: '/admin/submissions',
        icon: Trophy,
        title: 'Project Reviews',
        description: 'Review and approve student project submissions.',
    },
    {
        href: '/admin/signup',
        icon: UserPlus,
        title: 'Add Admin',
        description: 'Create a new admin account with immediate access.',
    },
]

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Admin Overview</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage content and monitor learner performance.</p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Switch to Learner View
                    </Button>
                </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                {sections.map((s) => (
                    <Card key={s.href} className="border-border/40 hover:border-border/80 transition-colors">
                        <CardHeader className="pb-2">
                            <s.icon className="w-5 h-5 text-primary mb-1" />
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
