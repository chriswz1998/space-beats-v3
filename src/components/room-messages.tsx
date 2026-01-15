'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RoomNotificationSong {
  id: string
  name: string
  author: string
}

interface RoomNotificationUser {
  id: string
  name: string
  email: string
}

interface PendingInvite {
  id: string
  difficulty: string
  song: RoomNotificationSong
  inviter: RoomNotificationUser
  createdAt: string
}

interface AcceptedRoom {
  id: string
  difficulty: string
  song: RoomNotificationSong
  inviter: RoomNotificationUser
  invitee: RoomNotificationUser | null
  status?: string
  updatedAt: string
}

interface PendingSentInvite {
  id: string
  difficulty: string
  song: RoomNotificationSong
  invitee: RoomNotificationUser | null
  createdAt: string
}

interface CompletedRoom {
  id: string
  difficulty: string
  song: RoomNotificationSong
  inviter: RoomNotificationUser
  invitee: RoomNotificationUser | null
  updatedAt: string
}

export function RoomMessages() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [acceptedRooms, setAcceptedRooms] = useState<AcceptedRoom[]>([])
  const [pendingSent, setPendingSent] = useState<PendingSentInvite[]>([])
  const [completedRooms, setCompletedRooms] = useState<CompletedRoom[]>([])
  const [resultOpen, setResultOpen] = useState(false)
  const [resultRoomId, setResultRoomId] = useState<string | null>(null)
  const [roomResult, setRoomResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // Aggregate counts for the badge display.
  const unreadCount = useMemo(
    () =>
      pendingInvites.length +
      acceptedRooms.length +
      pendingSent.length +
      completedRooms.length,
    [pendingInvites, acceptedRooms, pendingSent, completedRooms]
  )

  // Poll the server for the latest room notifications.
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/room/notifications')
      const data = await res.json()
      if (data?.success) {
        setPendingInvites(data.pendingInvites || [])
        setAcceptedRooms(data.acceptedRooms || [])
        setPendingSent(data.pendingSent || [])
        setCompletedRooms(data.completedRooms || [])
      }
    } catch (error) {
      console.error('Failed to fetch room notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Keep the list fresh without user action.
    const timer = setInterval(fetchNotifications, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleAccept = async (roomId: string) => {
    try {
      const res = await fetch('/api/room/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      })
      const data = await res.json()
      if (!data?.success) {
        toast.error(data?.error || 'Accept failed')
        return
      }
      toast.success('Invitation accepted!')
      setOpen(false)
      router.push(`/play/${data.room.song.id}/${data.room.difficulty}?roomId=${data.room.id}`)
    } catch (error) {
      console.error('Accept invite error:', error)
      toast.error('Accept failed')
    }
  }

  const handleStart = (room: AcceptedRoom) => {
    router.push(`/play/${room.song.id}/${room.difficulty}?roomId=${room.id}`)
  }

  // Mark a completed room result as seen by this user.
  const markResultViewed = async (roomId: string) => {
    try {
      await fetch('/api/room/notifications/viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      })
    } catch (error) {
      console.error('Mark room result viewed error:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="pop" className="relative">
            Messages
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-black text-white">{unreadCount}</Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Room Invitations</DialogTitle>
            <DialogDescription>
              Accept an invite or start the duel once both sides are ready.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading && <div className="text-sm text-muted-foreground">Loading...</div>}

            {!loading &&
              pendingInvites.length === 0 &&
              acceptedRooms.length === 0 &&
              pendingSent.length === 0 &&
              completedRooms.length === 0 && (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            )}

            {pendingInvites.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Pending Invites</div>
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <div className="font-semibold">{invite.song.name}</div>
                      <div className="text-sm text-muted-foreground">
                        From {invite.inviter.name} · {invite.difficulty.toUpperCase()}
                      </div>
                    </div>
                    <Button
                      variant="pop"
                      onClick={() => handleAccept(invite.id)}
                    >
                      Accept
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {acceptedRooms.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Ready to Start</div>
                {acceptedRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <div className="font-semibold">{room.song.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {room.inviter?.name} vs {room.invitee?.name || 'Opponent'} ·{' '}
                        {(room.status || 'ACCEPTED').toUpperCase()}
                      </div>
                    </div>
                    <Button variant="pop" onClick={() => handleStart(room)}>
                      Start
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pendingSent.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Waiting for Response</div>
                {pendingSent.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <div className="font-semibold">{room.song.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Invite sent to {room.invitee?.name || room.invitee?.email || 'Opponent'}
                        {' '}· {room.difficulty.toUpperCase()}
                      </div>
                    </div>
                    <Badge className="bg-yellow-500 text-black">Pending</Badge>
                  </div>
                ))}
              </div>
            )}

            {completedRooms.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Results</div>
                {completedRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <div className="font-semibold">{room.song.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {room.inviter?.name} vs {room.invitee?.name || 'Opponent'}
                      </div>
                    </div>
                    <Button
                      variant="pop"
                      onClick={async () => {
                        setResultRoomId(room.id)
                        setResultOpen(true)
                        // Remove locally for immediate UI feedback.
                        setCompletedRooms((prev) =>
                          prev.filter((item) => item.id !== room.id)
                        )
                        await markResultViewed(room.id)
                        try {
                          const res = await fetch(
                            `/api/room/status?roomId=${room.id}`
                          )
                          const data = await res.json()
                          if (data?.success) {
                            setRoomResult(data)
                          }
                        } catch (error) {
                          console.error('Fetch room result error:', error)
                        }
                      }}
                    >
                      View Result
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Battle Result</DialogTitle>
            <DialogDescription>
              {roomResult?.room?.song?.name || 'Match Result'}
            </DialogDescription>
          </DialogHeader>
        {roomResult?.isCompleted ? (
            <div className="space-y-4">
              <div className="text-3xl font-black text-center">
                {roomResult.viewerOutcome === 'WIN'
                  ? 'YOU WIN'
                  : roomResult.viewerOutcome === 'LOSE'
                    ? 'YOU LOSE'
                    : 'DRAW'}
              </div>
              <div className="flex gap-6 justify-center">
                {(roomResult.players || []).map((player: any) => (
                  <div key={player.userId} className="text-center">
                    <div className="font-bold">{player.name}</div>
                    <div className="text-2xl">{player.score}</div>
                    <div className="text-xs text-muted-foreground">
                      P:{player.perfectCount} G:{player.goodCount} M:{player.missCount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Result pending...</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
