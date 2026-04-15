'use server'

import { cookies } from 'next/headers'

export const getNSFWHeader = async () => {
  const cookieStore = await cookies()

  const authToken = cookieStore.get('kun-galgame-patch-moe-token')?.value
  if (!authToken) {
    return { content_limit: 'sfw' }
  }

  const token = cookieStore.get(
    'kun-patch-setting-store|state|data|kunNsfwEnable'
  )?.value

  if (!token) {
    return { content_limit: 'sfw' }
  }

  if (token === 'all') {
    return {}
  } else {
    return { content_limit: token }
  }
}
