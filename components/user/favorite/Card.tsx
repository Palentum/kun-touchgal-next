import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import Link from 'next/link'
import { KunCardStats } from '~/components/kun/CardStats'
import { Button } from '@nextui-org/react'

interface Props {
  galgame: GalgameCard
}

export const UserGalgameCard = ({ galgame }: Props) => {
  return (
    <Card
      isPressable
      as={Link}
      href={`/${galgame.uniqueId}`}
      className="w-full"
      target="_blank"
    >
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:h-auto sm:w-40">
            <Image
              src={galgame.banner.replace(/\.avif$/, '-mini.avif')}
              alt={galgame.name}
              className="object-cover rounded-lg size-full max-h-52"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
              {galgame.name}
            </h2>

            <KunCardStats patch={galgame} isMobile={true} />

            <div className="flex justify-end">
              <Button size="sm" variant="flat" color="danger">
                从收藏夹移除
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
