'use client'

import { Link } from '@nextui-org/link'
import { useEffect, useState } from 'react'
import { kunFetchGet } from '~/utils/kunFetch'
import { DEFAULT_REDIRECT_CONFIG } from '~/constants/admin'
import type { ReactNode } from 'react'
import type { AdminRedirectConfig } from '~/types/api/admin'

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
  const [redirectConfig, setRedirectConfig] = useState<AdminRedirectConfig>(
    DEFAULT_REDIRECT_CONFIG
  )

  useEffect(() => {
    const fetchData = async () => {
      const response = await kunFetchGet<{
        setting: AdminRedirectConfig
      }>('/admin/setting/redirect')
      setRedirectConfig(response.setting)
    }
    fetchData()
  }, [])

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
