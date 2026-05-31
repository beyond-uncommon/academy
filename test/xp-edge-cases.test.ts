import { describe, it, expect } from 'vitest'
import { getRank, xpToNextRank, rankProgressPercent, calculateQuizXP } from '@/lib/xp'

describe('getRank edge cases', () => {
    it('returns beginner for negative XP', () => {
        expect(getRank(-1)).toBe('beginner')
    })

    it('returns beginner for very large negative XP', () => {
        expect(getRank(-100000)).toBe('beginner')
    })

    it('returns explorer at exactly 500 XP', () => {
        expect(getRank(500)).toBe('explorer')
    })

    it('returns explorer at 1999 XP', () => {
        expect(getRank(1999)).toBe('explorer')
    })

    it('returns practitioner at exactly 2000 XP', () => {
        expect(getRank(2000)).toBe('practitioner')
    })

    it('returns practitioner at 4999 XP', () => {
        expect(getRank(4999)).toBe('practitioner')
    })

    it('returns designer at exactly 5000 XP', () => {
        expect(getRank(5000)).toBe('designer')
    })

    it('returns designer at 9999 XP', () => {
        expect(getRank(9999)).toBe('designer')
    })

    it('returns master at exactly 10000 XP', () => {
        expect(getRank(10000)).toBe('master')
    })

    it('returns master for XP beyond max threshold', () => {
        expect(getRank(999999)).toBe('master')
    })
})

describe('xpToNextRank edge cases', () => {
    it('returns nextRank explorer and xpNeeded 500 for 0 XP', () => {
        const result = xpToNextRank(0)
        expect(result).not.toBeNull()
        expect(result!.nextRank).toBe('explorer')
        expect(result!.xpNeeded).toBe(500)
    })

    it('returns xpNeeded 0 at exactly explorer threshold', () => {
        const result = xpToNextRank(500)
        expect(result).not.toBeNull()
        expect(result!.nextRank).toBe('practitioner')
        expect(result!.xpNeeded).toBe(1500)
    })

    it('returns correct xpNeeded near end of beginner', () => {
        const result = xpToNextRank(499)
        expect(result).not.toBeNull()
        expect(result!.nextRank).toBe('explorer')
        expect(result!.xpNeeded).toBe(1)
    })

    it('returns explorer with positive xpNeeded for negative XP', () => {
        const result = xpToNextRank(-100)
        expect(result).not.toBeNull()
        expect(result!.nextRank).toBe('explorer')
        expect(result!.xpNeeded).toBe(600)
    })

    it('returns null for master rank', () => {
        expect(xpToNextRank(10000)).toBeNull()
    })

    it('returns null for XP beyond max threshold', () => {
        expect(xpToNextRank(999999)).toBeNull()
    })

    it('returns correct xpNeeded for practitioner to designer boundary', () => {
        const result = xpToNextRank(2000)
        expect(result!.nextRank).toBe('designer')
        expect(result!.xpNeeded).toBe(3000)
    })

    it('returns correct xpNeeded for designer to master boundary', () => {
        const result = xpToNextRank(5000)
        expect(result).not.toBeNull()
        expect(result!.nextRank).toBe('master')
        expect(result!.xpNeeded).toBe(5000)
    })
})

describe('rankProgressPercent edge cases', () => {
    it('returns non-positive value near zero for negative XP', () => {
        const result = rankProgressPercent(-1)
        expect(result).toBeLessThanOrEqual(0)
        expect(Math.abs(result)).toBeLessThan(1)
    })

    it('returns negative percentage for very large negative XP', () => {
        expect(rankProgressPercent(-100000)).toBe(-20000)
    })

    it('returns 0 at exact beginner threshold', () => {
        expect(rankProgressPercent(0)).toBe(0)
    })

    it('returns 1 for small positive XP in beginner', () => {
        expect(rankProgressPercent(5)).toBe(1)
    })

    it('returns 0 at exact explorer threshold (start of rank)', () => {
        expect(rankProgressPercent(500)).toBe(0)
    })

    it('returns 0 at exact practitioner threshold (start of rank)', () => {
        expect(rankProgressPercent(2000)).toBe(0)
    })

    it('returns 50 halfway through explorer rank', () => {
        expect(rankProgressPercent(1250)).toBe(50)
    })

    it('returns 33 at one-third through practitioner rank', () => {
        expect(rankProgressPercent(3000)).toBe(33)
    })

    it('returns 100 for master rank', () => {
        expect(rankProgressPercent(10000)).toBe(100)
    })

    it('returns 100 for XP beyond max threshold', () => {
        expect(rankProgressPercent(999999)).toBe(100)
    })
})

describe('calculateQuizXP edge cases', () => {
    it('returns base XP for score of 0', () => {
        expect(calculateQuizXP(0, 100, 50, 100)).toBe(100)
    })

    it('returns base XP for score of 79 (below bonus threshold)', () => {
        expect(calculateQuizXP(79, 100, 50, 100)).toBe(100)
    })

    it('returns base XP for score of 1 (minimum non-zero)', () => {
        expect(calculateQuizXP(1, 200, 100, 200)).toBe(200)
    })

    it('adds 80% bonus for score of exactly 80', () => {
        expect(calculateQuizXP(80, 100, 50, 100)).toBe(150)
    })

    it('adds 80% bonus for score of 99 (below perfect)', () => {
        expect(calculateQuizXP(99, 100, 50, 100)).toBe(150)
    })

    it('adds 100% bonus for score of exactly 100', () => {
        expect(calculateQuizXP(100, 100, 50, 100)).toBe(200)
    })

    it('handles different base XP values', () => {
        expect(calculateQuizXP(80, 250, 75, 150)).toBe(325)
    })

    it('handles zero base XP with bonus', () => {
        expect(calculateQuizXP(100, 0, 50, 100)).toBe(100)
    })

    it('handles zero bonus values', () => {
        expect(calculateQuizXP(100, 100, 0, 0)).toBe(100)
    })

    it('handles large XP values', () => {
        expect(calculateQuizXP(100, 10000, 5000, 10000)).toBe(20000)
    })

    it('handles 80% bonus with large values', () => {
        expect(calculateQuizXP(85, 500, 500, 1000)).toBe(1000)
    })
})
