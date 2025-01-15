import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const kunForceHttpsMiddleware = async (request: NextRequest) => {
  if (request.nextUrl.protocol === 'http:') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl)
  }
  return NextResponse.next()
}
