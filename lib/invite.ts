import { timingSafeEqual } from 'crypto'

function getInviteSecret(): string {
    const secret = process.env.INVITE_SECRET
    if (!secret) throw new Error('INVITE_SECRET environment variable is not configured')
    return secret
}

async function getHmacKey(): Promise<CryptoKey> {
    const enc = new TextEncoder()
    return crypto.subtle.importKey('raw', enc.encode(getInviteSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

export async function signInviteCode(code: string): Promise<string> {
    const key = await getHmacKey()
    const enc = new TextEncoder()
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(code))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyInviteCode(code: string, sig: string): Promise<boolean> {
    const expected = await signInviteCode(code)
    if (sig.length !== expected.length) return false
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
}
