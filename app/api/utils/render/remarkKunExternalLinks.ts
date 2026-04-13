import { visit } from 'unist-util-visit'
import { toString } from 'hast-util-to-string'
import { sanitizeUserHref } from '~/utils/safeUrl'
import type { Plugin } from 'unified'
import type { Node } from 'unist'

export const remarkKunExternalLinks: Plugin<[], Node> = () => {
  return (tree) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName === 'a') {
        const href = node.properties?.href
        if (typeof href !== 'string') {
          return
        }

        const safeHref = sanitizeUserHref(href)
        if (!safeHref) {
          return
        }

        node.properties.href = safeHref
        node.properties['data-kun-external-link'] = ''
        node.properties['data-href'] = safeHref
        node.properties['data-text'] = toString(node)
      }
    })
  }
}
