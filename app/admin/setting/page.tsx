import { AdminSetting } from '~/components/admin/setting/Container'
import { kunMetadata } from './metadata'
import { kunGetActions } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const setting = await kunGetActions()

  return <AdminSetting setting={setting} />
}
