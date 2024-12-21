import { $inputRule, $node, $remark } from '@milkdown/utils'
import { Node } from '@milkdown/prose/model'
import { InputRule } from '@milkdown/prose/inputrules'
import directive from 'remark-directive'

export const remarkDirective = $remark('remarkDirective', () => directive)

export const videoNode = $node('video', () => ({
  group: 'block',
  atom: true,
  isolating: true,
  marks: '',
  attrs: {
    src: { default: null }
  },
  parseDOM: [
    {
      tag: 'video',
      getAttrs: (dom) => ({
        src: (dom as HTMLElement).getAttribute('src')
      })
    }
  ],
  toDOM: (node: Node) => [
    'video',
    {
      ...node.attrs,
      contenteditable: false,
      controls: true,
      className: 'w-full rounded-lg shadow-lg'
    },
    0
  ],
  parseMarkdown: {
    match: (node) => node.type === 'textDirective' && node.name === 'kv',
    runner: (state, node, type) => {
      state.addNode(type, { src: (node.attributes as { src: string }).src })
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === 'video',
    runner: (state, node) => {
      state.addNode('textDirective', undefined, undefined, {
        name: 'kv',
        attributes: { src: node.attrs.src }
      })
    }
  }
}))

export const videoInputRule = $inputRule(
  (ctx) =>
    new InputRule(/{{kv\="(?<src>[^"]+)?"?\}}/, (state, match, start, end) => {
      const [okay, src = ''] = match
      const { tr } = state
      if (okay) {
        tr.replaceWith(start - 1, end, videoNode.type(ctx).create({ src }))
      }
      return tr
    })
)
