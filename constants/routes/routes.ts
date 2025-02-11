import { isPatchPath, isTagPath, isUserPath, isDocPath } from './matcher'
import { keyLabelMap } from './constants'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { KunBreadcrumbItem } from './constants'

type NextParams = Record<string, string | Array<string> | undefined>

// Some path's length is equal to galgame uniqueId (8 digits and chars)
const pathToIgnore = ['/resource', '/register', '/redirect', '/settings']

const createPatchBreadcrumb = (
  params: NextParams,
  defaultItem: KunBreadcrumbItem,
  pageTitle: string
) => {
  return {
    ...defaultItem,
    key: `/${params.id}`,
    label: pageTitle,
    href: `/${params.id}`
  }
}

const createTagBreadcrumb = (
  params: NextParams,
  defaultItem: KunBreadcrumbItem,
  pageTitle: string
) => {
  return {
    ...defaultItem,
    key: `/tag/${params.id}`,
    label: pageTitle,
    href: `/tag/${params.id}`
  }
}

const createUserBreadcrumb = (
  params: NextParams,
  defaultItem: KunBreadcrumbItem,
  pageTitle: string
) => {
  return {
    ...defaultItem,
    key: `/user/${params.id}`,
    label: pageTitle,
    href: `/user/${params.id}/resource`
  }
}

const createDocBreadcrumb = (
  params: NextParams,
  defaultItem: KunBreadcrumbItem,
  pageTitle: string
) => {
  return {
    ...defaultItem,
    key: `/doc/${params.id}`,
    label: pageTitle,
    href: `/doc/${params.id}`
  }
}

export const getKunPathLabel = (pathname: string): string => {
  const hasIgnorePath = pathToIgnore.some((p) => p === pathname)
  if (isPatchPath(pathname) && !hasIgnorePath) {
    return pathname
  }
  if (isDocPath(pathname)) {
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

const extractPatchCategory = (pageTitle: string): KunBreadcrumbItem[] => {
  const categoryRouteMap: Record<string, string> = {
    'PC + 安卓':
      '/galgame?type=all&language=all&platform=all&sortField=created&sortOrder=desc&page=1',
    'PC 游戏':
      '/galgame?type=all&language=all&platform=windows&sortField=created&sortOrder=desc&page=1',
    安卓游戏:
      '/galgame?type=all&language=all&platform=android&sortField=created&sortOrder=desc&page=1'
  }

  const lastPipeIndex = pageTitle.lastIndexOf(' | ')
  if (lastPipeIndex !== -1) {
    const categoryName = pageTitle.slice(lastPipeIndex + 3).split(' ')[0]
    if (categoryName === '-') {
      return []
    }

    return [
      {
        key: categoryName,
        label: categoryName,
        href: categoryRouteMap[categoryName]
      }
    ]
  }

  return []
}

export const createBreadcrumbItem = (
  pathname: string,
  params: NextParams
): KunBreadcrumbItem[] => {
  if (pathname === '/') {
    return []
  }

  const label = getKunPathLabel(pathname)
  if (!label) {
    return []
  }

  const defaultItem: KunBreadcrumbItem = {
    key: pathname,
    label,
    href: pathname
  }

  const pageTitle = document.title
    .replace(` - ${kunMoyuMoe.titleShort}`, '')
    .replace(/\|.*$/, '')

  const hasIgnorePath = pathToIgnore.some((p) => p === pathname)
  if (hasIgnorePath) {
    return [defaultItem]
  }

  if (isPatchPath(pathname)) {
    const patchCategoryRoute = extractPatchCategory(document.title)
    return [
      ...patchCategoryRoute,
      createPatchBreadcrumb(params, defaultItem, pageTitle)
    ]
  }
  if (isTagPath(pathname)) {
    const allTagRoute: KunBreadcrumbItem = {
      key: 'tag',
      label: '补丁标签',
      href: '/tag'
    }
    return [allTagRoute, createTagBreadcrumb(params, defaultItem, pageTitle)]
  }
  if (isUserPath(pathname)) {
    return [createUserBreadcrumb(params, defaultItem, pageTitle)]
  }
  if (isDocPath(pathname)) {
    const allDocRoute: KunBreadcrumbItem = {
      key: 'doc',
      label: '帮助文档',
      href: '/doc'
    }
    return [allDocRoute, createDocBreadcrumb(params, defaultItem, pageTitle)]
  }

  return [defaultItem]
}
