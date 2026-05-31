'use client'

import { useState, useEffect, useTransition } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { createEvent, updateEvent, toggleEventPublish, deleteEvent } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Event = {
    id: string
    title: string
    description: string | null
    event_date: string | null
    event_time: string | null
    event_type: string
    is_recurring: boolean
    registration_url: string | null
    is_published: boolean
    created_at: string
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
        </Button>
    )
}

export function EventsClient({ events }: { events: Event[] }) {
    const router = useRouter()
    const [rawAdd, addAction] = useActionState(createEvent, null)
    const [rawEdit, editAction] = useActionState(updateEvent, null)
    const addState = rawAdd as { success: true } | { error: string } | null
    const editState = rawEdit as { success: true } | { error: string } | null
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const [newType, setNewType] = useState('workshop')
    const [newRecurring, setNewRecurring] = useState(false)
    const [editType, setEditType] = useState('workshop')
    const [editRecurring, setEditRecurring] = useState(false)

    useEffect(() => {
        if (addState && 'error' in addState) toast.error(addState.error)
        if (addState && 'success' in addState) { toast.success('Event created'); startTransition(() => { setAddOpen(false); setNewType('workshop'); setNewRecurring(false); router.refresh() }) }
    }, [addState, router])

    useEffect(() => {
        if (editState && 'error' in editState) toast.error(editState.error)
        if (editState && 'success' in editState) { toast.success('Event updated'); startTransition(() => { setEditingEvent(null); router.refresh() }) }
    }, [editState, router])

    function handleToggle(event: Event) {
        startTransition(async () => {
            const res = await toggleEventPublish(event.id, !event.is_published)
            if (res?.error) toast.error(res.error)
            else router.refresh()
        })
    }

    function handleDelete(event: Event) {
        startTransition(async () => {
            const res = await deleteEvent(event.id)
            if (res?.error) toast.error(res.error)
            else { toast.success('Event deleted'); router.refresh() }
        })
    }

    function typeBadge(type: string) {
        const variants: Record<string, string> = { workshop: 'default', ama: 'secondary', social: 'outline', other: 'secondary' }
        return <Badge variant={(variants[type] as 'default' | 'secondary' | 'outline') ?? 'secondary'} className="text-[10px] capitalize">{type}</Badge>
    }

    const published = events.filter(e => e.is_published)
    const unpublished = events.filter(e => !e.is_published)

    return (
        <div className="space-y-6">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Staff Panel
            </Link>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Events</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage workshops, AMAs, and community events.</p>
                </div>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Event</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Event</DialogTitle>
                        </DialogHeader>
                        <form action={addAction} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" placeholder="Event title" required autoFocus />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" name="description" placeholder="Event description" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="event_date">Date</Label>
                                    <Input id="event_date" name="event_date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="event_time">Time</Label>
                                    <Input id="event_time" name="event_time" type="text" placeholder="e.g. 3:00 PM GMT" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="event_type">Type</Label>
                                <Select name="event_type" value={newType} onValueChange={setNewType}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="workshop">Workshop</SelectItem>
                                        <SelectItem value="ama">AMA</SelectItem>
                                        <SelectItem value="social">Social</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registration_url">Registration URL</Label>
                                <Input id="registration_url" name="registration_url" type="url" placeholder="https://..." />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" name="is_recurring" checked={newRecurring} onChange={e => setNewRecurring(e.target.checked)} className="h-4 w-4" />
                                Recurring event
                            </label>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <SubmitButton label="Create Event" />
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {unpublished.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3">Drafts ({unpublished.length})</h2>
                    <EventList
                        events={unpublished}
                        typeBadge={typeBadge}
                        handleToggle={handleToggle}
                        handleDelete={handleDelete}
                        editingEvent={editingEvent}
                        setEditingEvent={setEditingEvent}
                        editAction={editAction}
                        editState={editState}
                        editType={editType}
                        setEditType={setEditType}
                        editRecurring={editRecurring}
                        setEditRecurring={setEditRecurring}
                        isPending={isPending}
                    />
                </section>
            )}

            <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">Published ({published.length})</h2>
                {published.length === 0 && unpublished.length === 0 && (
                    <Card>
                        <CardContent className="p-8 text-center text-sm text-muted-foreground">
                            No events yet. Create your first one above.
                        </CardContent>
                    </Card>
                )}
                <EventList
                    events={published}
                    typeBadge={typeBadge}
                    handleToggle={handleToggle}
                    handleDelete={handleDelete}
                    editingEvent={editingEvent}
                    setEditingEvent={setEditingEvent}
                    editAction={editAction}
                    editState={editState}
                    editType={editType}
                    setEditType={setEditType}
                    editRecurring={editRecurring}
                    setEditRecurring={setEditRecurring}
                    isPending={isPending}
                />
            </section>
        </div>
    )
}

function EventList({
    events,
    typeBadge,
    handleToggle,
    handleDelete,
    editingEvent,
    setEditingEvent,
    editAction,
    editState,
    editType,
    setEditType,
    editRecurring,
    setEditRecurring,
    isPending,
}: {
    events: Event[]
    typeBadge: (type: string) => React.ReactNode
    handleToggle: (event: Event) => void
    handleDelete: (event: Event) => void
    editingEvent: Event | null
    setEditingEvent: (event: Event | null) => void
    editAction: (payload: FormData) => void
    editState: { success: true } | { error: string } | null
    editType: string
    setEditType: (v: string) => void
    editRecurring: boolean
    setEditRecurring: (v: boolean) => void
    isPending: boolean
}) {
    return (
        <div className="space-y-2">
            {events.map((event) => (
                <Card key={event.id} className="border-border/40">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium truncate">{event.title}</span>
                                {typeBadge(event.event_type)}
                                {event.is_recurring && <Badge variant="outline" className="text-[9px]">Recurring</Badge>}
                            </div>
                            {event.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                {event.event_date && <span>{event.event_date}</span>}
                                {event.event_time && <span>{event.event_time}</span>}
                                {event.registration_url && <span className="truncate max-w-[200px]">{event.registration_url}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={event.is_published ? 'Unpublish' : 'Publish'}
                                onClick={() => handleToggle(event)}
                                disabled={isPending}
                            >
                                {event.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                            </Button>

                            <Dialog open={editingEvent?.id === event.id} onOpenChange={(o) => { if (!o) setEditingEvent(null); if (o) { setEditType(event.event_type); setEditRecurring(event.is_recurring) } }}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingEvent(event); setEditType(event.event_type); setEditRecurring(event.is_recurring) }}>
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Event</DialogTitle>
                                    </DialogHeader>
                                    <form action={editAction} className="space-y-4 pt-2">
                                        <input type="hidden" name="id" value={event.id} />
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-title">Title</Label>
                                            <Input id="edit-title" name="title" defaultValue={event.title} required autoFocus />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-description">Description</Label>
                                            <Textarea id="edit-description" name="description" defaultValue={event.description ?? ''} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-event_date">Date</Label>
                                                <Input id="edit-event_date" name="event_date" type="date" defaultValue={event.event_date ?? ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-event_time">Time</Label>
                                                <Input id="edit-event_time" name="event_time" type="text" defaultValue={event.event_time ?? ''} placeholder="e.g. 3:00 PM GMT" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-event_type">Type</Label>
                                            <Select name="event_type" value={editType} onValueChange={setEditType}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="workshop">Workshop</SelectItem>
                                                    <SelectItem value="ama">AMA</SelectItem>
                                                    <SelectItem value="social">Social</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-registration_url">Registration URL</Label>
                                            <Input id="edit-registration_url" name="registration_url" type="url" defaultValue={event.registration_url ?? ''} placeholder="https://..." />
                                        </div>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" name="is_recurring" checked={editRecurring} onChange={e => setEditRecurring(e.target.checked)} className="h-4 w-4" />
                                            Recurring event
                                        </label>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button type="button" variant="outline">Cancel</Button>
                                            </DialogClose>
                                            <SubmitButton label="Save" />
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
                                        <DialogTitle>Delete Event</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                        Are you sure you want to delete <strong>{event.title}</strong>? This cannot be undone.
                                    </p>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                        </DialogClose>
                                        <DialogClose asChild>
                                            <Button variant="destructive" onClick={() => handleDelete(event)} disabled={isPending}>Delete</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
