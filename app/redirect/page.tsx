import { Suspense } from 'react'
import { kunMetadata } from './metadata'
import { KunRedirectCard } from '~/components/redirect/KunRedirectCard'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return (
    <div className="container mx-auto my-8">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-medium">外部链接跳转</h1>
          <p className="text-default-500">在您继续前往之前, 请确认下方的链接</p>
        </div>

        <Suspense>
          <KunRedirectCard />
        </Suspense>

        <div className="w-full max-w-md h-[250px] bg-default-50 rounded-large flex items-center justify-center">
          <p className="text-default-400">广告位</p>
        </div>
      </div>
    </div>
  )
}
