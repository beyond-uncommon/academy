import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsClient } from './EventsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Events' }

export default async function AdminEventsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/admin')

    const { data: events } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

    return <EventsClient events={events ?? []} />
}
