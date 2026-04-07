'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { galgameSchema } from '~/validations/galgame'
import { getGalgame } from '~/app/api/galgame/service'
import { getPatchVisibilityWhere } from '~/utils/actions/getPatchVisibilityWhere'

export const kunGetActions = async (params: z.infer<typeof galgameSchema>) => {
  const input = safeParseSchema(galgameSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const visibilityWhere = await getPatchVisibilityWhere()

  const response = await getGalgame(input, visibilityWhere)
  return response
}
