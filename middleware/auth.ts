import { NextResponse } from 'next/server'
import { parseCookies } from '~/utils/cookies'
import type { NextRequest } from 'next/server'

export const isProtectedRoute = (pathname: string) => {
  return pathname.startsWith('/admin') || pathname.startsWith('/user')
}

const redirectToLogin = (request: NextRequest) => {
  const loginUrl = new URL('/login', request.url)
  // loginUrl.searchParams.set('from', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const kunAuthMiddleware = async (request: NextRequest) => {
  const token = parseCookies(request.headers.get('cookie') ?? '')[
    'kun-galgame-patch-moe-token'
  ]

  if (isProtectedRoute(request.nextUrl.pathname) && !token) {
    return redirectToLogin(request)
  }

  return NextResponse.next()
}
