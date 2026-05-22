import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuizQuestionEditor } from './components/QuizQuestionEditor'

export default async function QuizEditorPage({ params }: { params: Promise<{ id: string }> }) {
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

    const { data: quiz } = await supabase
        .from('quizzes')
        .select('*, questions:quiz_questions(*)')
        .eq('id', id)
        .order('questions.order_index', { ascending: true })
        .single()

    if (!quiz) return <div className="text-center py-12 text-muted-foreground">Quiz not found.</div>

    // Fetch modules for the quiz's course for the week selector
    const { data: modules } = await supabase
        .from('modules')
        .select('id, title, order_index')
        .eq('course_id', quiz.course_id)
        .order('order_index', { ascending: true })

    const questions = (quiz.questions || []) as Array<{
        id: string
        quiz_id: string
        question: string
        options: { text: string; is_correct: boolean }[]
        explanation: string | null
        order_index: number
        is_draft: boolean
        generated_by: string | null
    }>

    const publishedCount = questions.filter((q) => !q.is_draft).length
    const draftCount = questions.filter((q) => q.is_draft).length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/admin/assessments">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{quiz.title}</h1>
                            {quiz.is_published ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {quiz.type} &middot; {questions.length} question{questions.length !== 1 ? 's' : ''}
                            {draftCount > 0 && (
                                <span className="text-yellow-500"> &middot; {draftCount} draft</span>
                            )}
                            <span className="text-green-500"> &middot; {publishedCount} published</span>
                            &middot; Pass: {quiz.passing_score_pct}% &middot; {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No time limit'}
                        </p>
                    </div>
                </div>
            </div>

            <QuizQuestionEditor quizId={id} questions={questions} modules={modules || []} />
        </div>
    )
}
