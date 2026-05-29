'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteUser } from '../../actions'
import { useRouter } from 'next/navigation'

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function handleDelete() {
        startTransition(async () => {
            const res = await deleteUser(userId)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(`${name} has been deleted`)
                setOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to permanently delete <strong>{name}</strong>?
                        This will remove their account and all associated data. This cannot be undone.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
