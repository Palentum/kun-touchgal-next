import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypePrism from 'rehype-prism-plus'
import { unified } from 'unified'
import { remarkKunExternalLinks } from './remarkKunExternalLinks'
import { markdownSanitizeSchema } from './sanitizeSchema'

export const markdownToHtml = async (markdown: string) => {
  const htmlVFile = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(remarkKunExternalLinks)
    .use(rehypeSanitize, markdownSanitizeSchema)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(rehypePrism, { ignoreMissing: true })
    .use(rehypeStringify)
    .process(markdown)

  return String(htmlVFile)
}
