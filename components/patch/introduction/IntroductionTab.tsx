import DOMPurify from 'isomorphic-dompurify'
import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Info } from './Info'
import { PatchTag } from './Tag'
import type { PatchIntroduction } from '~/types/api/patch'

interface Props {
  intro: PatchIntroduction
  patchId: number
}

export const IntroductionTab = ({ intro, patchId }: Props) => {
  return (
    <Card className="p-1 sm:p-8">
      <CardHeader className="p-4">
        <h2 className="text-2xl font-medium">游戏信息</h2>
      </CardHeader>
      <CardBody className="p-4 space-y-6">
        <div
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(intro.introduction)
          }}
          className="kun-prose max-w-none"
        />

        {/* <div className="mt-4">
          <h3 className="mb-4 text-xl font-medium">游戏制作商</h3>
        </div> */}

        <PatchTag patchId={patchId} initialTags={intro.tag} />

        <Info intro={intro} />
      </CardBody>
    </Card>
  )
}
