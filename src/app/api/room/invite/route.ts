import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const ALLOWED_DIFFICULTY = new Set(['easy', 'normal', 'hard'])

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { songId, difficulty, inviteeEmail } = body || {}

    if (!songId || !inviteeEmail) {
      return NextResponse.json(
        { error: 'Missing songId or inviteeEmail' },
        { status: 400 }
      )
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const normalizedDifficulty = ALLOWED_DIFFICULTY.has(
      String(difficulty || '').toLowerCase()
    )
      ? String(difficulty).toLowerCase()
      : 'normal'

    const invitee = await prisma.user.findUnique({
      where: { email: String(inviteeEmail) }
    })

    if (!invitee) {
      return NextResponse.json({ error: 'Invitee not found' }, { status: 404 })
    }

    if (invitee.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot invite yourself' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        songId: String(songId),
        difficulty: normalizedDifficulty,
        inviterId: session.user.id,
        inviteeId: invitee.id,
        inviteeEmail: invitee.email,
        players: {
          create: {
            userId: session.user.id
          }
        }
      },
      include: {
        song: true
      }
    })

    return NextResponse.json({ success: true, room })
  } catch (error) {
    console.error('Create room invite error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
