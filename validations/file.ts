import { z } from 'zod'

const isBlobLike = (value: unknown): value is Blob =>
  typeof Blob !== 'undefined' && value instanceof Blob

export const nonEmptyFileSchema = z
  .custom<Blob>((value) => isBlobLike(value), {
    message: '请上传文件'
  })
  .refine((file) => file.size > 0, {
    message: '上传文件不能为空'
  })
