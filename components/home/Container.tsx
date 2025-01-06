import { Button } from '@nextui-org/button'
import { ChevronRight } from 'lucide-react'
import { PatchCard } from '~/components/home/PatchCard'
import { ResourceCard } from '~/components/resource/ResourceCard'
import Link from 'next/link'
import { HeroContainer } from './hero/Container'
import type { HomeComment, HomeResource } from '~/types/api/home'

interface Props {
  galgames: GalgameCard[]
  resources: HomeResource[]
  comments: HomeComment[]
}

export const HomeContainer = ({ galgames, resources, comments }: Props) => {
  return (
    <div className="mx-auto space-y-16 max-w-7xl">
      <HeroContainer />

      <section className="space-y-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">最新 Galgame</h2>
          <Button
            variant="light"
            as={Link}
            color="primary"
            endContent={<ChevronRight className="size-4" />}
            href="/galgame"
          >
            查看更多
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galgames.map((galgame) => (
            <PatchCard key={galgame.id} patch={galgame} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">最新 Galgame 资源下载</h2>
          <Button
            variant="light"
            as={Link}
            color="primary"
            endContent={<ChevronRight className="size-4" />}
            href="/resource"
          >
            查看更多
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>
    </div>
  )
}
