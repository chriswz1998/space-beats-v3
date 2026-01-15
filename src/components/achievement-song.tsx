'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IconLaurelWreath, IconLoader2 } from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { UserSongAchievement } from '@/generated/prisma/client'

// Achievement rules (static on client, lit by backend data)
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'clear',
    name: 'Song Cleared',
    description: 'Complete the song with any score',
    icon: '🎯'
  },
  {
    id: 'rank_s',
    name: 'Rank S Master',
    description: 'Achieve Rank S (Score > 950,000)',
    icon: '🏆'
  },
  {
    id: 'full_combo',
    name: 'Full Combo',
    description: 'Complete without missing any notes',
    icon: '⚡'
  },
  {
    id: 'all_perfect',
    name: 'All Perfect',
    description: 'Complete with 100% Perfect judgment',
    icon: '👑'
  }
]

export const AchievementSong = ({ songId }: { songId: string }) => {
  const [open, setOpen] = useState(false) // Dialog state
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<UserSongAchievement | null>(null)

  // Fetch data when the dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoading(true)
        try {
          // Call the API
          const res = await fetch(`/api/achievement/song?songId=${songId}`)
          const data = await res.json()

          if (data.success) {
            setRecord(data.record)
          }
        } catch (error) {
          console.error('Failed to fetch achievements', error)
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [open, songId]) // Trigger when open or songId changes

  // Map backend data to UI list state
  const achievementsList = ACHIEVEMENT_DEFINITIONS.map((def) => {
    let isUnlocked = false

    if (record) {
      switch (def.id) {
        case 'clear':
          isUnlocked = record.highScore > 0
          break
        case 'rank_s':
          isUnlocked = record.highScore >= 950000
          break
        case 'full_combo':
          isUnlocked = record.isFullCombo
          break
        case 'all_perfect':
          isUnlocked = record.isAllPerfect
          break
      }
    }

    return {
      ...def,
      isUnlocked,
      achievedAt: isUnlocked ? record?.updatedAt : null
    }
  })

  // Count unlocked achievements
  const unlockedCount = achievementsList.filter((a) => a.isUnlocked).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={'pop'} className="gap-2">
          <IconLaurelWreath className="w-5 h-5" />
          <span className="hidden sm:inline">Achievements</span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
        bg-white border-4 border-black
        shadow-[10px_10px_0_0_rgba(0,0,0,0.35)]
        rounded-2xl overflow-hidden sm:max-w-3xl
        flex flex-col p-0
        [&>button]:z-50
        [&>button]:top-6
        [&>button]:right-6
        [&>button]:border-2
        [&>button]:border-black
        [&>button]:bg-red-400
        [&>button]:text-white
        [&>button]:opacity-100
        [&>button]:hover:bg-red-500
        [&>button]:hover:text-white
      "
      >
        <div className="absolute inset-0 pop-art-dots opacity-15 pointer-events-none" />

        <DialogHeader className="relative z-10 p-6 pb-2 shrink-0">
          <DialogTitle className="text-3xl font-black uppercase text-black">
            Song Records
          </DialogTitle>
          <DialogDescription className="text-black/70 font-bold flex items-center gap-2">
            YOUR PERFORMANCE
            {/* Show stats only after loading */}
            {!loading && (
              <span className="bg-black text-white text-xs px-2 py-0.5 rounded-full">
                {unlockedCount}/{achievementsList.length}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 relative z-10 overflow-y-auto p-6 pt-2 max-h-[60vh]">
          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
              <IconLoader2 className="w-10 h-10 animate-spin" />
              <p className="font-bold text-sm">LOADING RECORDS...</p>
            </div>
          ) : (
            // Data list
            achievementsList.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-5 rounded-2xl border-4 border-black transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.25)] overflow-hidden relative ${
                  item.isUnlocked
                    ? 'bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300'
                    : 'bg-gray-100'
                }`}
              >
                <div className="absolute inset-0 pop-art-dots opacity-20" />

                <div
                  className={`text-4xl flex-shrink-0 relative z-10 ${
                    item.isUnlocked ? 'scale-110' : 'grayscale opacity-50'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <div
                    className={`text-xl font-black mb-1 uppercase ${item.isUnlocked ? 'text-black' : 'text-gray-500'}`}
                  >
                    {item.name}
                  </div>
                  <div
                    className={`text-sm font-semibold ${item.isUnlocked ? 'text-black/80' : 'text-gray-400'}`}
                  >
                    {item.description}
                  </div>
                  {item.achievedAt && (
                    <div className="text-xs text-black/60 mt-2 font-bold">
                      🏆 Unlocked on:{' '}
                      {new Date(item.achievedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="relative z-10">
                  {item.isUnlocked ? (
                    <div className="text-black font-black text-sm px-3 py-1 rounded-lg bg-white border-2 border-black -rotate-3 shadow-sm">
                      ✓ UNLOCKED
                    </div>
                  ) : (
                    <div className="text-gray-400 font-bold text-xs px-2 py-1 bg-gray-200 rounded border-2 border-gray-300">
                      LOCKED
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
