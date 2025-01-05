import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { PrismaClient } from '@prisma/client'
import size from './size.json' with { type: 'json' }

const prisma = new PrismaClient()

// 用户 ID, 根据生产环境的实际 uid 确定
const USER_ID = 1

// 文件夹路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const MARKDOWN_DIR = path.join(__dirname, './markdown')
const FOLDERS = {
  SFW: 'sfw',
  NSFW: 'nsfw'
}

// 支持的分类
export const TYPE_MAP = {
  全部类型: 'all',
  PC游戏: 'pc',
  汉化资源: 'chinese',
  PE游戏: 'mobile',
  模拟器资源: 'emulator',
  生肉资源: 'row',
  直装资源: 'app',
  补丁资源: 'patch',
  游戏工具: 'tool',
  官方通知: 'notice',
  其它: 'other'
}

export const markdownToText = (markdown) => {
  return markdown
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^\s*(#{1,6})\s+(.*)/gm, '$2')
    .replace(/```[\s\S]*?```|`([^`]*)`/g, '$1')
    .replace(/^(-{3,}|\*{3,})$/gm, '')
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

// 创建标签
const createTag = async (input, uid) => {
  const { name, introduction = '', alias = [] } = input

  const existingTag = await prisma.patch_tag.findFirst({
    where: {
      OR: [{ name }, { alias: { has: name } }]
    }
  })
  if (existingTag) {
    return null
  }

  return await prisma.patch_tag.create({
    data: {
      user_id: uid,
      name,
      introduction,
      alias
    },
    select: {
      id: true,
      name: true,
      count: true,
      alias: true
    }
  })
}

// 处理 Markdown 文件
const processMarkdownFile = async (filePath, contentLimit) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

  // 提取字段
  const uniqueId = data.abbrlink
  const banner = data.cover || ''
  const created = new Date(data.date).toISOString()
  const title = data.title ?? ''
  const name = title.replace(/【.*?】/g, '').trim()
  const tags = data.tags || []

  const type = data.categories?.flat() || []
  const language = type.includes('汉化资源')
    ? ['zh-Hans']
    : type.includes('生肉资源')
      ? ['ja']
      : ['other']
  const platform = []
  if (type.includes('PC游戏')) {
    platform.push('windows')
  }
  if (type.some((t) => ['PE游戏', '模拟器资源', '直装资源'].includes(t))) {
    platform.push('android')
  }
  if (platform.length === 0) {
    platform.push('other')
  }

  // 替换 introduction 中的语法
  const introductionSections = [
    '## ▼ 游戏介绍',
    '## ▼ 游戏截图',
    '## ▼ PV鉴赏',
    '## ▼ 支持正版'
  ]
  let introduction = ''
  introductionSections.forEach((section) => {
    const regex = new RegExp(`${section}\\s*([\\s\\S]*?)(?=\\n## \\▼|$)`, 'g')
    const match = content.match(regex)
    if (match) {
      introduction += match.join('\n\n').trim() + '\n\n'
    }
  })

  // 替换语法
  introduction = introduction
    .replace(/\{\% image (.+?) \%\}/g, '![]($1)')
    .replace(/, alt=/g, '')
    .replace(/\{\% video (.+?) \%\}/g, '::kun-video{src="$1"}')
    .replace(
      /\{\% link ([^,]+),([^,]+),(.+?) \%\}/g,
      '::kun-link{href="$3" text="$1, $2"}'
    )
    .replace(/▼ /g, '')

  // 检查重复
  const existPatch = await prisma.patch.findUnique({
    where: { unique_id: uniqueId }
  })
  if (existPatch) {
    return
  }

  // 创建 patch
  try {
    const patch = await prisma.patch.create({
      data: {
        unique_id: uniqueId,
        name,
        type: type.map((t) => TYPE_MAP[t]),
        banner,
        content_limit: contentLimit,
        created,
        introduction,
        user_id: USER_ID,
        language,
        platform
      }
    })

    // 创建标签
    await Promise.all(
      tags.map(async (tagName) => {
        const tag = await createTag({ name: tagName }, USER_ID)
        if (tag) {
          return tag.id
        }
      })
    ).then(async (tagIds) => {
      // 添加标签到 patch
      const relationData = tagIds.map((tagId) => ({
        patch_id: patch.id,
        tag_id: tagId
      }))
      await prisma.$transaction(async (prisma) => {
        await prisma.patch_tag_relation.createMany({ data: relationData })
        await prisma.patch_tag.updateMany({
          where: { id: { in: tagIds } },
          data: { count: { increment: 1 } }
        })
      })
    })

    const sections = [
      {
        marker: '## ▼ 下载地址',
        name: '电脑版游戏本体下载资源',
        excludeType: new Set(['PE游戏', '模拟器资源', '直装资源']),
        excludePlatform: new Set(['android'])
      },
      {
        marker: '## ▼ PE版下载链接',
        name: '手机版游戏本体下载资源',
        excludeType: new Set(['PC游戏']),
        excludePlatform: new Set(['windows'])
      }
    ]

    let note = ''
    const noteMatch = content.match(/## ▼ 游戏备注\s*([\s\S]+?)$/)
    if (noteMatch) {
      note = noteMatch[1].trim()
    }

    sections.forEach(async (section) => {
      const regex = new RegExp(`${section.marker}\\s*\\{\\% btn '(.+?)',`, 's')
      const match = content.match(regex)

      if (match) {
        const link = match[1]
        const name = section.name
        const excludedType = type.filter(
          (item) => !section.excludeType.has(item)
        )
        const excludedPlatform = platform.filter(
          (item) => !section.excludePlatform.has(item)
        )

        await createPatchResource(
          {
            patchId: patch.id,
            section: 'galgame',
            name,
            storage: 'touchgal',
            size: size[link] ?? '未知大小',
            content: link,
            type: excludedType.map((type) => TYPE_MAP[type]),
            language,
            platform: excludedPlatform,
            note: markdownToText(note)
          },
          USER_ID
        )
      }
    })
    console.log(`成功迁移文件: ${filePath}`)
  } catch (error) {
    console.error(`迁移文件失败: ${filePath}`, error)
  }
}

// 创建资源
const createPatchResource = async (input, uid) => {
  const {
    patchId,
    type,
    language,
    platform,
    content,
    storage,
    ...resourceData
  } = input

  await prisma.patch_resource.create({
    data: {
      patch_id: patchId,
      user_id: uid,
      type,
      language,
      platform,
      content,
      storage,
      ...resourceData
    }
  })
}

// 遍历文件夹
const processFolder = async (folderPath, contentLimit) => {
  const files = fs.readdirSync(folderPath)

  for (const file of files) {
    const filePath = path.join(folderPath, file)

    if (path.extname(file) === '.md') {
      await processMarkdownFile(filePath, contentLimit)
    }
  }
}

// 重置数据库表
const resetTables = async () => {
  try {
    const tables = [
      { name: 'patch', sequence: 'patch_id_seq' },
      { name: 'patch_resource', sequence: 'patch_resource_id_seq' },
      { name: 'patch_tag', sequence: 'patch_tag_id_seq' },
      { name: 'patch_tag_relation', sequence: 'patch_tag_relation_id_seq' }
    ]

    for (const table of tables) {
      console.log(`Resetting table: ${table.name}`)
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${table.name}" RESTART IDENTITY CASCADE`
      )
    }

    console.log('All tables have been reset successfully.')
  } catch (error) {
    console.error('Error resetting tables:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 主函数
const kun = async () => {
  try {
    // 重置数据库表
    resetTables()

    // 处理 SFW 文件夹
    const sfwPath = path.join(MARKDOWN_DIR, FOLDERS.SFW)
    if (fs.existsSync(sfwPath)) {
      console.log('开始处理 SFW 文件夹...')
      await processFolder(sfwPath, 'sfw')
    }

    // 处理 NSFW 文件夹
    const nsfwPath = path.join(MARKDOWN_DIR, FOLDERS.NSFW)
    if (fs.existsSync(nsfwPath)) {
      console.log('开始处理 NSFW 文件夹...')
      await processFolder(nsfwPath, 'nsfw')
    }

    console.log('迁移完成！')
  } catch (error) {
    console.error('迁移过程中出现错误: ', error)
  } finally {
    await prisma.$disconnect()
  }
}

kun()
