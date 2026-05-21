'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { createCourse } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CreateCourseDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const res = await createCourse({}, formData)
        if (res.success) {
            toast.success('Course created!')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to create course')
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Course
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Course Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Product Design Fundamentals" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="Brief overview of the course" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <select
                                id="type"
                                name="type"
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="crash_course">Crash Course</option>
                                <option value="specialization">Specialization</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phase">Phase</Label>
                            <Input id="phase" name="phase" type="number" defaultValue={1} min={1} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Create Course
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
