import { handleBatchPatchTags } from './batchTag'
import { ensurePatchCompaniesFromVNDB } from './fetchCompanies'
import { ensurePatchCompanyFromDlsite } from './dlsite'
import { ensurePatchTagsFromVNDB } from './fetchTags'
import { ensurePatchTagsFromBangumi } from './fetchBangumiTags'
import { ensurePatchDataFromSteam } from './fetchSteamTags'

interface ExternalIds {
  vndbId?: string | null
  dlsiteCode?: string | null
  bangumiId?: number | null
  steamId?: number | null
  dlsiteCircleName?: string | null
  dlsiteCircleLink?: string | null
}

export const syncExternalData = async (
  patchId: number,
  ids: ExternalIds,
  tagArray: string[],
  uid: number
) => {
  if (tagArray.length) {
    await handleBatchPatchTags(patchId, tagArray, uid)
  }

  const tasks: { source: string; fn: () => Promise<unknown> }[] = []

  if (ids.vndbId) {
    tasks.push({
      source: 'vndb',
      fn: async () => {
        await ensurePatchCompaniesFromVNDB(patchId, ids.vndbId, uid)
        await ensurePatchTagsFromVNDB(patchId, ids.vndbId, uid)
      }
    })
  }

  if (ids.bangumiId) {
    tasks.push({
      source: 'bangumi',
      fn: () => ensurePatchTagsFromBangumi(patchId, ids.bangumiId!, uid)
    })
  }

  if (ids.steamId) {
    tasks.push({
      source: 'steam',
      fn: () => ensurePatchDataFromSteam(patchId, ids.steamId!, uid)
    })
  }

  if (ids.dlsiteCode) {
    tasks.push({
      source: 'dlsite',
      fn: () =>
        ensurePatchCompanyFromDlsite(
          patchId,
          ids.dlsiteCode,
          uid,
          ids.dlsiteCircleName,
          ids.dlsiteCircleLink
        )
    })
  }

  const results = await Promise.allSettled(tasks.map((t) => t.fn()))

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(
        `Failed to sync ${tasks[index].source} data for patch ${patchId}:`,
        result.reason
      )
    }
  })
}
