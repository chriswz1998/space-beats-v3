'use client'

import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoaderCircle } from 'lucide-react'
import { GameEngine } from '../../_components/game-engine'
import type { GameStats } from '../../_lib/types'

export default function PlayPage({
  params
}: {
  params: Promise<{ playId: string; difficulty: string }>
}) {
  const { playId, difficulty } = use(params)
  const [songData, setSongData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId') || undefined

  useEffect(() => {
    if (!playId) return

    const fetchSong = async () => {
      try {
        const res = await fetch(`/api/song/${playId}`)

        if (!res.ok) {
          throw new Error('API 404')
        }

        const data = await res.json()
        console.log(data)
        if (!data.success) {
          toast.error('Song not found')
          router.push('/')
          return
        }
        setSongData(data.song)
      } catch (e) {
        console.error(e)
        toast.error('Failed to load song')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchSong()
  }, [playId, router])

  const handleGameOver = (stats: GameStats) => {
    console.log('Game Over:', stats)
    // TODO: Navigate to the result page or show a result modal.
    toast.success(`Game Over! Score: ${stats.score}`)
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <LoaderCircle className="animate-spin w-10 h-10" />
        <span className="ml-4">Loading song data...</span>
      </div>
    )
  }

  if (!songData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div>No song data available</div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <GameEngine
        songData={songData}
        difficulty={difficulty}
        roomId={roomId}
        onGameOver={handleGameOver}
      />
    </div>
  )
}
