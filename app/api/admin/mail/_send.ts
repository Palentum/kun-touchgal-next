import { createTransport } from 'nodemailer'
import SMPTransport from 'nodemailer-smtp-transport'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { emailTemplates } from '~/constants/email/group-templates'

const getEmailSubject = (selectedTemplate: string) => {
  const currentTemplate = emailTemplates.find((t) => t.id === selectedTemplate)
  if (!currentTemplate) {
    return kunMoyuMoe.titleShort
  }
  return `${kunMoyuMoe.titleShort} - ${currentTemplate.name}`
}

const getPreviewContent = (
  selectedTemplate: string,
  templateVars: Record<string, string>
) => {
  const currentTemplate = emailTemplates.find((t) => t.id === selectedTemplate)
  if (!currentTemplate) {
    return ''
  }

  let content = currentTemplate.template
  Object.entries(templateVars).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })

  return content
}

export const sendEmailHTML = async (
  templateId: string,
  variables: Record<string, string>,
  email: string
) => {
  const content = getPreviewContent(templateId, variables)

  const transporter = createTransport(
    SMPTransport({
      pool: {
        pool: true
      },
      host: process.env.KUN_VISUAL_NOVEL_EMAIL_HOST,
      port: Number(process.env.KUN_VISUAL_NOVEL_EMAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT,
        pass: process.env.KUN_VISUAL_NOVEL_EMAIL_PASSWORD
      }
    })
  )

  const mailOptions = {
    from: `${process.env.KUN_VISUAL_NOVEL_EMAIL_FROM}<${process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT}>`,
    sender: process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT,
    to: email,
    subject: getEmailSubject(templateId),
    html: content
  }

  transporter.sendMail(mailOptions)
}
