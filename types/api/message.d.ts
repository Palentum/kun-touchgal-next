export interface Message {
  id: number
  patchUniqueId: string
  type: string
  content: string
  status: number
  created: string | Date
  sender: KunUser | null
}
