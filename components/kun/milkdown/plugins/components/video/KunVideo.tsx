import { Card, CardBody, CardHeader } from '@nextui-org/react'

interface Props {
  url: string
  title?: string
}

export const KunMilkdownVideo = ({ url, title }: Props) => {
  return (
    <Card className="w-full my-4">
      {title && (
        <CardHeader className="px-4 py-2 text-small">
          <h3 className="text-default-600">{title}</h3>
        </CardHeader>
      )}
      <CardBody className="p-0 overflow-hidden">
        <div className="relative w-full pt-[56.25%]">
          <iframe
            src={url}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </CardBody>
    </Card>
  )
}
