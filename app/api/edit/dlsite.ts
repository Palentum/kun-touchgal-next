import { prisma } from '~/prisma/index'
import { fetchDlsiteData } from '~/lib/arnebiae/dlsite'

export { fetchDlsiteData } from '~/lib/arnebiae/dlsite'
export type { DlsiteApiResponse } from '~/lib/arnebiae/dlsite'

export const ensurePatchCompanyFromDlsite = async (
  patchId: number,
  dlsiteCode: string | null | undefined,
  uid: number
) => {
  const code = dlsiteCode?.trim()
  if (!code) return

  try {
    const data = await fetchDlsiteData(code)
    const circleName = data.circle_name?.trim()
    if (!circleName) return

    const circleLink = data.circle_link?.trim()

    let company = await prisma.patch_company.findFirst({
      where: { name: circleName }
    })

    if (!company) {
      company = await prisma.patch_company.create({
        data: {
          name: circleName,
          introduction: '',
          count: 0,
          primary_language: [],
          official_website: circleLink ? [circleLink] : [],
          parent_brand: [],
          alias: [],
          user_id: uid
        }
      })
    }

    if (!company) return

    const existingRelation = await prisma.patch_company_relation.findFirst({
      where: { patch_id: patchId, company_id: company.id }
    })

    if (!existingRelation) {
      await prisma.patch_company_relation.create({
        data: {
          patch_id: patchId,
          company_id: company.id
        }
      })

      await prisma.patch_company.update({
        where: { id: company.id },
        data: {
          count: { increment: 1 }
        }
      })
    }
  } catch (error) {
    console.error('Failed to sync DLsite company', error)
  }
}
