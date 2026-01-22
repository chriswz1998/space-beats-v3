import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function DELETE(req: Request) {
  // 1. 验证用户身份
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 获取要删除的 roomId
    // 注意：DELETE 请求也可以带 Body，或者你可以改用 searchParams
    const { roomId } = await req.json()

    if (!roomId) {
      return new NextResponse('Room ID is required', { status: 400 })
    }

    // 2. 查找房间信息
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      return new NextResponse('Room not found', { status: 404 })
    }

    // 3. 权限验证 (非常重要)
    // 只有房间的“相关人员”才能删除房间
    const userId = session.user.id
    const userEmail = session.user.email

    const isInviter = room.inviterId === userId
    const isInviteeById = room.inviteeId === userId
    // 即使还没有 inviteeId (未接受状态)，也要允许通过邮箱验证身份来拒绝
    const isInviteeByEmail =
      room.inviteeEmail.toLowerCase() === userEmail.toLowerCase()

    if (!isInviter && !isInviteeById && !isInviteeByEmail) {
      return new NextResponse(
        'You do not have permission to delete this room',
        { status: 403 }
      )
    }

    // 4. 状态检查 (可选，取决于你的业务逻辑)
    // 通常只允许删除 "PENDING_ACCEPT" (取消/拒绝) 或 "COMPLETED" (清理) 的房间
    // 如果房间正在游戏中 (PLAYING)，删除可能会导致对方掉线，看你是否允许强制结束
    // 这里我们不做限制，允许用户强制删除/退出

    // 5. 执行删除
    await prisma.room.delete({
      where: { id: roomId }
    })

    return NextResponse.json({
      success: true,
      message: 'Room deleted successfully'
    })
  } catch (error) {
    console.error('Delete Room Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
