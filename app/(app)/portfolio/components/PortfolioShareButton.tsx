'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'

export function PortfolioShareButton() {
    const handleShare = async () => {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Portfolio URL copied to clipboard')
    }

    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" />
            Share
        </Button>
    )
}
