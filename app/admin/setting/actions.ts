'use server'

import { getRedirectConfig } from '~/app/api/admin/setting/redirect/getRedirectConfig'

export const kunGetActions = async () => {
  const response = await getRedirectConfig()
  return response
}
