import { redis } from '~/lib/redis'

const PATCH_VIEWS_BUFFER_KEY = 'kun:touchgal:views:buffer'

export const incrementPatchViewBuffer = async (uniqueId: string) => {
  await redis.hincrby(PATCH_VIEWS_BUFFER_KEY, uniqueId, 1)
}

export const drainPatchViewBuffer = async () => {
  const tempKey = `${PATCH_VIEWS_BUFFER_KEY}:flush:${Date.now()}`

  try {
    const renamed = await redis.rename(PATCH_VIEWS_BUFFER_KEY, tempKey)
    if (renamed !== 'OK') {
      return {}
    }
  } catch {
    return {}
  }

  const entries = await redis.hgetall(tempKey)
  await redis.del(tempKey)
  return entries
}
