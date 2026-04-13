'use client'

import { Link } from '@heroui/link'
import { useUserStore } from '~/store/userStore'
import {
  getHttpUrlHostname,
  isHostnameExcluded,
  isRedirectableUrl,
  sanitizeUserHref
} from '~/utils/safeUrl'
import type { ReactNode } from 'react'
import type { LinkProps } from '@heroui/react'

interface Props extends LinkProps {
  link: string
  isRequireRedirect?: boolean
  children?: ReactNode
  showAnchorIcon?: boolean
}

export const KunExternalLink = ({
  link,
  children,
  isRequireRedirect,
  isDisabled,
  showAnchorIcon = true,
  ...props
}: Props) => {
  const userConfig = useUserStore((state) => state.user)
  const safeLink = sanitizeUserHref(link)

  const urlHref = () => {
    if (!safeLink) {
      return undefined
    }

    const hostname = getHttpUrlHostname(safeLink)
    const isExcludedDomain = hostname
      ? isHostnameExcluded(hostname, userConfig.excludedDomains)
      : false

    if (isExcludedDomain) {
      return safeLink
    }

    if (typeof isRequireRedirect !== 'undefined') {
      return isRequireRedirect && isRedirectableUrl(safeLink)
        ? `/redirect?url=${encodeURIComponent(safeLink)}`
        : safeLink
    }

    return userConfig.enableRedirect && isRedirectableUrl(safeLink)
      ? `/redirect?url=${encodeURIComponent(safeLink)}`
      : safeLink
  }

  return (
    <Link
      {...props}
      isDisabled={!safeLink || isDisabled}
      isExternal={
        safeLink
          ? !isRequireRedirect &&
            !userConfig.enableRedirect &&
            isRedirectableUrl(safeLink)
          : false
      }
      showAnchorIcon={showAnchorIcon}
      href={urlHref()}
    >
      {children}
    </Link>
  )
}
