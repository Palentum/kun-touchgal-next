import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Metadata } from 'next'

export const kunMetadata: Metadata = {
  title: `邮件群发`,
  description: `给网站全体用户发送邮件`,
  openGraph: {
    title: `邮件群发`,
    description: `给网站全体用户发送邮件`,
    type: 'website',
    images: kunMoyuMoe.images
  },
  twitter: {
    card: 'summary_large_image',
    title: `邮件群发`,
    description: `给网站全体用户发送邮件`
  },
  alternates: {
    canonical: `${kunMoyuMoe.domain.main}/admin/email`
  }
}
