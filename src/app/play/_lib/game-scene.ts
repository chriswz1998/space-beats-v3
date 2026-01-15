import { GameLogic } from './game-logic'
import { GameBehavior } from './game-behavior'
import type { GameConfig } from './types'
import { DEFAULT_GAME_CONFIG } from './game-config'

/**
 * Create the GameScene class (runtime).
 * Must be called after Phaser is loaded.
 */
export function createGameSceneClass(Phaser: any): any {
  class GameSceneClass extends Phaser.Scene {
    private gameLogic!: GameLogic
    private gameBehavior!: GameBehavior
    private config: GameConfig

    // Game loop
    private musicTime: number = 0
    private isPlaying: boolean = false

    // Audio
    private musicUrl: string = ''
    private musicSound: any = null
    private musicStartTime: number = 0 // Timestamp when audio starts

    // Callbacks
    private onStatsUpdateCallback?: (stats: any) => void
    private onGameOverCallback?: (stats: any) => void

    // Chart info
    private totalGems: number = 0

    constructor() {
      super({ key: 'GameScene' })
      this.config = DEFAULT_GAME_CONFIG
      console.log('[GameScene] Constructor completed')
    }

    /**
     * Preload audio.
     */
    preload(): void {
      console.log('[GameScene] preload() called')
      // Audio is loaded dynamically in loadMusic().
    }

    /**
     * Load music.
     */
    loadMusic(url: string): void {
      this.musicUrl = url
      console.log('[GameScene] Loading music from:', url)

      // Check cache first
      if (this.cache.audio.exists('gameMusic')) {
        console.log('[GameScene] Music already in cache')
        return
      }

      // Load audio via Phaser loader
      this.load.audio('gameMusic', url)

      // Listen for load completion
      this.load.once('filecomplete-audio-gameMusic', () => {
        console.log('[GameScene] Music loaded successfully')
      })

      // Listen for load errors
      this.load.once('loaderror', (file: any) => {
        console.error('[GameScene] Music load error:', file)
      })

      // Start loading
      this.load.start()
    }

    /**
     * Scene creation.
     */
    create(): void {
      console.log('[GameScene] create() called')
      // Initialize game logic
      this.gameLogic = new GameLogic(this.config)
      console.log('[GameScene] GameLogic initialized')

      // Initialize game behavior
      this.gameBehavior = new GameBehavior(this, this.gameLogic, this.config)
      this.gameBehavior.init()
      console.log('[GameScene] GameBehavior initialized')

      // Listen to game events
      this.gameLogic.onEvent((event) => {
        switch (event.type) {
          case 'judgment':
            const { gem, judgment } = event.data
            if (gem.sprite) {
              const x = gem.sprite.x
              const y = gem.sprite.y
              this.gameBehavior.showJudgmentEffect(
                gem.gemData.lane,
                judgment,
                x,
                y
              )
              this.gameBehavior.removeGemSprite(gem.id)
              this.gameLogic.removeGem(gem.id)
            }
            this.updateStats()
            break

          case 'gem_missed':
            const missedGem = event.data.gem
            if (missedGem.sprite) {
              this.gameBehavior.showJudgmentEffect(
                missedGem.gemData.lane,
                'MISS',
                missedGem.sprite.x,
                missedGem.sprite.y
              )
              this.gameBehavior.removeGemSprite(missedGem.id)
              this.gameLogic.removeGem(missedGem.id)
            }
            this.updateStats()
            break

          case 'game_over':
            this.handleGameOver()
            break
        }
      })

      // Set behavior callbacks
      this.gameBehavior.onJudgment((result) => {
        // Judgment callback is handled via events
      })

      this.gameBehavior.onPause(() => {
        this.togglePause()
      })

      // Set input listeners
      this.input.keyboard?.on('keydown-ESC', () => {
        this.togglePause()
      })
    }

    /**
     * Load chart data.
     */
    loadChart(gemDataArray: any[]): void {
      this.gameLogic.loadChart(gemDataArray)
      this.totalGems = Array.isArray(gemDataArray) ? gemDataArray.length : 0
    }

    /**
     * Set music URL (after chart is loaded).
     */
    setMusicUrl(url: string): void {
      this.musicUrl = url
      console.log('[GameScene] Music URL set:', url)

      // If the scene is active, load audio immediately
      if (this.scene && this.scene.isActive()) {
        this.loadMusic(url)
      }
    }

    /**
     * Start the game.
     */
    startGame(): void {
      this.musicTime = 0
      this.gameLogic.startGame(this.time.now)

      // Check whether audio is loaded
      if (this.cache.audio.exists('gameMusic')) {
        console.log('[GameScene] Audio found in cache, starting playback')
        // Play after 3s to align with countdown
        this.time.delayedCall(3000, () => {
          this.playMusic()
        })
      } else {
        console.log('[GameScene] Audio not yet loaded, waiting...')
        // Wait for audio to finish loading
        this.load.once('complete', () => {
          console.log('[GameScene] Audio loading complete')
          // Play after 3s to align with countdown
          this.time.delayedCall(3000, () => {
            this.playMusic()
          })
        })
      }

      // Begin playing after 3s countdown
      this.time.delayedCall(3000, () => {
        this.gameLogic.startPlaying()
        this.isPlaying = true
        this.updateStats()
      })
    }

    /**
     * Play music.
     */
    private playMusic(): void {
      if (this.musicSound) {
        // Stop if already playing
        this.musicSound.stop()
      }

      try {
        // Create audio object
        this.musicSound = this.sound.add('gameMusic', {
          volume: 1,
          loop: false
        })

        // Play audio
        this.musicSound.play()
        this.musicStartTime = this.time.now
        console.log(
          '[GameScene] Music playback started at:',
          this.musicStartTime
        )
      } catch (error) {
        console.error('[GameScene] Error playing music:', error)
      }
    }

    /**
     * Pause or resume.
     */
    togglePause(): void {
      if (this.gameLogic.getState() === 'PLAYING') {
        this.gameLogic.pauseGame()
        this.isPlaying = false

        // Pause audio
        if (this.musicSound && this.musicSound.isPlaying) {
          this.musicSound.pause()
          console.log('[GameScene] Music paused')
        }
        this.updateStats()
      } else if (this.gameLogic.getState() === 'PAUSED') {
        this.gameLogic.resumeGame()
        this.isPlaying = true

        // Resume audio
        if (this.musicSound) {
          this.musicSound.resume()
          console.log('[GameScene] Music resumed')
        }
        this.updateStats()
      }
    }

    /**
     * Update stats.
     */
    private updateStats(): void {
      if (this.onStatsUpdateCallback) {
        this.onStatsUpdateCallback(this.gameLogic.getStats())
      }
    }

    /**
     * Handle game over.
     */
    private handleGameOver(): void {
      this.isPlaying = false
      const stats = this.gameLogic.getStats()
      if (this.onGameOverCallback) {
        this.onGameOverCallback(stats)
      }
    }

    /**
     * Set callbacks.
     */
    onStatsUpdate(callback: (stats: any) => void): void {
      this.onStatsUpdateCallback = callback
    }

    onGameOver(callback: (stats: any) => void): void {
      this.onGameOverCallback = callback
    }

    /**
     * Game loop update.
     */
    update(time: number, delta: number): void {
      if (!this.isPlaying || this.gameLogic.getState() !== 'PLAYING') {
        return
      }

      // Get accurate time from audio player
      if (this.musicSound && this.musicSound.isPlaying) {
        // Use Phaser audio seek to get playback position (seconds)
        try {
          this.musicTime = this.musicSound.seek || 0
        } catch (e) {
          // Fallback to time delta if seek unavailable
          this.musicTime = (time - this.musicStartTime) / 1000
        }
      } else {
        // Simulate time when no audio
        this.musicTime += delta / 1000
      }

      this.gameLogic.updateTime(this.musicTime)

      // Spawn new gems
      const gemsToSpawn = this.gameLogic.getGemsToSpawn(this.musicTime)
      for (const gemData of gemsToSpawn) {
        const activeGem = this.gameLogic.registerGem(gemData, null)
        const sprite = this.gameBehavior.createGemSprite(activeGem)
        activeGem.sprite = sprite
      }

      // Update positions for all active gems
      const activeGems = this.gameLogic.getActiveGems()
      for (const gem of activeGems) {
        const y = this.gameLogic.calculateGemY(gem, this.musicTime)
        this.gameBehavior.updateGemPosition(gem, y)

        // Remove if offscreen
        const { height } = this.scale
        if (this.gameLogic.shouldRemoveGem(gem, y, height)) {
          if (!gem.isHit) {
            // Unhit gems count as miss (stats + events)
            this.gameLogic.markGemMissed(gem)
          }
        }
      }

      // Check for missed gems
      this.gameLogic.checkMissedGems(this.musicTime)

      // Check for completion (victory)
      if (this.totalGems > 0 && this.gameLogic.checkGameComplete(this.totalGems)) {
        this.isPlaying = false
        this.gameLogic.setVictory()
        if (this.musicSound && this.musicSound.isPlaying) {
          this.musicSound.stop()
        }
        this.updateStats()
        return
      }

      // Update stats periodically
      if (time % 100 < delta) {
        // Update every 100ms
        this.updateStats()
      }
    }

    /**
     * Scene teardown.
     */
    destroy(): void {
      // Stop and destroy audio
      if (this.musicSound) {
        this.musicSound.stop()
        this.musicSound.destroy()
        this.musicSound = null
      }

      this.gameBehavior?.destroy()
      super.destroy()
    }

    /**
     * Get game logic instance.
     */
    getGameLogic(): GameLogic {
      return this.gameLogic
    }

    /**
     * Get music progress (0-1).
     */
    getMusicProgress(): number {
      if (!this.musicSound) {
        return 0
      }

      const duration =
        typeof this.musicSound.duration === 'number' ? this.musicSound.duration : 0
      if (duration <= 0) {
        return 0
      }

      const current = Math.max(0, this.musicTime)
      return Math.min(1, current / duration)
    }
  }

  return GameSceneClass
}

// Export a placeholder type (replaced at runtime)
export type GameScene = any
