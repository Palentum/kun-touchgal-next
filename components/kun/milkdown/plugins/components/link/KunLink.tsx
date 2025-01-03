'use client'

import { Card, CardHeader, CardBody, CardFooter, Link } from '@nextui-org/react'
import { ExternalLink, Globe } from 'lucide-react'
import { isValidURL } from '~/utils/validate'

interface KunLinkProps {
  href: string
  text: string
}

export const KunLink = ({ href, text }: KunLinkProps) => {
  const domain = isValidURL(href) ? new URL(href).hostname : href

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="size-4" />
          <span className="text-sm text-default-500">{domain}</span>
        </div>
      </CardHeader>

      <CardBody>
        <p className="mb-2 text-sm">{text}</p>
      </CardBody>

      <CardFooter>
        <Link
          href={href}
          size="sm"
          className="text-xs"
          target="_blank"
          rel="noopener noreferrer"
          showAnchorIcon
          anchorIcon={<ExternalLink className="size-3" />}
        >
          {href}
        </Link>
      </CardFooter>
    </Card>
  )
}
