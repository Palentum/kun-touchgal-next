'use server'

import { cookies } from 'next/headers'

export const getNSFWHeader = async () => {
  const cookieStore = await cookies()
  const nsfwCookie = cookieStore.get('nsfw')
  return nsfwCookie?.value === 'true' ? {} : { nsfw: undefined }
}
