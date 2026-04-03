import 'dotenv/config'
import { prisma } from '~/prisma/index'
import { normalizeResourceContent } from '~/utils/resourceLink'

const SHOULD_WRITE = process.argv.includes('--write')

interface ResourceRecord {
  id: number
  code: string
  content: string
  name: string
  patch: {
    name: string
  }
}

const resolveNextCode = (resource: ResourceRecord, codes: string[]) => {
  const currentCode = resource.code.trim()

  if (!codes.length) {
    return { nextCode: currentCode, hasConflict: false }
  }

  if (!currentCode) {
    return {
      nextCode: codes.length === 1 ? codes[0] : '',
      hasConflict: codes.length > 1
    }
  }

  return {
    nextCode: currentCode,
    hasConflict: codes.some((code) => code !== currentCode)
  }
}

const formatResource = async (resource: ResourceRecord) => {
  const normalized = normalizeResourceContent(resource.content)
  const { nextCode, hasConflict } = resolveNextCode(resource, normalized.codes)
  const nextContent = normalized.content

  if (hasConflict) {
    return {
      status: 'conflict' as const,
      resource,
      codes: normalized.codes
    }
  }

  const contentChanged = nextContent !== resource.content.trim()
  const codeChanged = nextCode !== resource.code.trim()

  if (!contentChanged && !codeChanged) {
    return { status: 'unchanged' as const }
  }

  if (SHOULD_WRITE) {
    await prisma.patch_resource.update({
      where: { id: resource.id },
      data: {
        content: nextContent,
        code: nextCode
      }
    })
  }

  return {
    status: 'updated' as const,
    resource,
    nextContent,
    nextCode
  }
}

const main = async () => {
  const resources = await prisma.patch_resource.findMany({
    where: { storage: 'user' },
    select: {
      id: true,
      name: true,
      code: true,
      content: true,
      patch: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  })

  let updated = 0
  let unchanged = 0
  let conflicts = 0

  console.log(
    `${SHOULD_WRITE ? 'Write' : 'Dry-run'} mode: scanning ${resources.length} custom-link resources`
  )

  for (const resource of resources) {
    const result = await formatResource(resource)

    if (result.status === 'unchanged') {
      unchanged += 1
      continue
    }

    if (result.status === 'conflict') {
      conflicts += 1
      console.log(
        `[conflict] #${result.resource.id} ${result.resource.patch.name} / ${result.resource.name || '未命名资源'} => ${result.codes.join(', ')}`
      )
      continue
    }

    updated += 1
    console.log(
      `[${SHOULD_WRITE ? 'updated' : 'preview'}] #${result.resource.id} content: ${result.resource.content} -> ${result.nextContent} | code: ${result.resource.code || '(empty)'} -> ${result.nextCode || '(empty)'}`
    )
  }

  console.log(
    `Done. updated=${updated}, unchanged=${unchanged}, conflicts=${conflicts}`
  )
}

main()
  .catch((error) => {
    console.error('Format custom resource links failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
