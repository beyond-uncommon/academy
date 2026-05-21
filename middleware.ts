import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    try {
        return await updateSession(request)
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        console.error('Middleware crash:', e)
        return new NextResponse(`Middleware crashed: ${message}`, { status: 500 })
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico / public assets
         * - api routes handled separately
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
