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
      fields: 'title, titles.title, aliases, released'
    })
  })

  const vndbData = await vndbResponse.json()

  if (vndbData.results.length === 0) {
    console.log('No results found for the given name')
    return
  }

  const vn = vndbData.results[0]
  return {
    released: vn.released,
    aliases: vn.aliases
  }
}

const updatePatchInfo = async () => {
  const patches = await prisma.patch.findMany()

  for (const patch of patches) {
    const searchTerm = extractSearchTerm(patch.name)
    const { released, aliases } = await fetchVnDetails(searchTerm)

    await prisma.patch.update({
      where: { id: patch.id },
      data: {
        released: released ?? '',
        alias: aliases
      }
    })

    console.log(
      `Updated galgame ${patch.name} with released: ${released}, aliases: ${aliases}`
    )

    await sleep(1000)
  }
}

updatePatchInfo()
