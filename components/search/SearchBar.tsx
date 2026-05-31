'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBar() {
    const [query, setQuery] = useState('')
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
            setQuery('')
            inputRef.current?.blur()
        }
    }

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}

                placeholder="Search..."
                className="w-48 h-8 pl-8 pr-3 rounded-md border border-input bg-muted/50 text-xs focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-all"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 border border-border/40 rounded px-1 py-0.5 pointer-events-none">
                {navigator?.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
            </kbd>
        </form>
    )
}
