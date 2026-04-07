import type { PatchResourceLink } from './patch'

export interface PatchResource {
  id: number
  name: string
  section: string
  uniqueId: string
  type: string[]
  language: string[]
  platform: string[]
  note: string
  links: PatchResourceLink[]
  likeCount: number
  download: number
  patchId: number
  patchName: string
  created: string
  user: KunUser & {
    patchCount: number
    role: number
  }
}
