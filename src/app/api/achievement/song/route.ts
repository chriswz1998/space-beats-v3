import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth' // Ensure this is your initialized auth instance
import { headers } from 'next/headers' // Next.js headers helper

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const songId = searchParams.get('songId')

    if (!songId) {
      return NextResponse.json({ error: 'Missing songId' }, { status: 400 })
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const record = await prisma.userSongAchievement.findUnique({
      where: {
        userId_songId: {
          userId: userId,
          songId: songId
        }
      }
    })

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Fetch achievement error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      songId,
      score,
      perfectCount,
      goodCount,
      missCount,
      isCleared
    } = body || {}

    if (!songId || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Missing songId or score' },
        { status: 400 }
      )
    }

    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const totalHits =
      (typeof perfectCount === 'number' ? perfectCount : 0) +
      (typeof goodCount === 'number' ? goodCount : 0) +
      (typeof missCount === 'number' ? missCount : 0)

    const nextIsFullCombo = totalHits > 0 && (missCount ?? 0) === 0
    const nextIsAllPerfect =
      totalHits > 0 && (goodCount ?? 0) === 0 && (missCount ?? 0) === 0

    const existing = await prisma.userSongAchievement.findUnique({
      where: {
        userId_songId: {
          userId,
          songId
        }
      }
    })

    const nextHighScore = existing
      ? Math.max(existing.highScore, score)
      : score
    const nextIsCleared = (existing?.isCleared ?? false) || !!isCleared
    const finalIsFullCombo = (existing?.isFullCombo ?? false) || nextIsFullCombo
    const finalIsAllPerfect =
      (existing?.isAllPerfect ?? false) || nextIsAllPerfect

    const record = existing
      ? await prisma.userSongAchievement.update({
          where: {
            userId_songId: {
              userId,
              songId
            }
          },
          data: {
            highScore: nextHighScore,
            isCleared: nextIsCleared,
            isFullCombo: finalIsFullCombo,
            isAllPerfect: finalIsAllPerfect
          }
        })
      : await prisma.userSongAchievement.create({
          data: {
            userId,
            songId,
            highScore: nextHighScore,
            isCleared: nextIsCleared,
            isFullCombo: finalIsFullCombo,
            isAllPerfect: finalIsAllPerfect
          }
        })

    // Update global achievements
    const unlockedTypes: Array<
      'FIRST_EXPERIENCE' | 'PERFECT_MASTER' | 'HIGH_SCORE_CHALLENGER' | 'RHYTHM_EXPERT' | 'COMPLETIONIST'
    > = []

    if (nextIsCleared) {
      unlockedTypes.push('FIRST_EXPERIENCE')
    }

    if (finalIsAllPerfect) {
      unlockedTypes.push('PERFECT_MASTER')
    }

    if (score >= 100000) {
      unlockedTypes.push('HIGH_SCORE_CHALLENGER')
    }

    if (totalHits > 0) {
      const accuracy = (perfectCount ?? 0 + (goodCount ?? 0)) / totalHits
      if (accuracy >= 0.9) {
        unlockedTypes.push('RHYTHM_EXPERT')
      }
    }

    if (nextIsCleared) {
      const totalSongs = await prisma.song.count()
      const clearedSongs = await prisma.userSongAchievement.count({
        where: { userId, isCleared: true }
      })
      if (totalSongs > 0 && clearedSongs >= totalSongs) {
        unlockedTypes.push('COMPLETIONIST')
      }
    }

    if (unlockedTypes.length > 0) {
      await prisma.userAchievement.createMany({
        data: unlockedTypes.map((type) => ({
          userId,
          type
        })),
        skipDuplicates: true
      })
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Update achievement error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
