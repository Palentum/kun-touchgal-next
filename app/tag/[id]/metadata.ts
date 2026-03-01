import { generateNullMetadata } from '~/utils/noIndex'
import type { Metadata } from 'next'

export const generateKunMetadataTemplate = (tagName: string): Metadata => {
  return generateNullMetadata(tagName)
}
