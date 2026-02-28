'use client'

import { kunFetchPost } from '~/utils/kunFetch'

interface VNDBDetailsResponse {
  titles: string[]
  released: string
}

export const fetchVNDBDetails = async (
  vnId: string
): Promise<{ titles: string[]; released: string }> => {
  const response = await kunFetchPost<VNDBDetailsResponse | string>(
    '/edit/vndb/details',
    { vndbId: vnId }
  )

  if (typeof response === 'string') {
    if (response === '未找到对应的 VNDB 条目') {
      throw new Error('VNDB_NOT_FOUND')
    }
    throw new Error('VNDB_API_ERROR')
  }

  return response
}
