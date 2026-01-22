import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const allowedOrigins = [
  'http://localhost:3000',
  'https://game.cabyte.ca',
  'https://rapid-terrier-active.ngrok-free.app'
]

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false

  if (req.method === 'OPTIONS' && req.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.json({}, { status: 200 })
    if (isAllowedOrigin && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
    return response
  }

  const response = NextResponse.next()
  if (isAllowedOrigin && origin && req.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return response
}

export const config = {
  matcher: ['/api/:path*']
}
