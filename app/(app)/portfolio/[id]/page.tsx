import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Trophy, BookOpen, Zap, Briefcase, MapPin, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', id).maybeSingle()
    return { title: `${profile?.full_name || 'Student'}'s Portfolio` } satisfies Metadata
}

export default async function PortfolioPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const [{ data: profile }, { data: xp }, { data: badges }, { data: submissions }, { count: lessonsCount }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('user_xp').select('total_xp, rank').eq('user_id', id).maybeSingle(),
        supabase.from('user_badges').select('badge:badges(name, icon_url, rarity)').eq('user_id', id),
        supabase
            .from('project_submissions')
            .select('*, lesson:lessons(title, type, module:modules(title, course:courses(title)))')
            .eq('user_id', id)
            .eq('status', 'approved')
            .order('submitted_at', { ascending: false }),
        supabase
            .from('user_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', id)
            .eq('completed', true),
    ])

    if (!profile) notFound()

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link href="/community" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Back to Community
            </Link>
            {/* Profile header */}
            <Card className="border-border/40">
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <Avatar className="w-24 h-24 border-2 border-border/60">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-2xl">{profile.full_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                            <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous'}</h1>
                            {profile.bio && <p className="text-sm text-muted-foreground max-w-lg">{profile.bio}</p>}
                            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
                                {profile.innovation_hub && (
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.innovation_hub}</span>
                                )}
                                {xp && (
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" />{xp.total_xp} XP</span>
                                )}
                                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{lessonsCount || 0} lessons completed</span>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-2">
                                {(badges || []).slice(0, 6).map((ub: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                                        {ub.badge?.icon_url || '🏅'}{ub.badge?.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Approved submissions */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Portfolio Projects
                </h2>
                {!submissions || submissions.length === 0 ? (
                    <Card className="border-border/40">
                        <CardContent className="p-12 text-center">
                            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="font-medium">No projects yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Projects will appear here once submitted and approved.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submissions.map((sub) => {
                            const lesson = sub.lesson as any
                            return (
                                <Card key={sub.id} className="border-border/40">
                                    <CardContent className="p-5">
                                        <div className="space-y-2">
                                            <div>
                                                <p className="font-medium text-sm">{lesson?.title || 'Project'}</p>
                                                {lesson?.module && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {lesson.module.course?.title} · {lesson.module.title}
                                                    </p>
                                                )}
                                            </div>
                                            {sub.submission_url && (
                                                <a href={sub.submission_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="gap-2 w-full">
                                                        <ExternalLink className="w-3 h-3" /> View Project
                                                    </Button>
                                                </a>
                                            )}
                                            {sub.notes && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">{sub.notes}</p>
                                            )}
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                                <span>{new Date(sub.submitted_at).toLocaleDateString()}</span>
                                                {sub.score && <Badge variant="outline" className="text-[10px]">Score: {sub.score}%</Badge>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
