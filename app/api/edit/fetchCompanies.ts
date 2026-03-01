import { prisma } from '~/prisma/index'
import { VNDB_API_BASE, VNDB_API_HEADERS } from '~/constants/vndb'

type VndbExtLink = { url?: string | null }
type VndbProducer = {
  id?: string
  name?: string
  original?: string | null
  aliases?: string[] | null
  lang?: string | null
  type?: string | null
  description?: string | null
  extlinks?: VndbExtLink[] | null
}

const uniq = <T>(arr: T[]) => Array.from(new Set(arr))

const toCompanyCreate = (producer: VndbProducer, uid: number) => {
  const name = producer?.name ?? ''
  const primary_language = producer?.lang ? [producer.lang] : []
  const aliasRaw = [
    ...(producer?.original ? [producer.original] : []),
    ...(Array.isArray(producer?.aliases) ? producer.aliases : [])
  ].filter(Boolean) as string[]
  const alias = uniq(aliasRaw)
  const official_website = Array.isArray(producer?.extlinks)
    ? uniq(
        producer.extlinks
          .map((l) => l?.url)
          .filter(Boolean)
          .map((u) => String(u))
      )
    : []
  return {
    name,
    introduction: alias.toString(),
    count: 0,
    primary_language,
    official_website,
    parent_brand: [] as string[],
    alias,
    user_id: uid
  }
}

export const ensurePatchCompaniesFromVNDB = async (
  patchId: number,
  vndbId: string | null | undefined,
  uid: number
) => {
  const logPrefix = `[VNDB Company Fetch] patchId=${patchId}, vndbId=${vndbId}`

  const id = (vndbId || '').trim()
  if (!id) {
    console.log(`${logPrefix} - 跳过: vndbId 为空`)
    return { ensured: 0, related: 0 }
  }

  console.log(`${logPrefix} - 开始获取会社信息`)

  try {
    const requestBody = {
      filters: ['id', '=', id],
      fields:
        'id,developers{id,name,original,aliases,lang,type,description,extlinks{url}}',
      results: 1
    }
    console.log(`${logPrefix} - 请求 VNDB API:`, JSON.stringify(requestBody))

    const res = await fetch(`${VNDB_API_BASE}/vn`, {
      method: 'POST',
      headers: VNDB_API_HEADERS,
      body: JSON.stringify(requestBody)
    })

    console.log(`${logPrefix} - API 响应状态: ${res.status} ${res.statusText}`)

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`${logPrefix} - API 请求失败:`, errorText)
      return { ensured: 0, related: 0 }
    }

    const data = (await res.json()) as {
      results?: Array<{ developers?: VndbProducer[] | null }>
    }

    console.log(
      `${logPrefix} - API 响应数据:`,
      JSON.stringify(data, null, 2).slice(0, 1000)
    )

    const allDevs = data?.results?.[0]?.developers ?? []
    console.log(`${logPrefix} - 获取到 ${allDevs.length} 个开发者/发行商`)

    const devs = allDevs.filter((d) => d && d.type === 'co') as VndbProducer[]
    console.log(
      `${logPrefix} - 筛选出 ${devs.length} 个会社 (type='co'):`,
      devs.map((d) => `${d.name} (${d.id})`).join(', ')
    )

    if (!devs.length) {
      console.log(`${logPrefix} - 没有找到会社信息，跳过`)
      return { ensured: 0, related: 0 }
    }

    const companiesByName = new Map<
      string,
      ReturnType<typeof toCompanyCreate>
    >()
    for (const p of devs) {
      const name = p?.name
      if (!name) continue
      if (!companiesByName.has(name)) {
        const companyData = toCompanyCreate(p, uid)
        companiesByName.set(name, companyData)
        console.log(
          `${logPrefix} - 解析会社: ${name}, alias=${companyData.alias.join(', ')}, websites=${companyData.official_website.join(', ')}`
        )
      }
    }

    const companyNames = Array.from(companiesByName.keys())
    if (!companyNames.length) {
      console.log(`${logPrefix} - 没有有效的会社名称，跳过`)
      return { ensured: 0, related: 0 }
    }

    console.log(
      `${logPrefix} - 检查数据库中已存在的会社: ${companyNames.join(', ')}`
    )

    const existing = await prisma.patch_company.findMany({
      where: { name: { in: companyNames } },
      select: { id: true, name: true }
    })
    const existingNames = new Set(existing.map((e) => e.name))

    console.log(
      `${logPrefix} - 数据库中已存在: ${existing.map((e) => `${e.name}(id=${e.id})`).join(', ') || '无'}`
    )

    const toCreate = companyNames
      .filter((n) => !existingNames.has(n))
      .map((n) => companiesByName.get(n)!)

    if (toCreate.length) {
      console.log(
        `${logPrefix} - 创建新会社: ${toCreate.map((c) => c.name).join(', ')}`
      )
      await prisma.patch_company.createMany({ data: toCreate })
      console.log(`${logPrefix} - 成功创建 ${toCreate.length} 个新会社`)
    } else {
      console.log(`${logPrefix} - 无需创建新会社`)
    }

    const allCompanies = await prisma.patch_company.findMany({
      where: { name: { in: companyNames } },
      select: { id: true, name: true }
    })
    const nameToId = new Map(allCompanies.map((c) => [c.name, c.id]))
    const companyIds = allCompanies.map((c) => c.id)

    console.log(
      `${logPrefix} - 会社 ID 映射: ${allCompanies.map((c) => `${c.name}=${c.id}`).join(', ')}`
    )

    if (companyIds.length) {
      const existingRelations = await prisma.patch_company_relation.findMany({
        where: {
          patch_id: patchId,
          company_id: { in: companyIds }
        },
        select: { company_id: true }
      })
      const existingCompanyIds = new Set(
        existingRelations.map((r) => r.company_id)
      )

      console.log(
        `${logPrefix} - 已存在的关联: ${existingRelations.map((r) => r.company_id).join(', ') || '无'}`
      )

      const newCompanyIds = companyIds.filter(
        (cid) => !existingCompanyIds.has(cid)
      )

      const relationsToCreate = companyNames
        .map((n) => nameToId.get(n))
        .filter((cid): cid is number => typeof cid === 'number')
        .map((cid) => ({ patch_id: patchId, company_id: cid }))

      console.log(
        `${logPrefix} - 创建 patch-会社 关联: ${relationsToCreate.map((r) => r.company_id).join(', ')}`
      )

      await prisma.patch_company_relation.createMany({
        data: relationsToCreate,
        skipDuplicates: true
      })

      if (newCompanyIds.length) {
        console.log(`${logPrefix} - 更新会社计数: ${newCompanyIds.join(', ')}`)
        await prisma.patch_company.updateMany({
          where: { id: { in: newCompanyIds } },
          data: { count: { increment: 1 } }
        })
      }
    }

    const result = { ensured: toCreate.length, related: companyIds.length }
    console.log(
      `${logPrefix} - 完成: 新建会社=${result.ensured}, 关联会社=${result.related}`
    )

    return result
  } catch (error) {
    console.error(`${logPrefix} - 发生错误:`, error)
    return { ensured: 0, related: 0 }
  }
}
