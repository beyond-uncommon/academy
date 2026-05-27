const INVITE_SECRET = process.env.INVITE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-invite-secret'

async function getHmacKey(): Promise<CryptoKey> {
    const enc = new TextEncoder()
    return crypto.subtle.importKey('raw', enc.encode(INVITE_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
}

export async function signInviteCode(code: string): Promise<string> {
    const key = await getHmacKey()
    const enc = new TextEncoder()
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(code))
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export async function verifyInviteCode(code: string, sig: string): Promise<boolean> {
    const expected = await signInviteCode(code)
    return sig === expected
}
