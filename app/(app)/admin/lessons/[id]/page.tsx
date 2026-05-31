import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { EditLessonForm } from './EditLessonForm'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function AdminEditLessonPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

    const { data: lesson } = await supabase
        .from('lessons')
        .select(`
            *,
            module:modules(title)
        `)
        .eq('id', id)
        .single()

    if (!lesson) redirect('/admin/lessons')

    const { data: modules } = await supabase.from('modules').select('id, title')

    return (
        <div className="space-y-6">
            <Link href="/admin/lessons" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Back to Lessons
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Edit Lesson</h1>
                <p className="text-muted-foreground text-sm">{lesson.title}</p>
            </div>
            <Card className="border-border/40">
                <CardHeader>
                    <CardTitle>Lesson Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <EditLessonForm lesson={lesson} modules={modules || []} />
                </CardContent>
            </Card>
        </div>
    )
}
