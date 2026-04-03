import fs from 'fs'
import path from 'path'

const getRuntimeRoots = () => {
  const cwd = process.cwd()
  return [cwd, path.resolve(cwd, '../..')]
}

const resolveRuntimePath = (
  relativePath: string,
  type: 'file' | 'directory'
) => {
  for (const root of getRuntimeRoots()) {
    const fullPath = path.join(root, relativePath)

    try {
      const stats = fs.statSync(fullPath)
      if (type === 'file' && stats.isFile()) {
        return fullPath
      }
      if (type === 'directory' && stats.isDirectory()) {
        return fullPath
      }
    } catch {
      continue
    }
  }

  return path.join(process.cwd(), relativePath)
}

export const resolveRuntimeFile = (relativePath: string) =>
  resolveRuntimePath(relativePath, 'file')

export const resolveRuntimeDirectory = (relativePath: string) =>
  resolveRuntimePath(relativePath, 'directory')
