'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { Video } from 'lucide-react'
import {
  MAX_FILE_SIZE,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_VIDEO_EXTENSIONS
} from '~/constants/admin'
import { cn } from '~/utils/cn'
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
    toast.error('视频类型不被支持, 系统被设置为仅支持 mp4, wmv, webm 格式')
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

interface Props {
  onFileSelected: (file: File) => void
  uploading: boolean
}

export const VideoDropZone = ({ uploading, onFileSelected }: Props) => {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]

    const res = handleFileInput(file)
    if (!res) {
      return
    }
    setFile(res)
    onFileSelected(res)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    const res = handleFileInput(selectedFile)
    if (!res) {
      return
    }
    setFile(res)
    onFileSelected(res)
  }

  return (
    <div
      className={cn(
        'flex flex-col justify-center items-center space-y-2 border-2 border-dashed rounded-lg p-8 transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-default-300'
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
    >
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
          已选择: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
        </p>
      )}
    </div>
  )
}
