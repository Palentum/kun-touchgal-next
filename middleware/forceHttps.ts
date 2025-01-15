import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const kunForceHttpsMiddleware = async (request: NextRequest) => {
  const protocol = request.headers.get('X-Forwarded-Proto') || 'https'

  if (protocol === 'http') {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    httpsUrl.hostname = process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD!
    return NextResponse.redirect(httpsUrl)
  }

  return NextResponse.next()
}
