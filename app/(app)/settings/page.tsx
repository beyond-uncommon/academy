import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './components/SettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch current profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, bio, avatar_url')
        .eq('id', user.id)
        .single()

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
            </div>

            <SettingsForm userId={user.id} initialData={profile || { full_name: '', username: '', bio: '', avatar_url: '' }} />
        </div>
    )
}
