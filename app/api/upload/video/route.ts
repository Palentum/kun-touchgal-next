import { unlink } from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import {
  ensureUploadDir,
  writeChunk,
  mergeChunks,
  cleanupChunks
} from '../videoUtils'
import { uploadVideoToS3 } from '~/lib/s3'
import { ChunkMetadata } from '~/types/api/upload'
import { MAX_FILE_SIZE } from '~/constants/admin'

const processVideoChunk = async (formData: FormData) => {
  const chunk = formData.get('chunk') as Blob
  const metadata = JSON.parse(
    formData.get('metadata') as string
  ) as ChunkMetadata
  // const galgameId = formData.get('galgameId') as string

  if (metadata.fileSize > MAX_FILE_SIZE) {
    return '视频大小超过最大大小 2GB'
  }

  await ensureUploadDir()
  const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
  await writeChunk(metadata.fileId, chunkBuffer, metadata.chunkIndex)

  if (metadata.chunkIndex === metadata.totalChunks - 1) {
    try {
      const mergedFilePath = await mergeChunks(
        metadata.fileId,
        metadata.totalChunks,
        metadata.fileName
      )

      console.log(mergedFilePath)

      // await uploadVideoToS3(
      //   mergedFilePath,
      //   metadata.fileName,
      //   metadata.mimeType,
      //   galgameId
      // )

      // await unlink(mergedFilePath)
    } catch (error) {
      await cleanupChunks(metadata.fileId, metadata.totalChunks)
      return '合并上传视频分片错误'
    }
  }

  return {}
}

export const POST = async (req: NextRequest) => {
  const formData = await req.formData()

  const res = await processVideoChunk(formData)
  if (typeof res === 'string') {
    return NextResponse.json(res)
  }
  return NextResponse.json(res)
}
