import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/demo']

const appRoutes = [
    '/dashboard', '/lesson', '/profile', '/admin', '/courses', '/leaderboard',
    '/community', '/settings', '/assessments', '/badges', '/projects', '/resources',
    '/career', '/analytics', '/notifications', '/events', '/help', '/search',
    '/module', '/portfolio',
]

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

    const { data: { user } } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const isAuthRoute = authRoutes.some((r) => url.pathname.startsWith(r))
    const isAppRoute = appRoutes.some((r) => url.pathname.startsWith(r))

    // Redirect logged-in users away from auth pages
    if (user && isAuthRoute) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Redirect unauthenticated users to login
    if (!user && isAppRoute) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Check onboarding for logged-in users on app routes
    if (user && !url.pathname.startsWith('/onboarding') && !url.pathname.startsWith('/auth')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .maybeSingle()

        if (profile && !profile.onboarding_completed) {
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
