import { AdminSetting } from '~/components/admin/setting/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { AdminRedirectConfig } from '~/types/api/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { setting } = await kunServerFetchGet<{
    setting: AdminRedirectConfig
  }>('/admin/setting/redirect', {
    page: 1,
    limit: 30
  })

  return <AdminSetting setting={setting} />
}
