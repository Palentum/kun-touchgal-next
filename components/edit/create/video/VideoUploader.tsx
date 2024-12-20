'use client'

import { useState } from 'react'
import { Button, Chip, Progress } from '@nextui-org/react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { CHUNK_SIZE } from '~/constants/admin'
import { kunFetchFormData } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { VideoDropZone } from './VideoDropZone'
import { useCreatePatchStore } from '~/store/editStore'

const uploadChunk = async (
  file: File,
  chunk: Blob,
  chunkIndex: number,
  fileId: string,
  totalChunks: number
) => {
  const formData = new FormData()
  formData.append('chunk', chunk)
  formData.append(
    'metadata',
    JSON.stringify({
      chunkIndex,
      totalChunks,
      fileId,
      fileName: file!.name,
      fileSize: file!.size,
      mimeType: file!.type
    })
  )

  const response = await kunFetchFormData<KunResponse<{}>>(
    '/upload/video',
    formData
  )
  if (typeof response === 'string') {
    toast.error(response)
  }
}

export const VideoUploader = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>('')
  const { data, setData } = useCreatePatchStore()

  const handleUpload = async () => {
    if (!file) {
      toast.error('未选择视频文件')
      return
    }

    setUploading(true)
    setProgress(0)
    setError('')

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      await uploadChunk(file, chunk, i, fileId, totalChunks)

      setProgress(Math.round(((i + 1) / totalChunks) * 100))
    }

    setData({ ...data, tempVideoId: fileId, tempVideoName: file.name })
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      {data.tempVideoId && !file && (
        <>
          <Chip
            color="secondary"
            startContent={<AlertCircle />}
            variant="flat"
            className="h-full py-1 break-all whitespace-normal"
          >
            您本地服务器有一个已经上传的视频, 如果您不继续上传,
            将使用此视频作为本游戏的视频
          </Chip>
          <p className="text-small text-default-500">
            本地视频文件名: {data.tempVideoName}
          </p>
        </>
      )}

      <VideoDropZone
        onFileSelected={(file) => setFile(file)}
        uploading={uploading}
      />

      {error && (
        <div className="flex items-center gap-2 text-danger">
          <AlertCircle className="size-5" />
          <span>{error}</span>
        </div>
      )}

      {file && !error && (
        <Button
          color="primary"
          onClick={handleUpload}
          isLoading={uploading}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? `正在上传中... (${progress}%)` : '确定上传'}
        </Button>
      )}

      {uploading && (
        <Progress aria-label="上传进度" value={progress} className="w-full" />
      )}

      {progress === 100 && (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="size-5" />
          <span>上传成功! 文件将会被暂存服务器 24h</span>
        </div>
      )}
    </div>
  )
}
