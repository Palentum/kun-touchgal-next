import { kunAuthMiddleware } from '~/middleware/auth'
import { kunForceHttpsMiddleware } from '~/middleware/forceHttps'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/comment/:path*',
    '/edit/:path*',
    '/:path*'
  ]
}

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl

  if (process.env.NODE_ENV === 'production') {
    const forceHttpsResponse = await kunForceHttpsMiddleware(request)
    if (forceHttpsResponse) {
      return forceHttpsResponse
    }
  }

  const protectedRoutes = ['/admin', '/user', '/comment', '/edit']
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const authResponse = await kunAuthMiddleware(request)
    if (authResponse) {
      return authResponse
    }
  }

  return NextResponse.next()
}
