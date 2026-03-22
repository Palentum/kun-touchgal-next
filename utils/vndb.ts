'use client'

import { kunFetchPost } from '~/utils/kunFetch'

interface VNDBDetailsResponse {
  titles: string[]
  released: string
  tags: string[]
  developers: string[]
}

export const fetchVNDBDetails = async (
  vnId: string
): Promise<VNDBDetailsResponse> => {
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
