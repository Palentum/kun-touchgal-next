import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { fetchVndbVn } from '~/lib/arnebiae/vndb'
import type { VNDBDetailResult } from '~/lib/arnebiae/vndb'

const detailsSchema = z.object({
  vndbId: z.string().regex(/^v\d+$/i, 'VNDB ID 格式不正确')
})

const buildAllTitles = (response: { results: VNDBDetailResult[] }) => {
  return response.results.flatMap((vn) => {
    const jaTitle = vn.titles.find((t) => t.lang === 'ja')?.title
    const titlesArray = [
      ...(jaTitle ? [jaTitle] : []),
      vn.title,
      ...vn.titles.filter((t) => t.lang !== 'ja').map((t) => t.title),
      ...vn.aliases
    ]
    return titlesArray
  })
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, detailsSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const vndbId = input.vndbId.toLowerCase()

  try {
    const vndbData = await fetchVndbVn<VNDBDetailResult>(
      ['id', '=', vndbId],
      'title, titles.lang, titles.title, aliases, released'
    )
    if (!vndbData.results.length) {
      return NextResponse.json('未找到对应的 VNDB 条目')
    }

    const titles = buildAllTitles(vndbData)
    const released = vndbData.results[0].released

    return NextResponse.json({ titles, released })
  } catch (error) {
    console.error(error)
    return NextResponse.json('VNDB API 请求失败')
  }
}
