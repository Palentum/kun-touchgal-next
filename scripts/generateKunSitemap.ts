import { writeFile } from 'fs/promises'
import { globby } from 'globby'
import prettier from 'prettier'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WEBSITE_URL = process.env.NEXT_PUBLIC_KUN_PATCH_ADDRESS_PROD

const getKunDynamicRoutes = async () => {
  try {
    const patches = await prisma.patch.findMany({
      where: { content_limit: 'sfw' },
      select: {
        unique_id: true,
        updated: true
      }
    })

    return patches.map((patch) => ({
      path: `/${patch.unique_id}`,
      lastmod: patch.updated?.toISOString() || new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error fetching dynamic routes:', error)
    return []
  } finally {
    await prisma.$disconnect()
  }
}

const generateKunSitemap = async () => {
  try {
    const pages = await globby([
      'app/**/*.tsx',
      '!app/**/_*.tsx',
      '!app/**/layout.tsx',
      '!app/**/providers.tsx',
      '!app/**/loading.tsx',
      '!app/**/error.tsx',
      '!app/**/*.test.tsx',
      '!app/**/components/**',
      '!app/**/[id]/**',
      '!app/**/admin/**',
      '!app/**/edit/**',
      '!app/**/message/**',
      '!app/**/user/**'
    ])

    const dynamicRoutes = await getKunDynamicRoutes()

    const sitemap = `
      <?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${pages
          .map((page) => {
            const path = page
              .replace('app', '')
              .replace('/page.tsx', '')
              .replace('.tsx', '')
            const route = path === '/index' ? '' : path

            return `
              <url>
                <loc>${WEBSITE_URL}${route}</loc>
                <lastmod>${new Date().toISOString()}</lastmod>
                <changefreq>daily</changefreq>
                <priority>0.7</priority>
              </url>
            `
          })
          .join('')}
        ${dynamicRoutes
          .map(
            (route) => `
              <url>
                <loc>${WEBSITE_URL}${route.path}</loc>
                <lastmod>${route.lastmod}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
              </url>
            `
          )
          .join('')}
      </urlset>
    `

    const formatted = await prettier.format(sitemap, {
      parser: 'html'
    })

    await writeFile('public/sitemap.xml', formatted)
    console.log('✅ Sitemap generated successfully!')
  } catch (error) {
    console.error('Error generating sitemap:', error)
    process.exit(1)
  }
}

generateKunSitemap()
