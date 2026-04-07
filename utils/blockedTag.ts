import type { Prisma } from '~/prisma/generated/prisma/client'

export const parseBlockedTagIds = (value?: string | null) => {
  if (!value) {
    return []
  }

  try {
    const data = JSON.parse(value)
    if (!Array.isArray(data)) {
      return []
    }

    return [...new Set(data)]
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  } catch {
    return []
  }
}

export const appendBlockedTagId = (ids: number[], tagId: number) => {
  if (ids.includes(tagId)) {
    return ids
  }

  return [...ids, tagId]
}

export const removeBlockedTagId = (ids: number[], tagId: number) => {
  return ids.filter((id) => id !== tagId)
}

export const buildBlockedTagWhere = (
  blockedTagIds: number[]
): Prisma.patchWhereInput => {
  if (!blockedTagIds.length) {
    return {}
  }

  return {
    NOT: {
      tag: {
        some: {
          tag_id: {
            in: blockedTagIds
          }
        }
      }
    }
  }
}
