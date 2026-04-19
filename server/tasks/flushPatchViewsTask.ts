import cron from 'node-cron'
import { Prisma } from '~/prisma/generated/prisma/client'
import { prisma } from '~/prisma'
import {
  acknowledgePatchViewBuffer,
  checkoutPatchViewBuffer
} from '~/app/api/patch/views/buffer'
import { acquireKvLock, releaseKvLock } from '~/lib/redis'

const FLUSH_BATCH_SIZE = 1000
const FLUSH_LOCK_KEY = 'patch:views:flush:lock'
const FLUSH_LOCK_TTL_SECONDS = 600

export const flushPatchViewsTask = cron.schedule('*/2 * * * *', async () => {
  let lockToken: string | null = null

  try {
    lockToken = await acquireKvLock(FLUSH_LOCK_KEY, FLUSH_LOCK_TTL_SECONDS)
    if (!lockToken) {
      return
    }

    const buffer = await checkoutPatchViewBuffer()
    if (!buffer) {
      return
    }

    const validEntries = Object.entries(buffer.entries)
      .map(([uniqueId, countStr]) => [uniqueId, Number(countStr)] as const)
      .filter(([, count]) => Number.isFinite(count) && count > 0)

    if (validEntries.length === 0) {
      await acknowledgePatchViewBuffer(buffer.key)
      return
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < validEntries.length; i += FLUSH_BATCH_SIZE) {
        const batch = validEntries.slice(i, i + FLUSH_BATCH_SIZE)
        const caseFragments = batch.map(
          ([uniqueId, count]) => Prisma.sql`WHEN ${uniqueId} THEN ${count}`
        )
        const uniqueIdList = batch.map(([uniqueId]) => uniqueId)

        await tx.$executeRaw`
          UPDATE patch
          SET view = view + CASE unique_id
            ${Prisma.join(caseFragments, ' ')}
            ELSE 0
          END
          WHERE unique_id IN (${Prisma.join(uniqueIdList)})
        `
      }
    })

    await acknowledgePatchViewBuffer(buffer.key)
  } catch (error) {
    console.error('Error flushing patch views to DB:', error)
  } finally {
    if (lockToken) {
      try {
        await releaseKvLock(FLUSH_LOCK_KEY, lockToken)
      } catch (error) {
        console.error('Error releasing patch views flush lock:', error)
      }
    }
  }
})
