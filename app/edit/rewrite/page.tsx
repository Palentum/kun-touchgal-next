import { RewritePatch } from '~/components/edit/rewrite/RewritePatch'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { redirect } from 'next/navigation'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const payload = await verifyHeaderCookie()
  if (!payload || payload.role < 3) {
    redirect('/')
  }

  return (
    <div className="flex items-center justify-center flex-1 max-w-5xl mx-auto w-96">
      <RewritePatch />
    </div>
  )
}
