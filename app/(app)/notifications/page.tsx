import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, BellDot, CheckCheck, Clock, ExternalLink, Zap, Trophy, MessageSquare, Award, AlertTriangle, GraduationCap, BookOpen, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications' }

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    lesson_completed: { label: 'Lesson Completed', icon: BookOpen, color: 'text-blue-500' },
    quiz_passed: { label: 'Quiz Passed', icon: Zap, color: 'text-yellow-500' },
    quiz_failed: { label: 'Quiz Failed', icon: AlertTriangle, color: 'text-red-500' },
    project_approved: { label: 'Project Approved', icon: Trophy, color: 'text-green-500' },
    project_reviewed: { label: 'Project Reviewed', icon: MessageSquare, color: 'text-purple-500' },
    badge_earned: { label: 'Badge Earned', icon: Award, color: 'text-amber-500' },
    streak_at_risk: { label: 'Streak at Risk', icon: AlertTriangle, color: 'text-orange-500' },
    module_unlocked: { label: 'Module Unlocked', icon: GraduationCap, color: 'text-cyan-500' },
    course_completed: { label: 'Course Completed', icon: Trophy, color: 'text-yellow-500' },
    assessment_ready: { label: 'Assessment Ready', icon: Zap, color: 'text-primary' },
    xp_milestone: { label: 'XP Milestone', icon: Sparkles, color: 'text-yellow-500' },
    peer_feedback: { label: 'Peer Feedback', icon: MessageSquare, color: 'text-blue-500' },
    admin_message: { label: 'Announcement', icon: Bell, color: 'text-primary' },
}

async function markAsRead(formData: FormData) {
    'use server'
    const notificationId = formData.get('id') as string
    if (!notificationId) return
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', user.id)
}

async function markAllAsRead() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
}

export default async function NotificationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
        supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
        supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false),
    ])

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {unreadCount || 0} unread notification{(unreadCount || 0) !== 1 ? 's' : ''}
                    </p>
                </div>
                {(unreadCount || 0) > 0 && (
                    <form action={markAllAsRead}>
                        <Button type="submit" variant="outline" size="sm" className="gap-2">
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all as read
                        </Button>
                    </form>
                )}
            </div>

            {!notifications || notifications.length === 0 ? (
                <Card className="border-border/40">
                    <CardContent className="p-12 text-center">
                        <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium">All clear</p>
                        <p className="text-sm text-muted-foreground mt-1">No notifications yet. Keep learning!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => {
                        const cfg = typeConfig[n.type] || { label: n.type, icon: Bell, color: 'text-muted-foreground' }
                        const Icon = cfg.icon
                        return (
                            <form key={n.id} action={markAsRead} className="contents">
                                <input type="hidden" name="id" value={n.id} />
                                <button type="submit" className="w-full text-left block">
                                    <Card className={`border-border/40 hover:border-border/80 transition-all ${!n.is_read ? 'bg-primary/5 border-primary/20' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 ${!n.is_read ? 'ring-1 ring-primary/30' : ''}`}>
                                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-medium">{n.title}</p>
                                                            {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary" />}
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {timeAgo(n.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {n.link && (
                                                        <Link href={n.link} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5">
                                                            View details <ExternalLink className="w-3 h-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </button>
                            </form>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString()
}
