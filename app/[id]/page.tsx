import { PatchHeaderContainer } from '~/components/patch/header/Container'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const patch = await kunServerFetchGet<Patch>('/patch', {
    uniqueId: id
  })
  const intro = await kunServerFetchGet<PatchIntroduction>(
    '/patch/introduction',
    { uniqueId: id }
  )

  return generateKunMetadataTemplate(patch, intro)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  if (!id) {
    return <ErrorComponent error={'提取页面参数错误'} />
  }

  const res = await kunServerFetchGet<KunResponse<Patch>>('/patch', {
    uniqueId: id
  })
  if (!res || typeof res === 'string') {
    return <ErrorComponent error={res} />
  }

  const intro = await kunServerFetchGet<PatchIntroduction>(
    '/patch/introduction',
    { uniqueId: id }
  )

  return (
    <div className="container py-6 mx-auto space-y-6">
      <PatchHeaderContainer patch={res} intro={intro} />
    </div>
  )
}
