'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { rankingSchema } from '~/validations/ranking'
import { getRanking } from '~/app/api/ranking/service'
import { getPatchVisibilityWhere } from '~/utils/actions/getPatchVisibilityWhere'

export const kunGetRankingActions = async (
  params: z.infer<typeof rankingSchema>
) => {
  const input = safeParseSchema(rankingSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const visibilityWhere = await getPatchVisibilityWhere()
  const response = await getRanking(input, visibilityWhere)
  return response
}
