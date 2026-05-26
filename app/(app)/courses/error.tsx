'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 py-2"
            >
                Try again
            </button>
        </div>
    )
}
