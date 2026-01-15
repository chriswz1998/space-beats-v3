import type {
  ActiveGem,
  JudgmentResult,
  GameStats,
  GameState,
  GameConfig
} from './types'
import { getLaneX } from './game-config'
import type { GameLogic } from './game-logic'

/**
 * Game behavior class.
 * Handles rendering, input, animation, and visuals.
 * Does not handle game logic, judgment, or stats.
 */
export class GameBehavior {
  private scene: any // Use any to avoid Phaser type issues
  private logic: GameLogic
  private config: GameConfig

  // Render objects
  private backgroundLayer: any | null = null
  private backgroundDots: any | null = null
  private judgmentLine: any | null = null
  private lanes: any[] = []
  private keyIndicators: any[] = []
  private gemSprites: Map<string, any> = new Map()
  private gemPool: any[] = []

  // Input
  private keys: {
    Q: any | null
    W: any | null
    E: any | null
    ESC: any | null
  } = {
    Q: null,
    W: null,
    E: null,
    ESC: null
  }

  // Callbacks
  private onJudgmentCallback?: (result: JudgmentResult) => void
  private onPauseCallback?: () => void
  private onGameOverCallback?: () => void

  constructor(scene: any, logic: GameLogic, config: GameConfig) {
    this.scene = scene
    this.logic = logic
    this.config = config
  }

  /**
   * Initialize rendering.
   */
  init(): void {
    console.log('[GameBehavior] Initializing...')
    
    try {
      if (!this.scene) {
        throw new Error('Scene is not available')
      }
      
      this.createBackground()
      this.createLanes()
      this.createJudgmentLine()
      this.createKeyIndicators()
      this.setupInput()
      console.log('[GameBehavior] Initialization complete')
    } catch (error) {
      console.error('[GameBehavior] Error during initialization:', error)
      throw error
    }
  }

  /**
   * Create background.
   */
  private createBackground(): void {
    const { width, height } = this.scene.scale
    const bg = this.scene.add.graphics()
    bg.setDepth(-20)

    // Pop art three-tone background (reduced brightness)
    bg.fillStyle(0xe2d2a1, 1)
    bg.fillRect(0, 0, width * 0.33, height)
    bg.fillStyle(0xd5b2c4, 1)
    bg.fillRect(width * 0.33, 0, width * 0.34, height)
    bg.fillStyle(0xaab7d6, 1)
    bg.fillRect(width * 0.67, 0, width * 0.33, height)

    // Thick black border for comic feel
    bg.lineStyle(6, 0x000000, 1)
    bg.strokeRect(3, 3, width - 6, height - 6)

    // Halftone dots
    const dots = this.scene.add.graphics()
    dots.setDepth(-19)
    dots.fillStyle(0x000000, 0.1)
    const dotStep = 26
    for (let y = 12; y < height; y += dotStep) {
      for (let x = 12; x < width; x += dotStep) {
        dots.fillCircle(x, y, 3)
      }
    }

    this.backgroundLayer = bg
    this.backgroundDots = dots
  }

  /**
   * Create lane separators.
   */
  private createLanes(): void {
    const { width } = this.scene.scale
    const laneWidth = width / this.config.laneCount

    for (let i = 1; i < this.config.laneCount; i++) {
      const x = laneWidth * i
      const line = this.scene.add.line(
        0,
        0,
        x,
        0,
        x,
        this.scene.scale.height,
        0x333333,
        0.5
      )
      line.setOrigin(0, 0)
      line.setLineWidth(2)
      this.lanes.push(line)
    }
  }

  /**
   * Create the judgment line.
   */
  private createJudgmentLine(): void {
    const { width } = this.scene.scale
    const y = this.config.judgmentLineY

    // Glowing judgment line
    this.judgmentLine = this.scene.add.line(
      0,
      0,
      0,
      y,
      width,
      y,
      0x00ffff,
      1
    )
    this.judgmentLine.setOrigin(0, 0)
    this.judgmentLine.setLineWidth(4)

    // Add glow via tween
    this.scene.tweens.add({
      targets: this.judgmentLine,
      alpha: { from: 0.5, to: 1 },
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  /**
   * Create key indicators.
   */
  private createKeyIndicators(): void {
    const { width, height } = this.scene.scale
    const laneWidth = width / this.config.laneCount
    const indicatorY = height - 100
    const indicatorSize = 80

    for (let i = 0; i < this.config.laneCount; i++) {
      const x = getLaneX(i, width)
      const indicator = this.scene.add.rectangle(
        x,
        indicatorY,
        indicatorSize,
        indicatorSize,
        0x444444
      )
      indicator.setStrokeStyle(3, 0x888888)

      // Add label text
      const keyLabel = ['Q', 'W', 'E'][i]
      const label = this.scene.add.text(x, indicatorY, keyLabel, {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial'
      })
      label.setOrigin(0.5)

      this.keyIndicators.push(indicator)
    }
  }

  /**
   * Set up input.
   */
  private setupInput(): void {
    this.keys.Q = this.scene.input.keyboard?.addKey('Q') || null
    this.keys.W = this.scene.input.keyboard?.addKey('W') || null
    this.keys.E = this.scene.input.keyboard?.addKey('E') || null
    this.keys.ESC = this.scene.input.keyboard?.addKey('ESC') || null

    // Listen for key events
    this.keys.Q?.on('down', () => this.handleKeyPress(0))
    this.keys.W?.on('down', () => this.handleKeyPress(1))
    this.keys.E?.on('down', () => this.handleKeyPress(2))
    this.keys.ESC?.on('down', () => {
      if (this.onPauseCallback) {
        this.onPauseCallback()
      }
    })
  }

  /**
   * Handle key press.
   */
  private handleKeyPress(lane: number): void {
    // Get current music time from GameLogic
    const currentTime = this.logic.getCurrentMusicTime()
    const result = this.logic.judgeHit(lane, currentTime)

    if (result) {
      // Highlight the key
      this.highlightKey(lane)

      // Trigger judgment callback
      if (this.onJudgmentCallback) {
        this.onJudgmentCallback(result)
      }
    }
  }

  /**
   * Highlight a key.
   */
  private highlightKey(lane: number): void {
    const indicator = this.keyIndicators[lane]
    if (!indicator) return

    const originalColor = indicator.fillColor
    indicator.setFillStyle(0x00ff00) // Green highlight

    this.scene.tweens.add({
      targets: indicator,
      props: {
        fillColor: { from: 0x00ff00, to: originalColor }
      },
      duration: 150,
      ease: 'Power2'
    })
  }

  /**
   * Create a gem sprite.
   */
  createGemSprite(activeGem: ActiveGem): any {
    const { width } = this.scene.scale
    const laneX = getLaneX(activeGem.gemData.lane, width)

    // Create a pop art gem (bigger, bold outline, bright accents)
    const textureKey = 'gemPop'
    if (!this.scene.textures.exists(textureKey)) {
      const size = 72
      const center = size / 2
      const graphics = this.scene.add.graphics()

      // Outer ring and outline
      graphics.fillStyle(0xffdd00, 1)
      graphics.fillCircle(center, center, 28)
      graphics.lineStyle(6, 0x000000, 1)
      graphics.strokeCircle(center, center, 28)

      // Inner highlight
      graphics.fillStyle(0xff6bd6, 1)
      graphics.fillCircle(center, center, 18)
      graphics.lineStyle(4, 0x000000, 1)
      graphics.strokeCircle(center, center, 18)

      // Highlights
      graphics.fillStyle(0xffffff, 1)
      graphics.fillCircle(center - 10, center - 10, 6)
      graphics.fillCircle(center + 12, center - 6, 3)

      // Grainy accents
      graphics.fillStyle(0x000000, 1)
      graphics.fillCircle(center - 16, center + 12, 2)
      graphics.fillCircle(center + 16, center + 10, 2)
      graphics.fillCircle(center + 6, center + 18, 2)

      graphics.generateTexture(textureKey, size, size)
      graphics.destroy()
    }

    let sprite = this.gemPool.pop()
    if (sprite) {
      sprite.setTexture(textureKey)
      sprite.setPosition(laneX, 0)
      sprite.setActive(true)
      sprite.setVisible(true)
    } else {
      sprite = this.scene.add.sprite(laneX, 0, textureKey)
    }
    sprite.setOrigin(0.5, 0.5)

    this.gemSprites.set(activeGem.id, sprite)
    activeGem.sprite = sprite

    return sprite
  }

  /**
   * Update gem position.
   */
  updateGemPosition(gem: ActiveGem, y: number): void {
    const sprite = this.gemSprites.get(gem.id)
    if (sprite) {
      sprite.setY(y)
    }
  }

  /**
   * Remove gem sprite.
   */
  removeGemSprite(gemId: string): void {
    const sprite = this.gemSprites.get(gemId)
    if (sprite) {
      sprite.setActive(false)
      sprite.setVisible(false)
      sprite.setPosition(-9999, -9999)
      this.gemSprites.delete(gemId)
      this.gemPool.push(sprite)
    }
  }

  /**
   * Show judgment effects.
   */
  showJudgmentEffect(
    lane: number,
    judgment: 'PERFECT' | 'GOOD' | 'MISS',
    x: number,
    y: number
  ): void {
    const colors = {
      PERFECT: 0xffff00, // Yellow
      GOOD: 0x00ff00, // Green
      MISS: 0xff0000 // Red
    }

    const text = this.scene.add.text(x, y - 50, judgment, {
      fontSize: '48px',
      color: `#${colors[judgment].toString(16)}`,
      fontFamily: 'Arial',
      fontWeight: 'bold'
    })
    text.setOrigin(0.5)

    // Animate upward and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 150,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        text.destroy()
      }
    })

    // Extra explosion effect for PERFECT
    if (judgment === 'PERFECT') {
      this.createExplosionEffect(x, y, colors.PERFECT)
    }
  }

  /**
   * PERFECT explosion effect.
   */
  private createExplosionEffect(x: number, y: number, color: number): void {
    const textureKey = 'perfectParticlePop'
    if (!this.scene.textures.exists(textureKey)) {
      const size = 18
      const center = size / 2
      const gfx = this.scene.add.graphics()

      // Pop art particles: bright circles + black outline + highlights
      gfx.fillStyle(0xffdd00, 1)
      gfx.fillCircle(center, center, 6)
      gfx.lineStyle(2, 0x000000, 1)
      gfx.strokeCircle(center, center, 6)
      gfx.fillStyle(0xffffff, 1)
      gfx.fillCircle(center - 2, center - 3, 2)

      gfx.generateTexture(textureKey, size, size)
      gfx.destroy()
    }

    const particles = this.scene.add.particles(0, 0, textureKey, {
      speed: { min: 260, max: 720 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 900,
      tint: color,
      blendMode: 'ADD'
    })

    // Explosive particle spread
    particles.explode(80, x, y)

    this.scene.time.delayedCall(1000, () => {
      particles.destroy()
    })
  }

  /**
   * Update background color (by progress).
   */
  updateBackgroundColor(progress: number): void {
    // 0-25%: Cyan, 25-50%: Purple, 50-75%: Yellow, 75-100%: Green
    let color: number
    if (progress < 0.25) {
      color = 0x00ffff // Cyan
    } else if (progress < 0.5) {
      color = 0x800080 // Purple
    } else if (progress < 0.75) {
      color = 0xffff00 // Yellow
    } else {
      color = 0x00ff00 // Green
    }

    // Update background color here using background references.
    // Left empty for now.
  }

  /**
   * Set callbacks.
   */
  onJudgment(callback: (result: JudgmentResult) => void): void {
    this.onJudgmentCallback = callback
  }

  onPause(callback: () => void): void {
    this.onPauseCallback = callback
  }

  onGameOver(callback: () => void): void {
    this.onGameOverCallback = callback
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.backgroundLayer) {
      this.backgroundLayer.destroy()
      this.backgroundLayer = null
    }
    if (this.backgroundDots) {
      this.backgroundDots.destroy()
      this.backgroundDots = null
    }
    this.gemSprites.forEach(sprite => sprite.destroy())
    this.gemSprites.clear()
    this.gemPool.forEach(sprite => sprite.destroy())
    this.gemPool = []
    this.keyIndicators.forEach(indicator => indicator.destroy())
    this.keyIndicators = []
    if (this.judgmentLine) {
      this.judgmentLine.destroy()
    }
    this.lanes.forEach(lane => lane.destroy())
    this.lanes = []
  }
}
