import { describe, it, expect, vi, afterEach } from 'vitest'
import { cn, timeAgo } from '@/lib/utils'

describe('cn', () => {
    it('merges class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes with objects', () => {
        expect(cn('base', { active: true, hidden: false })).toBe('base active')
    })

    it('handles empty input', () => {
        expect(cn()).toBe('')
    })

    it('filters falsy values', () => {
        expect(cn('a', false, null, undefined, 0, 'b')).toBe('a b')
    })

    it('handles array arguments', () => {
        expect(cn(['a', 'b'], 'c')).toBe('a b c')
    })

    it('handles tailwind conflicts via twMerge', () => {
        expect(cn('px-4', 'px-2')).toBe('px-2')
    })

    it('handles single class', () => {
        expect(cn('text-center')).toBe('text-center')
    })
})

describe('timeAgo', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns "just now" for less than 60 seconds', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z'))
        const date = new Date('2025-06-01T11:59:30Z').toISOString()
        expect(timeAgo(date)).toBe('just now')
    })

    it('returns minutes ago for less than 1 hour', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z'))
        const date = new Date('2025-06-01T11:45:00Z').toISOString()
        expect(timeAgo(date)).toBe('15m ago')
    })

    it('returns hours ago for less than 24 hours', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z'))
        const date = new Date('2025-06-01T08:00:00Z').toISOString()
        expect(timeAgo(date)).toBe('4h ago')
    })

    it('returns days ago for less than 30 days', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z'))
        const date = new Date('2025-05-25T12:00:00Z').toISOString()
        expect(timeAgo(date)).toBe('7d ago')
    })

    it('returns formatted date for 30 days or more', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z'))
        const date = new Date('2025-01-01T12:00:00Z').toISOString()
        const result = timeAgo(date)
        expect(result).toBe('1/1/2025')
    })

    it('returns "just now" for exactly 0 seconds', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z'))
        const date = new Date('2025-06-01T12:00:00Z').toISOString()
        expect(timeAgo(date)).toBe('just now')
    })

    it('returns "1m ago" for exactly 60 seconds', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-06-01T12:01:00Z'))
        const date = new Date('2025-06-01T12:00:00Z').toISOString()
        expect(timeAgo(date)).toBe('1m ago')
    })
})
