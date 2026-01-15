import type { GameConfig } from './types'

/**
 * Game configuration constants.
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvasWidth: 1920,
  canvasHeight: 1080,
  judgmentLineY: 1100, // Judgment line Y (tuned for visuals)
  gemFallSpeed: 500, // 500px/s
  perfectThreshold: 50, // Within 50px is PERFECT
  goodThreshold: 120, // Within 120px is GOOD
  laneCount: 3, // Three lanes
  initialHP: 100 // Starting HP 100%
}

/**
 * Judgment scores.
 */
export const JUDGMENT_SCORES = {
  PERFECT: 100,
  GOOD: 30,
  MISS: 0
}

/**
 * HP loss.
 */
export const HP_DAMAGE = {
  MISS: 10 // 10% HP loss per miss
}

/**
 * Lane position calculation.
 * Split width into three lanes.
 */
export function getLaneX(lane: number, canvasWidth: number): number {
  const laneWidth = canvasWidth / 3
  return laneWidth * lane + laneWidth / 2 // Lane center X
}
