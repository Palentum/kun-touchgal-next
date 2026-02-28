'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'

interface Props {
  banner: string
  name: string
}

export const BannerImage = ({ banner, name }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [slides, setSlides] = useState<{ src: string }[]>([])

  const fullBannerUrl = banner.replace('banner.avif', 'banner-full.avif')

  useEffect(() => {
    const img = new window.Image()
    img.onload = () => {
      setSlides([{ src: fullBannerUrl }, { src: banner }])
    }
    img.onerror = () => {
      setSlides([{ src: banner }])
    }
    img.src = fullBannerUrl
  }, [banner, fullBannerUrl])

  return (
    <>
      <Image
        src={banner}
        alt={name}
        className="object-cover cursor-pointer"
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        priority
        unoptimized
        data-no-lightbox
        onClick={() => setIsOpen(true)}
      />

      <Lightbox
        open={isOpen}
        close={() => setIsOpen(false)}
        slides={slides}
        plugins={[Zoom, Download]}
        animation={{ fade: 300 }}
        carousel={{
          finite: true,
          preload: 2,
          imageProps: {
            style: {
              maxWidth: 'none',
              maxHeight: 'none',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }
          }
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true
        }}
        controller={{
          closeOnBackdropClick: true
        }}
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .7)' } }}
      />
    </>
  )
}
