'use client'

import { $command, $inputRule, $node, $remark } from '@milkdown/utils'
import { Node } from '@milkdown/prose/model'
import { InputRule } from '@milkdown/prose/inputrules'
import directive from 'remark-directive'
import { createRoot } from 'react-dom/client'
import { KunLink } from './KunLink'

export const kunImageRemarkDirective = $remark(
  'remarkDirective',
  () => directive
)

export const kunLinkNode = $node('kun-link', () => ({
  content: 'inline*',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,
  marks: '',
  attrs: {
    href: { default: '' },
    text: { default: '' }
  },
  parseDOM: [
    {
      tag: 'span[data-kun-link]',
      getAttrs: (dom) => ({
        href: (dom as HTMLElement).getAttribute('data-href'),
        text: (dom as HTMLElement).getAttribute('data-text')
      })
    }
  ],
  toDOM: (node: Node) => {
    const container = document.createElement('span')
    container.setAttribute('data-kun-link', '')
    container.setAttribute('data-href', node.attrs.href)
    container.setAttribute('data-text', node.attrs.text)
    container.setAttribute('contenteditable', 'false')

    const root = createRoot(container)
    root.render(<KunLink href={node.attrs.href} text={node.attrs.text} />)

    return container
  },
  parseMarkdown: {
    match: (node) => node.type === 'leafDirective' && node.name === 'kun-link',
    runner: (state, node, type) => {
      state.addNode(type, {
        href: (node.attributes as { href: string }).href,
        text: node.children ? node.children[0].value : ''
      })
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === 'kun-link',
    runner: (state, node) => {
      state.addNode('leafDirective', undefined, node.attrs.text, {
        name: 'kun-link',
        attributes: { href: node.attrs.href }
      })
    }
  }
}))

interface InsertKunLinkCommandPayload {
  href: string
  text: string
}

export const insertKunLinkCommand = $command(
  'InsertKunLink',
  (ctx) =>
    (payload: InsertKunLinkCommandPayload = { href: '', text: '' }) =>
    (state, dispatch) => {
      if (!dispatch) return true

      const { href = '', text = '' } = payload
      const node = kunLinkNode.type(ctx).create({ href, text })

      if (!node) return true

      dispatch(state.tr.replaceSelectionWith(node).scrollIntoView())
      return true
    }
)

export const kunLinkInputRule = $inputRule(
  (ctx) =>
    new InputRule(
      // Matches format: [[text]](url)
      /\[\[(?<text>[^\]]+)\]\]\((?<href>[^)]+)\)/,
      (state, match, start, end) => {
        const [matched, text = '', href = ''] = match
        const { tr } = state

        if (matched) {
          return tr.replaceWith(
            start - 1,
            end,
            kunLinkNode.type(ctx).create({ href, text })
          )
        }
        return null
      }
    )
)
