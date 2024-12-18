'use client'

import { useState } from 'react'
import { Button, Progress } from '@nextui-org/react'
import { Video, CheckCircle2, AlertCircle } from 'lucide-react'
import { CHUNK_SIZE, MAX_FILE_SIZE } from '~/constants/admin'

export function VideoUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadChunk = async (
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

    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Chunk upload failed')
    }

    const result = await response.json()
    return result
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunk = file.slice(start, end)

        const result = await uploadChunk(chunk, i, fileId, totalChunks)

        if (result.url) {
          setUploadedUrl(result.url)
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100))
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload video. Please try again.')
    } finally {
      setUploading(false)
    }
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

      {uploadedUrl && (
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-small">Upload complete!</span>
        </div>
      )}
    </div>
  )
}
