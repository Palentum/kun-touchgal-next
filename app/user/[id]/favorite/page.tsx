import { UserFavorite } from '~/components/user/favorite/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const { favorites, total } = await kunServerFetchGet<{
    favorites: GalgameCard[]
    total: number
  }>('/user/profile/favorite', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserFavorite favorites={favorites} total={total} uid={Number(id)} />
}
