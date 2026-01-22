import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth' // BetterAuth
import { headers } from 'next/headers'
import { RoomStatus } from '@/generated/prisma/enums'

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { songId, difficulty, inviteeEmail } = await req.json()

    console.log(songId, inviteeEmail, difficulty)
    // 1. 简单的校验：不能邀请自己
    if (inviteeEmail === session.user.email) {
      return new NextResponse('Cannot invite yourself', { status: 400 })
    }

    // 2. 创建房间
    // 注意：这里不需要立即创建 RoomPlayer，通常等到对方接受(Accept)时，
    // 或者在这里先给邀请人创建一条 RoomPlayer 也可以，取决于你的业务逻辑。
    // 按照之前的设计，我们先建 Room，对方接受后再生成 Player 记录。

    const room = await prisma.room.create({
      data: {
        songId,
        difficulty,
        inviterId: session.user.id,
        inviteeEmail: inviteeEmail,
        status: RoomStatus.PENDING_ACCEPT
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Create Room Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
