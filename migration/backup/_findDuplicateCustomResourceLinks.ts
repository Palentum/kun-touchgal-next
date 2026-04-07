// @ts-nocheck
import { prisma } from '../../prisma/index'
import { parseResourceLink } from '../../utils/resourceLink'

type ResourceRecord = {
  id: number
  content: string
  status: number
  user_id: number
  patch_id: number
  created: Date
  patch: {
    name: string
    unique_id: string
  }
}

type LinkOccurrence = {
  link: string
  resourceId: number
  patchId: number
  patchName: string
  patchUniqueId: string
  userId: number
  status: number
  created: string
}

const STATUS_LABEL_MAP: Record<number, string> = {
  0: 'normal',
  1: 'banned',
  2: 'pending'
}

const formatStatus = (status: number) => STATUS_LABEL_MAP[status] ?? 'unknown'

const normalizeDuplicateKey = (input: string) => {
  const parsed = parseResourceLink(input)
  if (!parsed.url) {
    return ''
  }

  try {
    const url = new URL(parsed.url)

    const params = Array.from(url.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    )
    url.search = ''
    for (const [key, value] of params) {
      url.searchParams.append(key, value)
    }

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }

    return url.toString().replace(/\?$/, '')
  } catch {
    return parsed.url.trim()
  }
}

const extractLinks = (content: string) =>
  content
    .split(',')
    .map((item) => normalizeDuplicateKey(item))
    .filter(Boolean)

const buildOccurrences = (resources: ResourceRecord[]) => {
  const duplicateMap = new Map<string, LinkOccurrence[]>()

  for (const resource of resources) {
    const links = extractLinks(resource.content)

    for (const link of links) {
      const occurrences = duplicateMap.get(link) ?? []
      occurrences.push({
        link,
        resourceId: resource.id,
        patchId: resource.patch_id,
        patchName: resource.patch.name,
        patchUniqueId: resource.patch.unique_id,
        userId: resource.user_id,
        status: resource.status,
        created: resource.created.toISOString()
      })
      duplicateMap.set(link, occurrences)
    }
  }

  return duplicateMap
}

const printSummary = (
  resources: ResourceRecord[],
  totalLinks: number,
  duplicateGroups: [string, LinkOccurrence[]][]
) => {
  console.log(`自定义链接资源总数: ${resources.length}`)
  console.log(`提取后的链接总数: ${totalLinks}`)
  console.log(`重复链接组数: ${duplicateGroups.length}`)
  console.log('')
}

const printDuplicateGroups = (duplicateGroups: [string, LinkOccurrence[]][]) => {
  for (const [index, [link, occurrences]] of duplicateGroups.entries()) {
    console.log(`[${index + 1}] ${link}`)
    console.log(`重复次数: ${occurrences.length}`)

    for (const item of occurrences) {
      console.log(
        `  - resource=${item.resourceId} patch=${item.patchId} uniqueId=${item.patchUniqueId} user=${item.userId} status=${formatStatus(item.status)} created=${item.created} name=${item.patchName}`
      )
    }

    console.log('')
  }
}

const main = async () => {
  const resources = await prisma.patch_resource.findMany({
    where: {
      storage: 'user'
    },
    select: {
      id: true,
      content: true,
      status: true,
      user_id: true,
      patch_id: true,
      created: true,
      patch: {
        select: {
          name: true,
          unique_id: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  })

  const duplicateMap = buildOccurrences(resources)
  const duplicateGroups = Array.from(duplicateMap.entries())
    .filter(([, occurrences]) => occurrences.length > 1)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))

  const totalLinks = Array.from(duplicateMap.values()).reduce(
    (count, occurrences) => count + occurrences.length,
    0
  )

  printSummary(resources, totalLinks, duplicateGroups)

  if (!duplicateGroups.length) {
    console.log('未发现重复的自定义链接。')
    return
  }

  printDuplicateGroups(duplicateGroups)
}

main()
  .catch((error) => {
    console.error('扫描重复自定义链接失败:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
