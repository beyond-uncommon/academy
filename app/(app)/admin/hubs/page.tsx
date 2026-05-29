import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HubsClient } from './HubsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Innovation Hubs' }

export default async function HubsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/admin')

    const { data: hubs } = await supabase
        .from('innovation_hubs')
        .select('id, name, active')
        .order('name')

    return <HubsClient hubs={hubs ?? []} />
}
