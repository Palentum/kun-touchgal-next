'use server'

import { getPatchVisibilityWhere } from '~/utils/actions/getPatchVisibilityWhere'
import { getHomeData } from '~/app/api/home/service'

export const kunGetActions = async () => {
  const visibilityWhere = await getPatchVisibilityWhere()
  const response = await getHomeData(visibilityWhere)
  return response
}
