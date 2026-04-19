import { prisma } from '~/prisma'
import cron from 'node-cron'
import { KUN_PATCH_WEBSITE_SYNC_PATCH_TYPE_ENDPOINT } from '~/config/external-api'
import { withTaskLock } from './withTaskLock'

const SYNC_PATCH_TYPE_LOCK_KEY = 'cron:sync-kun-patch-type:lock'
const SYNC_PATCH_TYPE_LOCK_TTL_SECONDS = 60 * 60

interface MoyuResponse<T> {
  success: boolean
  message: string
  data: T | null
}

const syncKunPatchType = async () => {
  console.log('Starting daily patch type sync task...')

  try {
    const res = await fetch(KUN_PATCH_WEBSITE_SYNC_PATCH_TYPE_ENDPOINT)
    if (!res.ok) {
      throw new Error(`Failed to fetch from API: ${res.statusText}`)
    }
    const response = (await res.json()) as MoyuResponse<string[]>

    if (response.success && Array.isArray(response.data)) {
      const vndbIdsToAddPatch = response.data

      if (vndbIdsToAddPatch.length === 0) {
        return
      }

      const updateResult = await prisma.patch.updateMany({
        where: {
          vndb_id: {
            in: vndbIdsToAddPatch
          },
          NOT: {
            type: {
              has: 'patch'
            }
          }
        },
        data: {
          type: {
            push: 'patch'
          }
        }
      })

      console.log(
        `Successfully updated ${updateResult.count} patch records. Task finished.`
      )
    } else {
      console.error(
        'API response was not successful or data is invalid.',
        response
      )
    }
  } catch (error) {
    console.error('An error occurred during the daily patch sync task:', error)
  }
}

export const syncKunPatchTypeTask = cron.createTask('0 0 * * *', async () => {
  await withTaskLock(
    {
      key: SYNC_PATCH_TYPE_LOCK_KEY,
      ttlSeconds: SYNC_PATCH_TYPE_LOCK_TTL_SECONDS,
      taskName: 'syncKunPatchTypeTask',
      releaseOnComplete: false
    },
    syncKunPatchType
  )
})
