import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, CheckCircle2, Clock, AlertCircle, MessageSquare, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { reviewSubmission } from '../actions'

export default async function AdminSubmissionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isStaff = profile?.role === 'admin' || profile?.role === 'instructor'
    if (!isStaff) redirect('/dashboard')

    const admin = createAdminClient()

    const { data: submissions } = await admin
        .from('project_submissions')
        .select(`
            *,
            profile:profiles(full_name, avatar_url, username),
            lesson:lessons(title)
        `)
        .order('submitted_at', { ascending: false })

    return (
        <div className="space-y-6">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Staff Panel
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Project Submissions</h1>
                <p className="text-muted-foreground text-sm">Review student work and award final approvals.</p>
            </div>

            <div className="grid gap-4">
                {submissions?.map((sub) => (
                    <Card key={sub.id} className="border-border/40 overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="flex-1 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={(sub.profile as any)?.avatar_url} />
                                            <AvatarFallback>{(sub.profile as any)?.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{(sub.profile as any)?.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                Submitted {new Date(sub.submitted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={sub.status === 'approved' ? 'default' : 'secondary'} className="gap-1">
                                        {sub.status === 'approved' ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <Clock className="w-3 h-3" />
                                        )}
                                        {sub.status.toUpperCase()}
                                    </Badge>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-lg">{sub.lesson?.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {sub.notes || "No notes provided."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <a
                                        href={sub.submission_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                                    >
                                        View Submission <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>

                            <div className="bg-muted/30 border-t md:border-t-0 md:border-l border-border/40 p-6 flex flex-col gap-3 min-w-[240px]">
                                {/* Feedback form */}
                                <form action={async (formData: FormData) => {
                                    'use server'
                                    const feedback = formData.get('feedback') as string
                                    const res = await reviewSubmission(sub.id, 'reviewed', undefined, feedback)
                                    if (res?.error) throw new Error(res.error)
                                }} className="space-y-2">
                                    <label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                                        <MessageSquare className="w-3 h-3" />
                                        Feedback for student
                                    </label>
                                    <Textarea
                                        name="feedback"
                                        placeholder="What should they improve?"
                                        defaultValue={(sub as any).feedback || ''}
                                        disabled={sub.status === 'approved'}
                                        className="text-xs min-h-[80px] resize-none"
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        disabled={sub.status === 'approved'}
                                    >
                                        Save Feedback
                                    </Button>
                                </form>
                                {/* Approve form */}
                                <form action={async (formData: FormData) => {
                                    'use server'
                                    const feedback = formData.get('feedback') as string
                                    const res = await reviewSubmission(sub.id, 'approved', undefined, feedback || undefined)
                                    if (res?.error) throw new Error(res.error)
                                }}>
                                    <input type="hidden" name="feedback" value={(sub as any).feedback || ''} />
                                    <Button
                                        type="submit"
                                        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white border-0"
                                        disabled={sub.status === 'approved'}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve Project
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </Card>
                ))}

                {(!submissions || submissions.length === 0) && (
                    <Card className="border-border/40 border-dashed bg-transparent py-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-2">
                            <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                            <p className="text-muted-foreground text-sm">No project submissions yet.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
