import { SUPPORTED_RESOURCE_LINK } from '~/constants/resource'

export interface UploadFileResponse {
  filetype: (typeof SUPPORTED_RESOURCE_LINK)[number]
  fileHash: string
  fileSize: string
}

export interface ChunkMetadata {
  chunkIndex: number
  totalChunks: number
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UploadResponse {
  success: boolean
  fileId?: string
  error?: string
  url?: string
}
