import { Link } from '@nextui-org/link'
import React from 'react'

interface Props {
  link: string
  children?: React.ReactNode
  showAnchorIcon?: boolean
}

export const KunExternalLink = ({
  link,
  children,
  showAnchorIcon = true
}: Props) => {
  const encodeLink = encodeURIComponent(link)
  return (
    <Link
      isExternal
      showAnchorIcon={showAnchorIcon}
      href={`/redirect?url=${encodeLink}`}
      rel="noopener noreferrer"
    >
      {children}
    </Link>
  )
}
