'use client'

import { useEffect, useState } from 'react'
import { Card, Chip } from '@nextui-org/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
      className="relative h-[300px] sm:h-[400px] overflow-hidden group touch-pan-y"
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
          {/* Desktop version */}
          <div className="hidden h-full sm:block">
            <img
              alt={posts[currentSlide].title}
              className="object-cover w-full h-full brightness-75 rounded-2xl"
              src={posts[currentSlide].banner}
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            <Card className="absolute border-none bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={posts[currentSlide].authorAvatar}
                    alt={posts[currentSlide].authorName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-foreground/80">
                    {posts[currentSlide].authorName}
                  </span>
                </div>
                <h2 className="mb-2 text-2xl font-bold line-clamp-1">
                  {posts[currentSlide].title}
                </h2>
                <p className="mb-2 text-sm text-foreground/80 line-clamp-2">
                  {posts[currentSlide].description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {posts[currentSlide].tags?.map((tag) => (
                    <Chip key={tag} variant="flat" size="sm">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Mobile version */}
          <Card
            radius="none"
            className="h-full border-none shadow-none sm:hidden"
          >
            <div className="relative h-1/2">
              <img
                alt={posts[currentSlide].title}
                className="object-cover w-full h-full rounded-2xl"
                src={posts[currentSlide].banner}
              />
            </div>
            <div className="p-3 h-1/2">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={posts[currentSlide].authorAvatar}
                  alt={posts[currentSlide].authorName}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-xs text-foreground/80">
                  {posts[currentSlide].authorName}
                </span>
              </div>
              <h2 className="mb-1 text-lg font-bold line-clamp-1">
                {posts[currentSlide].title}
              </h2>
              <p className="mb-2 text-xs text-foreground/80 line-clamp-2">
                {posts[currentSlide].description}
              </p>
              <div className="flex flex-wrap gap-1">
                {posts[currentSlide].tags?.map((tag) => (
                  <Chip key={tag} variant="flat" size="sm">
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 touch:opacity-100 z-10"
        onClick={() => paginate(-1)}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 touch:opacity-100 z-10"
        onClick={() => paginate(1)}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="absolute z-10 flex gap-1 -translate-x-1/2 bottom-1 left-1/2">
        {posts.map((_, index) => (
          <button
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-primary w-4'
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
