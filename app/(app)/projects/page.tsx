import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Wrench, Clock, Zap, CheckCircle2, AlertCircle, Clock4, MessageSquare } from 'lucide-react'
import { SubmitProjectDialog } from './components/SubmitProjectDialog'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Projects' }

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
    pending: { label: 'Awaiting Review', variant: 'secondary', icon: Clock4 },
    reviewed: { label: 'Needs Revision', variant: 'destructive', icon: AlertCircle },
    approved: { label: 'Approved', variant: 'default', icon: CheckCircle2 },
}

export default async function ProjectsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: projectLessons }, { data: submissions }] = await Promise.all([
        supabase
            .from('lessons')
            .select('*, module:modules(title, order_index, course:courses(id, title, slug))')
            .eq('type', 'project')
            .eq('is_published', true)
            .order('order_index', { ascending: true }),
        supabase
            .from('project_submissions')
            .select('*')
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false }),
    ])

    const submissionMap = new Map<string, any>()
    for (const s of submissions || []) {
        if (s.lesson_id && !submissionMap.has(s.lesson_id)) {
            submissionMap.set(s.lesson_id, s)
        }
    }

    const completedSubmissions = submissions?.filter(s => s.status === 'approved').length || 0
    const totalProjects = projectLessons?.length || 0

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Projects & Sprints</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Submit portfolio-ready projects and get feedback.
                </p>
            </div>

            {totalProjects > 0 && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{totalProjects} projects</span>
                    <span>{completedSubmissions} completed</span>
                    <Progress value={totalProjects > 0 ? Math.round((completedSubmissions / totalProjects) * 100) : 0} className="h-1.5 flex-1 max-w-xs" />
                </div>
            )}

            {totalProjects === 0 ? (
                <Card className="border-border/40">
                    <CardContent className="p-12 text-center">
                        <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">No projects yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Complete lessons to unlock project submissions.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {(projectLessons || []).map((lesson) => {
                        const sub = submissionMap.get(lesson.id)
                        const status = sub?.status || null
                        const cfg = status ? statusConfig[status] : null
                        const moduleInfo = lesson.module as any
                        return (
                            <Card key={lesson.id} className="border-border/40">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-base">{lesson.title}</CardTitle>
                                                {cfg && (
                                                    <Badge variant={cfg.variant} className="text-[10px] gap-1">
                                                        <cfg.icon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            {moduleInfo?.course && (
                                                <p className="text-xs text-muted-foreground">
                                                    {moduleInfo.course.title} · {moduleInfo.title}
                                                </p>
                                            )}
                                        </div>
                                        <SubmitProjectDialog
                                            lessonId={lesson.id}
                                            lessonTitle={lesson.title}
                                            xpReward={lesson.xp_reward}
                                            existing={sub ? { submission_url: sub.submission_url, notes: sub.notes, status: sub.status, feedback: sub.feedback } : null}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-3">
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.duration_minutes || 60} min</span>
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{lesson.xp_reward} XP</span>
                                    </div>

                                    {status === 'reviewed' && sub?.feedback && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-blue-600">Instructor Feedback</p>
                                                <p className="text-xs text-blue-600/80 mt-0.5">{sub.feedback}</p>
                                            </div>
                                        </div>
                                    )}

                                    {status === 'approved' && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-green-600">Approved</p>
                                                {sub?.feedback && (
                                                    <p className="text-xs text-green-600/70 mt-0.5">&ldquo;{sub.feedback}&rdquo;</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
