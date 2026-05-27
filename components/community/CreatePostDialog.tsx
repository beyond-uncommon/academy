'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createPost } from '@/components/community/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CreatePostDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('discussion')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const res = await createPost({ title, content, type })
    if (res.error) {
      toast.error(res.error)
      setSaving(false)
      return
    }
    toast.success('Post created!')
    setOpen(false)
    setTitle('')
    setContent('')
    setType('discussion')
    if (res.postId) {
      router.push(`/community/post/${res.postId}`)
    } else {
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share a question, tip, or discussion with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="tip">Tip</SelectItem>
                <SelectItem value="showcase">Showcase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a title..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content... (Markdown supported)"
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim() || !content.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
