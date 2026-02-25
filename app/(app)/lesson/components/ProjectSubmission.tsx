'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Link2, Send, Loader2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react'
import { submitProject } from '../project-actions'
import { toast } from 'sonner'

interface ProjectSubmissionProps {
    lessonId: string
    xpReward: number
    initialSubmission?: {
        submission_url: string
        notes: string
        status: string
        submitted_at: string
        feedback?: string | null
    } | null
}

export function ProjectSubmission({
    lessonId,
    xpReward,
    initialSubmission
}: ProjectSubmissionProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [submission, setSubmission] = useState(initialSubmission)
    const [url, setUrl] = useState(initialSubmission?.submission_url || '')
    const [notes, setNotes] = useState(initialSubmission?.notes || '')

    async function handleSubmission() {
        if (!url) {
            toast.error('Please provide a submission URL')
            return
        }

        setIsLoading(true)
        const res = await submitProject(lessonId, url, notes)

        if (res.success) {
            toast.success('Project submitted successfully!')
            setSubmission({
                submission_url: url,
                notes: notes,
                status: 'pending',
                submitted_at: new Date().toISOString()
            })
        } else {
            toast.error(res.error || 'Failed to submit project')
        }
        setIsLoading(false)
    }

    const isPending = submission?.status === 'pending'
    const isReviewed = submission?.status === 'reviewed'
    const isApproved = submission?.status === 'approved'

    return (
        <Card className="border-border/40 overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Project Submission</CardTitle>
                        <CardDescription>Submit your work for review and earn XP.</CardDescription>
                    </div>
                    {submission && (
                        <Badge variant={isApproved ? 'default' : 'secondary'} className="gap-1 px-3 py-1">
                            {isApproved ? (
                                <CheckCircle2 className="w-3 h-3" />
                            ) : (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                            {submission.status.toUpperCase()}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url" className="text-sm font-medium">
                            Submission URL (Figma, GitHub, Loom, etc.)
                        </Label>
                        <div className="relative">
                            <Link2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="url"
                                placeholder="https://..."
                                className="pl-10"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={isApproved || isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">
                            Notes for the instructor (Optional)
                        </Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any context or instructions here..."
                            className="min-h-[100px]"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isApproved || isLoading}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span>{isPending ? 'Awaiting review — you can still update your submission.' : 'Submission locked after review.'}</span>
                    </div>
                    <Button
                        onClick={handleSubmission}
                        disabled={isLoading || isApproved || isReviewed}
                        className="w-full sm:w-auto gap-2 min-w-[140px]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {submission ? 'Update Submission' : `Submit (+${xpReward} XP)`}
                    </Button>
                </div>

                {isReviewed && submission?.feedback && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-blue-600">Instructor Feedback</p>
                            <p className="text-xs text-blue-600/80 leading-relaxed">{submission.feedback}</p>
                        </div>
                    </div>
                )}

                {isApproved && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-green-600">Project Approved!</p>
                            <p className="text-xs text-green-600/80">
                                Excellent work! You&apos;ve earned {xpReward} XP for this project. Check your profile to see it in your showcase.
                            </p>
                            {submission?.feedback && (
                                <p className="text-xs text-green-600/70 mt-2 pt-2 border-t border-green-500/20 italic">&ldquo;{submission.feedback}&rdquo;</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
