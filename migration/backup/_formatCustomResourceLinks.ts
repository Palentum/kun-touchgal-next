import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { prisma } from '~/prisma/index'
import { normalizeResourceContent } from '~/utils/resourceLink'

const SHOULD_WRITE = process.argv.includes('--write')
const readline = createInterface({ input, output })

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
    return { nextCode: currentCode, hasConflict: false as const }
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

const promptYesNo = async (question: string) => {
  while (true) {
    const answer = (await readline.question(question)).trim().toLowerCase()

    if (!answer || answer === 'n' || answer === 'no') {
      return false
    }

    if (answer === 'y' || answer === 'yes') {
      return true
    }

    console.log('请输入 y 或 n，直接回车默认为 n')
  }
}

const promptConflictResolution = async (
  resource: ResourceRecord,
  extractedCodes: string[],
  nextContent: string
) => {
  const currentCode = resource.code.trim()

  console.log('')
  console.log(
    `[conflict] #${resource.id} ${resource.patch.name} / ${resource.name || '未命名资源'}`
  )
  console.log(`current code: ${currentCode || '(empty)'}`)
  console.log(`extracted code: ${extractedCodes.join(', ')}`)
  console.log(`original content: ${resource.content}`)
  if (nextContent !== resource.content.trim()) {
    console.log(`normalized content: ${nextContent}`)
  }

  if (extractedCodes.length === 1) {
    const shouldOverwrite = await promptYesNo(
      `是否将 code 覆盖为 "${extractedCodes[0]}"? [y/N] `
    )

    return {
      shouldSkip: false,
      nextCode: shouldOverwrite ? extractedCodes[0] : currentCode
    }
  }

  while (true) {
    const answer = (
      await readline.question(
        '检测到多个提取码，输入要写入的 code；输入 k 保留当前值；输入 s 跳过该资源: '
      )
    ).trim()

    if (!answer || answer === 'k') {
      return {
        shouldSkip: false,
        nextCode: currentCode
      }
    }

    if (answer === 's') {
      return {
        shouldSkip: true,
        nextCode: currentCode
      }
    }

    if (extractedCodes.includes(answer)) {
      return {
        shouldSkip: false,
        nextCode: answer
      }
    }

    console.log('输入无效，请填写候选提取码之一，或输入 k / s')
  }
}

const formatResource = async (resource: ResourceRecord) => {
  const normalized = normalizeResourceContent(resource.content)
  const { nextCode, hasConflict } = resolveNextCode(resource, normalized.codes)
  const nextContent = normalized.content

  if (hasConflict) {
    if (!SHOULD_WRITE || !input.isTTY || !output.isTTY) {
      return {
        status: 'conflict' as const,
        resource,
        codes: normalized.codes
      }
    }

    const resolution = await promptConflictResolution(
      resource,
      normalized.codes,
      nextContent
    )

    if (resolution.shouldSkip) {
      return {
        status: 'skipped' as const,
        resource
      }
    }

    const contentChanged = nextContent !== resource.content.trim()
    const codeChanged = resolution.nextCode !== resource.code.trim()

    if (!contentChanged && !codeChanged) {
      return { status: 'unchanged' as const }
    }

    await prisma.patch_resource.update({
      where: { id: resource.id },
      data: {
        content: nextContent,
        code: resolution.nextCode
      }
    })

    return {
      status: 'updated' as const,
      resource,
      nextContent,
      nextCode: resolution.nextCode
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
  let skipped = 0

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

    if (result.status === 'skipped') {
      skipped += 1
      console.log(
        `[skipped] #${result.resource.id} ${result.resource.patch.name} / ${result.resource.name || '未命名资源'}`
      )
      continue
    }

    updated += 1
    console.log(
      `[${SHOULD_WRITE ? 'updated' : 'preview'}] #${result.resource.id} content: ${result.resource.content} -> ${result.nextContent} | code: ${result.resource.code || '(empty)'} -> ${result.nextCode || '(empty)'}`
    )
  }

  console.log(
    `Done. updated=${updated}, unchanged=${unchanged}, conflicts=${conflicts}, skipped=${skipped}`
  )
}

main()
  .catch((error) => {
    console.error('Format custom resource links failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    readline.close()
    await prisma.$disconnect()
  })
