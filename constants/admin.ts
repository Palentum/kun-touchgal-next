export const APPLICANT_STATUS_MAP: Record<number, string> = {
  0: '待处理',
  1: '已处理',
  2: '已同意',
  3: '已拒绝'
}

export const ADMIN_LOG_TYPE_MAP: Record<string, string> = {
  create: '创建',
  delete: '删除',
  approve: '同意',
  decline: '拒绝',
  update: '更改'
}

export const CHUNK_SIZE = 5 * 1024 * 1024
export const UPLOAD_DIR = 'upload/video'
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm']

export const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm']
