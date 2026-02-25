import { loginAsDemo } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Trophy, BookOpen, Star } from 'lucide-react'
import Link from 'next/link'

const highlights = [
    { icon: BookOpen, label: '22 lessons across 4 modules' },
    { icon: Zap, label: 'XP, streaks & rank system' },
    { icon: Trophy, label: 'Badges & project submissions' },
    { icon: Star, label: 'Leaderboard & community feed' },
]

export default function DemoPage() {
    return (
        <Card className="border-border/40">
            <CardHeader className="text-center">
                <Badge variant="secondary" className="mx-auto mb-2 w-fit">Demo mode</Badge>
                <CardTitle>Explore the platform</CardTitle>
                <CardDescription>
                    Try everything as a pre-loaded learner — no sign up needed.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <ul className="space-y-2.5">
                    {highlights.map(({ icon: Icon, label }) => (
                        <li key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            {label}
                        </li>
                    ))}
                </ul>

                <form action={loginAsDemo}>
                    <Button type="submit" className="w-full">
                        Enter demo
                    </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground">
                    Want your own account?{' '}
                    <Link href="/signup" className="text-foreground font-medium hover:underline">
                        Sign up free
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}
