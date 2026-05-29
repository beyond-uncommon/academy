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

export async function addHub(_prevState: unknown, formData: FormData) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const name = (formData.get('name') as string)?.trim()
    if (!name) return { error: 'Hub name is required' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('innovation_hubs').insert({ name })
    if (error) return { error: error.message }

    revalidatePath('/admin/hubs')
    return { success: true }
}

export async function updateHub(_prevState: unknown, formData: FormData) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const name = (formData.get('name') as string)?.trim()
    if (!id || !name) return { error: 'Missing fields' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('innovation_hubs').update({ name }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/hubs')
    return { success: true }
}

export async function toggleHub(id: string, active: boolean) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('innovation_hubs').update({ active }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/hubs')
    return { success: true }
}

export async function deleteHub(id: string) {
    const admin = await assertAdmin()
    if (!admin) return { error: 'Unauthorized' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('innovation_hubs').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/hubs')
    return { success: true }
}
