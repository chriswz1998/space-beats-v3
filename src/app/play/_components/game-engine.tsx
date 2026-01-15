'use client'

import type { GameStats } from '../_lib/types'
import dynamic from 'next/dynamic'

// Dynamically import Phaser to avoid SSR issues.
const PhaserGame = dynamic(() => import('./phaser-game'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-black text-white">
      <div className="text-xl">Loading game engine...</div>
    </div>
  )
})

interface GameEngineProps {
  songData: any
  difficulty?: string
  roomId?: string
  onGameOver?: (stats: GameStats) => void
}

/**
 * Game engine component.
 * Uses dynamic import to avoid SSR issues.
 */
export function GameEngine({
  songData,
  difficulty,
  roomId,
  onGameOver
}: GameEngineProps) {
  return (
    <PhaserGame
      songData={songData}
      difficulty={difficulty}
      roomId={roomId}
      onGameOver={onGameOver}
    />
  )
}
