'use client'

import { Link } from '@nextui-org/link'
// Do not use `~`
import * as redirectConfig from '../../../config/redirect.json'
import type { ReactNode } from 'react'

interface Props {
  link: string
  isRequireRedirect?: boolean
  children?: ReactNode
  showAnchorIcon?: boolean
}

export const KunExternalLink = ({
  link,
  children,
  isRequireRedirect,
  showAnchorIcon = true
}: Props) => {
  const encodeLink = encodeURIComponent(link)

  const urlHref = () => {
    const isExcludedDomain = redirectConfig.excludedDomains.some((domain) =>
      link.includes(domain)
    )
    if (isExcludedDomain) {
      return link
    }

    if (typeof isRequireRedirect !== 'undefined') {
      return isRequireRedirect ? `/redirect?url=${encodeLink}` : link
    }

    return redirectConfig.enabled ? `/redirect?url=${encodeLink}` : link
  }

  return (
    <Link
      isExternal={!isRequireRedirect && !redirectConfig.enabled}
      showAnchorIcon={showAnchorIcon}
      href={urlHref()}
    >
      {children}
    </Link>
  )
}
