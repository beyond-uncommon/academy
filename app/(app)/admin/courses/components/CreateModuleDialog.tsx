'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { createModule } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CreateModuleDialog({ courseId }: { courseId: string }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.set('course_id', courseId)
        const res = await createModule({}, formData)
        if (res.success) {
            toast.success('Module created!')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to create module')
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 w-full mt-4">
                    <Plus className="w-4 h-4" />
                    Add Module
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Add Module</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Module Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Design Fundamentals" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="skill_node_id">Skill Node ID (optional)</Label>
                            <Input id="skill_node_id" name="skill_node_id" placeholder="e.g. foundations" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="xp_available">XP Available</Label>
                            <Input id="xp_available" name="xp_available" type="number" defaultValue={100} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Create Module
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
