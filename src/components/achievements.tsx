'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AchievementType } from '@/generated/prisma/enums'

const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementType,
  { name: string; description: string; icon: string }
> = {
  FIRST_EXPERIENCE: {
    name: 'First Experience',
    description: 'Complete your first game',
    icon: '🎯'
  },
  PERFECT_MASTER: {
    name: 'Perfect Master',
    description: 'All Perfect in a single game',
    icon: '⭐'
  },
  HIGH_SCORE_CHALLENGER: {
    name: 'High Score Challenger',
    description: 'Score 100,000 points or more',
    icon: '🏆'
  },
  RHYTHM_EXPERT: {
    name: 'Rhythm Expert',
    description: 'Achieve 90% or higher accuracy',
    icon: '🎵'
  },
  COMPLETIONIST: {
    name: 'Completionist',
    description: 'Complete all songs at least once',
    icon: '🌟'
  }
}

// API response shape
interface UnlockedAchievement {
  type: AchievementType
  unlockedAt: string // Dates come as strings from JSON
}

export const Achievements = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unlockedData, setUnlockedData] = useState<UnlockedAchievement[]>([])

  // Fetch data when the dialog opens
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoading(true)
        try {
          const res = await fetch('/api/achievement/global')
          const data = await res.json()
          if (data.success) {
            setUnlockedData(data.achievements)
          }
        } catch (error) {
          console.error('Failed to fetch achievements', error)
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }, [open])

  // Merge static definitions with user data for rendering
  // Object.entries turns the object into an array for mapping
  const renderList = (
    Object.entries(ACHIEVEMENT_DEFINITIONS) as [
      AchievementType,
      (typeof ACHIEVEMENT_DEFINITIONS)[AchievementType]
    ][]
  ).map(([type, meta]) => {
    // Check if the user unlocked this achievement
    const record = unlockedData.find((u) => u.type === type)

    return {
      ...meta,
      type,
      isUnlocked: !!record, // Any record means unlocked
      achievedAt: record ? record.unlockedAt : null
    }
  })

  // Compute unlock progress
  const unlockedCount = unlockedData.length
  const totalCount = Object.keys(ACHIEVEMENT_DEFINITIONS).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full text-left cursor-pointer font-black uppercase text-sm tracking-wide text-black hover:text-pink-600 transition-colors">
        Achievements
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
          <DialogTitle className="text-3xl font-black uppercase text-black flex items-center justify-between">
            Achievements
          </DialogTitle>
          <DialogDescription className="text-black/70 font-bold flex items-center gap-2">
            Your global achievements collection
            {!loading && (
              <span className="text-sm bg-black text-white px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
                {unlockedCount} / {totalCount}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 relative z-10 overflow-y-auto p-6 pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <LoaderCircle className="w-10 h-10 animate-spin text-black" />
              <div className="font-bold text-black uppercase">Loading...</div>
            </div>
          ) : (
            renderList.map((item, index) => {
              return (
                <div
                  key={item.type} // Use type as a stable key
                  className={`flex items-center gap-4 p-5 rounded-2xl border-4 border-black transition-all shadow-[6px_6px_0_0_rgba(0,0,0,0.25)] overflow-hidden relative shrink-0 ${
                    item.isUnlocked
                      ? 'bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300'
                      : 'bg-gray-200'
                  }`}
                >
                  <div className="absolute inset-0 pop-art-dots opacity-20" />

                  {/* Icon */}
                  <div
                    className={`text-4xl flex-shrink-0 relative z-10 transition-transform ${
                      item.isUnlocked ? 'scale-110' : 'grayscale opacity-50'
                    }`}
                  >
                    {item.icon}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="text-xl font-black mb-1 uppercase text-black">
                      {item.name}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        item.isUnlocked ? 'text-black/80' : 'text-black/50'
                      }`}
                    >
                      {item.description}
                    </div>

                    {/* Unlock time */}
                    {item.isUnlocked && item.achievedAt && (
                      <div className="text-xs text-black/60 mt-2 font-bold flex items-center gap-1">
                        <span>
                          🏆 Unlocked:{' '}
                          {new Date(item.achievedAt).toLocaleDateString(
                            'en-US'
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right-side checkmark */}
                  {item.isUnlocked ? (
                    <div className="flex-shrink-0 text-black font-black text-sm px-3 py-1 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.25)] relative z-10 -rotate-6">
                      ✓
                    </div>
                  ) : (
                    <div className="flex-shrink-0 text-gray-400 font-bold text-xs px-2 py-1 bg-gray-300 rounded border-2 border-gray-400 relative z-10">
                      LOCKED
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
