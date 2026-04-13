'use client'

import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import DOMPurify from 'isomorphic-dompurify'
import { Card, CardBody } from '@heroui/card'
import { Info } from './Info'
import { PatchTag } from './Tag'
import dynamic from 'next/dynamic'
import { useMounted } from '~/hooks/useMounted'
import { KunLink } from '~/components/kun/milkdown/plugins/components/link/KunLink'
import { KunExternalLink } from '~/components/kun/external-link/ExternalLink'
import {
  SAFE_MEDIA_PROTOCOLS,
  sanitizeUserHref,
  sanitizeUserUrl
} from '~/utils/safeUrl'
import type { PatchIntroduction } from '~/types/api/patch'

import './_adjust.scss'
import { PatchCompany } from './Company'

const KunPlyr = dynamic(
  () =>
    import('~/components/kun/milkdown/plugins/components/video/Plyr').then(
      (mod) => mod.KunPlyr
    ),
  { ssr: false }
)

interface Props {
  intro: PatchIntroduction
  patchId: number
  uid?: number
}

export const IntroductionTab = ({ intro, patchId, uid }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const isMounted = useMounted()

  useEffect(() => {
    if (!contentRef.current || !isMounted) {
      return
    }

    const externalLinkElements = contentRef.current.querySelectorAll(
      '[data-kun-external-link]'
    )
    externalLinkElements.forEach((element) => {
      const text = element.getAttribute('data-text')
      const href = element.getAttribute('data-href')
      const safeHref = href ? sanitizeUserHref(href) : null
      if (!text || !safeHref) {
        return
      }
      const root = document.createElement('div')
      root.className = element.className
      element.replaceWith(root)
      const videoRoot = createRoot(root)
      videoRoot.render(
        <KunExternalLink link={safeHref}>{text}</KunExternalLink>
      )
    })

    const videoElements = contentRef.current.querySelectorAll(
      '[data-video-player]'
    )
    videoElements.forEach((element) => {
      const src = element.getAttribute('data-src')
      const safeSrc = src ? sanitizeUserUrl(src, SAFE_MEDIA_PROTOCOLS) : null
      if (!safeSrc) {
        return
      }
      const root = document.createElement('div')
      root.className = element.className
      element.replaceWith(root)
      const videoRoot = createRoot(root)
      videoRoot.render(<KunPlyr src={safeSrc} />)
    })

    const linkElements = contentRef.current.querySelectorAll('[data-kun-link]')
    linkElements.forEach((element) => {
      const href = element.getAttribute('data-href')
      const text = element.getAttribute('data-text')
      const safeHref = href ? sanitizeUserHref(href) : null
      if (!safeHref || !text) return

      const root = document.createElement('div')
      root.className = element.className
      element.replaceWith(root)

      const linkRoot = ReactDOM.createRoot(root)
      linkRoot.render(<KunLink href={safeHref} text={text} />)
    })
  }, [isMounted])

  return (
    <Card className="p-1 sm:p-8">
      <CardBody className="p-4 space-y-6">
        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(intro.introduction)
          }}
          className="kun-prose max-w-none"
        />

        {/* <div className="mt-4">
          <h3 className="mb-4 text-xl font-medium">游戏制作商</h3>
        </div> */}

        {uid && <PatchTag patchId={patchId} initialTags={intro.tag} />}

        <PatchCompany
          patchId={patchId}
          initialCompanies={intro.company}
          vndbId={intro.vndbId}
        />

        <Info intro={intro} />
      </CardBody>
    </Card>
  )
}
