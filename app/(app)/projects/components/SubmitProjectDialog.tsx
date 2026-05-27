'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Link2, Send, Loader2, ExternalLink, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { submitProject } from '@/app/(app)/lesson/project-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Submission {
    submission_url: string
    notes: string
    status: string
    feedback?: string | null
}

export function SubmitProjectDialog({
    lessonId,
    lessonTitle,
    xpReward,
    existing,
}: {
    lessonId: string
    lessonTitle: string
    xpReward: number
    existing?: Submission | null
}) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [url, setUrl] = useState(existing?.submission_url || '')
    const [notes, setNotes] = useState(existing?.notes || '')
    const router = useRouter()

    const isApproved = existing?.status === 'approved'
    const isReviewed = existing?.status === 'reviewed'

    async function handleSubmit() {
        if (!url) {
            toast.error('Please provide a submission URL')
            return
        }
        setIsLoading(true)
        const res = await submitProject(lessonId, url, notes)
        if (res.success) {
            toast.success('Project submitted!')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to submit')
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {existing ? (
                    <Button variant="outline" size="sm" className="gap-2" disabled={isApproved}>
                        {isApproved ? (
                            <><CheckCircle2 className="w-3 h-3" /> Approved</>
                        ) : isReviewed ? (
                            <><AlertCircle className="w-3 h-3" /> Resubmit</>
                        ) : (
                            <><ExternalLink className="w-3 h-3" /> Update</>
                        )}
                    </Button>
                ) : (
                    <Button size="sm" className="gap-2">
                        <Send className="w-3 h-3" />
                        Submit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {lessonTitle}
                        {existing && (
                            <Badge variant={isApproved ? 'default' : 'secondary'} className="text-[10px]">
                                {existing.status}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">Submission URL</Label>
                        <div className="relative">
                            <Link2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="url"
                                placeholder="https://figma.com/..."
                                className="pl-10"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={isApproved || isLoading}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Context, instructions, or anything else..."
                            className="min-h-[100px]"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isApproved || isLoading}
                        />
                    </div>

                    {isReviewed && existing?.feedback && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-blue-600">Instructor Feedback</p>
                                <p className="text-xs text-blue-600/80 mt-0.5">{existing.feedback}</p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || isApproved}
                        className="w-full gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {existing ? 'Resubmit' : `Submit (+${xpReward} XP)`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
