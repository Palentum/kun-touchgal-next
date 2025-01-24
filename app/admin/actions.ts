'use server'

import { getAdminStats } from '~/app/api/admin/stats/route'

export const kunGetActions = async () => {
  const response = await getAdminStats()
  return response
}
