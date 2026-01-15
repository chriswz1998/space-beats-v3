import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const pendingInvites = await prisma.room.findMany({
      where: {
        status: 'PENDING',
        inviteeId: userId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        song: true,
        inviter: true
      }
    })

    const acceptedRooms = await prisma.room.findMany({
      where: {
        status: { in: ['ACCEPTED', 'IN_PROGRESS'] },
        OR: [{ inviterId: userId }, { inviteeId: userId }]
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        song: true,
        inviter: true,
        invitee: true
      }
    })

    const pendingSent = await prisma.room.findMany({
      where: {
        status: 'PENDING',
        inviterId: userId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        song: true,
        invitee: true
      }
    })

    // Only return completed rooms that the user has not viewed yet.
    const completedRooms = await prisma.room.findMany({
      where: {
        status: 'COMPLETED',
        OR: [{ inviterId: userId }, { inviteeId: userId }],
        players: {
          some: {
            userId,
            resultViewedAt: null
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        song: true,
        inviter: true,
        invitee: true
      }
    })

    return NextResponse.json({
      success: true,
      pendingInvites,
      acceptedRooms,
      pendingSent,
      completedRooms
    })
  } catch (error) {
    console.error('Fetch room notifications error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
