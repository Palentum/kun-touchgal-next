import { acquireKvLock, releaseKvLock } from '~/lib/redis'

const LOCK_ACQUIRE_MAX_ATTEMPTS = 3
const LOCK_ACQUIRE_RETRY_DELAY_MS = 500

interface TaskLockOptions {
  key: string
  ttlSeconds: number
  taskName: string
  releaseOnComplete?: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const acquireTaskLock = async (
  key: string,
  ttlSeconds: number,
  taskName: string
) => {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= LOCK_ACQUIRE_MAX_ATTEMPTS; attempt++) {
    try {
      return await acquireKvLock(key, ttlSeconds)
    } catch (error) {
      lastError = error

      if (attempt < LOCK_ACQUIRE_MAX_ATTEMPTS) {
        await sleep(LOCK_ACQUIRE_RETRY_DELAY_MS)
      }
    }
  }

  console.error(`Failed to acquire ${taskName} lock:`, lastError)
  return null
}

export const withTaskLock = async <T>(
  options: TaskLockOptions,
  task: () => Promise<T>
) => {
  const { key, ttlSeconds, taskName, releaseOnComplete = true } = options
  const lockToken = await acquireTaskLock(key, ttlSeconds, taskName)

  if (!lockToken) {
    return
  }

  try {
    return await task()
  } finally {
    if (releaseOnComplete) {
      try {
        await releaseKvLock(key, lockToken)
      } catch (error) {
        console.error(`Failed to release ${taskName} lock:`, error)
      }
    }
  }
}
