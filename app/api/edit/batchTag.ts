import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchUpdateSchema } from '~/validations/edit'

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

// 批量处理 tags
export const handleBatchPatchTags = async (
  input: z.infer<typeof patchUpdateSchema>,
  uid: number
) => {
  const { id, name, alias, tag, introduction, contentLimit } = input

  console.log(input)

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch.update({
      where: { id },
      data: {
        name,
        alias: alias ? alias : [],
        introduction,
        content_limit: contentLimit
      }
    })

    // 获取当前 patch 的所有关联 tag
    const existingRelations = await prisma.patch_tag_relation.findMany({
      where: { patch_id: id },
      include: { tag: true }
    })

    // 当前已关联的 tag name
    const existingTagNames = existingRelations.map((rel) => rel.tag.name)

    // 需要添加的 tags
    const tagsToAdd = tag.filter((tag) => !existingTagNames.includes(tag))
    // 需要移除的 tags
    const tagsToRemove = existingRelations
      .filter((rel) => !tag.includes(rel.tag.name))
      .map((rel) => rel.tag_id)

    // 添加新的 tags
    const newTagIds: number[] = []
    for (const tagName of tagsToAdd) {
      const existingTag = await prisma.patch_tag.findFirst({
        where: { OR: [{ name: tagName }, { alias: { has: tagName } }] }
      })

      if (existingTag) {
        // 如果 tag 已经存在，直接记录其 ID
        newTagIds.push(existingTag.id)
      } else {
        // 如果 tag 不存在，创建新的 tag
        const newTag = await createTag(tagName, uid)
        if (typeof newTag !== 'string' && newTag.id) {
          newTagIds.push(newTag.id)
        }
      }
    }

    // 新建关联关系并增加计数
    if (newTagIds.length > 0) {
      const relationData = newTagIds.map((tagId) => ({
        patch_id: id,
        tag_id: tagId
      }))

      await prisma.patch_tag_relation.createMany({ data: relationData })

      await prisma.patch_tag.updateMany({
        where: { id: { in: newTagIds } },
        data: { count: { increment: 1 } }
      })
    }

    // 移除关联关系并减少计数
    if (tagsToRemove.length > 0) {
      await prisma.patch_tag_relation.deleteMany({
        where: { patch_id: id, tag_id: { in: tagsToRemove } }
      })

      await prisma.patch_tag.updateMany({
        where: { id: { in: tagsToRemove } },
        data: { count: { decrement: 1 } }
      })
    }

    return {}
  })
}
