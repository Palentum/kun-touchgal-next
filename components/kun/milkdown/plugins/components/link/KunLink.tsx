'use client'

import { Card, CardBody, Chip } from '@heroui/react'
import { isValidURL } from '~/utils/validate'
import { KunExternalLink } from '~/components/kun/external-link/ExternalLink'
import { sanitizeUserHref } from '~/utils/safeUrl'

interface KunLinkProps {
  href: string
  text: string
}

export const KunLink = ({ href, text }: KunLinkProps) => {
  const safeHref = sanitizeUserHref(href)
  const domain = safeHref
    ? isValidURL(safeHref)
      ? new URL(safeHref).hostname
      : safeHref
    : '无效链接'

  return (
    <Card className="w-full">
      <CardBody>
        <div className="flex items-center gap-2">
          <Chip size="sm" color="primary" variant="flat">
            外部链接
          </Chip>
          <span className="text-default-500">{domain}</span>
        </div>
        <p style={{ margin: '0' }}>{text}</p>
        {safeHref ? (
          <KunExternalLink link={safeHref}>{safeHref}</KunExternalLink>
        ) : (
          <span className="text-danger">链接协议不受支持</span>
        )}
      </CardBody>
    </Card>
  )
}
