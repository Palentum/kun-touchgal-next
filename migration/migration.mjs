import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { PrismaClient } from '@prisma/client'

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
const SUPPORTED_RESOURCE_SECTION = ['galgame', 'patch']
const SUPPORTED_RESOURCE_LINK = ['touchgal', 's3']
const SUPPORTED_TYPE = ['game', 'patch']
const SUPPORTED_LANGUAGE = ['zh-Hans', 'ja', 'other']
const SUPPORTED_PLATFORM = ['windows', 'android', 'other']
const ResourceSizeRegex = /^\d+(MB|GB)$/

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
  if (type.some((t) => ['手机游戏', '模拟器资源', '直装资源'].includes(t))) {
    platform.push('android')
  }
  if (platform.length === 0) {
    platform.push('other')
  }

  // 替换 introduction 中的语法
  let introduction = content
    .replace(/\{\% image (.+?) \%\}/g, '![]($1)')
    .replace(/▼ /g, '')
    .replace(/, alt=/g, '')
  introduction = introduction.replace(
    /\{\% video (.+?) \%\}/g,
    '::kun-video{src="$1"}'
  )
  introduction = introduction.replace(
    /\{\% link ([^,]+),([^,]+),(.+?) \%\}/g,
    '::kun-link{href="$3" text="$1, $2"}'
  )

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
        type,
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
    for (const tag of tags) {
      await createTag({ name: tag }, 1)
    }

    // 创建资源
    // console.log(content)

    console.log(resource)
    const [, link] = resource.match(/\{\% btn '(.+?)',(.+?),(.*?) \%\}/)
    console.log(link, name)

    await createPatchResource({
      patchId: patch.id,
      section: 'galgame',
      name: '电脑版游戏本体下载资源',
      storage: 'touchgal',
      size: '未知大小',
      content: link,
      type,
      language,
      platform,
      note: ''
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

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: {
      type: true,
      language: true,
      platform: true
    }
  })
  if (!currentPatch) {
    return
  }

  let res = content

  return await prisma.$transaction(async (prisma) => {
    const newResource = await prisma.patch_resource.create({
      data: {
        patch_id: patchId,
        user_id: uid,
        type,
        language,
        platform,
        content: res,
        storage,
        ...resourceData
      }
    })

    const updatedTypes = [...new Set(currentPatch.type.concat(type))]
    const updatedLanguages = [
      ...new Set(currentPatch.language.concat(language))
    ]
    const updatedPlatforms = [
      ...new Set(currentPatch.platform.concat(platform))
    ]

    await prisma.patch.update({
      where: { id: patchId },
      data: {
        type: { set: updatedTypes },
        language: { set: updatedLanguages },
        platform: { set: updatedPlatforms }
      }
    })

    return newResource
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

// 主函数
const kun = async () => {
  try {
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
