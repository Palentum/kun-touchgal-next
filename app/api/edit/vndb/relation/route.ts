import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { VNDB_API_BASE, VNDB_API_HEADERS } from '~/constants/vndb'

const relationSchema = z.object({
  relationId: z.string().regex(/^r\d+$/i, 'Relation ID 格式不正确')
})

interface VNDBReleaseVN {
  id: string
  title?: string
}

interface VNDBReleaseResult {
  id: string
  title: string
  alttitle?: string
  released?: string
  vns?: VNDBReleaseVN[]
}

interface VNDBReleaseResponse {
  results: VNDBReleaseResult[]
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, relationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const relationId = input.relationId.toLowerCase()

  try {
    const response = await fetch(`${VNDB_API_BASE}/release`, {
      method: 'POST',
      headers: VNDB_API_HEADERS,
      body: JSON.stringify({
        filters: ['id', '=', relationId],
        fields: 'id, title, alttitle, released, vns.id'
      })
    })

    if (!response.ok) {
      return NextResponse.json('VNDB Release API 请求失败')
    }

    const data: VNDBReleaseResponse = await response.json()

    if (!data.results.length) {
      return NextResponse.json('未找到对应的 VNDB Release')
    }

    const release = data.results[0]

    if (!release.vns?.length) {
      return NextResponse.json('未能找到关联的 VN ID')
    }

    const vndbId = release.vns[0].id.toLowerCase()

    const titles: string[] = []
    if (release.title) {
      titles.push(release.title)
    }
    if (release.alttitle && !titles.includes(release.alttitle)) {
      titles.push(release.alttitle)
    }

    return NextResponse.json({
      vndbId,
      titles,
      released: release.released ?? ''
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      `VNDB Release API 请求失败 - ${JSON.stringify(error)}`
    )
  }
}
