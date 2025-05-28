import { NextRequest, NextResponse } from 'next/server'
import { kunParseFormData } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { updatePatchBannerSchema } from '~/validations/patch'
import { uploadPatchBanner } from '~/app/api/edit/_upload'

const purgeCache = async (patchId: number) => {
  const imageBedUrl = process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL
  const patchBannerUrl = `${imageBedUrl}/patch/${patchId}/banner/banner.avif`
  const patchBannerMiniUrl = `${imageBedUrl}/patch/${patchId}/banner/banner-mini.avif`

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${process.env.KUN_CF_CACHE_ZONE_ID}/purge_cache`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KUN_CF_CACHE_PURGE_API_TOKEN}`
      },
      body: JSON.stringify({
        files: [patchBannerUrl, patchBannerMiniUrl]
      })
    }
  )

  return { status: res.status }
}

export const updatePatchBanner = async (
  image: ArrayBuffer,
  patchId: number
) => {
  const patch = await prisma.patch.findUnique({
    where: { id: patchId }
  })
  if (!patch) {
    return '这个 Galgame 不存在'
  }

  const res = await uploadPatchBanner(image, patchId)
  if (typeof res === 'string') {
    return res
  }

  await purgeCache(patchId)

  return {}
}

export const POST = async (req: NextRequest) => {
  const input = await kunParseFormData(req, updatePatchBannerSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const image = await new Response(input.image)?.arrayBuffer()

  const response = await updatePatchBanner(image, input.patchId)
  return NextResponse.json(response)
}
