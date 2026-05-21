import { describe, it, expect } from 'vitest'
import { RANK_THRESHOLDS, RANK_LABELS } from '@/types'

describe('Rank constants', () => {
    it('has correct thresholds in order', () => {
        expect(RANK_THRESHOLDS.beginner).toBe(0)
        expect(RANK_THRESHOLDS.explorer).toBe(500)
        expect(RANK_THRESHOLDS.practitioner).toBe(2000)
        expect(RANK_THRESHOLDS.designer).toBe(5000)
        expect(RANK_THRESHOLDS.master).toBe(10000)
    })

    it('has labels for all ranks', () => {
        const ranks = ['beginner', 'explorer', 'practitioner', 'designer', 'master'] as const
        ranks.forEach((rank) => {
            expect(RANK_LABELS[rank]).toBeTruthy()
        })
    })
})
