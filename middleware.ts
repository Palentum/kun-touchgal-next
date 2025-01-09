import { kunAuthMiddleware } from '~/middleware/auth'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/admin/:path*', '/user/:path*']
}

export const middleware = async (request: NextRequest) => {
  return kunAuthMiddleware(request)
}
