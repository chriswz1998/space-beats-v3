/**
 * Game-related type definitions.
 */

// Game state
export enum GameState {
  WAITING = 'WAITING', // Waiting to start
  COUNTDOWN = 'COUNTDOWN', // Countdown
  PLAYING = 'PLAYING', // Playing
  PAUSED = 'PAUSED', // Paused
  GAMEOVER = 'GAMEOVER', // Game over
  VICTORY = 'VICTORY' // Completed
}

// Judgment type
export enum JudgmentType {
  PERFECT = 'PERFECT',
  GOOD = 'GOOD',
  MISS = 'MISS'
}

// Gem data
export interface GemData {
  id?: string // Optional, auto-generated if missing
  time: number // Music timestamp (seconds)
  lane: number // Lane 0, 1, 2
  type: 'score' | 'tap' | string // Gem type
}

// Active gem instance
export interface ActiveGem {
  id: string
  sprite: any | null // Use any to avoid Phaser type issues
  gemData: GemData
  spawnTime: number // Spawn time
  isHit: boolean // Already hit
  judgment?: JudgmentType // Judgment result
}

// Judgment result
export interface JudgmentResult {
  type: JudgmentType
  distance: number // Distance to the judgment line (px)
  score: number // Awarded score
}

// Game stats
export interface GameStats {
  score: number
  perfectCount: number
  goodCount: number
  missCount: number
  maxCombo: number
  currentCombo: number
  resonanceIntegrity: number // HP 0-100
  accuracy: number // Accuracy 0-1
}

// Game config
export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  judgmentLineY: number // Judgment line Y (px)
  gemFallSpeed: number // Gem fall speed px/s
  perfectThreshold: number // PERFECT threshold (px)
  goodThreshold: number // GOOD threshold (px)
  laneCount: number // Lane count
  initialHP: number // Starting HP
}

// Game events
export interface GameEvent {
  type: 'judgment' | 'gem_spawned' | 'gem_missed' | 'combo_break' | 'hp_changed' | 'game_over'
  data?: any
}
