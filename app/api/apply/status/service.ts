import { prisma } from '~/prisma/index'

export const getApplyStatus = async (uid: number) => {
  const count = await prisma.patch_resource.count({
    where: { user_id: uid }
  })
  const user = await prisma.user.findUnique({
    where: { id: uid }
  })
  const role = user?.role ?? 0

  return { count, role }
}
