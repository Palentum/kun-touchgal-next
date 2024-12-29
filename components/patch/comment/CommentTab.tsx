import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Comments } from '~/components/patch/comment/Comments'

interface Props {
  id: number
}

export const CommentTab = ({ id }: Props) => {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-medium">游戏评论</h2>
      </CardHeader>
      <CardBody>
        <Comments id={Number(id)} />
      </CardBody>
    </Card>
  )
}
