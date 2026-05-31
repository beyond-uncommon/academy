import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Events' }

export default async function EventsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: milestones } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: true, nullsFirst: false })

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Events & Milestones</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Upcoming workshops, AMAs, and your recent activity milestones.
                </p>
            </div>

            {/* Upcoming events */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Upcoming Events
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(events ?? []).map((event) => (
                        <Card key={event.id} className="border-border/40">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-3">
                                    <CardTitle className="text-sm">{event.title}</CardTitle>
                                    <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                                        {event.event_type === 'workshop' ? 'Workshop' : event.event_type === 'ama' ? 'AMA' : event.event_type === 'social' ? 'Social' : 'Event'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">{event.description}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {event.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.event_date}</span>}
                                    {event.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.event_time}</span>}
                                    {event.is_recurring && <Badge variant="outline" className="text-[9px]">Recurring</Badge>}
                                </div>
                                {event.registration_url ? (
                                    <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="block">
                                        <Button variant="outline" size="sm" className="gap-2 w-full text-xs">
                                            <ExternalLink className="w-3 h-3" /> Register
                                        </Button>
                                    </a>
                                ) : (
                                    <Button variant="outline" size="sm" className="gap-2 w-full text-xs" disabled>
                                        <ExternalLink className="w-3 h-3" /> Notify Me
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">More events are added as the program progresses.</p>
            </div>

            {/* Recent milestones */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Recent Milestones
                </h2>
                {!milestones || milestones.length === 0 ? (
                    <Card className="border-border/40">
                        <CardContent className="p-8 text-center">
                            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-medium">No milestones yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Complete lessons and activities to see your milestones here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {milestones.map((m: { id: string; event_type: string; created_at: string }) => (
                            <Card key={m.id} className="border-border/40">
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{m.event_type}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
