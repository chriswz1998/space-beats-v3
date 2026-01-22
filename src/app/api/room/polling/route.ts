// app/api/user/polling/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth' // 👈 这里换成你的 BetterAuth 实例路径
import { headers } from 'next/headers'

export async function GET() {
  // 1. BetterAuth 获取 Session
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const userEmail = session.user.email

  try {
    // 1. 待处理的邀请 (别人邀我，我还没点接受)
    const pendingInvites = await prisma.room.findMany({
      where: {
        status: 'PENDING_ACCEPT', // 必须是等待状态
        OR: [
          { inviteeId: userId }, // 情况A: 明确指名道姓邀请了该ID
          { inviteeEmail: userEmail } // 情况B: 邀请的是邮箱 (最常见的情况)
        ]
      },
      include: {
        song: true,
        inviter: {
          select: { name: true, image: true } // 只取需要的字段，防止泄露密码等
        }
      },
      orderBy: {
        createdAt: 'desc' // 最新的邀请排前面
      }
    })

    // 2. 进行中的游戏 (我接受了，或者别人接受了我，可以进去玩了)
    const activeRooms = await prisma.room.findMany({
      where: {
        OR: [{ inviterId: userId }, { inviteeId: userId }],
        status: { in: ['READY', 'PLAYING'] } // 状态是 READY 或 PLAYING
      },
      include: { song: true, inviter: true, invitee: true }
    })

    // 3. 游戏结果 (阅后即焚)
    const newResults = await prisma.roomPlayer.findMany({
      where: {
        userId: userId,
        hasViewedResult: false,
        room: { status: 'COMPLETED' }
      },
      include: {
        room: {
          include: { song: true, players: { include: { user: true } } }
        }
      }
    })

    return NextResponse.json({
      invites: pendingInvites,
      activeRooms: activeRooms,
      results: newResults
    })
  } catch (error) {
    return new NextResponse('Error', { status: 500 })
  }
}
