'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'admin' ? user : null
}

export async function getEvents() {
    const admin = await assertAdmin()
    if (!admin) return []

    const supabase = createAdminClient()
    const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true, nullsFirst: false })
    return data ?? []
}

export async function createEvent(_prevState: unknown, formData: FormData) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const title = (formData.get('title') as string)?.trim()
    if (!title) return { error: 'Title is required' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('events').insert({
        title,
        description: (formData.get('description') as string)?.trim() || null,
        event_date: (formData.get('event_date') as string) || null,
        event_time: (formData.get('event_time') as string) || null,
        event_type: (formData.get('event_type') as string) || 'other',
        is_recurring: formData.get('is_recurring') === 'on',
        registration_url: (formData.get('registration_url') as string)?.trim() || null,
        created_by: admin.id,
    })

    if (error) return { error: error.message }

    revalidatePath('/admin/events')
    revalidatePath('/events')
    return { success: true }
}

export async function updateEvent(_prevState: unknown, formData: FormData) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    if (!id) return { error: 'Event ID is required' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('events').update({
        title: (formData.get('title') as string)?.trim(),
        description: (formData.get('description') as string)?.trim() || null,
        event_date: (formData.get('event_date') as string) || null,
        event_time: (formData.get('event_time') as string) || null,
        event_type: (formData.get('event_type') as string) || 'other',
        is_recurring: formData.get('is_recurring') === 'on',
        registration_url: (formData.get('registration_url') as string)?.trim() || null,
    }).eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/events')
    revalidatePath('/events')
    return { success: true }
}

export async function toggleEventPublish(id: string, isPublished: boolean) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('events').update({ is_published: isPublished }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/events')
    revalidatePath('/events')
    return { success: true }
}

export async function deleteEvent(id: string) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/events')
    revalidatePath('/events')
    return { success: true }
}
