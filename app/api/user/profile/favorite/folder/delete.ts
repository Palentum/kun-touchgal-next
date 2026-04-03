import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { bumpPatchFavoriteCacheVersion } from '~/app/api/patch/cache'

const folderIdSchema = z.object({
  folderId: z.coerce.number().min(1).max(9999999)
})

export const deleteFolder = async (
  input: z.infer<typeof folderIdSchema>,
  uid: number
) => {
  const folder = await prisma.user_patch_favorite_folder.findUnique({
    where: { id: input.folderId }
  })
  if (!folder) {
    return '未找到该收藏夹'
  }
  if (folder.user_id !== uid) {
    return '您没有权限删除该收藏夹'
  }

  await prisma.user_patch_favorite_folder.delete({
    where: { id: input.folderId }
  })

  try {
    await bumpPatchFavoriteCacheVersion(uid)
  } catch {
    // 缓存版本更新失败不影响删除结果
  }

  return {}
}
