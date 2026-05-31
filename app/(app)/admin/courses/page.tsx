import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Eye, EyeOff, ArrowRight, Layers, ClipboardCheck } from 'lucide-react'
import { toggleCoursePublish } from '../actions'
import { CreateCourseDialog } from './components/CreateCourseDialog'
import type { Course } from '@/types'

export default async function AdminCoursesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
    if (profile?.role !== 'admin') redirect('/dashboard')

    const { data: courses } = await supabase
        .from('courses')
        .select(`
            *,
            modules:modules(count),
            quizzes:quizzes(count)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Courses</h1>
                    <p className="text-muted-foreground text-sm">Create and manage course content.</p>
                </div>
                <CreateCourseDialog />
            </div>

            <div className="grid gap-4">
                {courses?.map((course: Course & { modules?: { count: number }[]; quizzes?: { count: number }[] }) => (
                    <Card key={course.id} className="border-border/40 hover:border-border/80 transition-colors">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                                        <Link href={`/admin/courses/${course.id}`} className="font-semibold hover:underline">
                                            {course.title}
                                        </Link>
                                        {course.is_published ? (
                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">Published</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] text-muted-foreground">Draft</Badge>
                                        )}
                                    </div>
                                    {course.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                                    )}
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            {course.modules?.[0]?.count || 0} modules
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClipboardCheck className="w-3 h-3" />
                                            {course.quizzes?.[0]?.count || 0} quizzes
                                        </span>
                                        <span className="capitalize">{course.type?.replace('_', ' ') || '—'}</span>
                                        {course.phase && <span>Phase {course.phase}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <form action={async () => {
                                        'use server'
                                        const res = await toggleCoursePublish(course.id, !course.is_published)
                                        if (res?.error) throw new Error(res.error)
                                    }}>
                                        <Button variant="ghost" size="sm">
                                            {course.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </Button>
                                    </form>
                                    <Link href={`/admin/courses/${course.id}`}>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            Manage <ArrowRight className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {(!courses || courses.length === 0) && (
                    <Card className="border-border/40 bg-secondary/5">
                        <CardContent className="p-12 text-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm font-medium">No courses yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Create your first course to get started.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
