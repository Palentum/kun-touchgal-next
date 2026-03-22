import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { fetchSteamAppData } from '~/lib/arnebiae/steam'

const steamSchema = z.object({
  steamId: z.string().regex(/^\d+$/, 'Steam ID 必须为纯数字')
})

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, steamSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  try {
    const data = await fetchSteamAppData(Number(input.steamId))
    return NextResponse.json({
      name: data.name,
      aliases: data.aliases
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json('Steam API 请求失败')
  }
}
