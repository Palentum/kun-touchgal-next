interface GalgameCard {
  id: number
  uniqueId: string
  name: string
  banner: string
  view: number
  download: number
  type: string[]
  language: string[]
  platform: string[]
  tags: string[]
  created: Date | string
  _count: {
    favorite_by: number
    resource: number
    comment: number
  }
}
