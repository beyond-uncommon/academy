import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { PWAProvider } from '@/components/PWAProvider'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  title: {
    default: 'Academy – Product Design Learning',
    template: '%s | Academy',
  },
  description:
    'Gamified product design education. Learn UX/UI, earn XP, unlock badges, and build a career-ready portfolio.',
  keywords: ['product design', 'UX', 'UI', 'learning', 'courses', 'gamification'],
  openGraph: {
    title: 'Academy – Product Design Learning',
    description: 'Gamified product design education with XP, badges, and skill trees.',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Academy',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium">
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PWAProvider>
            {children}
            <OfflineIndicator />
            <Toaster richColors position="bottom-right" />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
