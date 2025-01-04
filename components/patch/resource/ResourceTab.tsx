import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Link } from '@nextui-org/link'
import { Resources } from '~/components/patch/resource/Resource'

interface Props {
  id: number
}

export const ResourceTab = ({ id }: Props) => {
  return (
    <Card className="p-1 sm:p-8">
      <CardHeader className="p-4">
        <h2 className="text-2xl font-medium">资源链接</h2>
      </CardHeader>
      <CardBody className="p-4">
        <div className="text-default-600">
          <p>
            请注意, 本站是 Galgame 补丁站, 资源链接指的是 Galgame 补丁资源,
            我们仅提供 Galgame 补丁的下载
          </p>
          <p>
            <b>
              请注意, 本站的 Galgame 补丁下载资源均为用户自行上传,
              请自行鉴别资源安全性
            </b>
          </p>
          <p>
            如果您要下载 Galgame 本体资源, 请前往{' '}
            <Link showAnchorIcon isExternal href="https://www.kungal.com/zh-cn">
              主站论坛
            </Link>
          </p>
        </div>

        <Resources id={Number(id)} />
      </CardBody>
    </Card>
  )
}
