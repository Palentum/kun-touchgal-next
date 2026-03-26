import { PATCH_FAVORITE_CACHE_DURATION } from '~/config/cache'
import { delKv, getKv, setKv } from '~/lib/redis'

const PATCH_CACHE_KEY = 'patch'
const PATCH_INTRODUCTION_CACHE_KEY = 'patch:introduction'
const PATCH_FAVORITE_CACHE_KEY = 'patch:favorite'
const PATCH_FAVORITE_VERSION_KEY = 'patch:favorite:version'

export const getPatchCacheKey = (uniqueId: string) =>
  `${PATCH_CACHE_KEY}:${uniqueId}`

export const getPatchIntroductionCacheKey = (uniqueId: string) =>
  `${PATCH_INTRODUCTION_CACHE_KEY}:${uniqueId}`

const getPatchFavoriteVersionKey = (uid: number) =>
  `${PATCH_FAVORITE_VERSION_KEY}:${uid}`

const getPatchFavoriteCacheKey = (
  uniqueId: string,
  uid: number,
  version: string
) => `${PATCH_FAVORITE_CACHE_KEY}:${uniqueId}:${uid}:${version}`

const getPatchFavoriteCacheVersion = async (uid: number) => {
  if (uid <= 0) {
    return '0'
  }

  const version = await getKv(getPatchFavoriteVersionKey(uid))
  return version ?? '0'
}

export const getCachedPatchFavoriteStatus = async (
  uniqueId: string,
  uid: number
) => {
  if (uid <= 0) {
    return false
  }

  const version = await getPatchFavoriteCacheVersion(uid)
  const cachedStatus = await getKv(getPatchFavoriteCacheKey(uniqueId, uid, version))

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

  const version = await getPatchFavoriteCacheVersion(uid)
  await setKv(
    getPatchFavoriteCacheKey(uniqueId, uid, version),
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

export const bumpPatchFavoriteCacheVersion = async (uid: number) => {
  if (uid <= 0) {
    return
  }

  await setKv(getPatchFavoriteVersionKey(uid), String(Date.now()))
}
