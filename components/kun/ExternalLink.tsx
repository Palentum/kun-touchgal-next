import { Link } from '@nextui-org/link'
import React from 'react'
import * as redirectConfig from '~/config/redirect.json'

interface Props {
  link: string
  isRequireRedirect?: boolean
  children?: React.ReactNode
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
      isExternal
      showAnchorIcon={showAnchorIcon}
      href={urlHref()}
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  )
}
