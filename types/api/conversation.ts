export interface Conversation {
  id: number
  otherUser: KunUser
  lastMessage: string
  lastMessageTime: string | Date
  unreadCount: number
}

export interface PrivateMessage {
  id: number
  content: string
  status: number
  isDeleted: boolean
  editedAt: string | Date | null
  created: string | Date
  sender: KunUser
}
