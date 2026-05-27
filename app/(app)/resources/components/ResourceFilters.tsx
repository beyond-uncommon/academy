'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

const labelMap: Record<string, string> = {
  all: 'All',
  video: 'Videos',
  article: 'Articles',
  figma: 'Figma',
  template: 'Templates',
  book: 'Books',
  code: 'Code',
  tool: 'Tools',
  link: 'Links',
}

export function ResourceFilters({
  activeType,
  query,
  types,
  counts,
}: {
  activeType: string
  query: string
  types: string[]
  counts: Record<string, number>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query)
  const timerRef = useRef<NodeJS.Timeout>(undefined as unknown as NodeJS.Timeout)

  const update = useCallback(
    (params: { type?: string; q?: string }) => {
      const sp = new URLSearchParams()
      if (params.type && params.type !== 'all') sp.set('type', params.type)
      if (params.q?.trim()) sp.set('q', params.q.trim())
      const qs = sp.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname]
  )

  useEffect(() => {
    setSearch(query)
  }, [query])

  function onSearchChange(value: string) {
    setSearch(value)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => update({ q: value, type: activeType }), 300)
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search resources..."
          className="pl-10 pr-10"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('')
              update({ q: '', type: activeType })
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => update({ type: t, q: search })}
            className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-md transition-colors ${
              activeType === t
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {labelMap[t] || t}
            {counts[t] !== undefined && (
              <span className="ml-1.5 text-[10px] opacity-60">({counts[t]})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
