import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { markdownToHtmlExtend } from '~/app/api/utils/render/markdownToHtmlExtend'
import { getKv, setKv } from '~/lib/redis'
import { PATCH_INTRODUCTION_CACHE_DURATION } from '~/config/cache'
import type { PatchIntroduction } from '~/types/api/patch'

const CACHE_KEY = 'patch:introduction'

const uniqueIdSchema = z.object({
  uniqueId: z.string().min(8).max(8)
})

export const getPatchIntroduction = async (
  input: z.infer<typeof uniqueIdSchema>
) => {
  const cachedIntro = await getKv(`${CACHE_KEY}:${input.uniqueId}`)
  if (cachedIntro) {
    return JSON.parse(cachedIntro) as PatchIntroduction
  }

  const { uniqueId } = input

  const patch = await prisma.patch.findUnique({
    where: { unique_id: uniqueId },
    include: {
      alias: {
        select: {
          name: true
        }
      },
      tag: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              count: true,
              alias: true
            }
          }
        }
      },
      company: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              count: true,
              alias: true
            }
          }
        }
      }
    }
  })
  if (!patch) {
    return '未找到对应 Galgame'
  }

  const response: PatchIntroduction = {
    vndbId: patch.vndb_id,
    vndbRelationId: patch.vndb_relation_id,
    bangumiId: patch.bangumi_id,
    steamId: patch.steam_id,
    dlsiteCode: patch.dlsite_code,
    introduction: await markdownToHtmlExtend(patch.introduction),
    released: patch.released,
    alias: patch.alias.map((a) => a.name),
    tag: patch.tag.map((tag) => tag.tag),
    company: patch.company.map((company) => company.company),
    created: patch.created,
    updated: patch.updated,
    resourceUpdateTime: patch.resource_update_time
  }

  await setKv(
    `${CACHE_KEY}:${input.uniqueId}`,
    JSON.stringify(response),
    PATCH_INTRODUCTION_CACHE_DURATION
  )

  return response
}
