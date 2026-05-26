'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { createLesson } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ModuleItem {
    id: string;
    title: string;
}

export function CreateLessonDialog({ modules }: { modules: ModuleItem[] }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const getVal = (key: string) => (formData.get(key) as string) || ''
        const data = {
            title: getVal('title'),
            module_id: getVal('module_id'),
            type: getVal('type') as 'video' | 'text' | 'interactive' | 'project',
            duration_minutes: Number(formData.get('duration_minutes')),
            xp_reward: Number(formData.get('xp_reward')),
            order_index: 0,
            content: {
                description: getVal('description'),
                body: getVal('body'),
                video_url: getVal('video_url')
            },
            is_published: false
        }

        const res = await createLesson(data)
        if (res.success) {
            toast.success('Lesson created successfully!')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res?.error || 'Failed to create lesson')
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Lesson
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Lesson</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Lesson Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Introduction to Figma" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="module_id">Module</Label>
                            <select
                                id="module_id"
                                name="module_id"
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                {modules.map(m => (
                                    <option key={m.id} value={m.id}>{m.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <select
                                id="type"
                                name="type"
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            >
                                <option value="video">Video</option>
                                <option value="text">Text/Article</option>
                                <option value="project">Project Submission</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration_minutes">Duration (min)</Label>
                            <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue={10} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="xp_reward">XP Reward</Label>
                            <Input id="xp_reward" name="xp_reward" type="number" defaultValue={50} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Short Description</Label>
                        <Input id="description" name="description" placeholder="Brief overview of the lesson" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="video_url">Video URL (Embed)</Label>
                        <Input id="video_url" name="video_url" placeholder="https://..." />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Create Lesson
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
