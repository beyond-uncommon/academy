import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, MessageSquare, Zap, Trophy, Users, Shield, FileQuestion } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Help & FAQ' }

const faqs = [
    {
        q: 'How does the skill tree work?',
        a: 'The skill tree represents your learning journey. Each node is a module containing lessons. Complete all lessons in a module to unlock the next. Modules must be completed before you can take the module assessment.',
        icon: BookOpen,
    },
    {
        q: 'How do I earn XP?',
        a: 'You earn XP by completing lessons, passing quizzes and assessments, submitting projects, and maintaining your learning streak. Different activities award different amounts of XP.',
        icon: Zap,
    },
    {
        q: 'What are streaks?',
        a: 'Your streak counts consecutive days you complete at least one lesson. Longer streaks unlock bonus XP. If you miss a day, your streak resets. Check back daily to keep it alive!',
        icon: Trophy,
    },
    {
        q: 'How do assessments work?',
        a: 'Module assessments test your understanding of all lessons in a module. You need to complete all lessons before attempting the assessment. A passing score (typically 80%) is required to proceed. You can retake assessments if needed.',
        icon: FileQuestion,
    },
    {
        q: 'Can I retake a quiz or assessment?',
        a: 'Yes. Each assessment has a maximum number of attempts (usually 3). Your best score is recorded. If you pass, you cannot retake it.',
        icon: MessageSquare,
    },
    {
        q: 'How does the community work?',
        a: 'The community page lets you share project submissions, start discussions, ask questions, and share tips. You can like and comment on posts and submissions. Engaging with peers helps you learn and can earn you badges.',
        icon: Users,
    },
    {
        q: 'What are badges?',
        a: 'Badges are achievements you earn by completing specific milestones — like finishing your first lesson, maintaining a 7-day streak, or getting a perfect score on an assessment. Each badge has a rarity level from Common to Legendary.',
        icon: Trophy,
    },
    {
        q: 'How do I reset my password?',
        a: 'Go to the login page and click "Forgot password". Enter your email address and follow the reset link sent to your inbox.',
        icon: Shield,
    },
    {
        q: 'How do I update my profile?',
        a: 'Go to Settings from the sidebar. You can update your name, avatar, bio, and other personal details. Changes are saved automatically.',
        icon: Shield,
    },
    {
        q: 'What happens when I complete a course?',
        a: 'When you complete all modules and pass the course assessment, you earn a certificate and a badge. Your rank and XP are updated, and the course is marked as complete on your profile.',
        icon: Trophy,
    },
]

export default function HelpPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Help & FAQ</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Frequently asked questions about using the Academy platform.
                </p>
            </div>

            <div className="space-y-4">
                {faqs.map((faq, i) => {
                    const Icon = faq.icon
                    return (
                        <Card key={i} className="border-border/40">
                            <CardHeader className="pb-2">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded bg-secondary/20 flex items-center justify-center shrink-0">
                                        <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <CardTitle className="text-sm font-medium pt-1">{faq.q}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-1 pl-14">
                                <p className="text-sm text-muted-foreground">{faq.a}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
