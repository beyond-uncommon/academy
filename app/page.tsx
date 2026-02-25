import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Zap, Trophy, Star, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Earn XP',
    description: 'Complete lessons and quizzes to earn experience points and level up.',
  },
  {
    icon: Trophy,
    title: 'Unlock Badges',
    description: 'Achieve milestones and collect rare badges to show off your progress.',
  },
  {
    icon: Star,
    title: 'Skill Tree',
    description: 'Visualise your learning path and unlock new skills step by step.',
  },
  {
    icon: BookOpen,
    title: 'Real Projects',
    description: 'Submit portfolio-ready projects and get scored on actual design work.',
  },
]

const highlights = [
  '20 lessons + 2 projects in the Crash Course',
  '24 lessons + 3 projects in Specialist Phase 1',
  'XP, streaks, ranks & badges',
  'Figma-focused curriculum',
  'Portfolio case study included',
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Academy <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/demo">
              <Button variant="ghost" size="sm">Live demo</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <Badge variant="outline" className="mb-6 text-sm px-4 py-1">
          🚀 Now in Beta · Product Design Path
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-neutral-400 bg-clip-text text-transparent">
          Learn Product Design.<br />Level up every day.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          The gamified platform that turns UX/UI education into an addictive daily habit.
          Earn XP, unlock badges, track your skill tree — all while building a real portfolio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2 text-base px-8">
              Start for free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-base px-8">
              Live demo
            </Button>
          </Link>
        </div>
      </section>

      {/* What's included */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Everything you need to go from zero to hired</h2>
            <p className="text-muted-foreground mb-6">
              Two structured paths — a 4-week Crash Course and a 6-week Specialization — built around
              the skills hiring managers actually want.
            </p>
            <ul className="space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="border-border/40 bg-card/50">
                <CardHeader className="pb-2">
                  <f.icon className="w-5 h-5 text-primary mb-1" />
                  <CardTitle className="text-sm font-semibold">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <Card className="border-border/40 bg-gradient-to-br from-primary/10 to-background p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to start your design journey?</h2>
          <p className="text-muted-foreground mb-8">
            Join the beta and be among the first to experience the future of design education.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 px-10 text-base">
              Join the beta <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Academy. Built for the next generation of designers.
      </footer>
    </main>
  )
}
