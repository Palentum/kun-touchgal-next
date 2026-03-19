import { prisma } from '~/prisma/index'
import { VNDB_API_BASE, VNDB_API_HEADERS } from '~/constants/vndb'
import { TAG_MAP } from '~/lib/tagMap'

interface VndbTag {
  id: string
  name: string
  rating: number
  spoiler: number
  lie: boolean
  category: string
}

export const ensurePatchTagsFromVNDB = async (
  patchId: number,
  vndbId: string | null | undefined,
  uid: number
) => {
  const id = (vndbId || '').trim()
  if (!id) return { ensured: 0, related: 0 }

  try {
    const res = await fetch(`${VNDB_API_BASE}/vn`, {
      method: 'POST',
      headers: VNDB_API_HEADERS,
      body: JSON.stringify({
        filters: ['id', '=', id],
        fields: 'id,tags{id,name,rating,spoiler,lie,category}',
        results: 1
      })
    })

    if (!res.ok) {
      return { ensured: 0, related: 0 }
    }

    const data = (await res.json()) as {
      results?: Array<{ tags?: VndbTag[] | null }>
    }

    const allTags = data?.results?.[0]?.tags ?? []

    const filteredTags = allTags.filter(
      (t) =>
        !t.lie &&
        t.spoiler === 0 &&
        (t.category === 'cont' || t.category === 'tech')
    )

    if (!filteredTags.length) return { ensured: 0, related: 0 }

    const vndbOriginalNames = filteredTags.map((t) => t.name)
    const existingTags = await prisma.patch_tag.findMany({
      where: { vndb_original_name: { in: vndbOriginalNames } },
      select: { id: true, vndb_original_name: true }
    })
    const existingNameSet = new Set(
      existingTags.map((t) => t.vndb_original_name)
    )

    const tagsToCreate = filteredTags.filter(
      (t) => !existingNameSet.has(t.name)
    )

    const mappedNames = tagsToCreate.map((t) => TAG_MAP[t.name] || t.name)
    const conflictingTags = await prisma.patch_tag.findMany({
      where: { name: { in: mappedNames } },
      select: { id: true, name: true }
    })
    const conflictNameSet = new Set(conflictingTags.map((t) => t.name))

    const reallyToCreate = tagsToCreate.filter((t) => {
      const mappedName = TAG_MAP[t.name] || t.name
      return !conflictNameSet.has(mappedName)
    })

    if (reallyToCreate.length) {
      await prisma.patch_tag.createMany({
        data: reallyToCreate.map((t) => ({
          name: TAG_MAP[t.name] || t.name,
          user_id: uid,
          source: 'vndb',
          vndb_original_name: t.name,
          vndb_category: t.category,
          vndb_spoiler: t.spoiler,
          vndb_rating: t.rating
        })),
        skipDuplicates: true
      })
    }

    const allRelevantTags = await prisma.patch_tag.findMany({
      where: {
        OR: [
          { vndb_original_name: { in: vndbOriginalNames } },
          { name: { in: mappedNames } }
        ]
      },
      select: { id: true }
    })
    const tagIds = allRelevantTags.map((t) => t.id)

    if (tagIds.length) {
      const existingRelations = await prisma.patch_tag_relation.findMany({
        where: {
          patch_id: patchId,
          tag_id: { in: tagIds }
        },
        select: { tag_id: true }
      })
      const existingRelationIds = new Set(
        existingRelations.map((r) => r.tag_id)
      )

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

    return { ensured: reallyToCreate.length, related: tagIds.length }
  } catch {
    return { ensured: 0, related: 0 }
  }
}
