'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PushStatus = 'unsupported' | 'prompt' | 'denied' | 'subscribed' | 'loading'

function urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from(rawData.split('').map((c) => c.charCodeAt(0)))
}

async function getExistingSubscription(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
}

async function subscribeUser(): Promise<PushSubscription | null> {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })
    return sub
}

async function sendSubscriptionToServer(sub: PushSubscription, userAgent?: string) {
    await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscription: sub.toJSON(),
            userAgent,
        }),
    })
}

async function unsubscribeFromServer(endpoint: string) {
    await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
    })
}

export function usePushNotifications() {
    const [status, setStatus] = useState<PushStatus>('prompt')

    useEffect(() => {
        startTransition(() => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setStatus('unsupported')
                return
            }
            if (Notification.permission === 'denied') {
                setStatus('denied')
                return
            }
            if (Notification.permission === 'granted') {
                navigator.serviceWorker.ready.then((reg) =>
                    reg.pushManager.getSubscription().then((sub) => {
                        setStatus(sub ? 'subscribed' : 'prompt')
                    })
                )
                return
            }
            setStatus('prompt')
        })
    }, [])

    const enable = useCallback(async () => {
        setStatus('loading')
        try {
            const sub = await subscribeUser()
            if (sub) {
                await sendSubscriptionToServer(sub, navigator.userAgent)
                setStatus('subscribed')
            } else {
                setStatus('denied')
            }
        } catch {
            setStatus('prompt')
        }
    }, [])

    const disable = useCallback(async () => {
        setStatus('loading')
        try {
            const sub = await getExistingSubscription()
            if (sub) {
                await unsubscribeFromServer(sub.endpoint)
                await sub.unsubscribe()
            }
            setStatus('prompt')
        } catch {
            setStatus('prompt')
        }
    }, [])

    return { status, enable, disable }
}

export function PushNotificationManager() {
    const { status, enable, disable } = usePushNotifications()
    const isLoading = status === 'loading'

    if (status === 'unsupported') return null
    if (status === 'denied') return null

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {status === 'subscribed' ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={disable}
                    disabled={isLoading}
                >
                    <BellOff className="w-4 h-4" />
                    Disable notifications
                </Button>
            ) : (
                <Button
                    variant="default"
                    size="sm"
                    onClick={enable}
                    disabled={isLoading}
                >
                    <Bell className="w-4 h-4" />
                    Enable notifications
                </Button>
            )}
        </div>
    )
}
