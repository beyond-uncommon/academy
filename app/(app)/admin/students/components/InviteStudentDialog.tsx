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
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Link2, Loader2, UserPlus, CheckCircle2, Copy } from 'lucide-react'
import { inviteStudentLink } from '../../actions'
import { useRouter } from 'next/navigation'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {pending ? 'Generating link...' : 'Generate Invite Link'}
        </Button>
    )
}

export function InviteStudentDialog() {
    const [open, setOpen] = useState(false)
    const [rawState, formAction] = useActionState(inviteStudentLink, null)
    const state = rawState as { success: true; link: string } | { error: string } | null
    const router = useRouter()
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (state && 'error' in state) toast.error(state.error)
    }, [state])

    function handleCopy() {
        if (state && 'link' in state) {
            navigator.clipboard.writeText(state.link)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) router.refresh() }}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                {state && 'success' in state ? (
                    <div className="py-6 space-y-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">Invite Link Generated</DialogTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Share this link with your student. They&apos;ll set their email, name, and password.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Invite Link</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={state.link} className="text-xs font-mono" />
                                <Button variant="outline" size="icon" className="shrink-0" onClick={handleCopy}>
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                            Done
                        </Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Invite a Student</DialogTitle>
                            <DialogDescription>
                                Generate a one-time invite link to share with your student.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={formAction} className="space-y-4 pt-2">
                            <SubmitButton />
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
