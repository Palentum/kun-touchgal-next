'use client'

import { $inputRule, $node, $remark } from '@milkdown/utils'
import { Node } from '@milkdown/prose/model'
import { InputRule } from '@milkdown/prose/inputrules'
import { createRoot } from 'react-dom/client'
import directive from 'remark-directive'
import dynamic from 'next/dynamic'

const KunPlyr = dynamic(() => import('./Plyr').then((mod) => mod.KunPlyr), {
  ssr: false
})

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
      tag: 'div[data-video-player]',
      getAttrs: (dom) => ({
        src: (dom as HTMLElement).getAttribute('data-src')
      })
    }
  ],
  toDOM: (node: Node) => {
    const container = document.createElement('div')
    container.setAttribute('data-video-player', '')
    container.setAttribute('data-src', node.attrs.src)
    container.setAttribute('contenteditable', 'false')
    container.className = 'w-full my-4 rounded-lg shadow-lg'

    const root = createRoot(container)
    root.render(<KunPlyr src={node.attrs.src} />)

    return container
  },
  parseMarkdown: {
    match: (node) => node.type === 'leafDirective' && node.name === 'kv',
    runner: (state, node, type) => {
      state.addNode(type, { src: (node.attributes as { src: string }).src })
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === 'video',
    runner: (state, node) => {
      state.addNode('leafDirective', undefined, undefined, {
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
