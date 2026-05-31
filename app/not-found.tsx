import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="border-border/40 max-w-md w-full">
                <CardContent className="p-12 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <span className="text-3xl font-bold text-muted-foreground">404</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-bold">Page not found</h1>
                        <p className="text-sm text-muted-foreground">
                            The page you&apos;re looking for doesn&apos;t exist or has been moved.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" asChild className="gap-2">
                            <Link href="javascript:history.back()">
                                <ArrowLeft className="w-4 h-4" />
                                Go back
                            </Link>
                        </Button>
                        <Button asChild className="gap-2">
                            <Link href="/">
                                <Home className="w-4 h-4" />
                                Home
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
