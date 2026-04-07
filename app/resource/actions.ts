'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { resourceSchema } from '~/validations/resource'
import { getPatchResource } from '~/app/api/resource/service'
import { getPatchVisibilityWhere } from '~/utils/actions/getPatchVisibilityWhere'

export const kunGetActions = async (params: z.infer<typeof resourceSchema>) => {
  const input = safeParseSchema(resourceSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const visibilityWhere = await getPatchVisibilityWhere()

  const response = await getPatchResource(input, visibilityWhere)
  return response
}
