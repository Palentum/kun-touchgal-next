import { prisma } from '~/prisma/index'

type TwoFactorDB = {
  user: Pick<typeof prisma.user, 'update'>
}

export const disable2FA = async (uid: number, db: TwoFactorDB = prisma) => {
  await db.user.update({
    where: { id: uid },
    data: {
      enable_2fa: false,
      two_factor_secret: '',
      two_factor_backup: []
    }
  })

  return { success: true, message: '2FA 已禁用' }
}
