import { $node, $remark } from '@milkdown/utils'
import { Node } from '@milkdown/prose/model'
import directive from 'remark-directive'

export const remarkDirective = $remark('remarkDirective', () => directive)

export const videoNode = $node('video', () => ({
  group: 'block',
  atom: true,
  isolating: true,
  marks: '',
  attrs: {
    url: { default: null },
    title: { default: '' }
  },
  parseDOM: [
    {
      tag: 'div[data-type="video"]',
      getAttrs: (dom) => ({
        url: (dom as HTMLElement).getAttribute('data-url'),
        title: (dom as HTMLElement).getAttribute('data-title')
      })
    }
  ],
  toDOM: (node: Node) => [
    'div',
    {
      'data-type': 'video',
      'data-url': node.attrs.url,
      'data-title': node.attrs.title,
      class: 'milkdown-video-wrapper'
    }
  ],
  parseMarkdown: {
    match: (node) => node.type === 'textDirective' && node.name === 'kv',
    runner: (state, node, type) => {
      const url = (node.attributes as { url: string }).url || ''
      const title = (node.attributes as { title: string }).title || ''
      state.addNode(type, { url, title })
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === 'video',
    runner: (state, node) => {
      state.addNode('textDirective', undefined, undefined, {
        name: 'kv',
        attributes: {
          url: node.attrs.url,
          title: node.attrs.title
        }
      })
    }
  }
}))
