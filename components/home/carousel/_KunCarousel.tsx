'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Chip } from '@nextui-org/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import type { HomeCarouselMetadata } from './mdx'

interface KunCarouselProps {
  posts: HomeCarouselMetadata[]
}

export const KunCarousel = ({ posts }: KunCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        setDirection(1)
        setCurrentSlide((prev) => (prev + 1) % posts.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [isHovered, posts.length])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentSlide(
      (prev) => (prev + newDirection + posts.length) % posts.length
    )
  }

  return (
    <div
      className="relative h-[500px] sm:h-[600px] overflow-hidden group touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x)

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1)
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1)
            }
          }}
          className="absolute w-full h-full cursor-grab active:cursor-grabbing"
        >
          <img
            alt={posts[currentSlide].title}
            className="object-cover w-full h-full brightness-75"
            src={posts[currentSlide].banner}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <Card className="absolute border-none bottom-4 sm:bottom-8 left-4 right-4 sm:left-8 sm:right-8 bg-background/80 backdrop-blur-md">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 mb-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={posts[currentSlide].authorAvatar}
                      alt={posts[currentSlide].authorName}
                      className="w-6 h-6 rounded-full sm:w-8 sm:h-8"
                    />
                    <span className="text-xs sm:text-sm text-foreground/80">
                      {posts[currentSlide].authorName}
                    </span>
                  </div>
                  <h2 className="mb-2 text-xl font-bold sm:text-3xl line-clamp-2">
                    {posts[currentSlide].title}
                  </h2>
                  <p className="mb-4 text-sm sm:text-lg text-foreground/80 line-clamp-2">
                    {posts[currentSlide].description}
                  </p>
                </div>
                <div className="flex gap-2 sm:flex-shrink-0">
                  <Button
                    className="flex-1 sm:flex-initial"
                    color="primary"
                    variant="solid"
                    startContent={<Download size={18} />}
                    size="sm"
                  >
                    Download
                  </Button>
                  <Button
                    className="flex-1 sm:flex-initial"
                    variant="bordered"
                    startContent={<Heart size={18} />}
                    size="sm"
                  >
                    Wishlist
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-6">
                <div className="flex items-center gap-2">
                  <Chip color="primary" variant="flat" size="sm">
                    {posts[currentSlide].downloads} Downloads
                  </Chip>
                  <Chip color="success" variant="flat" size="sm">
                    ★ {posts[currentSlide].rating}
                  </Chip>
                </div>

                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {posts[currentSlide].tags?.map((tag) => (
                    <Chip key={tag} variant="flat" size="sm">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <button
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 touch:opacity-100"
        onClick={() => paginate(-1)}
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      <button
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 p-1.5 sm:p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 touch:opacity-100"
        onClick={() => paginate(1)}
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
      </button>

      <div className="absolute flex gap-1 -translate-x-1/2 sm:gap-2 bottom-2 sm:bottom-4 left-1/2">
        {posts.map((_, index) => (
          <button
            key={index}
            className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-primary w-4 sm:w-6'
                : 'bg-foreground/20 hover:bg-foreground/40'
            }`}
            onClick={() => {
              setDirection(index > currentSlide ? 1 : -1)
              setCurrentSlide(index)
            }}
          />
        ))}
      </div>
    </div>
  )
}
