'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { PatchHeaderTabs } from './Tabs'
import { PatchHeaderInfo } from './Info'
import { KunAutoImageViewer } from '~/components/kun/image-viewer/AutoImageViewer'
import { KunNull } from '~/components/kun/Null'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
  intro: PatchIntroduction
  uid?: number
}

export const PatchHeaderContainer = ({
  patch,
  intro,
  uid
}: PatchHeaderProps) => {
  const { setData } = useRewritePatchStore()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState('introduction')
  const tabsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const targetTab = searchParams.get('tab')
    const targetCommentId = searchParams.get('commentId')
    const targetRatingId = searchParams.get('ratingId')
    const targetResourceId = searchParams.get('resourceId')

    if (targetTab === 'comments' || targetCommentId) {
      setSelected('comments')
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (targetTab === 'rating' || targetRatingId) {
      setSelected('rating')
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (targetTab === 'resources' || targetResourceId) {
      setSelected('resources')
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    if (targetTab === 'introduction') {
      setSelected('introduction')
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [searchParams])

  useEffect(() => {
    setData({
      id: patch.id,
      uniqueId: patch.uniqueId,
      vndbId: patch.vndbId ?? '',
      vndbRelationId: patch.vndbRelationId ?? '',
      bangumiId: patch.bangumiId ? String(patch.bangumiId) : '',
      steamId: patch.steamId ? String(patch.steamId) : '',
      dlsiteCode: patch.dlsiteCode ?? '',
      dlsiteCircleName: '',
      dlsiteCircleLink: '',
      vndbTags: [],
      vndbDevelopers: [],
      bangumiTags: [],
      bangumiDevelopers: [],
      steamTags: [],
      steamDevelopers: [],
      steamAliases: [],
      name: patch.name,
      introduction: patch.introduction,
      alias: patch.alias,
      tag: patch.tags,
      contentLimit: patch.contentLimit,
      released: intro.released
    })
  }, [])

  return (
    <div className="relative w-full mx-auto max-w-7xl">
      {patch.contentLimit === 'nsfw' && !uid ? (
        <KunNull message="请登录后查看 NSFW 游戏" />
      ) : (
        <>
          <KunAutoImageViewer />

          <PatchHeaderInfo
            patch={patch}
            handleClickDownloadNav={() => {
              setSelected('resources')
              tabsRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          />

          <div ref={tabsRef}>
            <PatchHeaderTabs
              id={patch.id}
              vndbId={patch.vndbId || ''}
              intro={intro}
              uid={uid}
              selected={selected}
              setSelected={setSelected}
            />
          </div>
        </>
      )}
    </div>
  )
}
