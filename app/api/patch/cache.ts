import { PATCH_FAVORITE_CACHE_DURATION } from '~/config/cache'
import { delKv, delKvs, getKv, setKv } from '~/lib/redis'

const PATCH_CACHE_KEY = 'patch'
const PATCH_INTRODUCTION_CACHE_KEY = 'patch:introduction'
const PATCH_FAVORITE_CACHE_KEY = 'patch:favorite'

export const getPatchCacheKey = (uniqueId: string) =>
  `${PATCH_CACHE_KEY}:${uniqueId}`

export const getPatchIntroductionCacheKey = (uniqueId: string) =>
  `${PATCH_INTRODUCTION_CACHE_KEY}:${uniqueId}`

const getPatchFavoriteCacheKey = (uniqueId: string, uid: number) =>
  `${PATCH_FAVORITE_CACHE_KEY}:${uid}:${uniqueId}`

export const getCachedPatchFavoriteStatus = async (
  uniqueId: string,
  uid: number
) => {
  if (uid <= 0) {
    return false
  }

  const cachedStatus = await getKv(getPatchFavoriteCacheKey(uniqueId, uid))

  if (cachedStatus === null) {
    return null
  }

  return cachedStatus === '1'
}

export const setCachedPatchFavoriteStatus = async (
  uniqueId: string,
  uid: number,
  isFavorite: boolean
) => {
  if (uid <= 0) {
    return
  }

  await setKv(
    getPatchFavoriteCacheKey(uniqueId, uid),
    isFavorite ? '1' : '0',
    PATCH_FAVORITE_CACHE_DURATION
  )
}

export const invalidatePatchContentCache = async (uniqueId: string) => {
  await Promise.all([
    delKv(getPatchCacheKey(uniqueId)),
    delKv(getPatchIntroductionCacheKey(uniqueId))
  ])
}

export const invalidatePatchFavoriteCache = async (
  uniqueId: string,
  uid: number
) => {
  if (uid <= 0) {
    return
  }

  await delKv(getPatchFavoriteCacheKey(uniqueId, uid))
}

export const invalidatePatchFavoriteCaches = async (
  uniqueIds: string[],
  uid: number
) => {
  if (uid <= 0) {
    return
  }

  const cacheKeys = [...new Set(uniqueIds)].map((uniqueId) =>
    getPatchFavoriteCacheKey(uniqueId, uid)
  )
  await delKvs(cacheKeys)
}
