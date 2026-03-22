import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { BANGUMI_API_BASE, BANGUMI_HEADERS } from '~/constants/bangumi'

const bangumiSchema = z.object({
  bangumiId: z.string().regex(/^\d+$/, 'Bangumi ID 必须为纯数字')
})

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, bangumiSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  try {
    const res = await fetch(
      `${BANGUMI_API_BASE}/v0/subjects/${input.bangumiId}`,
      { headers: BANGUMI_HEADERS }
    )
    if (!res.ok) {
      return NextResponse.json('未找到对应的 Bangumi 条目')
    }

    const data = (await res.json()) as { name?: string; name_cn?: string }
    return NextResponse.json({
      name: data.name ?? '',
      nameCn: data.name_cn ?? ''
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json('Bangumi API 请求失败')
  }
}
