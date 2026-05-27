'use client'

import { useState, useRef } from 'react'
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
import { Plus, Loader2, ImageIcon, X } from 'lucide-react'
import { createPost } from '@/components/community/actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UploadedImage {
  url: string
  path: string
}

export function CreatePostDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('discussion')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('community-images')
      .upload(filePath, file)

    if (uploadError) {
      toast.error(uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('community-images')
      .getPublicUrl(filePath)

    const md = `![image](${publicUrl})`
    setContent((prev) => (prev ? prev + '\n' + md : md))
    setImages((prev) => [...prev, { url: publicUrl, path: filePath }])
    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeImage(path: string) {
    setImages((prev) => prev.filter((img) => img.path !== path))
    setContent((prev) => {
      const lines = prev.split('\n')
      return lines.filter((line) => !line.includes(path)).join('\n')
    })
  }

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
    setImages([])
    if (res.postId) {
      router.push(`/community/post/${res.postId}`)
    } else {
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setImages([]) }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
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
            <div className="border border-input rounded-md focus-within:ring-1 focus-within:ring-ring">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-2 py-1.5 border-b border-input bg-muted/30">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                  title="Attach image"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
                <span className="text-[10px] text-muted-foreground ml-1">
                  Attach images (5MB max)
                </span>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content... (Markdown supported)"
                className="border-0 focus-visible:ring-0 rounded-t-none min-h-[140px]"
              />
            </div>
            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img) => (
                  <div key={img.path} className="relative group">
                    <img
                      src={img.url}
                      alt=""
                      className="w-16 h-16 object-cover rounded-md border border-border/40"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.path)}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
