import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=oauth_error', origin))
    }

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
                    redirectResponse = NextResponse.redirect(new URL('/dashboard', origin))
                    cookiesToSet.forEach(({ name, value, options }) =>
                        redirectResponse!.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        console.error('OAuth callback error:', error.message)
        return NextResponse.redirect(new URL('/login?error=oauth_error', origin))
    }

    if (redirectResponse) {
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

    return NextResponse.redirect(new URL('/dashboard', origin))
}
