import { z } from 'zod'

const duplicateQueryField = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') {
      return undefined
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }, z.string().max(maxLength).optional())

const optionalVndbId = z
  .string()
  .max(10, { message: 'VNDB ID 最多 10 个字符' })
  .regex(/^(v\d+)?$/i, { message: 'VNDB ID 格式不正确, 例如 v19658' })

const optionalVndbRelationId = z
  .string()
  .max(10, { message: 'VNDB Relation ID 最多 10 个字符' })
  .regex(/^(r\d+)?$/i, { message: 'VNDB Relation ID 格式不正确, 例如 r5879' })

const optionalBangumiId = z
  .string()
  .max(10, { message: 'Bangumi ID 最多 10 个字符' })
  .regex(/^(\d+)?$/, { message: 'Bangumi ID 必须为纯数字' })

const optionalSteamId = z
  .string()
  .max(10, { message: 'Steam ID 最多 10 个字符' })
  .regex(/^(\d+)?$/, { message: 'Steam ID 必须为纯数字' })

const optionalDlsiteCode = z
  .string()
  .max(20, { message: 'DLsite Code 最多 20 个字符' })
  .regex(/^((RJ|VJ)\d+)?$/i, {
    message: 'DLsite Code 格式不正确, 例如 RJ01405813'
  })

const optionalCircleField = z.string().max(500).optional().default('')

export const patchCreateSchema = z.object({
  banner: z.any(),
  bannerOriginal: z.any().optional(),
  name: z.string().trim().min(1, { message: '游戏名称是必填项' }),
  vndbId: optionalVndbId,
  vndbRelationId: optionalVndbRelationId,
  bangumiId: optionalBangumiId,
  steamId: optionalSteamId,
  dlsiteCode: optionalDlsiteCode,
  dlsiteCircleName: optionalCircleField,
  dlsiteCircleLink: optionalCircleField,
  introduction: z
    .string()
    .trim()
    .min(10, { message: '游戏介绍是必填项, 最少 10 个字符' })
    .max(100007, { message: '游戏介绍最多 100007 字' }),
  alias: z
    .string()
    .max(2333, { message: '别名字符串总长度不可超过 3000 个字符' }),
  tag: z
    .string()
    .max(2333, { message: '别名字符串总长度不可超过 3000 个字符' }),
  released: z.string(),
  contentLimit: z.string().max(10)
})

export const patchUpdateSchema = z.object({
  id: z.coerce.number().min(1).max(9999999),
  name: z.string().trim().min(1, { message: '游戏名称是必填项' }),
  vndbId: optionalVndbId,
  vndbRelationId: optionalVndbRelationId,
  bangumiId: optionalBangumiId,
  steamId: optionalSteamId,
  dlsiteCode: optionalDlsiteCode,
  dlsiteCircleName: optionalCircleField,
  dlsiteCircleLink: optionalCircleField,
  introduction: z
    .string()
    .trim()
    .min(10, { message: '游戏介绍是必填项, 最少 10 个字符' })
    .max(100007, { message: '游戏介绍最多 100007 字' }),
  tag: z.array(
    z
      .string()
      .trim()
      .min(1, { message: '单个标签至少一个字符' })
      .max(500, { message: '单个标签至多 500 个字符' })
  ),
  alias: z.array(
    z
      .string()
      .trim()
      .min(1, { message: '单个别名至少一个字符' })
      .max(500, { message: '单个别名至多 500 个字符' })
  ),
  contentLimit: z.string().max(10),
  released: z.string().optional()
})

export const duplicateSchema = z
  .object({
    vndbId: duplicateQueryField(10),
    vndbRelationId: duplicateQueryField(10),
    dlsiteCode: duplicateQueryField(20),
    title: duplicateQueryField(1007)
  })
  .refine(
    (data) => Object.values(data).some((value) => typeof value === 'string'),
    {
      message: '请至少提供一个查重字段'
    }
  )

export const imageSchema = z.object({
  image: z.any()
})

export const editLinkSchema = z.object({
  name: z.string({ message: '您的输入应为字符串' }),
  link: z
    .string({ message: '您的输入应为字符串' })
    .url({ message: '您输入的链接必须为合法 URL' })
})
