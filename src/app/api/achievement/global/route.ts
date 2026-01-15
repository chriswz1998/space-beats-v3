import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(req: Request) {
  try {
    // Validate user session (Better Auth)
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all global achievements for the user
    const achievements = await prisma.userAchievement.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        type: true, // Achievement enum (FIRST_EXPERIENCE, etc.)
        unlockedAt: true // Unlock time
      }
    })

    return NextResponse.json({ success: true, achievements })
  } catch (error) {
    console.error('Fetch global achievements error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
