// app/api/room/submit/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { RoomStatus } from '@/generated/prisma/enums'

export async function POST(req: Request) {
  // 1. 只有登录用户才能提交
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { roomId, score, perfect, good, miss, maxCombo } = body

    // 如果没有 roomId，说明是单人练习模式，不记录对战成绩
    if (!roomId) {
      return NextResponse.json({ message: 'Practice score saved locally' })
    }

    // 2. 核心逻辑：更新“这个房间”里“当前用户”的那条记录
    // 我们不需要前端传 userId，直接用 session.user.id 安全地查找
    const updatedPlayer = await prisma.roomPlayer.update({
      where: {
        roomId_userId: {
          // 复合唯一键
          roomId: roomId,
          userId: session.user.id
        }
      },
      data: {
        score,
        perfectCount: perfect,
        goodCount: good,
        missCount: miss,
        maxCombo: maxCombo,
        hasFinished: true, // 标记为已完成
        finishedAt: new Date()
      }
    })

    // 3. 检查是否双方都完成了？
    // 如果都完成了，把房间状态改成 COMPLETED
    const roomPlayers = await prisma.roomPlayer.findMany({
      where: { roomId }
    })

    const allFinished = roomPlayers.every((p) => p.hasFinished)

    if (allFinished) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: RoomStatus.COMPLETED }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submit Score Error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}
