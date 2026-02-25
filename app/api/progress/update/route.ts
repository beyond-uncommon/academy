import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    // TODO Week 2: implement full progress update + skill tree calculation
    const { userId, lessonId } = await request.json()

    if (!userId || !lessonId) {
        return NextResponse.json({ error: 'Missing userId or lessonId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('user_progress')
        .upsert(
            {
                user_id: userId,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,lesson_id' }
        )

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId, lessonId })
}
