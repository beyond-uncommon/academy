import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { InviteInstructorDialog } from '../components/InviteInstructorDialog'
import { DeleteUserButton } from '../students/components/DeleteUserButton'

export const metadata: Metadata = { title: 'Staff — Instructors' }

export default async function InstructorsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/admin')

    const admin = createAdminClient()

    const { data: instructors } = await admin
        .from('profiles')
        .select('id, full_name, username, avatar_url, created_at')
        .eq('role', 'instructor')
        .order('created_at', { ascending: false })

    const ids = instructors?.map(i => i.id) || []

    const [{ data: allXP }, { data: allSubmissions }] = await Promise.all([
        admin.from('user_xp').select('user_id, total_xp').in('user_id', ids),
        admin.from('project_submissions').select('user_id, status').in('user_id', ids),
    ])

    const xpMap = Object.fromEntries((allXP || []).map(x => [x.user_id, x.total_xp]))
    const reviewStats: Record<string, { total: number; approved: number }> = {}
    for (const s of allSubmissions || []) {
        if (!reviewStats[s.user_id]) reviewStats[s.user_id] = { total: 0, approved: 0 }
        reviewStats[s.user_id].total++
        if (s.status === 'approved') reviewStats[s.user_id].approved++
    }

    const rows = (instructors || []).map(i => ({
        ...i,
        xp: xpMap[i.id] ?? 0,
        reviewed: reviewStats[i.id]?.total ?? 0,
        approved: reviewStats[i.id]?.approved ?? 0,
    }))

    return (
        <div className="space-y-6">
            <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ChevronLeft className="w-4 h-4" />
                Staff Panel
            </Link>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Instructors</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {rows.length} instructor{rows.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <InviteInstructorDialog />
            </div>

            <Card className="border-border/40">
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40">
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Instructor</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Projects Reviewed</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Approved</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Joined</th>
                                    <th className="h-11 px-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(row => {
                                    const displayName = row.full_name || row.username || 'Instructor'
                                    const initials = displayName[0]?.toUpperCase() ?? 'I'
                                    return (
                                        <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 shrink-0">
                                                        <AvatarImage src={row.avatar_url ?? undefined} />
                                                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <Link href={`/profile/${row.id}`} className="font-medium hover:underline flex items-center gap-1">
                                                            {displayName}
                                                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground font-mono">{row.id.slice(0, 8)}…</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">{row.reviewed || '—'}</td>
                                            <td className="px-4 py-3 text-right">
                                                {row.reviewed > 0
                                                    ? <span className={row.approved === row.reviewed ? 'text-green-500' : 'text-yellow-500'}>{row.approved}/{row.reviewed}</span>
                                                    : <span className="text-muted-foreground">—</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {new Date(row.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DeleteUserButton userId={row.id} name={displayName} />
                                            </td>
                                        </tr>
                                    )
                                })}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">No instructors yet. Invite one above.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
