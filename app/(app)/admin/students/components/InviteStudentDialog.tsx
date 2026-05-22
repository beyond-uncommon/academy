'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react'
import { inviteStudent } from '../../actions'
import { useRouter } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {pending ? 'Creating account...' : 'Invite Student'}
        </Button>
    )
}

export function InviteStudentDialog() {
    const [open, setOpen] = useState(false)
    const [state, formAction] = useActionState(inviteStudent, null)
    const router = useRouter()

    useEffect(() => {
        if (state?.error) toast.error(state.error)
        if (state?.success) {
            toast.success('Student invited!')
            setOpen(false)
            router.refresh()
        }
    }, [state, router])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Invite a Student</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" placeholder="Student name" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="student@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Temporary Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="At least 8 characters"
                            required
                            minLength={8}
                        />
                        <p className="text-xs text-muted-foreground">Student can change this after first login.</p>
                    </div>
                    <SubmitButton />
                </form>
            </DialogContent>
        </Dialog>
    )
}
