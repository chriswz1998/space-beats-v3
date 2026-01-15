import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 })
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        song: true,
        players: {
          include: { user: true }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.inviterId !== session.user.id && room.inviteeId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const finishedPlayers = room.players.filter((p) => p.finishedAt)
    const isCompleted = finishedPlayers.length >= 2

    let winnerUserId: string | null = null
    let isDraw = false

    if (isCompleted) {
      const sorted = [...finishedPlayers].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.perfectCount !== a.perfectCount) {
          return b.perfectCount - a.perfectCount
        }
        return (b.accuracy || 0) - (a.accuracy || 0)
      })
      if (sorted.length >= 2 && sorted[0].score === sorted[1].score) {
        isDraw = true
      } else {
        winnerUserId = sorted[0]?.userId ?? null
      }
    }

    const viewerOutcome = isCompleted
      ? isDraw
        ? 'DRAW'
        : winnerUserId === session.user.id
          ? 'WIN'
          : 'LOSE'
      : 'PENDING'

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        status: room.status,
        song: room.song,
        difficulty: room.difficulty
      },
      players: room.players.map((player) => ({
        userId: player.userId,
        name: player.user.name,
        email: player.user.email,
        score: player.score,
        perfectCount: player.perfectCount,
        goodCount: player.goodCount,
        missCount: player.missCount,
        accuracy: player.accuracy,
        result: player.result,
        finishedAt: player.finishedAt
      })),
      isCompleted,
      winnerUserId,
      isDraw,
      viewerOutcome
    })
  } catch (error) {
    console.error('Fetch room status error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
