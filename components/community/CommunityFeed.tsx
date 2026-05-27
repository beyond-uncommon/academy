'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export function CommunityFeed({
  totalPages,
  currentPage,
  sort,
  type,
}: {
  totalPages: number
  currentPage: number
  sort: string
  type: string
}) {
  return (
    <div className="flex items-center gap-2">
      {currentPage > 1 && (
        <Link
          href={`/community?sort=${sort}&type=${type}&page=${currentPage - 1}`}
        >
          <Button variant="outline" size="sm" className="gap-1">
            <ChevronLeft className="w-3 h-3" />
            Previous
          </Button>
        </Link>
      )}
      <span className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Link
          href={`/community?sort=${sort}&type=${type}&page=${currentPage + 1}`}
        >
          <Button variant="outline" size="sm" className="gap-1">
            Next
            <ChevronRight className="w-3 h-3" />
          </Button>
        </Link>
      )}
    </div>
  )
}
