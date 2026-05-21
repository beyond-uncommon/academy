import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, User, SearchIcon, ArrowRight } from 'lucide-react'
import { searchAll } from '@/lib/search'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const results = q ? await searchAll(q) : null

    const totalResults = results
        ? results.courses.length + results.lessons.length + results.profiles.length
        : 0

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Search</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Find courses, lessons, and people.
                </p>
            </div>

            <form className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    name="q"
                    defaultValue={q || ''}
                    placeholder="Search courses, lessons, people..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                />
            </form>

            {q && (
                <p className="text-sm text-muted-foreground">
                    {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
                </p>
            )}

            {results && totalResults === 0 && (
                <Card className="border-border/40 bg-secondary/5">
                    <CardContent className="p-12 text-center">
                        <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Try a different search term.
                        </p>
                    </CardContent>
                </Card>
            )}

            {results && results.courses.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Courses
                    </h2>
                    {results.courses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.slug}`}>
                            <Card className="border-border/40 hover:border-border/80 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{course.title}</p>
                                        {course.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="capitalize text-[10px]">
                                        {course.type?.replace('_', ' ')}
                                    </Badge>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </section>
            )}

            {results && results.lessons.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Lessons
                    </h2>
                    {results.lessons.map((lesson) => (
                        <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                            <Card className="border-border/40 hover:border-border/80 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{lesson.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {lesson.course_title} &middot; {lesson.module_title}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-[10px]">{lesson.type}</Badge>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </section>
            )}

            {results && results.profiles.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" />
                        People
                    </h2>
                    {results.profiles.map((profile) => (
                        <Link key={profile.id} href={`/profile/${profile.id}`}>
                            <Card className="border-border/40 hover:border-border/80 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                            {profile.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium">{profile.full_name || 'Anonymous'}</p>
                                            {profile.bio && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">{profile.bio}</p>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </section>
            )}

            {!q && (
                <Card className="border-border/40 bg-secondary/5">
                    <CardContent className="p-12 text-center">
                        <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Type a query above to search courses, lessons, and people.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
