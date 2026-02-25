import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

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
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session — do not remove or it could cause random logged-out states
    const { data: { user } } = await supabase.auth.getUser()

    // Protect app routes
    const url = request.nextUrl.clone()
    const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/signup')
    const isAppRoute =
        url.pathname.startsWith('/dashboard') ||
        url.pathname.startsWith('/lesson') ||
        url.pathname.startsWith('/profile') ||
        url.pathname.startsWith('/admin') ||
        url.pathname.startsWith('/courses') ||
        url.pathname.startsWith('/leaderboard') ||
        url.pathname.startsWith('/community') ||
        url.pathname.startsWith('/settings')

    if (!user && isAppRoute) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
