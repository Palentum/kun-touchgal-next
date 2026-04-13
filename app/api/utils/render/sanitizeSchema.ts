import { defaultSchema } from 'rehype-sanitize'
import {
  SAFE_LINK_PROTOCOL_NAMES,
  SAFE_MEDIA_PROTOCOL_NAMES
} from '~/utils/safeUrl'
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize'

const defaultProtocols = defaultSchema.protocols || {}

const linkAttributes = [
  'data-kun-external-link',
  'data-href',
  'data-text',
  'href',
  'target',
  'rel',
  'className'
]

const imageAttributes = ['src', 'alt', 'title', 'class', 'loading']

const safeProtocols = {
  ...defaultProtocols,
  href: SAFE_LINK_PROTOCOL_NAMES,
  src: SAFE_MEDIA_PROTOCOL_NAMES,
  'data-href': SAFE_LINK_PROTOCOL_NAMES,
  'data-src': SAFE_MEDIA_PROTOCOL_NAMES
}

export const markdownSanitizeSchema: RehypeSanitizeOptions = {
  ...defaultSchema,
  attributes: {
    a: linkAttributes,
    img: imageAttributes
  },
  protocols: safeProtocols
}

export const markdownExtendSanitizeSchema: RehypeSanitizeOptions = {
  ...markdownSanitizeSchema,
  attributes: {
    div: [
      'data-video-player',
      'data-src',
      'data-kun-link',
      'data-href',
      'data-text',
      'data-kun-img-container',
      'className'
    ],
    img: imageAttributes,
    a: linkAttributes
  }
}
