'use client'

import type { GameStats, GameState } from '../_lib/types'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface GameHUDProps {
  stats: GameStats
  gameState: GameState
  songData: any
  musicProgress: number // 0-1
  difficulty?: string
  roomResult?: any
}

export function GameHUD({
  stats,
  gameState,
  songData,
  musicProgress,
  difficulty,
  roomResult
}: GameHUDProps) {
  const router = useRouter()
  const hpPercentage = stats.resonanceIntegrity
  const clampedHp = Math.max(0, Math.min(100, hpPercentage))
  const hpRatio =
    clampedHp > 1 ? clampedHp / 100 : Math.max(0, Math.min(1, hpPercentage))
  const displayHp = clampedHp > 1 ? clampedHp : clampedHp * 100
  const clampedProgress = Math.max(0, Math.min(1, musicProgress || 0))
  const progressPercent = Math.round(clampedProgress * 100)

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top HUD */}
      <div className="flex flex-col gap-y-4 p-6 bg-linear-to-b from-black/80 to-transparent">
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-cyan-500 via-purple-500 via-yellow-500 to-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between w-full">
          <div className={'text-white text-xl font-bold space-y-2'}>
            <div className="flex items-center gap-3">
              <div>{songData.name}</div>
              {difficulty && (
                <div className="text-xs px-2 py-1 rounded bg-white/15 text-white/90 uppercase tracking-widest">
                  {difficulty}
                </div>
              )}
            </div>
            <div>SCORE: {stats.score.toLocaleString().padStart(6, '0')}</div>
            <div>Accuracy: {(stats.accuracy * 100).toFixed(1)}%</div>
          </div>

          <div className={'text-white text-xl font-bold space-y-2'}>
            <div className={'flex gap-8'}>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.perfectCount}
                </div>
                <div className="text-xs text-gray-400">PERFECT</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {stats.goodCount}
                </div>
                <div className="text-xs text-gray-400">GOOD</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {stats.missCount}
                </div>
                <div className="text-xs text-gray-400">MISS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {stats.currentCombo}
                </div>
                <div className="text-xs text-gray-400">COMBO</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="text-xl font-bold">
                HP: {Math.round(displayHp)}%
              </div>
              <div className="relative w-48 h-4 bg-gray-700 rounded-full overflow-hidden border-2 border-white/30">
                <div
                  className="absolute inset-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
                  style={{
                    transform: `scaleX(${hpRatio})`,
                    transformOrigin: 'right center'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 pointer-events-auto flex flex-col gap-y-6 items-center justify-center bg-black/50 z-20">
          <div className="text-white text-4xl font-bold">PAUSED</div>
          <Button
            className={'bg-white text-black hover:bg-white/80'}
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 pointer-events-auto flex items-center justify-center bg-black/80 z-20">
          <div className="text-white flex flex-col gap-y-6 items-center justify-center">
            <div className="text-6xl font-bold mb-4">GAME OVER</div>
            <div className="text-2xl">HP Depleted</div>
            <div className={'text-xl font-bold space-y-2'}>
              <div className={'flex gap-8'}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.perfectCount}
                  </div>
                  <div className="text-xs text-gray-400">PERFECT</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.goodCount}
                  </div>
                  <div className="text-xs text-gray-400">GOOD</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {stats.missCount}
                  </div>
                  <div className="text-xs text-gray-400">MISS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.currentCombo}
                  </div>
                  <div className="text-xs text-gray-400">COMBO</div>
                </div>
              </div>
            </div>
            <Button
              className={'bg-white text-black hover:bg-white/80'}
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}

      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 pointer-events-auto flex items-center justify-center bg-black/80 z-20">
          <div className="text-white flex flex-col gap-y-6 items-center justify-center">
            <div className="text-6xl font-bold">VICTORY</div>
            <div className="text-2xl">Song Completed!</div>
            <div className={'text-xl font-bold'}>
              <div className={'flex gap-8'}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.perfectCount}
                  </div>
                  <div className="text-xs text-gray-400">PERFECT</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {stats.goodCount}
                  </div>
                  <div className="text-xs text-gray-400">GOOD</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {stats.missCount}
                  </div>
                  <div className="text-xs text-gray-400">MISS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.currentCombo}
                  </div>
                  <div className="text-xs text-gray-400">COMBO</div>
                </div>
              </div>
            </div>
            <Button
              className={'bg-white text-black hover:bg-white/80'}
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}

      {roomResult?.isCompleted && (
        <div className="absolute inset-0 pointer-events-auto flex items-center justify-center bg-black/80 z-30">
          <div className="text-white flex flex-col gap-y-6 items-center justify-center">
            <div className="text-5xl font-bold">
              {roomResult.viewerOutcome === 'WIN'
                ? 'YOU WIN'
                : roomResult.viewerOutcome === 'LOSE'
                  ? 'YOU LOSE'
                  : 'DRAW'}
            </div>
            <div className="text-sm text-white/70">
              Duel Result · {roomResult.room?.song?.name}
            </div>
            <div className="flex gap-6">
              {(roomResult.players || []).map((player: any) => (
                <div key={player.userId} className="text-center">
                  <div className="text-lg font-bold">{player.name}</div>
                  <div className="text-2xl">{player.score}</div>
                  <div className="text-xs text-white/60">
                    P:{player.perfectCount} G:{player.goodCount} M:{player.missCount}
                  </div>
                </div>
              ))}
            </div>
            <Button
              className={'bg-white text-black hover:bg-white/80'}
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
