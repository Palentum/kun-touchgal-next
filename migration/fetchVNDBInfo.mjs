import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const extractSearchTerm = (name) => {
  const lastDashIndex = name.lastIndexOf(' - ')
  if (lastDashIndex !== -1) {
    return name.substring(0, lastDashIndex).trim()
  }
  return name.trim()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchVnDetails = async (name) => {
  const vndbResponse = await fetch('https://api.vndb.org/kana/vn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filters: ['search', '=', name],
      fields: 'id, aliases, released'
    })
  })

  const vndbData = await vndbResponse.json()

  if (vndbData.results.length === 0) {
    console.log('No results found for the given name: ', name)
    return
  }

  const vn = vndbData.results[0]
  return {
    id: vn.id,
    released: vn.released,
    aliases: vn.aliases
  }
}

const updatePatchInfo = async () => {
  const patches = await prisma.patch.findMany()

  for (const patch of patches) {
    const searchTerm = extractSearchTerm(patch.name)
    const res = await fetchVnDetails(searchTerm)
    if (!res) {
      continue
    }

    const { id, released, aliases } = res

    try {
      const existingPatch = await prisma.patch.findFirst({
        where: {
          vndb_id: id
        }
      })

      if (existingPatch) {
        console.log(
          `Skipping update for ${patch.name} because vndb_id ${id} already exists.`
        )
        continue
      }

      await prisma.patch.update({
        where: { id: patch.id },
        data: {
          vndb_id: id ?? '',
          released: released ?? '',
          alias: aliases
        }
      })

      console.log(
        `Updated galgame ${patch.name} with vndb_id: ${id}, released: ${released}, aliases: ${aliases}`
      )
    } catch (error) {
      console.error(`Failed to update patch ${patch.name}:`, error)
    }

    await sleep(1700)
  }
}

updatePatchInfo()
