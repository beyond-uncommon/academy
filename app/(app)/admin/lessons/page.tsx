import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { toggleLessonStatus } from '../actions'
import { CreateLessonDialog } from './components/CreateLessonDialog'

export default async function AdminLessonsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/dashboard')

    const { data: lessons } = await supabase
        .from('lessons')
        .select(`
            *,
            module:modules(title)
        `)
        .order('order_index', { ascending: true })

    const { data: modules } = await supabase.from('modules').select('id, title')

    return (
        <div className="space-y-6">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Staff Panel
            </Link>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Manage Content</h1>
                    <p className="text-muted-foreground text-sm">Create and publish lessons for your students.</p>
                </div>
                <CreateLessonDialog modules={modules || []} />
            </div>

            <Card className="border-border/40">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b border-border/40">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Module</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {lessons?.map((lesson) => (
                                    <tr key={lesson.id} className="border-b border-border/40 transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{lesson.title}</td>
                                        <td className="p-4 align-middle text-muted-foreground">{(lesson.module as { title: string } | null)?.title}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant="secondary" className="capitalize">{lesson.type}</Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            {lesson.is_published ? (
                                                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Published</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            <form action={async () => {
                                                'use server'
                                                const res = await toggleLessonStatus(lesson.id, !lesson.is_published)
                                                if (res?.error) throw new Error(res.error)
                                            }}>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    {lesson.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    {lesson.is_published ? 'Unpublish' : 'Publish'}
                                                </Button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                                {(!lessons || lessons.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No lessons created yet.
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
