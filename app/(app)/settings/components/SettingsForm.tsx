'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera, Check, Trash2, AlertTriangle } from 'lucide-react'
import { updateProfile, deleteAccount } from '../actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'

interface SettingsFormProps {
    userId: string
    initialData: {
        full_name: string | null
        username: string | null
        bio: string | null
        avatar_url: string | null
    }
}

export function SettingsForm({ userId, initialData }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState(initialData)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { theme, setTheme } = useTheme()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await updateProfile({
                full_name: formData.full_name || '',
                username: formData.username || '',
                bio: formData.bio || '',
                avatar_url: formData.avatar_url || '',
            })
            toast.success('Profile updated successfully')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-border/40">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your public identity on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <Avatar className="w-20 h-20 border">
                                <AvatarImage src={formData.avatar_url || undefined} />
                                <AvatarFallback className="text-xl">
                                    {formData.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
                            >
                                {uploading ? (
                                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    if (file.size > 2 * 1024 * 1024) {
                                        toast.error('Image must be under 2MB')
                                        return
                                    }

                                    setUploading(true)
                                    const supabase = createClient()
                                    const ext = file.name.split('.').pop()
                                    const filePath = `${userId}/avatar.${ext}`

                                    const { error: uploadError } = await supabase.storage
                                        .from('avatars')
                                        .upload(filePath, file, { upsert: true })

                                    if (uploadError) {
                                        toast.error(uploadError.message)
                                        setUploading(false)
                                        return
                                    }

                                    const { data: { publicUrl } } = supabase.storage
                                        .from('avatars')
                                        .getPublicUrl(filePath)

                                    setFormData({ ...formData, avatar_url: publicUrl })
                                    setUploading(false)
                                    toast.success('Avatar uploaded')
                                }}
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Profile Picture</p>
                            <p className="text-xs text-muted-foreground">Click the camera icon to upload</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name || ''}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">@</span>
                                <Input
                                    id="username"
                                    className="pl-7"
                                    value={formData.username || ''}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="johndoe"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            className="min-h-[100px]"
                            value={formData.bio || ''}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell the community a bit about yourself..."
                        />
                        <p className="text-[10px] text-muted-foreground text-right italic">Max 160 characters</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/40">
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your learning environment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Appearance</Label>
                            <p className="text-xs text-muted-foreground">Switch between light and dark modes.</p>
                        </div>
                        <div className="flex bg-muted p-1 rounded-lg">
                            {(['light', 'dark', 'system'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTheme(t)}
                                    className={`px-3 py-1.5 text-xs rounded-md transition-all ${theme === t
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions that affect your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Delete Account</Label>
                            <p className="text-xs text-muted-foreground">
                                Permanently removes your account, profile, submissions, progress, and all associated data.
                            </p>
                        </div>
                        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="destructive" size="sm" className="gap-2 shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[420px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="w-5 h-5" />
                                        Delete Account
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. All your data — including projects, progress, badges, and certificates — will be permanently deleted.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                        <p className="text-xs text-destructive font-medium">
                                            Are you sure you want to proceed?
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDeleteOpen(false)}
                                            disabled={deleteLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="gap-2"
                                            disabled={deleteLoading}
                                            onClick={async () => {
                                                setDeleteLoading(true)
                                                const res = await deleteAccount()
                                                if (res.success) {
                                                    router.push('/')
                                                    router.refresh()
                                                } else {
                                                    toast.error(res.error || 'Failed to delete account')
                                                    setDeleteLoading(false)
                                                    setDeleteOpen(false)
                                                }
                                            }}
                                        >
                                            {deleteLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Permanently Delete
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    Save Changes
                </Button>
            </div>
        </form>
    )
}
