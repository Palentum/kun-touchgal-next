import { Button } from '@nextui-org/button'
import { Link } from '@nextui-org/link'
import { Card, CardBody } from '@nextui-org/card'
import { Chip } from '@nextui-org/chip'
import { Sparkles } from 'lucide-react'
import { KunCarousel } from '../carousel/KunCarousel'
import { getKunPosts } from '../carousel/mdx'
import { RandomGalgameButton } from '../carousel/RandomGalgameButton'
import { homeNavigationItems } from '~/constants/home'
import { Telegram } from '~/components/kun/icons/Telegram'

export const HomeHero = () => {
  const posts = getKunPosts()

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-6 min-h-[300px]">
        <div className="flex flex-col justify-center order-2 space-y-2 sm:space-y-6 sm:order-1">
          <Card className="hidden h-full border-none sm:block bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-success-500/20">
            <CardBody className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <Chip color="primary" variant="flat">
                  欢迎来到 TouchGal
                </Chip>
              </div>

              <div className="space-y-4">
                <h1 className="py-1 text-2xl font-bold text-transparent lg:text-3xl xl:text-4xl bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text">
                  一站式 Galgame 文化社区！
                </h1>
                <p className="text-lg text-default-600">
                  免费, 高质量的 Galgame 资源下载站
                </p>
              </div>

              <div className="flex items-center gap-2">
                <RandomGalgameButton color="primary" variant="solid">
                  随机一部游戏
                </RandomGalgameButton>
                <Button
                  isIconOnly
                  as={Link}
                  href="/learn-more"
                  variant="flat"
                  color="secondary"
                >
                  <Telegram />
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {homeNavigationItems.map((item) => (
              <div key={item.label}>
                <Button
                  as={Link}
                  href={item.href}
                  startContent={<item.icon className="w-5 h-5" />}
                  className="hidden w-full sm:flex"
                  color={item.color as any}
                  variant="flat"
                  size="lg"
                >
                  {item.label}
                </Button>
                <Button
                  as={Link}
                  href={item.href}
                  startContent={<item.icon className="w-5 h-5" />}
                  className="flex w-full sm:hidden"
                  color={item.color as any}
                  variant="flat"
                >
                  {item.label}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 sm:order-2">
          <KunCarousel posts={posts} />
        </div>
      </div>
    </div>
  )
}
