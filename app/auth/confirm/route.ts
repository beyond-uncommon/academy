import { createServerClient } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function getErrorReason(message: string): string {
    if (message.includes('expired')) return 'link_expired'
    if (message.includes('Already') || message.includes('already')) return 'already_confirmed'
    return 'invalid_link'
}

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/dashboard'

    if (!token_hash || !type) {
        return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
    }

    // Create supabase client directly so we can capture the response cookies
    let redirectResponse: NextResponse | null = null

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    redirectResponse = NextResponse.redirect(new URL(next, origin))
                    cookiesToSet.forEach(({ name, value, options }) =>
                        redirectResponse!.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
    })

    if (error) {
        console.error('OTP verification failed:', error.message)
        return NextResponse.redirect(new URL(`/login?error=${getErrorReason(error.message)}`, origin))
    }

    // If setAll was called, the cookies are on redirectResponse
    if (redirectResponse) {
        // Ensure profile exists (handles edge case where DB trigger didn't fire)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const admin = createAdminClient()
            const { data: profile } = await admin
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()

            if (!profile) {
                await admin.from('profiles').insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name ?? null,
                    role: 'learner',
                })
            }
        }
        return redirectResponse
    }

    return NextResponse.redirect(new URL(next, origin))
}
