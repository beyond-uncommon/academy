import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Eye, EyeOff, Layers, Trash2, Clock, Zap, ClipboardCheck, Pencil } from 'lucide-react'
import { toggleCoursePublish, deleteModule, toggleLessonStatus, toggleQuizPublish } from '../../actions'
import { CreateModuleDialog } from '../components/CreateModuleDialog'
import { CreateLessonDialog } from '../../lessons/components/CreateLessonDialog'
import { CreateQuizDialog } from '../components/CreateQuizDialog'
import type { Module, Lesson, Quiz } from '@/types'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

    if (!course) return <div className="text-center py-12 text-muted-foreground">Course not found.</div>

    const { data: modules } = await supabase
        .from('modules')
        .select(`
            *,
            lessons(*),
            quizzes:quizzes(*)
        `)
        .eq('course_id', id)
        .order('order_index', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/courses">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{course.title}</h1>
                            {course.is_published ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                            )}
                        </div>
                        {course.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{course.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <form action={async () => {
                        'use server'
                        const res = await toggleCoursePublish(course.id, !course.is_published)
                        if (res?.error) throw new Error(res.error)
                    }}>
                        <Button variant="outline" size="sm" className="gap-2">
                            {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {course.is_published ? 'Unpublish' : 'Publish'}
                        </Button>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Layers className="w-5 h-5 text-primary" />
                        <div>
                            <p className="font-medium">{modules?.length || 0} Modules</p>
                            <p className="text-xs text-muted-foreground capitalize">{course.type?.replace('_', ' ')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <div>
                            <p className="font-medium">{modules?.reduce((sum: number, m: Module & { lessons: Lesson[]; quizzes: Quiz[] }) => sum + (m.lessons?.length || 0), 0) || 0} Lessons</p>
                            <p className="text-xs text-muted-foreground">Phase {course.phase}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border/40">
                    <CardContent className="p-4 flex items-center gap-3">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        <div>
                            <p className="font-medium">{modules?.reduce((sum: number, m: Module & { lessons: Lesson[]; quizzes: Quiz[] }) => sum + (m.quizzes?.length || 0), 0) || 0} Quizzes</p>
                            <p className="text-xs text-muted-foreground">Across all modules</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {modules?.map((mod: Module & { lessons: Lesson[]; quizzes: Quiz[] }) => (
                    <Card key={mod.id} className="border-border/40">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{mod.title}</CardTitle>
                                <Badge variant="secondary" className="text-[10px]">Module {mod.order_index}</Badge>
                                {mod.xp_available > 0 && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> {mod.xp_available} XP
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <CreateLessonDialog modules={[{ id: mod.id, title: mod.title }]} />
                                <CreateQuizDialog moduleId={mod.id} courseId={id} />
                                <form action={async () => {
                                    'use server'
                                    const res = await deleteModule(mod.id, id)
                                    if (res?.error) throw new Error(res.error)
                                }}>
                                    <Button variant="ghost" size="sm" className="text-destructive">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            {/* Lessons */}
                            {mod.lessons?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lessons</p>
                                    {mod.lessons.map((lesson: Lesson) => (
                                        <div key={lesson.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/10">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground w-6 text-right text-xs">{lesson.order_index}.</span>
                                                <span>{lesson.title}</span>
                                                <Badge variant="outline" className="text-[10px] capitalize">{lesson.type}</Badge>
                                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                                    <Clock className="w-3 h-3" /> {lesson.duration_minutes}m
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                                    <Zap className="w-3 h-3" /> {lesson.xp_reward}XP
                                                </span>
                                            </div>
                                            <form action={async () => {
                                                'use server'
                                                const res = await toggleLessonStatus(lesson.id, !lesson.is_published)
                                                if (res?.error) throw new Error(res.error)
                                            }}>
                                                <Button variant="ghost" size="sm">
                                                    {lesson.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                </Button>
                                            </form>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quizzes */}
                            {mod.quizzes?.length > 0 && mod.quizzes.map((quiz: Quiz) => (
                                <div key={quiz.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/10 mt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <ClipboardCheck className="w-4 h-4 text-primary" />
                                        <span>{quiz.title}</span>
                                        <Badge variant="outline" className="text-[10px] capitalize">{quiz.type}</Badge>
                                        {quiz.time_limit_minutes && (
                                            <span className="text-xs text-muted-foreground">{quiz.time_limit_minutes}min</span>
                                        )}
                                        <span className="text-xs text-muted-foreground">Pass: {quiz.passing_score_pct}%</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <form action={async () => {
                                            'use server'
                                            const res = await toggleQuizPublish(quiz.id, !quiz.is_published)
                                            if (res?.error) throw new Error(res.error)
                                        }}>
                                            <Button variant="ghost" size="sm">
                                                {quiz.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </Button>
                                        </form>
                                        <Link href={`/admin/quizzes/${quiz.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1">
                                                <Pencil className="w-3.5 h-3.5" />
                                                Questions
                                            </Button>
                                        </Link>
                                        <Link href={`/assessments/${quiz.id}`}>
                                            <Button variant="ghost" size="sm">Preview</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {(!mod.lessons || mod.lessons.length === 0) && (!mod.quizzes || mod.quizzes.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No content yet. Add lessons or a quiz.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <CreateModuleDialog courseId={id} />
        </div>
    )
}
