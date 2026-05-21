'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, Palette, PenTool, Search, Briefcase, DollarSign, Sparkles } from 'lucide-react'

const INNOVATION_HUBS = [
    'Bulawayo Hub',
    'Harare Hub',
    'Mutare Hub',
    'Gweru Hub',
    'Chinhoyi Hub',
]

const SKILL_QUESTIONS = [
    {
        id: 'figma',
        question: 'How familiar are you with Figma?',
        options: [
            { text: "Never heard of it", score: 0 },
            { text: "Seen it but never used", score: 1 },
            { text: "Can do basic layouts", score: 2 },
            { text: "Comfortable with components & auto-layout", score: 3 },
            { text: "Advanced: variables, prototyping, teams", score: 4 },
        ]
    },
    {
        id: 'ui_experience',
        question: 'Have you ever designed a user interface?',
        options: [
            { text: "No, never", score: 0 },
            { text: "A few simple sketches", score: 1 },
            { text: "Digital designs for personal projects", score: 2 },
            { text: "Designed for work or clients", score: 3 },
            { text: "Professional UI designer", score: 4 },
        ]
    },
    {
        id: 'persona',
        question: 'What is a user persona?',
        options: [
            { text: "No idea", score: 0 },
            { text: "Heard the term but can't explain", score: 1 },
            { text: "Know it's a fictional user representation", score: 2 },
            { text: "Can create and use personas in projects", score: 3 },
            { text: "Expert: can teach others", score: 4 },
        ]
    },
    {
        id: 'research',
        question: 'Have you conducted user research?',
        options: [
            { text: "No", score: 0 },
            { text: "Informal conversations with friends", score: 1 },
            { text: "Conducted 1-2 user interviews", score: 2 },
            { text: "Regularly run usability tests", score: 3 },
            { text: "Expert in research methods", score: 4 },
        ]
    },
    {
        id: 'process',
        question: 'How do you approach design problems?',
        options: [
            { text: "Just start designing", score: 0 },
            { text: "Look at what others have done", score: 1 },
            { text: "Follow a basic process (sketch, design, test)", score: 2 },
            { text: "Use research and iteration", score: 3 },
            { text: "Full design thinking process", score: 4 },
        ]
    },
]

const LEARNING_GOALS = [
    { id: 'ui_fundamentals', label: 'Master UI Basics', description: 'Learn core principles of visual design', icon: Palette },
    { id: 'figma_pro', label: 'Become Figma Pro', description: 'Master Figma from basics to advanced', icon: PenTool },
    { id: 'ux_research', label: 'UX Research Skills', description: 'Learn user research and testing', icon: Search },
    { id: 'portfolio_ready', label: 'Build Portfolio', description: 'Create case studies for job applications', icon: Briefcase },
    { id: 'freelance', label: 'Freelance Ready', description: 'Learn to find and retain clients', icon: DollarSign },
]

function calculateSkillLevel(answers: Record<string, number>): { level: string; path: string } {
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0)
    const maxScore = SKILL_QUESTIONS.length * 4
    
    const percentage = (totalScore / maxScore) * 100
    
    if (percentage < 20) {
        return { level: 'beginner', path: 'crash-course' }
    } else if (percentage < 50) {
        return { level: 'intermediate', path: 'crash-course' }
    } else if (percentage < 80) {
        return { level: 'advanced', path: 'specialization-1' }
    } else {
        return { level: 'advanced', path: 'specialization-2' }
    }
}

export default function OnboardingForm({ userId, initialName }: { userId: string, initialName?: string }) {
    const router = useRouter()
    const supabase = createClient()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: initialName || '',
        gender: '',
        age: '',
        innovation_hub: '',
        skillAnswers: {} as Record<string, number>,
        selectedGoals: [] as string[],
    })

    const totalSteps = 5

    const handleNext = () => {
        if (step === 1 && !formData.full_name) {
            toast.error('Please enter your name')
            return
        }
        if (step === 2 && (!formData.gender || !formData.age)) {
            toast.error('Please fill in all fields')
            return
        }
        if (step === 4 && Object.keys(formData.skillAnswers).length < SKILL_QUESTIONS.length) {
            toast.error('Please answer all questions')
            return
        }
        if (step === 5 && formData.selectedGoals.length === 0) {
            toast.error('Please select at least one goal')
            return
        }
        setStep(step + 1)
    }

    const handleBack = () => {
        setStep(step - 1)
    }

    const handleGoalToggle = (goalId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedGoals: prev.selectedGoals.includes(goalId)
                ? prev.selectedGoals.filter(id => id !== goalId)
                : [...prev.selectedGoals, goalId]
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const { level, path } = calculateSkillLevel(formData.skillAnswers)

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: formData.full_name,
                    gender: formData.gender,
                    age: parseInt(formData.age),
                    innovation_hub: formData.innovation_hub,
                    onboarding_completed: true,
                    skill_level: level,
                    recommended_path: path,
                    learning_goals: formData.selectedGoals,
                }, { onConflict: 'id' })

            if (error) throw error

            toast.success('Onboarding completed!')
            router.push('/dashboard')
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Something went wrong'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    const getStepTitle = () => {
        switch(step) {
            case 1: return "Welcome! What's your name?"
            case 2: return "Tell us a bit about yourself"
            case 3: return "Join your local community"
            case 4: return "Assess your current skills"
            case 5: return "What do you want to achieve?"
            default: return ''
        }
    }

    const getStepDescription = () => {
        switch(step) {
            case 1: return "Start by letting us know how people should address you."
            case 2: return "This helps us personalize your learning experience."
            case 3: return "Select the innovation hub you'll be learning from."
            case 4: return "Answer these 5 questions to help us recommend the right path."
            case 5: return "Select your goals - you can always explore more later."
            default: return ''
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex gap-1">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-primary' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
                    {getStepTitle()}
                </CardTitle>
                <CardDescription>
                    {getStepDescription()}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Step 1: Name */}
                {step === 1 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                            id="full_name"
                            placeholder="e.g. John Doe"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                )}

                {/* Step 2: Demographics */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-3">
                            <Label>Gender</Label>
                            <RadioGroup
                                value={formData.gender}
                                onValueChange={(val: string) => setFormData({ ...formData, gender: val })}
                                className="grid grid-cols-2 gap-4"
                            >
                                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option} id={option} />
                                        <Label htmlFor={option} className="cursor-pointer">{option}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input
                                id="age"
                                type="number"
                                placeholder="How old are you?"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                )}

                {/* Step 3: Hub Selection */}
                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <Label htmlFor="hub">Innovation Hub</Label>
                        <Select
                            value={formData.innovation_hub}
                            onValueChange={(val: string) => setFormData({ ...formData, innovation_hub: val })}
                        >
                            <SelectTrigger className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/20">
                                <SelectValue placeholder="Select a hub" />
                            </SelectTrigger>
                            <SelectContent>
                                {INNOVATION_HUBS.map((hub) => (
                                    <SelectItem key={hub} value={hub}>{hub}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Step 4: Skill Assessment */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 max-h-[400px] overflow-y-auto pr-2">
                        {SKILL_QUESTIONS.map((q, idx) => (
                            <div key={q.id} className="space-y-3">
                                <Label className="text-sm font-medium">{idx + 1}. {q.question}</Label>
                                <RadioGroup
                                    value={formData.skillAnswers[q.id]?.toString() || ''}
                                    onValueChange={(val: string) => setFormData({
                                        ...formData,
                                        skillAnswers: { ...formData.skillAnswers, [q.id]: parseInt(val) }
                                    })}
                                    className="grid grid-cols-1 gap-2"
                                >
                                    {q.options.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value={optIdx.toString()} id={`${q.id}-${optIdx}`} />
                                            <Label htmlFor={`${q.id}-${optIdx}`} className="cursor-pointer text-sm text-muted-foreground">{opt.text}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        ))}
                    </div>
                )}

                {/* Step 5: Learning Goals */}
                {step === 5 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                            <Sparkles className="w-4 h-4" />
                            <span>Select all that apply</span>
                        </div>
                        {LEARNING_GOALS.map((goal) => {
                            const Icon = goal.icon
                            const isSelected = formData.selectedGoals.includes(goal.id)
                            return (
                                <div
                                    key={goal.id}
                                    onClick={() => handleGoalToggle(goal.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{goal.label}</div>
                                            <div className="text-sm text-muted-foreground">{goal.description}</div>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack} disabled={loading} className="px-8">
                        Back
                    </Button>
                ) : (
                    <div />
                )}

                {step < totalSteps ? (
                    <Button onClick={handleNext} className="px-8 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black">
                        Continue
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="px-8 bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-black">
                        {loading ? 'Setting up...' : 'Start Learning'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
