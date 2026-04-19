import cron from 'node-cron'
import { Prisma } from '~/prisma/generated/prisma/client'
import { prisma } from '~/prisma'
import { drainPatchViewBuffer } from '~/app/api/patch/views/buffer'

const FLUSH_BATCH_SIZE = 1000

export const flushPatchViewsTask = cron.schedule('*/2 * * * *', async () => {
  try {
    const entries = await drainPatchViewBuffer()
    const validEntries = Object.entries(entries)
      .map(([uniqueId, countStr]) => [uniqueId, Number(countStr)] as const)
      .filter(([, count]) => Number.isFinite(count) && count > 0)

    if (validEntries.length === 0) {
      return
    }

    for (let i = 0; i < validEntries.length; i += FLUSH_BATCH_SIZE) {
      const batch = validEntries.slice(i, i + FLUSH_BATCH_SIZE)
      const caseFragments = batch.map(
        ([uniqueId, count]) => Prisma.sql`WHEN ${uniqueId} THEN ${count}`
      )
      const uniqueIdList = batch.map(([uniqueId]) => uniqueId)

      try {
        await prisma.$executeRaw`
          UPDATE patch
          SET view = view + CASE unique_id
            ${Prisma.join(caseFragments, ' ')}
            ELSE 0
          END
          WHERE unique_id IN (${Prisma.join(uniqueIdList)})
        `
      } catch (error) {
        console.error(
          `Error flushing patch views batch (offset ${i}):`,
          error
        )
      }
    }
  } catch (error) {
    console.error('Error flushing patch views to DB:', error)
  }
})
