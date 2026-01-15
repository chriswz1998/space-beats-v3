// app/api/song/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/dist/server/web/spec-extension/revalidate'

// Define validation schemas (ensure JSON shape from client).
// Matches the single-note structure from Python.
const noteSchema = z.object({
  time: z.number(),
  type: z.string(),
  lane: z.number()
})

// Matches the full request body from the client.
const createSongSchema = z.object({
  name: z.string().min(1),
  author: z.string(),
  duration: z.number(), // Prisma Int
  url: z.string(), // MP3 URL
  achievement: z.string(), // Prisma String
  // Charts for three difficulties
  easyChart: z.array(noteSchema),
  normalChart: z.array(noteSchema),
  hardChart: z.array(noteSchema)
})

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await req.json()

    console.log(body)
    // Validate data
    const validatedData = createSongSchema.parse(body)

    // Write to database
    const newSong = await prisma.song.create({
      data: {
        name: validatedData.name,
        author: session.user.name || validatedData.author,
        duration: Math.round(validatedData.duration),
        url: validatedData.url,
        achievement: validatedData.achievement,
        easyChart: validatedData.easyChart,
        normalChart: validatedData.normalChart,
        hardChart: validatedData.hardChart,
        userId: session.user.id
      }
    })
    revalidatePath('/')
    return NextResponse.json({ success: true, song: newSong })
  } catch (error) {
    console.error('Upload song error:', error)

    // Return 400 for validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format', details: error },
        { status: 400 }
      )
    }

    // Return 500 for other errors
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
