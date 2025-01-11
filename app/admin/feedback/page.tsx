import { Feedback } from '~/components/admin/feedback/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { AdminFeedback } from '~/types/api/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { feedbacks, total } = await kunServerFetchGet<{
    feedbacks: AdminFeedback[]
    total: number
  }>('/admin/feedback', {
    page: 1,
    limit: 30
  })

  return <Feedback initialFeedbacks={feedbacks} total={total} />
}
