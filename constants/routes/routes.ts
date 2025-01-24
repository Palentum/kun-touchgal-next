import { isPatchPath, isTagPath, isUserPath } from './matcher'
import { keyLabelMap } from './constants'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { KunBreadcrumbItem } from './constants'

type NextParams = Record<string, string | Array<string> | undefined>

export const getKunPathLabel = (pathname: string): string => {
  if (isPatchPath(pathname)) {
    return pathname
  }

  for (const key in keyLabelMap) {
    const regex = new RegExp(`^${key.replace(/\[id\]/g, '\\d+')}$`)
    if (regex.test(pathname)) {
      return keyLabelMap[key]
    }
  }

  return keyLabelMap[pathname]
}

export const createBreadcrumbItem = (
  pathname: string,
  params: NextParams
): KunBreadcrumbItem | null => {
  const label = getKunPathLabel(pathname)
  if (!label) {
    return null
  }

  const defaultItem: KunBreadcrumbItem = {
    key: pathname,
    label,
    href: pathname
  }

  const pageTitle = document.title
    .replace(` - ${kunMoyuMoe.titleShort}`, '')
    .replace(/\|.*$/, '')

  const pathHandlers: Record<
    string,
    { keyPrefix: string; hrefSuffix: string }
  > = {
    patch: { keyPrefix: `/${params.id}`, hrefSuffix: '' },
    tag: { keyPrefix: `/tag/${params.id}`, hrefSuffix: '' },
    user: { keyPrefix: `/user/${params.id}`, hrefSuffix: `/resource` }
  }

  // Some path's length is equal to galgame uniqueId (8 digits and chars)
  const pathToIgnore = ['/resource']

  for (const [pathKey, { keyPrefix, hrefSuffix }] of Object.entries(
    pathHandlers
  )) {
    const isPath = {
      patch: isPatchPath,
      tag: isTagPath,
      user: isUserPath
    }[pathKey]
    const hasIgnorePath = pathToIgnore.some((p) => p === pathname)

    if (isPath && isPath(pathname) && !hasIgnorePath) {
      return {
        ...defaultItem,
        key: keyPrefix,
        label: pageTitle,
        href: `${keyPrefix}${hrefSuffix}`
      }
    }
  }

  return defaultItem
}
