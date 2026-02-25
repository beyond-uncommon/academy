import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    // TODO Week 2: implement full XP award logic
    const { userId, xpAmount, source } = await request.json()

    if (!userId || !xpAmount) {
        return NextResponse.json({ error: 'Missing userId or xpAmount' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_xp: xpAmount,
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId, xpAmount, source })
}
