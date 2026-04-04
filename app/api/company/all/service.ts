import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getCompanySchema } from '~/validations/company'
export const getCompany = async (input: z.infer<typeof getCompanySchema>) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [companies, total] = await Promise.all([
    prisma.patch_company.findMany({
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        count: true,
        alias: true
      },
      orderBy: { count: 'desc' }
    }),
    prisma.patch_company.count()
  ])

  return { companies, total }
}
