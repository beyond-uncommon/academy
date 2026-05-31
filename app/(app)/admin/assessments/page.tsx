import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, ClipboardCheck, Pencil, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

const assessmentTypeLabel: Record<string, string> = {
    lesson: 'Lesson',
    module: 'Module',
    course: 'Course',
    standalone: 'Standalone',
}

export default async function AdminAssessmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

    const { data: assessments } = await supabase
        .from('quizzes')
        .select(`
            *,
            questions:quiz_questions(count)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Staff Panel
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Manage Assessments</h1>
                <p className="text-muted-foreground text-sm">View and manage all assessments across the platform.</p>
            </div>

            <Card className="border-border/40">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b border-border/40">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Questions</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time Limit</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Pass %</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Max Attempts</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {assessments?.map((a: any) => (
                                    <tr key={a.id} className="border-b border-border/40 transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{a.title}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant="secondary" className="text-xs">
                                                {assessmentTypeLabel[a.type] || a.type}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">
                                            {a.questions?.[0]?.count || 0}
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">
                                            {a.time_limit_minutes ? `${a.time_limit_minutes} min` : 'Unlimited'}
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">
                                            {a.passing_score_pct}%
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">
                                            {a.max_attempts || 'Unlimited'}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Badge
                                                className={a.is_published
                                                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20'}
                                            >
                                                {a.is_published ? 'Published' : 'Draft'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/admin/quizzes/${a.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Link href={`/assessments/${a.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1">
                                                        <ClipboardCheck className="w-3.5 h-3.5" />
                                                        Preview
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!assessments || assessments.length === 0) && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            No assessments created yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
