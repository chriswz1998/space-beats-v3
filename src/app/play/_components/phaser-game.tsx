'use client'

import { useEffect, useRef, useState } from 'react'
import type { GameStats, GameState } from '../_lib/types'
import { GameHUD } from './game-hud'
import { createGameSceneClass, GameScene } from '../_lib/game-scene'

interface PhaserGameProps {
  songData: any
  difficulty?: string
  roomId?: string
  onGameOver?: (stats: GameStats) => void
}

/**
 * Phaser game component (client-only).
 */
export default function PhaserGame({
  songData,
  difficulty,
  roomId,
  onGameOver
}: PhaserGameProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<any>(null)
  const sceneRef = useRef<GameScene | null>(null)
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const [gameState, setGameState] = useState<GameState>('WAITING')
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...')
  const [musicProgress, setMusicProgress] = useState<number>(0)
  const resizeHandlerRef = useRef<(() => void) | null>(null)
  const uploadKeyRef = useRef<string | null>(null)
  const [roomResult, setRoomResult] = useState<any | null>(null)
  const roomPollingRef = useRef<NodeJS.Timeout | null>(null)
  const roomSubmitKeyRef = useRef<string | null>(null)
  const lastStatsRef = useRef<GameStats | null>(null)

  useEffect(() => {
    if (!gameRef.current || !songData || typeof window === 'undefined') {
      return
    }

    let mounted = true
    let Phaser: any = null

    // Dynamically import Phaser (client-only).
    const initGame = async () => {
      try {
        setLoadingStatus('Loading Phaser...')
        // Attempt to import Phaser
        const phaserModule = await import('phaser')
        // Phaser 3.90.0 may use default or named export
        Phaser = phaserModule.default || phaserModule

        // Fallback to module itself if needed
        if (!Phaser || typeof Phaser !== 'object') {
          Phaser = phaserModule
        }

        if (!Phaser || !Phaser.Game) {
          setLoadingStatus('Error: Failed to load Phaser')
          return
        }
        // Expose Phaser on window for GameScene
        if (typeof window !== 'undefined') {
          ;(window as any).Phaser = Phaser
        }

        setLoadingStatus('Creating game instance...')

        if (!mounted || !gameRef.current) return

        // Get container size
        const container = gameRef.current
        const width = container.clientWidth || window.innerWidth
        const height = container.clientHeight || window.innerHeight

        // Create scene class after Phaser loads
        const GameSceneClass = createGameSceneClass(Phaser)

        // Create game config
        const config: any = {
          type: Phaser.AUTO,
          width,
          height,
          parent: container,
          backgroundColor: '#000000',
          scene: GameSceneClass, // Pass scene class
          physics: {
            default: 'arcade',
            arcade: {
              debug: false
            }
          },
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
          },
          // Disable options that may cause issues
          render: {
            antialias: true,
            pixelArt: false
          }
        }

        // Create Phaser game instance
        setLoadingStatus('Initializing Phaser game...')

        let game: any
        try {
          game = new Phaser.Game(config)
        } catch (error) {
          setLoadingStatus(
            `Error creating game: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          return
        }
        phaserGameRef.current = game

        setLoadingStatus('Waiting for scene...')

        // Wait for scene to be ready
        let checkCount = 0
        const checkScene = () => {
          if (!mounted) return

          checkCount++

          const scene = game.scene.getScene('GameScene')

          // Check scene readiness
          const isSceneReady =
            scene &&
            ((scene as any).scene?.isActive?.() ||
              (scene as any).sys?.isActive?.() ||
              game.scene.isActive('GameScene'))

          if (scene && isSceneReady) {
            const gameScene = scene as any // Use any to avoid type issues
            setLoadingStatus('Loading chart data...')
            sceneRef.current = gameScene

            // Load chart data by difficulty (default normal)
            const normalizedDifficulty = (difficulty || 'normal').toLowerCase()
            let chartData: any[] = []
            if (normalizedDifficulty === 'easy' && Array.isArray(songData.easyChart)) {
              chartData = songData.easyChart
            } else if (
              normalizedDifficulty === 'hard' &&
              Array.isArray(songData.hardChart)
            ) {
              chartData = songData.hardChart
            } else if (Array.isArray(songData.normalChart)) {
              chartData = songData.normalChart
            } else if (Array.isArray(songData.easyChart)) {
              chartData = songData.easyChart
            } else if (Array.isArray(songData.hardChart)) {
              chartData = songData.hardChart
            }

            if (chartData.length === 0) {
              setLoadingStatus('Error: No chart data')
              return
            }

            // Normalize data: {lane, time, type} -> GemData
            // Python analysis returns ms; convert to seconds
            const processedChartData = chartData.map((gem, index) => {
              // Convert ms to seconds (float)
              const timeInSeconds = gem.time / 1000

              return {
                id: `gem_${index}_${timeInSeconds.toFixed(3)}_${gem.lane}`,
                time: timeInSeconds,
                lane: gem.lane ?? 0,
                type: gem.type || 'score'
              }
            })

            // Check for loadChart method
            if (typeof gameScene.loadChart === 'function') {
              gameScene.loadChart(processedChartData)
            } else {
              setLoadingStatus('Error: Scene loadChart method not found')
              return
            }

            // Load music URL after scene init
            setTimeout(() => {
              if (songData.url && typeof gameScene.setMusicUrl === 'function') {
                console.log('[GameEngine] Setting music URL:', songData.url)
                gameScene.setMusicUrl(songData.url)
              } else {
                console.warn('[GameEngine] No music URL found in song data')
              }
            }, 500)

            // Set stats update callback
            if (typeof gameScene.onStatsUpdate === 'function') {
              gameScene.onStatsUpdate((stats: GameStats) => {
                if (mounted) {
                  setGameStats(stats as GameStats)
                  lastStatsRef.current = stats as GameStats
                  if (typeof gameScene.getGameLogic === 'function') {
                    setGameState(gameScene.getGameLogic().getState())
                  }
                  if (typeof gameScene.getMusicProgress === 'function') {
                    setMusicProgress(gameScene.getMusicProgress())
                  }
                }
              })
            }

            // Set game-over callback
            if (typeof gameScene.onGameOver === 'function') {
              gameScene.onGameOver((stats: GameStats) => {
                if (mounted) {
                  setGameStats(stats as GameStats)
                  lastStatsRef.current = stats as GameStats
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  setGameState('GAMEOVER')
                  if (onGameOver) {
                    onGameOver(stats as GameStats)
                  }
                }
              })
            }

            setLoadingStatus('Starting game...')
            // Delay start to allow resources to load
            setTimeout(() => {
              if (mounted) {
                if (typeof gameScene.startGame === 'function') {
                  gameScene.startGame()
                  setLoadingStatus('Game started!')
                  setTimeout(() => setLoadingStatus(''), 2000) // Hide loading status after 2s
                } else {
                  setLoadingStatus('Error: Scene startGame method not found')
                }
              }
            }, 500)
          } else {
            // Retry if scene is not ready
            if (mounted && checkCount < 50) {
              // Up to 50 tries (5s)
              setTimeout(checkScene, 100)
            } else {
              setLoadingStatus('Error: Scene initialization timeout')
            }
          }
        }

        // Start checking the scene
        checkScene()

        // Handle window resize
        const handleResize = () => {
          if (phaserGameRef.current && gameRef.current) {
            const container = gameRef.current
            const newWidth = container.clientWidth || window.innerWidth
            const newHeight = container.clientHeight || window.innerHeight
            phaserGameRef.current.scale.resize(newWidth, newHeight)
          }
        }

        window.addEventListener('resize', handleResize)
        resizeHandlerRef.current = handleResize
      } catch (error) {
        setLoadingStatus(
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    initGame()

    // Cleanup
    return () => {
      mounted = false

      // Remove resize listener
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current)
        resizeHandlerRef.current = null
      }

      // Destroy Phaser game instance
      if (phaserGameRef.current) {
        try {
          phaserGameRef.current.destroy(true)
        } catch (e) {
          console.error('Error destroying Phaser game:', e)
        }
        phaserGameRef.current = null
      }

      sceneRef.current = null
    }
  }, [songData, difficulty, onGameOver])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const scene = sceneRef.current as any
      if (scene && typeof scene.togglePause === 'function') {
        scene.togglePause()
        if (typeof scene.getGameLogic === 'function') {
          setGameState(scene.getGameLogic().getState())
        }
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  useEffect(() => {
    if (!gameStats || !songData) return
    if (gameState !== 'GAMEOVER' && gameState !== 'VICTORY') return

    const songId = songData.id
    if (!songId) return

    const totalHits =
      gameStats.perfectCount + gameStats.goodCount + gameStats.missCount
    const isFullCombo = totalHits > 0 && gameStats.missCount === 0
    const isAllPerfect =
      totalHits > 0 && gameStats.goodCount === 0 && gameStats.missCount === 0
    const isCleared = gameState === 'VICTORY'

    const uploadKey = `${songId}:${difficulty || 'normal'}:${gameState}:${gameStats.score}:${gameStats.perfectCount}:${gameStats.goodCount}:${gameStats.missCount}`
    if (uploadKeyRef.current === uploadKey) return
    uploadKeyRef.current = uploadKey

    const upload = async () => {
      try {
        await fetch('/api/achievement/song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId,
            score: gameStats.score,
            perfectCount: gameStats.perfectCount,
            goodCount: gameStats.goodCount,
            missCount: gameStats.missCount,
            isCleared,
            isFullCombo,
            isAllPerfect,
            difficulty
          })
        })
      } catch (error) {
        console.error('Failed to upload achievements:', error)
      }
    }

    upload()
  }, [gameState, gameStats, songData, difficulty])

  useEffect(() => {
    if (!roomId || !gameStats) return
    if (gameState !== 'GAMEOVER' && gameState !== 'VICTORY') return

    const submitKey = `${roomId}:${gameState}:${gameStats.score}:${gameStats.perfectCount}:${gameStats.goodCount}:${gameStats.missCount}`
    if (roomSubmitKeyRef.current === submitKey) {
      return
    }
    roomSubmitKeyRef.current = submitKey

    const submitRoomResult = async () => {
      try {
        await fetch('/api/room/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            score: gameStats.score,
            perfectCount: gameStats.perfectCount,
            goodCount: gameStats.goodCount,
            missCount: gameStats.missCount,
            accuracy: gameStats.accuracy,
            result: gameState
          })
        })
      } catch (error) {
        console.error('Failed to submit room result:', error)
      }
    }

    submitRoomResult()

  }, [roomId, gameState, gameStats])

  useEffect(() => {
    if (!roomId) return

    if (roomPollingRef.current) {
      clearInterval(roomPollingRef.current)
    }

    roomPollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/room/status?roomId=${roomId}`)
        const data = await res.json()
        if (data?.success && data?.isCompleted) {
          setRoomResult(data)
          if (roomPollingRef.current) {
            clearInterval(roomPollingRef.current)
            roomPollingRef.current = null
          }
        }
      } catch (error) {
        console.error('Failed to poll room status:', error)
      }
    }, 2000)

    return () => {
      if (roomPollingRef.current) {
        clearInterval(roomPollingRef.current)
        roomPollingRef.current = null
      }
    }
  }, [roomId])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Phaser canvas container */}
      <div
        ref={gameRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading status indicator */}

      {/* Game HUD overlay */}
      {(gameStats || lastStatsRef.current) && (
        <GameHUD
          stats={(gameStats || lastStatsRef.current)!}
          gameState={gameState}
          songData={songData!}
          musicProgress={musicProgress}
          difficulty={difficulty}
          roomResult={roomResult}
        />
      )}
    </div>
  )
}
