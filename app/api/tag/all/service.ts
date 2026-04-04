import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getTagSchema } from '~/validations/tag'
import type { Tag } from '~/types/api/tag'

export const getTag = async (input: z.infer<typeof getTagSchema>) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_tag.findMany({
      take: limit,
      skip: offset,
      orderBy: { count: 'desc' }
    }),
    prisma.patch_tag.count()
  ])

  const tags: Tag[] = data.map((tag) => ({
    id: tag.id,
    name: tag.name,
    count: tag.count,
    alias: tag.alias
  }))

  return { tags, total }
}
