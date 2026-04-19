import cron from 'node-cron'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { withTaskLock } from './withTaskLock'

const CLEANUP_LOCK_KEY = 'cron:cleanup-uploads:lock'
const CLEANUP_LOCK_TTL_SECONDS = 55 * 60
const IGNORED_DELETE_ERRORS = new Set(['ENOENT', 'ENOTEMPTY'])

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && 'code' in error

const shouldIgnoreFsError = (error: unknown, codes: Set<string>) =>
  isNodeError(error) && typeof error.code === 'string' && codes.has(error.code)

const isOlderThanOneDay = async (filePath: string): Promise<boolean> => {
  const stats = await fs.stat(filePath)
  const now = Date.now()
  const fileTime = stats.ctime.getTime()
  return now - fileTime > 24 * 60 * 60 * 1000
}

const deleteOldFilesAndFolders = async (dir: string) => {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await deleteOldFilesAndFolders(fullPath)

      try {
        const subEntries = await fs.readdir(fullPath)
        if (subEntries.length === 0) {
          await fs.rmdir(fullPath)
        }
      } catch (error) {
        if (!shouldIgnoreFsError(error, IGNORED_DELETE_ERRORS)) {
          throw error
        }
      }
    } else if (entry.isFile()) {
      let shouldDelete = false

      try {
        shouldDelete = await isOlderThanOneDay(fullPath)
      } catch (error) {
        if (!shouldIgnoreFsError(error, IGNORED_DELETE_ERRORS)) {
          throw error
        }
      }

      if (shouldDelete) {
        try {
          await fs.unlink(fullPath)
        } catch (error) {
          if (!shouldIgnoreFsError(error, IGNORED_DELETE_ERRORS)) {
            throw error
          }
        }
      }
    }
  }
}

const cleanupUploads = async () => {
  const uploadsDir = path.posix.resolve('uploads')

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }

  try {
    await deleteOldFilesAndFolders(uploadsDir)
    console.log('Cleanup task completed.')
  } catch (error) {
    console.error('Error during cleanup task:', error)
  }
}

export const setCleanupTask = cron.createTask('0 * * * *', async () => {
  await withTaskLock(
    {
      key: CLEANUP_LOCK_KEY,
      ttlSeconds: CLEANUP_LOCK_TTL_SECONDS,
      taskName: 'setCleanupTask',
      releaseOnComplete: false
    },
    cleanupUploads
  )
})
