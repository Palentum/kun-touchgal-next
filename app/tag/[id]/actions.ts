'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getTagById } from '~/app/api/tag/get'
import { getPatchByTag } from '~/app/api/tag/galgame/service'
import { getPatchVisibilityWhere } from '~/utils/actions/getPatchVisibilityWhere'
import { getPatchByTagSchema, getTagByIdSchema } from '~/validations/tag'

export const kunGetTagByIdActions = async (
  params: z.infer<typeof getTagByIdSchema>
) => {
  const input = safeParseSchema(getTagByIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getTagById(input)
  return response
}

export const kunTagGalgameActions = async (
  params: z.infer<typeof getPatchByTagSchema>
) => {
  const input = safeParseSchema(getPatchByTagSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const visibilityWhere = await getPatchVisibilityWhere()

  const response = await getPatchByTag(input, visibilityWhere)
  return response
}
