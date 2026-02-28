import { ConversationList } from '~/components/message/chat/ConversationList'
import { ErrorComponent } from '~/components/error/ErrorComponent'
import { kunGetConversationsAction } from './actions'
import type { Metadata } from 'next'

export const revalidate = 3

export const metadata: Metadata = {
  title: '私聊'
}

export default async function Kun() {
  const response = await kunGetConversationsAction({ page: 1, limit: 30 })
  if (typeof response === 'string') {
    return <ErrorComponent error={response} />
  }

  return (
    <ConversationList
      initialConversations={response.conversations}
      total={response.total}
    />
  )
}
