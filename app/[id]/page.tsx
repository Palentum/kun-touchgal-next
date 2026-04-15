import { PatchHeaderContainer } from '~/components/patch/header/Container'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { generateKunMetadataTemplate } from './metadata'
import {
  kunGetPatchActions,
  kunGetPatchIntroductionActions,
  kunUpdatePatchViewsActions
} from './actions'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { after } from 'next/server'
import type { Metadata } from 'next'

export const revalidate = 120

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunGetPatchActions({
    uniqueId: id
  })
  const intro = await kunGetPatchIntroductionActions({ uniqueId: id })
  if (typeof patch === 'string' || typeof intro === 'string') {
    return {}
  }

  return generateKunMetadataTemplate(patch, intro)
}

export default async function Kun({ params }: Props) {
  const { id } = await params
  if (!id) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const [patch, intro, payload, nsfwHeader] = await Promise.all([
    kunGetPatchActions({ uniqueId: id }),
    kunGetPatchIntroductionActions({ uniqueId: id }),
    verifyHeaderCookie(),
    getNSFWHeader()
  ])
  const nsfwAllowed =
    (nsfwHeader as { content_limit?: string }).content_limit !== 'sfw'
  if (typeof patch === 'string') {
    return <ErrorComponent error={patch} />
  }
  if (typeof intro === 'string') {
    return <ErrorComponent error={intro} />
  }

  after(() => kunUpdatePatchViewsActions({ uniqueId: id }))

  return (
    <div className="container py-6 mx-auto space-y-6">
      <PatchHeaderContainer
        patch={patch}
        intro={intro}
        uid={payload?.uid}
        nsfwAllowed={nsfwAllowed}
      />
    </div>
  )
}
