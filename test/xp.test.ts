import { describe, it, expect } from 'vitest'
import { getRank, xpToNextRank, rankProgressPercent, calculateQuizXP } from '@/lib/xp'

describe('getRank', () => {
    it('returns beginner for 0 XP', () => {
        expect(getRank(0)).toBe('beginner')
    })

    it('returns explorer at 500 XP', () => {
        expect(getRank(500)).toBe('explorer')
    })

    it('returns practitioner at 2000 XP', () => {
        expect(getRank(2000)).toBe('practitioner')
    })

    it('returns designer at 5000 XP', () => {
        expect(getRank(5000)).toBe('designer')
    })

    it('returns master at 10000 XP', () => {
        expect(getRank(10000)).toBe('master')
    })
})

describe('xpToNextRank', () => {
    it('returns XP needed for next rank', () => {
        const result = xpToNextRank(100)
        expect(result).not.toBeNull()
        expect(result!.nextRank).toBe('explorer')
        expect(result!.xpNeeded).toBe(400)
    })

    it('returns null for master', () => {
        expect(xpToNextRank(15000)).toBeNull()
    })
})

describe('rankProgressPercent', () => {
    it('returns 0 at start of beginner', () => {
        expect(rankProgressPercent(0)).toBe(0)
    })

    it('returns 50 halfway through beginner', () => {
        expect(rankProgressPercent(250)).toBe(50)
    })

    it('returns 100 for master', () => {
        expect(rankProgressPercent(10000)).toBe(100)
    })
})

describe('calculateQuizXP', () => {
    it('returns base XP for failing score', () => {
        expect(calculateQuizXP(70, 100, 50, 100)).toBe(100)
    })

    it('adds 80% bonus for score >= 80', () => {
        expect(calculateQuizXP(85, 100, 50, 100)).toBe(150)
    })

    it('adds 100% bonus for perfect score', () => {
        expect(calculateQuizXP(100, 100, 50, 100)).toBe(200)
    })
})
