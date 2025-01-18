import { HomeContainer } from '~/components/home/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { HomeResource } from '~/types/api/home'

export default async function Kun() {
  const response = await kunServerFetchGet<{
    galgames: GalgameCard[]
    resources: HomeResource[]
  }>('/home')

  return (
    <div className="container mx-auto my-4 space-y-6">
      <HomeContainer {...response} />
    </div>
  )
}
