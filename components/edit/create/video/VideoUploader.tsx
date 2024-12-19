'use client'

import { useState } from 'react'
import { Button, Progress } from '@nextui-org/react'
import { Video, CheckCircle2, AlertCircle } from 'lucide-react'
import {
  CHUNK_SIZE,
  MAX_FILE_SIZE,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_VIDEO_EXTENSIONS
} from '~/constants/admin'
import { kunFetchFormData } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

const validateFileType = (file: File): boolean => {
  const fileExtension = file.name
    .slice(file.name.lastIndexOf('.'))
    .toLowerCase()
  return (
    ALLOWED_VIDEO_MIME_TYPES.includes(file.type) ||
    ALLOWED_VIDEO_EXTENSIONS.includes(fileExtension)
  )
}

const handleFileInput = (file: File | undefined) => {
  if (!file) {
    toast.error('未选择视频文件')
    return
  }

  if (!validateFileType(file)) {
    toast.error('视频类型不被支持, 系统被设置为仅支持 MP4 和 WEBM 格式')
    return
  }

  const fileSizeMB = file.size / (1024 * 1024 * 1024)
  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      `视频文件大小超出限制: ${fileSizeMB.toFixed(3)} GB, 系统设定最大允许大小为 ${MAX_FILE_SIZE} GB`
    )
    return
  }

  return file
}

const uploadChunk = async (
  file: File,
  chunk: Blob,
  chunkIndex: number,
  fileId: string,
  totalChunks: number,
  galgameId: number
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

interface Props {
  galgameId: number
}

export const VideoUploader = ({ galgameId }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    const res = handleFileInput(selectedFile)
    if (!res) {
      return
    }
    setFile(res)
    setError('')
  }

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

      await uploadChunk(file, chunk, i, fileId, totalChunks, galgameId)

      setProgress(Math.round(((i + 1) / totalChunks) * 100))
    }

    setUploading(false)
  }

  return (
    <div>
      <div className="flex flex-col items-center p-6 space-y-2 border-2 border-dashed rounded-lg border-default-300">
        <Video className="w-12 h-12 text-default-400" />
        <p>拖放视频到此处或</p>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload">
          <Button color="primary" variant="flat" as="span" disabled={uploading}>
            选择视频
          </Button>
        </label>
        {file && (
          <p className="text-small text-default-500">
            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-danger">
          <AlertCircle className="w-4 h-4" />
          <span className="text-small">{error}</span>
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
          {uploading ? `Uploading (${progress}%)` : 'Upload Video'}
        </Button>
      )}

      {uploading && (
        <Progress
          aria-label="Upload progress"
          value={progress}
          className="w-full"
        />
      )}

      {progress === 100 && (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-small">Upload complete!</span>
        </div>
      )}
    </div>
  )
}
