import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
