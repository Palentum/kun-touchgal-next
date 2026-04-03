import { execSync } from 'child_process'
import { mkdir, readdir, copyFile } from 'fs/promises'
import path from 'path'

const copyDirectory = async (src: string, dest: string): Promise<void> => {
  try {
    await mkdir(dest, { recursive: true })
    const entries = await readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath)
      } else {
        await copyFile(srcPath, destPath)
      }
    }
  } catch (error) {
    console.error(`Error copying directory from ${src} to ${dest}:`, error)
    throw error
  }
}

const copyFiles = async () => {
  try {
    execSync('pnpm build:sitemap', { stdio: 'inherit' })

    await copyDirectory('public', '.next/standalone/public')
    await copyDirectory('.next/static', '.next/standalone/.next/static')
    await copyDirectory('server/image', '.next/standalone/server/image')

    console.log('Files copied successfully.')
  } catch (error) {
    console.error('Error during postbuild:', error)
    process.exit(1)
  }
}

copyFiles()
