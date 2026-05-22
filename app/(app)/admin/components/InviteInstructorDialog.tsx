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
import { Mail, Loader2, UserPlus } from 'lucide-react'
import { inviteInstructor } from '../actions'
import { useRouter } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {pending ? 'Sending invite...' : 'Send Invite'}
        </Button>
    )
}

export function InviteInstructorDialog() {
    const [open, setOpen] = useState(false)
    const [state, formAction] = useActionState(inviteInstructor, null) as any
    const router = useRouter()

    useEffect(() => {
        if (state?.error) toast.error(state.error)
        if (state?.success) {
            toast.success(`Invite sent to ${state.email}`)
            setOpen(false)
            router.refresh()
        }
    }, [state, router])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 w-full">
                    <UserPlus className="w-4 h-4" />
                    Open
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Invite an Instructor</DialogTitle>
                </DialogHeader>
                <form action={formAction} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" name="email" type="email" placeholder="instructor@example.com" required />
                        <p className="text-xs text-muted-foreground">
                            They&apos;ll receive an invite email and can set their own name and password.
                        </p>
                    </div>
                    <SubmitButton />
                </form>
            </DialogContent>
        </Dialog>
    )
}
