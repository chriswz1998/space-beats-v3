import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roomId } = body || {}

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
      where: { id: String(roomId) },
      include: {
        song: true
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.inviteeId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (room.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Room already accepted' },
        { status: 400 }
      )
    }

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: {
        status: 'ACCEPTED',
        inviteeId: session.user.id
      },
      include: {
        song: true
      }
    })

    await prisma.roomPlayer.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: session.user.id
        }
      },
      update: {},
      create: {
        roomId: room.id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ success: true, room: updatedRoom })
  } catch (error) {
    console.error('Accept room invite error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
