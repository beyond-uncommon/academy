'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { updateLesson } from '../../actions'
import { toast } from 'sonner'

interface ModuleItem {
    id: string
    title: string
}

interface Resource {
    title: string
    url: string
    type: string
}

interface LessonData {
    id: string
    title: string
    module_id: string
    type: string
    duration_minutes: number | null
    xp_reward: number
    content: Record<string, unknown> | null
    is_published: boolean
    module: { title: string } | null
}

export function EditLessonForm({ lesson, modules }: { lesson: LessonData; modules: ModuleItem[] }) {
    const router = useRouter()
    const content = lesson.content || {}
    const [resources, setResources] = useState<Resource[]>(
        (content.resources as Resource[]) || []
    )

    const [, formAction, pending] = useActionState(
        async (_prevState: unknown, formData: FormData) => {
            const getVal = (key: string) => (formData.get(key) as string) || ''
            const data = {
                title: getVal('title') || undefined,
                module_id: getVal('module_id') || undefined,
                type: getVal('type') as 'video' | 'text' | 'interactive' | 'project' | undefined,
                duration_minutes: formData.get('duration_minutes')
                    ? Number(formData.get('duration_minutes'))
                    : undefined,
                xp_reward: formData.get('xp_reward')
                    ? Number(formData.get('xp_reward'))
                    : undefined,
                content: {
                    description: getVal('description'),
                    video_url: getVal('video_url'),
                    notes: getVal('notes'),
                    text_content: getVal('text_content'),
                    brief: getVal('brief'),
                    resources,
                },
            }

            const res = await updateLesson(lesson.id, data)
            if (res.success) {
                toast.success('Lesson updated successfully!')
                router.refresh()
            } else {
                toast.error(res?.error || 'Failed to update lesson')
            }
            return res
        },
        null
    )

    function addResource() {
        setResources([...resources, { title: '', url: '', type: 'article' }])
    }

    function removeResource(index: number) {
        setResources(resources.filter((_, i) => i !== index))
    }

    function updateResource(index: number, field: keyof Resource, value: string) {
        const updated = resources.map((r, i) =>
            i === index ? { ...r, [field]: value } : r
        )
        setResources(updated)
    }

    return (
        <form action={formAction} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input id="title" name="title" defaultValue={lesson.title} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="module_id">Module</Label>
                    <select
                        id="module_id"
                        name="module_id"
                        defaultValue={lesson.module_id}
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
                        defaultValue={lesson.type}
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
                    <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue={lesson.duration_minutes ?? 10} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="xp_reward">XP Reward</Label>
                    <Input id="xp_reward" name="xp_reward" type="number" defaultValue={lesson.xp_reward} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Input id="description" name="description" defaultValue={(content.description as string) || ''} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (Embed)</Label>
                <Input id="video_url" name="video_url" placeholder="https://..." defaultValue={(content.video_url as string) || ''} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Notes (markdown)</Label>
                <Textarea id="notes" name="notes" rows={6} defaultValue={(content.notes as string) || ''} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="text_content">Text Content (markdown)</Label>
                <Textarea id="text_content" name="text_content" rows={8} defaultValue={(content.text_content as string) || ''} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="brief">Project Brief (markdown)</Label>
                <Textarea id="brief" name="brief" rows={6} defaultValue={(content.brief as string) || ''} />
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Resources</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addResource} className="gap-1">
                        <Plus className="w-3 h-3" />
                        Add Resource
                    </Button>
                </div>
                {resources.length === 0 && (
                    <p className="text-sm text-muted-foreground">No resources added yet.</p>
                )}
                {resources.map((resource, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-lg border border-border/40">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            <div>
                                <Label className="text-xs">Title</Label>
                                <Input
                                    value={resource.title}
                                    onChange={e => updateResource(index, 'title', e.target.value)}
                                    placeholder="Resource title"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">URL</Label>
                                <Input
                                    value={resource.url}
                                    onChange={e => updateResource(index, 'url', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Type</Label>
                                <select
                                    value={resource.type}
                                    onChange={e => updateResource(index, 'type', e.target.value)}
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="article">Article</option>
                                    <option value="docs">Documentation</option>
                                    <option value="video">Video</option>
                                    <option value="tool">Tool</option>
                                </select>
                            </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeResource(index)} className="mt-5 shrink-0 text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={pending}>
                    {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Changes
                </Button>
                <Link href="/admin/lessons">
                    <Button type="button" variant="outline">Cancel</Button>
                </Link>
            </div>
        </form>
    )
}
