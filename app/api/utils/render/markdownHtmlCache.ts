import { createHash } from 'crypto'
import { MARKDOWN_HTML_CACHE_DURATION } from '~/config/cache'

type MarkdownHtmlCacheVariant = 'standard' | 'extend'
type MarkdownHtmlRenderer = () => Promise<string>

const MARKDOWN_HTML_CACHE_KEY = 'markdown:html'
const MARKDOWN_HTML_CACHE_VERSION = 'v1'
const MARKDOWN_HTML_CACHE_TIMEOUT_MS = 200
const MARKDOWN_HTML_CACHE_RETRY_DELAY_MS = 30 * 1000

let markdownHtmlCacheDisabledUntil = 0

const isRedisConfigured = () =>
  Boolean(process.env.REDIS_HOST && process.env.REDIS_PORT)

const isMarkdownHtmlCacheAvailable = () =>
  isRedisConfigured() && Date.now() >= markdownHtmlCacheDisabledUntil

const disableMarkdownHtmlCache = () => {
  markdownHtmlCacheDisabledUntil =
    Date.now() + MARKDOWN_HTML_CACHE_RETRY_DELAY_MS
}

const getMarkdownHtmlCacheKey = (
  variant: MarkdownHtmlCacheVariant,
  markdown: string
) => {
  const hash = createHash('sha256').update(markdown).digest('hex')
  return `${MARKDOWN_HTML_CACHE_KEY}:${MARKDOWN_HTML_CACHE_VERSION}:${variant}:${hash}`
}

const withCacheTimeout = async <T>(operation: Promise<T>, fallback: T) => {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          disableMarkdownHtmlCache()
          resolve(fallback)
        }, MARKDOWN_HTML_CACHE_TIMEOUT_MS)
      })
    ])
  } catch {
    disableMarkdownHtmlCache()
    return fallback
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

const readMarkdownHtmlCache = async (cacheKey: string) => {
  if (!isMarkdownHtmlCacheAvailable()) {
    return null
  }

  return withCacheTimeout(
    (async () => {
      const { getKv } = await import('~/lib/redis')
      return await getKv(cacheKey)
    })(),
    null
  )
}

const writeMarkdownHtmlCache = async (cacheKey: string, html: string) => {
  if (!isMarkdownHtmlCacheAvailable()) {
    return
  }

  await withCacheTimeout(
    (async () => {
      const { setKv } = await import('~/lib/redis')
      await setKv(cacheKey, html, MARKDOWN_HTML_CACHE_DURATION)
    })(),
    undefined
  )
}

export const renderMarkdownHtmlWithCache = async (
  variant: MarkdownHtmlCacheVariant,
  markdown: string,
  render: MarkdownHtmlRenderer
) => {
  const cacheKey = getMarkdownHtmlCacheKey(variant, markdown)
  const cachedHtml = await readMarkdownHtmlCache(cacheKey)

  if (cachedHtml !== null) {
    return cachedHtml
  }

  const html = await render()
  await writeMarkdownHtmlCache(cacheKey, html)

  return html
}
