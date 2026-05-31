'use client'

import { useState, useEffect, useTransition } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, EyeOff, Eye, Loader2, ChevronLeft } from 'lucide-react'
import { addHub, updateHub, toggleHub, deleteHub } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Hub = { id: string; name: string; active: boolean }

function AddButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="gap-2">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Hub
        </Button>
    )
}

function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </Button>
    )
}

export function HubsClient({ hubs }: { hubs: Hub[] }) {
    const router = useRouter()
    const [rawAdd, addAction] = useActionState(addHub, null)
    const [rawEdit, editAction] = useActionState(updateHub, null)
    const addState = rawAdd as { success: true } | { error: string } | null
    const editState = rawEdit as { success: true } | { error: string } | null
    const [editingHub, setEditingHub] = useState<Hub | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (addState && 'error' in addState) toast.error(addState.error)
        if (addState && 'success' in addState) { toast.success('Hub added'); startTransition(() => { setAddOpen(false); router.refresh() }) }
    }, [addState, router])

    useEffect(() => {
        if (editState && 'error' in editState) toast.error(editState.error)
        if (editState && 'success' in editState) { toast.success('Hub updated'); startTransition(() => { setEditingHub(null); router.refresh() }) }
    }, [editState, router])

    function handleToggle(hub: Hub) {
        startTransition(async () => {
            const res = await toggleHub(hub.id, !hub.active)
            if (res?.error) toast.error(res.error)
            else router.refresh()
        })
    }

    function handleDelete(hub: Hub) {
        startTransition(async () => {
            const res = await deleteHub(hub.id)
            if (res?.error) toast.error(res.error)
            else { toast.success('Hub deleted'); router.refresh() }
        })
    }

    return (
        <div className="space-y-6">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Staff Panel
            </Link>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Innovation Hubs</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage the hubs shown during student onboarding.</p>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Hub</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Innovation Hub</DialogTitle>
                        </DialogHeader>
                        <form action={addAction} className="space-y-4 pt-2">
                            <Input name="name" placeholder="Hub name" required autoFocus />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <AddButton />
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{hubs.length} hub{hubs.length !== 1 ? 's' : ''}</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                    {hubs.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">No hubs yet. Add one above.</p>
                    )}
                    {hubs.map((hub) => (
                        <div key={hub.id} className="flex items-center justify-between py-3 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="text-sm font-medium truncate">{hub.name}</span>
                                {!hub.active && <Badge variant="secondary" className="text-xs shrink-0">Hidden</Badge>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title={hub.active ? 'Hide from onboarding' : 'Show in onboarding'}
                                    onClick={() => handleToggle(hub)}
                                    disabled={isPending}
                                >
                                    {hub.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                </Button>

                                <Dialog open={editingHub?.id === hub.id} onOpenChange={(o) => !o && setEditingHub(null)}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingHub(hub)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Rename Hub</DialogTitle>
                                        </DialogHeader>
                                        <form action={editAction} className="space-y-4 pt-2">
                                            <input type="hidden" name="id" value={hub.id} />
                                            <Input name="name" defaultValue={hub.name} required autoFocus />
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <SaveButton />
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Delete Hub</DialogTitle>
                                        </DialogHeader>
                                        <p className="text-sm text-muted-foreground">
                                            Are you sure you want to delete <strong>{hub.name}</strong>? This cannot be undone.
                                        </p>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <DialogClose asChild>
                                                <Button variant="destructive" onClick={() => handleDelete(hub)} disabled={isPending}>Delete</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
