import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { RoomStatus } from '@/generated/prisma/enums'

export async function POST(req: Request) {
  // 1. 验证身份
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { roomId } = await req.json()

    if (!roomId) {
      return new NextResponse('Room ID is required', { status: 400 })
    }

    // 2. 查找房间并检查权限
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      return new NextResponse('Room not found', { status: 404 })
    }

    // 检查状态：必须是等待接受状态
    if (room.status !== RoomStatus.PENDING_ACCEPT) {
      return new NextResponse('Room is not available', { status: 409 }) // 409 Conflict
    }

    // 检查权限：当前用户必须是受邀者 (检查 ID 或 邮箱)
    // 注意：如果是通过邮箱邀请，inviteeId 此时可能是 null，所以主要校验 inviteeEmail
    const isInvitedById = room.inviteeId === session.user.id
    const isInvitedByEmail =
      room.inviteeEmail.toLowerCase() === session.user.email.toLowerCase()

    if (!isInvitedById && !isInvitedByEmail) {
      return new NextResponse('You are not invited to this room', {
        status: 403
      })
    }

    // 3. 执行事务 (Transaction)
    // 我们需要同时做3件事，要么都成功，要么都失败：
    // A. 更新房间状态为 READY，并绑定 inviteeId
    // B. 为邀请人创建 Player 记录
    // C. 为被邀请人(我)创建 Player 记录

    await prisma.$transaction([
      // A. 更新房间
      prisma.room.update({
        where: { id: roomId },
        data: {
          status: RoomStatus.READY, // 状态变为就绪
          inviteeId: session.user.id // 确保 ID 绑定
        }
      }),

      // B. 创建邀请人的游戏记录 (Player 1)
      prisma.roomPlayer.create({
        data: {
          roomId: roomId,
          userId: room.inviterId,
          score: 0,
          hasFinished: false,
          hasViewedResult: false
        }
      }),

      // C. 创建被邀请人的游戏记录 (Player 2 - 就是我)
      prisma.roomPlayer.create({
        data: {
          roomId: roomId,
          userId: session.user.id,
          score: 0,
          hasFinished: false,
          hasViewedResult: false
        }
      })
    ])

    return NextResponse.json({ success: true, roomId })
  } catch (error) {
    console.error('Accept Room Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
