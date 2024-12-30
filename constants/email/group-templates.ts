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
    name: 'TouchGal',
    template: touchgalTemplate('{{title}}', '{{content}}')
  },
  {
    id: 'announcement',
    name: '重要公告',
    template: announcementTemplate('{{title}}', '{{content}}')
  }
]
