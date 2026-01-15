import { requireAuth } from '@/lib/auth-utils'
import GlobalLayout from '@/components/auth-layout'
import { PlayerInfo } from '@/components/player-info'
import { SongsList } from '@/components/songs-list'
import { UploadSong } from '@/components/upload-song'
import GameHeader from '@/components/game-header'
import { SongListHeader } from '@/components/song-list-header'
import { prisma } from '@/lib/db'

export default async function Home() {
  await requireAuth()
  const songs = await prisma.song.findMany()

  return (
    <GlobalLayout>
      {/* Main content container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Top navigation bar - pop art style */}
        <div className="flex items-center justify-between mb-12">
          <GameHeader />
          <PlayerInfo />
        </div>

        {/* Song list section */}
        <div className="mt-8">
          {/* Header area - pop art style */}
          <SongListHeader />
          <SongsList songs={songs} />
          <UploadSong />
        </div>
      </div>
    </GlobalLayout>
  )
}
