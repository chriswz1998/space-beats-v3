import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      roomId,
      score,
      perfectCount,
      goodCount,
      missCount,
      accuracy,
      result
    } = body || {}

    if (!roomId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Missing roomId or score' },
        { status: 400 }
      )
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const room = await prisma.room.findUnique({
      where: { id: String(roomId) }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.inviterId !== session.user.id && room.inviteeId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.roomPlayer.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: session.user.id
        }
      },
      update: {
        score,
        perfectCount: perfectCount ?? 0,
        goodCount: goodCount ?? 0,
        missCount: missCount ?? 0,
        accuracy: typeof accuracy === 'number' ? accuracy : 0,
        result: result || null,
        finishedAt: new Date()
      },
      create: {
        roomId: room.id,
        userId: session.user.id,
        score,
        perfectCount: perfectCount ?? 0,
        goodCount: goodCount ?? 0,
        missCount: missCount ?? 0,
        accuracy: typeof accuracy === 'number' ? accuracy : 0,
        result: result || null,
        finishedAt: new Date()
      }
    })

    const finishedCount = await prisma.roomPlayer.count({
      where: {
        roomId: room.id,
        finishedAt: { not: null }
      }
    })

    if (finishedCount >= 2) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: 'COMPLETED'
        }
      })
    } else if (room.status === 'ACCEPTED') {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          status: 'IN_PROGRESS'
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submit room result error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
