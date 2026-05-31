import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Courses' }

export default async function CoursesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const [{ data: courses }, { data: userProgress }] = await Promise.all([
        supabase
            .from('courses')
            .select('*, modules(id, lessons(id))')
            .eq('is_published', true)
            .order('phase', { ascending: true }),
        supabase
            .from('user_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true),
    ])

    const completedIds = new Set(userProgress?.map(p => p.lesson_id) || [])

    const enriched = (courses || []).map(course => {
        const allLessons = course.modules?.flatMap((m: { lessons: { id: string }[] }) => m.lessons || []) || []
        const total = allLessons.length
        const completed = allLessons.filter((l: { id: string }) => completedIds.has(l.id)).length
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0
        return { ...course, total, completed, pct }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Courses</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Browse all available courses and track your progress.
                </p>
            </div>

            {enriched.length === 0 ? (
                <Card className="border-border/40">
                    <CardContent className="p-12 text-center">
                        <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">No courses available yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Check back soon for new content.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {enriched.map(course => (
                        <Card key={course.id} className="border-border/40">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <CardTitle className="text-base">{course.title}</CardTitle>
                                            <Badge variant="secondary" className="capitalize text-xs">
                                                {course.type === 'crash_course' ? 'Crash Course' : 'Specialization'}
                                            </Badge>
                                            {course.phase && (
                                                <Badge variant="outline" className="text-xs">Phase {course.phase}</Badge>
                                            )}
                                        </div>
                                        {course.description && (
                                            <p className="text-sm text-muted-foreground">{course.description}</p>
                                        )}
                                    </div>
                                    <Link href={`/courses/${course.slug}`} className="shrink-0">
                                        <Button size="sm" variant={course.pct > 0 ? 'default' : 'outline'} className="gap-2">
                                            {course.pct === 100 ? 'Review' : course.pct > 0 ? 'Continue' : 'Start'}
                                            <ArrowRight className="w-3 h-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        {course.modules?.length || 0} modules · {course.total} lessons
                                    </span>
                                    <span>{course.completed}/{course.total} completed</span>
                                </div>
                                <Progress value={course.pct} className="h-1.5" />
                                {course.pct === 100 && (
                                    <p className="text-xs text-green-500 font-medium">Course complete</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
