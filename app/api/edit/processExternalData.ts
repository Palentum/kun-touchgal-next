import { prisma } from '~/prisma/index'
import { handleBatchPatchTags } from './batchTag'

interface SubmittedExternalData {
  vndbTags: string[]
  vndbDevelopers: string[]
  bangumiTags: string[]
  bangumiDevelopers: string[]
  steamTags: string[]
  steamDevelopers: string[]
  steamAliases: string[]
  dlsiteCircleName: string
  dlsiteCircleLink: string
}

const ensureTagsWithSource = async (
  patchId: number,
  tagNames: string[],
  source: string,
  uid: number
) => {
  const validTags = tagNames.filter(Boolean)
  if (!validTags.length) return

  const existingTags = await prisma.patch_tag.findMany({
    where: { name: { in: validTags } },
    select: { id: true, name: true }
  })
  const existingNameSet = new Set(existingTags.map((t) => t.name))

  const tagsToCreate = validTags.filter((n) => !existingNameSet.has(n))
  if (tagsToCreate.length) {
    await prisma.patch_tag.createMany({
      data: tagsToCreate.map((name) => ({ name, user_id: uid, source })),
      skipDuplicates: true
    })
  }

  const allTags = await prisma.patch_tag.findMany({
    where: { name: { in: validTags } },
    select: { id: true }
  })
  const tagIds = allTags.map((t) => t.id)

  if (!tagIds.length) return

  const existingRelations = await prisma.patch_tag_relation.findMany({
    where: { patch_id: patchId, tag_id: { in: tagIds } },
    select: { tag_id: true }
  })
  const existingRelationIds = new Set(existingRelations.map((r) => r.tag_id))
  const newTagIds = tagIds.filter((id) => !existingRelationIds.has(id))

  if (newTagIds.length) {
    await prisma.patch_tag_relation.createMany({
      data: newTagIds.map((tagId) => ({ patch_id: patchId, tag_id: tagId })),
      skipDuplicates: true
    })
    await prisma.patch_tag.updateMany({
      where: { id: { in: newTagIds } },
      data: { count: { increment: 1 } }
    })
  }
}

const ensureCompanies = async (
  patchId: number,
  names: string[],
  uid: number
) => {
  const validNames = names.filter(Boolean)
  if (!validNames.length) return

  const existing = await prisma.patch_company.findMany({
    where: { name: { in: validNames } },
    select: { id: true, name: true }
  })
  const existingNameSet = new Set(existing.map((c) => c.name))

  const toCreate = validNames.filter((n) => !existingNameSet.has(n))
  if (toCreate.length) {
    await prisma.patch_company.createMany({
      data: toCreate.map((name) => ({
        name,
        introduction: '',
        count: 0,
        primary_language: [],
        official_website: [],
        parent_brand: [],
        alias: [],
        user_id: uid
      })),
      skipDuplicates: true
    })
  }

  const allCompanies = await prisma.patch_company.findMany({
    where: { name: { in: validNames } },
    select: { id: true }
  })
  const companyIds = allCompanies.map((c) => c.id)

  if (!companyIds.length) return

  const existingRelations = await prisma.patch_company_relation.findMany({
    where: { patch_id: patchId, company_id: { in: companyIds } },
    select: { company_id: true }
  })
  const existingRelationIds = new Set(
    existingRelations.map((r) => r.company_id)
  )
  const newCompanyIds = companyIds.filter((id) => !existingRelationIds.has(id))

  if (newCompanyIds.length) {
    await prisma.patch_company_relation.createMany({
      data: newCompanyIds.map((companyId) => ({
        patch_id: patchId,
        company_id: companyId
      })),
      skipDuplicates: true
    })
    await prisma.patch_company.updateMany({
      where: { id: { in: newCompanyIds } },
      data: { count: { increment: 1 } }
    })
  }
}

const ensureSingleCompany = async (
  patchId: number,
  name: string,
  link: string,
  uid: number
) => {
  if (!name.trim()) return

  let company = await prisma.patch_company.findFirst({
    where: { name: name.trim() }
  })

  if (!company) {
    company = await prisma.patch_company.create({
      data: {
        name: name.trim(),
        introduction: '',
        count: 0,
        primary_language: [],
        official_website: link.trim() ? [link.trim()] : [],
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

const ensureAliases = async (patchId: number, aliases: string[]) => {
  const validAliases = aliases.filter(Boolean)
  if (!validAliases.length) return

  const existing = await prisma.patch_alias.findMany({
    where: { patch_id: patchId },
    select: { name: true }
  })
  const existingNames = new Set(existing.map((a) => a.name))
  const toCreate = validAliases.filter((n) => !existingNames.has(n))

  if (toCreate.length) {
    await prisma.patch_alias.createMany({
      data: toCreate.map((name) => ({ name, patch_id: patchId })),
      skipDuplicates: true
    })
  }
}

export const processSubmittedExternalData = async (
  patchId: number,
  data: SubmittedExternalData,
  userTags: string[],
  uid: number
) => {
  if (userTags.length) {
    await handleBatchPatchTags(patchId, userTags, uid)
  }

  const tagTasks = [
    data.vndbTags.length &&
      ensureTagsWithSource(patchId, data.vndbTags, 'vndb', uid),
    data.bangumiTags.length &&
      ensureTagsWithSource(patchId, data.bangumiTags, 'bangumi', uid),
    data.steamTags.length &&
      ensureTagsWithSource(patchId, data.steamTags, 'steam', uid)
  ].filter(Boolean)

  const companyTasks = [
    data.vndbDevelopers.length &&
      ensureCompanies(patchId, data.vndbDevelopers, uid),
    data.bangumiDevelopers.length &&
      ensureCompanies(patchId, data.bangumiDevelopers, uid),
    data.steamDevelopers.length &&
      ensureCompanies(patchId, data.steamDevelopers, uid),
    data.dlsiteCircleName &&
      ensureSingleCompany(
        patchId,
        data.dlsiteCircleName,
        data.dlsiteCircleLink,
        uid
      )
  ].filter(Boolean)

  const aliasTasks = [
    data.steamAliases.length && ensureAliases(patchId, data.steamAliases)
  ].filter(Boolean)

  await Promise.allSettled([...tagTasks, ...companyTasks, ...aliasTasks])
}
