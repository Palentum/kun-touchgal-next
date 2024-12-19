'use client'

import { useState } from 'react'
import { Button, Progress } from '@nextui-org/react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { CHUNK_SIZE } from '~/constants/admin'
import { kunFetchFormData } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { VideoDropZone } from './VideoDropZone'

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

    setUploading(false)
  }

  return (
    <div className="space-y-2">
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
          <span>上传成功!</span>
        </div>
      )}
    </div>
  )
}
