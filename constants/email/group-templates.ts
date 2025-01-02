import { touchgalTemplate } from './templates/touchgal'
import { announcementTemplate } from './templates/announcement'

export interface EmailTemplate {
  id: string
  name: string
  template: string
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'touchgal',
    name: 'TouchGal 全体消息',
    template: touchgalTemplate('{{title}}', '{{content}}')
  },
  {
    id: 'announcement',
    name: 'TouchGal 重要公告',
    template: announcementTemplate('{{title}}', '{{content}}')
  }
]
