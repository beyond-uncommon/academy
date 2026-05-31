'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ExternalLink, Search, ChevronLeft } from 'lucide-react'
import { RANK_LABELS, type Rank } from '@/types'
import { InviteInstructorDialog } from '../../components/InviteInstructorDialog'
import { DeleteUserButton } from '../../students/components/DeleteUserButton'

interface InstructorRow {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    created_at: string
    xp: number
    rank: Rank | undefined
    streak: number
    reviewed: number
    approved: number
    quizPassed: number
    quizTotal: number
}

export function InstructorsTable({ rows }: { rows: InstructorRow[] }) {
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        if (!search.trim()) return rows
        const q = search.toLowerCase()
        return rows.filter(r =>
            (r.full_name ?? '').toLowerCase().includes(q) ||
            (r.username ?? '').toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q)
        )
    }, [rows, search])

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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search instructors..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9 max-w-xs"
                />
            </div>

            <Card className="border-border/40">
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40">
                                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Instructor</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">XP</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Rank</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Streak</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Projects Reviewed</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Approved</th>
                                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Joined</th>
                                    <th className="h-11 px-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(row => {
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
                                            <td className="px-4 py-3 text-right font-medium">{row.xp.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                                {row.rank ? RANK_LABELS[row.rank] : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {row.streak > 0
                                                    ? <span className="text-orange-500 font-medium">{row.streak}d</span>
                                                    : <span className="text-muted-foreground">—</span>
                                                }
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
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            {search ? 'No instructors match your search.' : 'No instructors yet.'}
                                        </td>
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
