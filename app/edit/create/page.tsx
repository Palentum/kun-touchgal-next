import { CreatePatch } from '~/components/edit/create/CreatePatch'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { redirect } from 'next/navigation'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Create() {
  const payload = await verifyHeaderCookie()
  if (!payload || payload.role < 4) {
    redirect('/')
  }

  return <CreatePatch />
}
