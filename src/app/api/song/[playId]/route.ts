import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db' // Prisma instance

export async function GET(
  req: Request,
  { params }: { params: Promise<{ playId: string }> }
) {
  try {
    const { playId } = await params
    const song = await prisma.song.findUnique({
      where: { id: playId }
    })

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, song })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}
