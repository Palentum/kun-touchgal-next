import { $inputRule } from '@milkdown/utils'
import { InputRule } from '@milkdown/prose/inputrules'

export const videoInputRule = $inputRule(
  (ctx) =>
    new InputRule(
      /{{kv=(?<url>[^}]+)(?:\|(?<title>[^}]+))?}}/,
      (state, match, start, end) => {
        const [okay, url = '', title = ''] = match
        const { tr } = state

        console.log(ctx.get('video'))

        if (okay) {
          const nodeType = ctx.get('video')

          tr.replaceWith(
            start - 1,
            end,
            nodeType.create({ url: url.trim(), title: title.trim() })
          )
        }

        return tr
      }
    )
)
