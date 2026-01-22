'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Swords,
  Mail,
  Play,
  Trash2,
  Trophy,
  Frown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils' // shadcn 的工具函数

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function RoomMessages() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // 1. SWR 轮询
  const { data, mutate, isLoading } = useSWR('/api/room/polling', fetcher, {
    refreshInterval: 3000,
    dedupingInterval: 2000
  })

  const messageCount =
    (data?.invites?.length || 0) +
    (data?.activeRooms?.length || 0) +
    (data?.results?.length || 0)

  // --- Actions ---8

  const handleAccept = async (roomId: string) => {
    try {
      await fetch('/api/room/accept', {
        method: 'POST',
        body: JSON.stringify({ roomId })
      })
      toast.success('Accepted! Get ready.')
      mutate()
    } catch (e) {
      toast.error('Failed to accept')
    }
  }

  const handleEnterGame = (value: {
    songId: string
    id: string
    difficulty: string
  }) => {
    setIsOpen(false)
    router.push(`/play/${value.songId}/${value.difficulty}?roomId=${value.id}`)
  }

  // 点击删除按钮：标记为已读，消息消失
  const handleDeleteGame = async (roomId: string) => {
    console.log(roomId)
    try {
      // 调用刚才写的删除接口
      const res = await fetch('/api/room/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      })

      if (!res.ok) {
        const errorMsg = await res.text()
        throw new Error(errorMsg)
      }

      toast.success('Battle record deleted')
      mutate() // 刷新列表，消息消失
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="pop" className="relative">
          Messages
          {messageCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
            >
              {messageCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Game Center</DialogTitle>
          <DialogDescription>
            Invitations, active games, and battle results.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-6">
            {isLoading && !data && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            {messageCount === 0 && !isLoading && (
              <div className="text-center text-gray-500 py-8 text-sm">
                No new messages.
              </div>
            )}

            {/* 1. Active Games (进行中) */}
            {data?.activeRooms?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Swords className="w-3 h-3" /> Active Games
                </h3>
                {data.activeRooms.map((room: any) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-green-50/50 border border-green-200 rounded-lg"
                  >
                    <div>
                      <p className="font-bold text-sm text-green-900">
                        {room.song.name}
                      </p>
                      <p className="text-xs text-green-700">Ready to start!</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-8"
                      onClick={() => handleEnterGame(room)}
                    >
                      <Play className="w-3 h-3 mr-1" /> Play
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Invitations (邀请) */}
            {data?.invites?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Invites
                </h3>
                {data.invites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-200 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                        {invite.inviter.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-blue-900">
                          {invite.inviter.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          invites you to {invite.song.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 bg-blue-100 hover:bg-blue-200 text-blue-700"
                      onClick={() => handleAccept(invite.id)}
                    >
                      Accept
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Results (结果 - 直接显示) */}
            {data?.results?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-3 h-3" /> Recent Results
                </h3>
                {data.results.map((result: any) => {
                  // 计算胜负逻辑
                  const myScore = result.score
                  // 在 players 数组里找到对手 (userId 不等于我的那个)
                  const opponent = result.room.players.find(
                    (p: any) => p.userId !== result.userId
                  )
                  const opponentScore = opponent?.score || 0

                  const isWin = myScore > opponentScore
                  const isDraw = myScore === opponentScore

                  return (
                    <div
                      key={result.id}
                      className={cn(
                        'relative flex items-center justify-between p-3 rounded-lg border',
                        isWin
                          ? 'bg-yellow-50/50 border-yellow-200'
                          : isDraw
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-red-50/50 border-red-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {/* 结果图标 */}
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center border-2',
                            isWin
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-600'
                              : isDraw
                                ? 'bg-gray-100 border-gray-400 text-gray-600'
                                : 'bg-red-100 border-red-400 text-red-600'
                          )}
                        >
                          {isWin ? (
                            <Trophy className="w-5 h-5" />
                          ) : isDraw ? (
                            <Minus className="w-5 h-5" />
                          ) : (
                            <Frown className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <p
                            className={cn(
                              'font-bold text-sm',
                              isWin
                                ? 'text-yellow-800'
                                : isDraw
                                  ? 'text-gray-700'
                                  : 'text-red-800'
                            )}
                          >
                            {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {result.room.song.name}
                          </p>
                          <div className="text-xs font-semibold mt-1 flex gap-2">
                            <span className="text-blue-600">
                              You: {myScore}
                            </span>
                            <span className="text-gray-400">vs</span>
                            <span className="text-gray-600">
                              Opp: {opponentScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 删除按钮 (阅后即焚) */}
                      {/*<Button*/}
                      {/*  variant="ghost"*/}
                      {/*  size="icon"*/}
                      {/*  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-transparent"*/}
                      {/*  onClick={() => handleDeleteGame(result.id)}*/}
                      {/*>*/}
                      {/*  <Trash2 className="w-4 h-4" />*/}
                      {/*  <span className="sr-only">Dismiss</span>*/}
                      {/*</Button>*/}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
