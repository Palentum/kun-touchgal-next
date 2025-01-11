import { Report } from '~/components/admin/report/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { AdminReport } from '~/types/api/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { reports, total } = await kunServerFetchGet<{
    reports: AdminReport[]
    total: number
  }>('/admin/report', {
    page: 1,
    limit: 30
  })

  return <Report initialReports={reports} total={total} />
}
