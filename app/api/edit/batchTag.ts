import { prisma } from '~/prisma/index'

export const createTag = async (name: string, uid: number) => {
  const existingTag = await prisma.patch_tag.findFirst({
    where: {
      OR: [{ name }, { alias: { has: name } }]
    }
  })
  if (existingTag) {
    return '这个标签已经存在了'
  }

  const newTag = await prisma.patch_tag.create({
    data: {
      user_id: uid,
      name
    },
    select: {
      id: true,
      name: true,
      count: true,
      alias: true
    }
  })

  return newTag
}

export const handleBatchPatchTags = async (
  patchId: number,
  tagArray: string[],
  uid: number
) => {
  return await prisma.$transaction(async (prisma) => {
    const existingRelations = await prisma.patch_tag_relation.findMany({
      where: { patch_id: patchId },
      include: { tag: true }
    })

    const existingTagNames = existingRelations.map((rel) => rel.tag.name)
    const tagsToAdd = tagArray.filter((tag) => !existingTagNames.includes(tag))
    const tagsToRemove = existingRelations
      .filter((rel) => !tagArray.includes(rel.tag.name))
      .map((rel) => rel.tag_id)

    const newTagIds: number[] = []
    for (const tagName of tagsToAdd) {
      if (!tagName) {
        continue
      }

      const existingTag = await prisma.patch_tag.findFirst({
        where: { OR: [{ name: tagName }, { alias: { has: tagName } }] }
      })

      if (existingTag) {
        newTagIds.push(existingTag.id)
      } else {
        const newTag = await createTag(tagName, uid)
        if (typeof newTag !== 'string' && newTag.id) {
          newTagIds.push(newTag.id)
        }
      }
    }

    if (newTagIds.length > 0) {
      const relationData = newTagIds.map((tagId) => ({
        patch_id: patchId,
        tag_id: tagId
      }))

      await prisma.patch_tag_relation.createMany({ data: relationData })

      await prisma.patch_tag.updateMany({
        where: { id: { in: newTagIds } },
        data: { count: { increment: 1 } }
      })
    }

    if (tagsToRemove.length > 0) {
      await prisma.patch_tag_relation.deleteMany({
        where: { patch_id: patchId, tag_id: { in: tagsToRemove } }
      })

      await prisma.patch_tag.updateMany({
        where: { id: { in: tagsToRemove } },
        data: { count: { decrement: 1 } }
      })
    }

    return {}
  })
}
