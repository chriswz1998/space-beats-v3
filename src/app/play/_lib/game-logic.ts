// Enums are used at runtime, so avoid type-only imports.
import { GameState, JudgmentType } from './types'
// These are type-only imports.
import type {
  GemData,
  ActiveGem,
  JudgmentResult,
  GameStats,
  GameConfig,
  GameEvent
} from './types'
import { DEFAULT_GAME_CONFIG, JUDGMENT_SCORES, HP_DAMAGE } from './game-config'

/**
 * Game logic class.
 * Handles state, judgment, scoring, and stats.
 * Does not handle rendering, input, or animation.
 */
export class GameLogic {
  private state: GameState = GameState.WAITING
  private config: GameConfig
  private stats: GameStats
  private activeGems: Map<string, ActiveGem> = new Map()
  private gemQueue: GemData[] = [] // Queue of gems to spawn
  private nextGemIndex: number = 0 // Next gem index to spawn
  private currentMusicTime: number = 0 // Current music time (seconds)
  private startTime: number = 0 // Game start timestamp
  private eventListeners: Array<(event: GameEvent) => void> = []

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config
    this.stats = this.initStats()
  }

  /**
   * Initialize stats.
   */
  private initStats(): GameStats {
    return {
      score: 0,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      maxCombo: 0,
      currentCombo: 0,
      resonanceIntegrity: this.config.initialHP,
      accuracy: 0
    }
  }

  /**
   * Register an event listener.
   */
  onEvent(callback: (event: GameEvent) => void): () => void {
    this.eventListeners.push(callback)
    return () => {
      const index = this.eventListeners.indexOf(callback)
      if (index > -1) {
        this.eventListeners.splice(index, 1)
      }
    }
  }

  /**
   * Emit an event.
   */
  private emitEvent(event: GameEvent): void {
    this.eventListeners.forEach(callback => callback(event))
  }

  /**
   * Load chart data.
   */
  loadChart(gemDataArray: GemData[]): void {
    // Sort by time
    this.gemQueue = gemDataArray.sort((a, b) => a.time - b.time)
    this.nextGemIndex = 0
  }

  /**
   * Start the game.
   */
  startGame(startTime: number): void {
    this.state = GameState.COUNTDOWN
    this.startTime = startTime
    this.stats = this.initStats()
    this.activeGems.clear()
    this.nextGemIndex = 0
  }

  /**
   * Enter playing state.
   */
  startPlaying(): void {
    this.state = GameState.PLAYING
  }

  /**
   * Pause the game.
   */
  pauseGame(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED
    }
  }

  /**
   * Resume the game.
   */
  resumeGame(): void {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING
    }
  }

  /**
   * Mark the game as victory.
   */
  setVictory(): void {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.VICTORY
    }
  }

  /**
   * Update music time.
   */
  updateTime(musicTime: number): void {
    this.currentMusicTime = musicTime
  }

  /**
   * Get gems to spawn.
   * Uses current time and fall speed to determine spawn window.
   */
  getGemsToSpawn(currentTime: number): GemData[] {
    if (this.state !== GameState.PLAYING) {
      return []
    }

    const gemsToSpawn: GemData[] = []
    const { gemFallSpeed, judgmentLineY } = this.config

    // Spawn so the gem reaches the judgment line at time T.
    // T(spawn) = T(music) - (Distance / velocity)
    const spawnTimeOffset = judgmentLineY / gemFallSpeed

    const spawnWindow = 0.1
    while (this.nextGemIndex < this.gemQueue.length) {
      const gem = this.gemQueue[this.nextGemIndex]
      const spawnTime = gem.time - spawnTimeOffset

      // Stop when outside the spawn window.
      if (spawnTime > currentTime + spawnWindow) {
        break
      }

      // Spawn within window and advance the index.
      gemsToSpawn.push(gem)
      this.nextGemIndex++
    }

    return gemsToSpawn
  }

  /**
   * Register a newly spawned gem.
   */
  registerGem(gemData: GemData, sprite: any | null): ActiveGem {
    // Generate a unique ID if missing.
    const id = gemData.id || `gem_${gemData.time.toFixed(3)}_${gemData.lane}_${Math.random().toString(36).substr(2, 9)}`
    
    // Ensure gemData has an id.
    const gemDataWithId: GemData = { ...gemData, id }
    
    const activeGem: ActiveGem = {
      id,
      sprite,
      gemData: gemDataWithId,
      spawnTime: this.currentMusicTime,
      isHit: false
    }

    this.activeGems.set(activeGem.id, activeGem)
    this.emitEvent({ type: 'gem_spawned', data: activeGem })
    return activeGem
  }

  /**
   * Compute the gem's current Y position.
   */
  calculateGemY(gem: ActiveGem, currentTime: number): number {
    const { gemFallSpeed, judgmentLineY } = this.config
    // Fall from the spawn position.
    const fallDistance = (currentTime - gem.spawnTime) * gemFallSpeed
    // Spawn position at the top of the screen.
    const startY = 0
    return startY + fallDistance
  }

  /**
   * Check if the gem should be removed (past screen bottom).
   */
  shouldRemoveGem(gem: ActiveGem, currentY: number, canvasHeight: number): boolean {
    return currentY > canvasHeight + 100 // Remove after 100px below screen
  }

  /**
   * Handle key judgment.
   * @param lane Lane index: 0, 1, 2
   * @param currentTime Current time
   */
  judgeHit(lane: number, currentTime: number): JudgmentResult | null {
    if (this.state !== GameState.PLAYING) {
      return null
    }

    // Find the closest unhit gem to the judgment line.
    let closestGem: ActiveGem | null = null
    let closestDistance = Infinity
    const { judgmentLineY } = this.config

    for (const gem of this.activeGems.values()) {
      if (gem.isHit || gem.gemData.lane !== lane) {
        continue
      }

      const currentY = this.calculateGemY(gem, currentTime)
      const distance = Math.abs(currentY - judgmentLineY)

      if (distance < closestDistance) {
        closestDistance = distance
        closestGem = gem
      }
    }

    // Return null if no gem or too far away.
    if (!closestGem || closestDistance > this.config.goodThreshold) {
      return null
    }

    // Determine judgment type.
    let judgmentType: JudgmentType
    if (closestDistance <= this.config.perfectThreshold) {
      judgmentType = JudgmentType.PERFECT
    } else {
      judgmentType = JudgmentType.GOOD
    }

    // Mark as hit.
    closestGem.isHit = true
    closestGem.judgment = judgmentType

    // Update stats.
    const score = JUDGMENT_SCORES[judgmentType]
    this.stats.score += score
    if (judgmentType === JudgmentType.PERFECT) {
      this.stats.perfectCount++
    } else {
      this.stats.goodCount++
    }
    this.stats.currentCombo++
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.currentCombo)
    this.updateAccuracy()

    this.emitEvent({
      type: 'judgment',
      data: { gem: closestGem, judgment: judgmentType, distance: closestDistance, score }
    })

    return {
      type: judgmentType,
      distance: closestDistance,
      score
    }
  }

  /**
   * Check and mark missed gems.
   * Called every frame to detect overdue gems.
   */
  checkMissedGems(currentTime: number): void {
    if (this.state !== GameState.PLAYING) {
      return
    }

    const { judgmentLineY } = this.config
    const missThreshold = 100 // 100px past line counts as miss

    for (const gem of this.activeGems.values()) {
      if (gem.isHit) {
        continue
      }

      const currentY = this.calculateGemY(gem, currentTime)
      const distance = currentY - judgmentLineY

      // Gem passed the line beyond the threshold.
      if (distance > missThreshold) {
        this.markGemMissed(gem)
      }
    }
  }

  /**
   * Force-mark a gem as miss (offscreen or timeout).
   */
  markGemMissed(gem: ActiveGem): void {
    if (gem.isHit || this.state !== GameState.PLAYING) {
      return
    }

    gem.isHit = true
    gem.judgment = JudgmentType.MISS

    // Update stats.
    this.stats.missCount++
    this.stats.currentCombo = 0 // Combo breaks on miss
    this.stats.resonanceIntegrity = Math.max(
      0,
      this.stats.resonanceIntegrity - HP_DAMAGE.MISS
    )
    this.updateAccuracy()

    this.emitEvent({
      type: 'gem_missed',
      data: { gem, judgment: JudgmentType.MISS }
    })

    // End the game when HP reaches 0.
    if (this.stats.resonanceIntegrity <= 0) {
      this.state = GameState.GAMEOVER
      this.emitEvent({ type: 'game_over', data: { reason: 'hp_zero' } })
    }
  }

  /**
   * Remove a hit gem.
   */
  removeGem(gemId: string): void {
    this.activeGems.delete(gemId)
  }

  /**
   * Get all active gems.
   */
  getActiveGems(): ActiveGem[] {
    return Array.from(this.activeGems.values())
  }

  /**
   * Get current music time.
   */
  getCurrentMusicTime(): number {
    return this.currentMusicTime
  }

  /**
   * Update accuracy.
   */
  private updateAccuracy(): void {
    const totalHits = this.stats.perfectCount + this.stats.goodCount + this.stats.missCount
    if (totalHits > 0) {
      const correctHits = this.stats.perfectCount + this.stats.goodCount
      this.stats.accuracy = correctHits / totalHits
    }
  }

  /**
   * Getters.
   */
  getState(): GameState {
    return this.state
  }

  getStats(): GameStats {
    return { ...this.stats }
  }

  getConfig(): GameConfig {
    return { ...this.config }
  }

  /**
   * Check if the game is complete (all gems processed).
   */
  checkGameComplete(totalGems: number): boolean {
    const processedGems =
      this.stats.perfectCount + this.stats.goodCount + this.stats.missCount
    return processedGems >= totalGems && this.state === GameState.PLAYING
  }
}
