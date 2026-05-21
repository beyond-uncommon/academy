import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('id', user.id)
        .single()

    if (profile?.onboarding_completed) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-zinc-50 to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl backdrop-blur-sm shadow-2xl">
                <div className="hidden md:block space-y-6">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
                        Your journey starts here.
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                        Welcome to the Academy. We&apos;re excited to help you grow your skills and connect with a local innovation community.
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium text-zinc-400 italic">
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                        Complete these quick steps to get started
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                </div>
                <OnboardingForm userId={user.id} initialName={profile?.full_name || ''} />
            </div>
        </div>
    )
}
