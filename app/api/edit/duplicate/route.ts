import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { duplicateSchema } from '~/validations/edit'
import type { Prisma } from '~/prisma/generated/prisma/client'

const duplicate = async (input: z.infer<typeof duplicateSchema>) => {
  const vndbId = input.vndbId?.toLowerCase()
  const vndbRelationId = input.vndbRelationId?.toLowerCase()
  const bangumiId = input.bangumiId ? Number(input.bangumiId) : undefined
  const steamId = input.steamId ? Number(input.steamId) : undefined
  const dlsiteCode = input.dlsiteCode?.toUpperCase()
  const title = input.title
  const excludeId = input.excludeId ? Number(input.excludeId) : undefined

  const conditions: Prisma.patchWhereInput[] = []

  const hasCompositeVndbKey = Boolean(vndbId && vndbRelationId)

  if (hasCompositeVndbKey) {
    conditions.push({
      AND: [{ vndb_id: vndbId }, { vndb_relation_id: vndbRelationId }]
    })
  }

  if (vndbId && !hasCompositeVndbKey) {
    conditions.push({ vndb_id: vndbId })
  }

  if (vndbRelationId && !hasCompositeVndbKey) {
    conditions.push({ vndb_relation_id: vndbRelationId })
  }

  if (bangumiId) {
    conditions.push({ bangumi_id: bangumiId })
  }

  if (steamId) {
    conditions.push({ steam_id: steamId })
  }

  if (dlsiteCode) {
    conditions.push({ dlsite_code: dlsiteCode })
  }

  if (title) {
    conditions.push({
      name: {
        equals: title,
        mode: 'insensitive'
      }
    })
    conditions.push({
      alias: {
        some: {
          name: {
            equals: title,
            mode: 'insensitive'
          }
        }
      }
    })
  }

  if (!conditions.length) {
    return {}
  }

  const where: Prisma.patchWhereInput = {
    OR: conditions
  }

  if (excludeId) {
    where.id = { not: excludeId }
  }

  const patch = await prisma.patch.findFirst({
    where,
    select: {
      unique_id: true
    }
  })

  if (patch?.unique_id) {
    return { uniqueId: patch.unique_id }
  }

  return {}
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, duplicateSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await duplicate(input)
  return NextResponse.json(response)
}
