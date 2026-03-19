import { prisma } from '~/prisma/index'
import { fetchSteamAppData } from '~/lib/arnebiae/steam'
import { lowQualitySteamTags } from '~/lib/steamDirtyTag'
import type { SteamAppData } from '~/lib/arnebiae/steam'

const dirtyTagSet = new Set(lowQualitySteamTags)

const processTags = async (
  patchId: number,
  data: SteamAppData,
  uid: number
) => {
  const filteredTags = data.tags.filter((t) => !dirtyTagSet.has(t))
  if (!filteredTags.length) return { ensured: 0, related: 0 }

  const existingTags = await prisma.patch_tag.findMany({
    where: { name: { in: filteredTags } },
    select: { id: true, name: true }
  })
  const existingNameSet = new Set(existingTags.map((t) => t.name))

  const tagsToCreate = filteredTags.filter((t) => !existingNameSet.has(t))

  if (tagsToCreate.length) {
    await prisma.patch_tag.createMany({
      data: tagsToCreate.map((name) => ({
        name,
        user_id: uid,
        source: 'steam'
      })),
      skipDuplicates: true
    })
  }

  const allRelevantTags = await prisma.patch_tag.findMany({
    where: { name: { in: filteredTags } },
    select: { id: true }
  })
  const tagIds = allRelevantTags.map((t) => t.id)

  if (tagIds.length) {
    const existingRelations = await prisma.patch_tag_relation.findMany({
      where: { patch_id: patchId, tag_id: { in: tagIds } },
      select: { tag_id: true }
    })
    const existingRelationIds = new Set(existingRelations.map((r) => r.tag_id))
    const newTagIds = tagIds.filter((id) => !existingRelationIds.has(id))

    if (newTagIds.length) {
      await prisma.patch_tag_relation.createMany({
        data: newTagIds.map((tagId) => ({
          patch_id: patchId,
          tag_id: tagId
        })),
        skipDuplicates: true
      })

      await prisma.patch_tag.updateMany({
        where: { id: { in: newTagIds } },
        data: { count: { increment: 1 } }
      })
    }
  }

  return { ensured: tagsToCreate.length, related: tagIds.length }
}

const processCompanies = async (
  patchId: number,
  data: SteamAppData,
  uid: number
) => {
  for (const dev of data.developers) {
    const devName = dev.name?.trim()
    if (!devName) continue

    let company = await prisma.patch_company.findFirst({
      where: { name: devName }
    })

    if (!company) {
      company = await prisma.patch_company.create({
        data: {
          name: devName,
          introduction: '',
          count: 0,
          primary_language: [],
          official_website: dev.link ? [dev.link] : [],
          parent_brand: [],
          alias: [],
          user_id: uid
        }
      })
    }

    const existingRelation = await prisma.patch_company_relation.findFirst({
      where: { patch_id: patchId, company_id: company.id }
    })

    if (!existingRelation) {
      await prisma.patch_company_relation.create({
        data: { patch_id: patchId, company_id: company.id }
      })

      await prisma.patch_company.update({
        where: { id: company.id },
        data: { count: { increment: 1 } }
      })
    }
  }
}

export const ensurePatchDataFromSteam = async (
  patchId: number,
  steamId: number,
  uid: number
) => {
  const hasTag = await prisma.patch_tag_relation.findFirst({
    where: { patch_id: patchId, tag: { source: 'steam' } },
    select: { id: true }
  })
  if (hasTag) return { ensured: 0, related: 0 }

  try {
    const data = await fetchSteamAppData(steamId)

    const tagResult = await processTags(patchId, data, uid)
    await processCompanies(patchId, data, uid)

    return tagResult
  } catch {
    return { ensured: 0, related: 0 }
  }
}
