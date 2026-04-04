'use client'

import { useEffect, useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'
import { useMounted } from '~/hooks/useMounted'

export const KunAutoImageViewer = () => {
  const [openImage, setOpenImage] = useState<string | null>(null)
  const [images, setImages] = useState<
    { src: string; width: number; height: number }[]
  >([])
  const isMounted = useMounted()

  useEffect(() => {
    if (!isMounted) {
      return
    }

    const processedImages = new Set<HTMLImageElement>()

    const handleImageClick = (event: Event) => {
      const currentTarget = event.currentTarget
      if (!(currentTarget instanceof HTMLImageElement)) {
        return
      }

      setOpenImage(currentTarget.currentSrc || currentTarget.src)
    }

    const checkImageDimensions = (img: HTMLImageElement) => {
      if (img.dataset.noLightbox !== undefined) {
        return
      }

      const rect = img.getBoundingClientRect()
      const renderedWidth = rect.width || img.width
      const renderedHeight = rect.height || img.height
      const width = img.naturalWidth || renderedWidth
      const height = img.naturalHeight || renderedHeight
      const src = img.currentSrc || img.src

      if (renderedWidth >= 200 && renderedHeight >= 200) {
        setImages((prev) => {
          const exists = prev.some((image) => image.src === src)
          if (!exists) {
            return [...prev, { src, width, height }]
          }
          return prev
        })

        if (!processedImages.has(img)) {
          processedImages.add(img)
          img.style.cursor = 'pointer'
          img.addEventListener('click', handleImageClick)
        }
      }
    }

    const processImage = (img: HTMLImageElement) => {
      if (img.complete) {
        checkImageDimensions(img)
        return
      }

      img.addEventListener('load', () => checkImageDimensions(img), {
        once: true
      })
    }

    const collectImages = (node: Node) => {
      if (node instanceof HTMLImageElement) {
        return [node]
      }

      if (node instanceof Element) {
        return Array.from(node.querySelectorAll('img'))
      }

      return []
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          collectImages(node).forEach(processImage)
        })
      })
    })

    document.querySelectorAll('img').forEach((img) => {
      processImage(img)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
      processedImages.forEach((img) => {
        img.removeEventListener('click', handleImageClick)
      })
    }
  }, [isMounted])

  const currentImageIndex = openImage
    ? images.findIndex((img) => img.src === openImage)
    : -1

  return (
    <Lightbox
      index={currentImageIndex}
      slides={images}
      open={currentImageIndex >= 0}
      close={() => setOpenImage(null)}
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
  )
}
