import { visit } from 'unist-util-visit'
import { SAFE_MEDIA_PROTOCOLS, sanitizeUserUrl } from '~/utils/safeUrl'
import type { Plugin } from 'unified'
import type { Node } from 'unist'

export const remarkKunVideo: Plugin<[], Node> = () => {
  return (tree) => {
    visit(tree, (node: any) => {
      if (
        node.type === 'containerDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'textDirective'
      ) {
        if (node.name !== 'kun-video') return

        const data = node.data || (node.data = {})
        const attributes = node.attributes || {}
        const src =
          typeof attributes.src === 'string'
            ? sanitizeUserUrl(attributes.src, SAFE_MEDIA_PROTOCOLS)
            : null

        if (!src) {
          return
        }

        data.hName = 'div'
        data.hProperties = {
          'data-video-player': '',
          'data-src': src,
          className: 'w-full my-4 overflow-hidden shadow-lg rounded-xl'
        }
      }
    })
  }
}
