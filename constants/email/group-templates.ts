import { kunMoyuMoe } from '~/config/moyu-moe'
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
    name: `${kunMoyuMoe.titleShort} 全体消息`,
    template: touchgalTemplate(
      '{{title}}',
      '{{content}}',
      '{{email}}',
      '{{validateEmailCode}}'
    )
  },
  {
    id: 'announcement',
    name: `${kunMoyuMoe.titleShort} 重要公告`,
    template: announcementTemplate(
      '{{title}}',
      '{{content}}',
      '{{email}}',
      '{{validateEmailCode}}'
    )
  }
]
