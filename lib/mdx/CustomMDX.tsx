import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { KunLink } from './element/KunLink'
import { KunTable } from './element/KunTable'
import { KunCode } from './element/KunCode'
import { createKunHeading } from './element/kunHeading'
import type { ComponentPropsWithoutRef } from 'react'

const NativeTable = (props: ComponentPropsWithoutRef<'table'>) => (
  <div className="overflow-x-auto">
    <table {...props} />
  </div>
)

const components = {
  h1: createKunHeading(1),
  h2: createKunHeading(2),
  h3: createKunHeading(3),
  h4: createKunHeading(4),
  h5: createKunHeading(5),
  h6: createKunHeading(6),
  a: KunLink,
  code: KunCode,
  table: NativeTable,
  Table: KunTable
}

export const CustomMDX = (props: MDXRemoteProps) => {
  return (
    <MDXRemote
      {...props}
      options={{
        ...(props.options || {}),
        mdxOptions: {
          ...(props.options?.mdxOptions || {}),
          remarkPlugins: [
            ...((props.options?.mdxOptions?.remarkPlugins as []) || []),
            remarkGfm
          ]
        }
      }}
      components={{ ...components, ...(props.components || {}) }}
    />
  )
}
