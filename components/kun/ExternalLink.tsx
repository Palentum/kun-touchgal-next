import { Link } from '@nextui-org/link'
import React from 'react'

interface Props {
  link: string
  isRequireRedirect?: boolean
  children?: React.ReactNode
  showAnchorIcon?: boolean
}

export const KunExternalLink = ({
  link,
  children,
  isRequireRedirect = true,
  showAnchorIcon = true
}: Props) => {
  const encodeLink = encodeURIComponent(link)

  const urlHref = isRequireRedirect ? `/redirect?url=${encodeLink}` : link

  return (
    <Link
      isExternal
      showAnchorIcon={showAnchorIcon}
      href={urlHref}
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  )
}
