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
            请注意, 本站的 Galgame 补丁 下载资源, 可能为用户自行上传,
            请自行鉴别资源安全性。
          </p>
          <p>Galgame 资源均可保证安全性。</p>
        </div>

        <Resources id={Number(id)} />
      </CardBody>
    </Card>
  )
}
