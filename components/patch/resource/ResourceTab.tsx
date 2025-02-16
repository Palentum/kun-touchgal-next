import { Card, CardBody, CardHeader } from '@nextui-org/card'
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
            请注意, 本站的 Galgame 下载资源和补丁均来自互联网或用户上传,
            请自行鉴别资源安全性。
          </p>
        </div>

        <Resources id={Number(id)} />
      </CardBody>
    </Card>
  )
}
