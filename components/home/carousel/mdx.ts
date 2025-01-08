import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface HomeCarouselMetadata {
  title: string
  banner: string
  description: string
  date: string
  authorName: string
  authorAvatar: string
  downloads?: string
  rating?: number
  tags?: string[]
}

const POSTS_PATH = path.join(process.cwd(), 'posts')

export const getKunPosts = (): HomeCarouselMetadata[] => {
  if (!fs.existsSync(POSTS_PATH)) {
    return []
  }

  const posts: HomeCarouselMetadata[] = []

  const traverseDirectory = (currentPath: string) => {
    const files = fs.readdirSync(currentPath)

    files.forEach((file) => {
      const filePath = path.join(currentPath, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        traverseDirectory(filePath)
      } else if (file.endsWith('.mdx')) {
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data } = matter(fileContents)

        posts.push({
          title: data.title,
          banner: data.banner,
          description: data.description,
          date: new Date(data.date).toISOString(),
          authorName: data.authorName,
          authorAvatar: data.authorAvatar,
          downloads: data.downloads || '1K+',
          rating: data.rating || 4.5,
          tags: data.tags || ['New']
        })
      }
    })
  }

  traverseDirectory(POSTS_PATH)
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
