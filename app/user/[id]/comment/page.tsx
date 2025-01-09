import { UserComment } from '~/components/user/comment/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { UserComment as UserCommentType } from '~/types/api/user'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const { comments, total } = await kunServerFetchGet<{
    comments: UserCommentType[]
    total: number
  }>('/user/profile/comment', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserComment initComments={comments} total={total} uid={Number(id)} />
}
