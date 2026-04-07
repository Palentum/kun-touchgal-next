'use server'

import { z } from 'zod'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getCompanyById } from '~/app/api/company/service'
import { getPatchByCompany } from '~/app/api/company/galgame/service'
import {
  getCompanyByIdSchema,
  getPatchByCompanySchema
} from '~/validations/company'
import { getPatchVisibilityWhere } from '~/utils/actions/getPatchVisibilityWhere'

export const kunGetCompanyByIdActions = async (
  params: z.infer<typeof getCompanyByIdSchema>
) => {
  const input = safeParseSchema(getCompanyByIdSchema, params)
  if (typeof input === 'string') {
    return input
  }

  const response = await getCompanyById(input)
  return response
}

export const kunCompanyGalgameActions = async (
  params: z.infer<typeof getPatchByCompanySchema>
) => {
  const input = safeParseSchema(getPatchByCompanySchema, params)
  if (typeof input === 'string') {
    return input
  }

  const visibilityWhere = await getPatchVisibilityWhere()

  const response = await getPatchByCompany(input, visibilityWhere)
  return response
}
