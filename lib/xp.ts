import { type Rank, RANK_THRESHOLDS } from '@/types'

/**
 * Calculate the user's current rank based on total XP.
 */
export function getRank(totalXP: number): Rank {
    if (totalXP >= RANK_THRESHOLDS.master) return 'master'
    if (totalXP >= RANK_THRESHOLDS.designer) return 'designer'
    if (totalXP >= RANK_THRESHOLDS.practitioner) return 'practitioner'
    if (totalXP >= RANK_THRESHOLDS.explorer) return 'explorer'
    return 'beginner'
}

/**
 * Get XP required to reach the next rank.
 */
export function xpToNextRank(totalXP: number): { nextRank: Rank; xpNeeded: number } | null {
    const ranks: Rank[] = ['beginner', 'explorer', 'practitioner', 'designer', 'master']
    const currentRank = getRank(totalXP)
    const currentIndex = ranks.indexOf(currentRank)
    if (currentIndex === ranks.length - 1) return null

    const nextRank = ranks[currentIndex + 1]
    return {
        nextRank,
        xpNeeded: RANK_THRESHOLDS[nextRank] - totalXP,
    }
}

/**
 * Calculate XP progress toward next rank as a percentage (0–100).
 */
export function rankProgressPercent(totalXP: number): number {
    const current = getRank(totalXP)
    const ranks: Rank[] = ['beginner', 'explorer', 'practitioner', 'designer', 'master']
    const idx = ranks.indexOf(current)
    if (idx === ranks.length - 1) return 100

    const currentThreshold = RANK_THRESHOLDS[current]
    const nextThreshold = RANK_THRESHOLDS[ranks[idx + 1]]
    return Math.round(((totalXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
}

/**
 * Calculate quiz XP including bonuses.
 */
export function calculateQuizXP(
    scorePct: number,
    xpBase: number,
    xpBonus80: number,
    xpBonus100: number
): number {
    let xp = xpBase
    if (scorePct >= 100) xp += xpBonus100
    else if (scorePct >= 80) xp += xpBonus80
    return xp
}
