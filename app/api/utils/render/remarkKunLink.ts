import { visit } from 'unist-util-visit'
import { sanitizeUserHref } from '~/utils/safeUrl'
import type { Plugin } from 'unified'
import type { Node } from 'unist'

export const remarkKunLink: Plugin<[], Node> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name !== 'kun-link') return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const href =
          typeof attributes.href === 'string'
            ? sanitizeUserHref(attributes.href)
            : null
        const text = typeof attributes.text === 'string' ? attributes.text : ''

        if (!href || !text) {
          return
        }

        data.hName = 'div'
        data.hProperties = {
          'data-kun-link': '',
          'data-href': href,
          'data-text': text,
          className: 'w-full'
        }
      }
    })
  }
}
