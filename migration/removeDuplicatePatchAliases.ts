import 'dotenv/config'
import { prisma } from '~/prisma/index'

const BATCH_SIZE = 1000

async function removeDuplicatePatchAliases() {
  let lastSeenId = 0
  let totalChecked = 0
  let totalDeleted = 0

  while (true) {
    const aliases = await prisma.patch_alias.findMany({
      take: BATCH_SIZE,
      orderBy: {
        id: 'asc'
      },
      where: {
        id: {
          gt: lastSeenId
        }
      },
      select: {
        id: true,
        name: true,
        patch: {
          select: {
            id: true,
            unique_id: true,
            name: true
          }
        }
      }
    })

    if (!aliases.length) {
      break
    }

    totalChecked += aliases.length
    lastSeenId = aliases[aliases.length - 1].id

    const duplicateAliasIds = aliases
      .filter((alias) => alias.name === alias.patch.name)
      .map((alias) => alias.id)

    if (duplicateAliasIds.length) {
      const result = await prisma.patch_alias.deleteMany({
        where: {
          id: {
            in: duplicateAliasIds
          }
        }
      })

      totalDeleted += result.count
      console.log(
        `Processed ${totalChecked} aliases, deleted ${result.count} duplicates in current batch`
      )
      continue
    }

    console.log(`Processed ${totalChecked} aliases, no duplicates in current batch`)
  }

  console.log(
    `Cleanup completed. Checked ${totalChecked} aliases, deleted ${totalDeleted} duplicates`
  )
}

removeDuplicatePatchAliases()
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
