'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AchievementSong } from '@/components/achievement-song'
import { IconMusic, IconPlayerPlay } from '@tabler/icons-react'
import type { Song } from '@/generated/prisma/client' // Prefer type-only import
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Use Song[] for the list props.
interface SongsListProps {
  songs: Song[]
}

export const SongsList = ({ songs }: SongsListProps) => {
  const router = useRouter()
  const [model, setModel] = useState<string>('')
  const [isMe, setIsMe] = useState<number | undefined>()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSongId, setInviteSongId] = useState<string | null>(null)
  const [inviteSongName, setInviteSongName] = useState<string | null>(null)
  const [inviteDifficulty, setInviteDifficulty] = useState<string>('normal')
  const [inviting, setInviting] = useState(false)

  // Handle empty state (optional).
  if (!songs || songs.length === 0) {
    return (
      <div className="text-center py-10 border-4 border-black border-dashed rounded-2xl bg-gray-100">
        <p className="text-xl font-black text-gray-500 uppercase">
          No Songs Found
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Render the list */}
        {songs.map((song, index) => (
          <div
            key={song.id} // React lists need a stable key
            className="group relative flex items-center justify-between px-8 py-6 rounded-2xl
                       bg-white border-4 border-black
                       shadow-[8px_8px_0_0_rgba(0,0,0,0.3)]
                       transition-all duration-200
                       hover:shadow-[12px_12px_0_0_rgba(0,0,0,0.3)]
                       hover:-translate-x-1 hover:-translate-y-1
                       cursor-pointer
                       overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #dbeafe 100%)'
            }}
          >
            {/* Pop art dot background */}
            <div className="absolute inset-0 pop-art-dots opacity-40 pointer-events-none" />

            {/* Left decorative stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-yellow-400 via-pink-500 to-blue-500" />

            {/* Song info */}
            <div className="flex items-center gap-5 flex-1 min-w-0 relative z-10">
              <div
                className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-pink-500
                            flex items-center justify-center border-4 border-black shadow-lg
                            group-hover:scale-110 group-hover:rotate-6 transition-all duration-200"
              >
                <IconMusic className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {/* Dynamic song name */}
                <div className="text-2xl font-black text-black drop-shadow-sm group-hover:text-pink-600 transition-colors truncate">
                  {song.name}
                </div>
                <div className="text-sm text-black/70 flex items-center gap-3 font-bold">
                  {/* Dynamic author */}
                  <span className="uppercase">
                    By {song.author || 'Unknown'}
                  </span>
                  <span className="text-black/40">•</span>
                  {/* Difficulty tags shown for each chart */}
                  <div className="flex gap-2">
                    <span
                      onClick={() => {
                        setModel('hard')
                        setIsMe(index)
                      }}
                      className={cn(
                        'px-3 py-1 rounded-lg bg-red-500 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-transform cursor-pointer block',
                        model === 'hard' && isMe === index
                          ? 'bg-red-200 text-black scale-110 ring-2 ring-black'
                          : ''
                      )}
                    >
                      Hard
                    </span>
                    <span
                      onClick={() => {
                        setModel('normal')
                        setIsMe(index)
                      }}
                      className={cn(
                        'px-3 py-1 rounded-lg bg-yellow-500 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-transform cursor-pointer block',
                        model === 'normal' && isMe === index
                          ? 'bg-red-200 text-black scale-110 ring-2 ring-black'
                          : ''
                      )}
                    >
                      Normal
                    </span>
                    <span
                      onClick={() => {
                        setModel('easy')
                        setIsMe(index)
                      }}
                      className={cn(
                        'px-3 py-1 rounded-lg bg-blue-500 text-white border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-transform cursor-pointer block',
                        model === 'easy' && isMe === index
                          ? 'bg-red-200 text-black scale-110 ring-2 ring-black'
                          : ''
                      )}
                    >
                      Easy
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons on the right */}
            <div className="flex items-center gap-4 relative z-10">
              {/* Pass props if achievements depend on song ID */}
              {/* <AchievementSong songId={song.id} /> */}
              <AchievementSong songId={song.id} />

              {/* Play button triggers navigation */}
              <Button
                variant={'pop'}
                onClick={() => {
                  if (!model) {
                    toast.message('please select a model')
                    return
                  }
                  router.push(`/play/${song.id}/${model}`)
                }}
              >
                <IconPlayerPlay className="w-5 h-5 fill-black mr-2" />
                PLAY
              </Button>

              <Button
                variant={'pop'}
                onClick={() => {
                  if (!model || isMe !== index) {
                    toast.message('please select a model')
                    return
                  }
                  setInviteSongId(song.id)
                  setInviteSongName(song.name)
                  setInviteDifficulty(model)
                  setInviteEmail('')
                  setInviteOpen(true)
                }}
              >
                Invite
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Player</DialogTitle>
            <DialogDescription>
              {inviteSongName} · {inviteDifficulty.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Enter opponent email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button
              variant="pop"
              disabled={inviting || !inviteEmail || !inviteSongId}
              onClick={async () => {
                if (!inviteSongId) return
                try {
                  setInviting(true)
                  const res = await fetch('/api/room/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      songId: inviteSongId,
                      difficulty: inviteDifficulty,
                      inviteeEmail: inviteEmail
                    })
                  })
                  const data = await res.json()
                  if (!data?.success) {
                    toast.error(data?.error || 'Invite failed')
                    return
                  }
                  toast.success('Invitation sent!')
                  setInviteOpen(false)
                } catch (error) {
                  console.error('Invite failed:', error)
                  toast.error('Invite failed')
                } finally {
                  setInviting(false)
                }
              }}
            >
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
